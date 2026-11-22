"use client";

import React, { useId, useState } from "react";
import { Box, ButtonBase, Popover, Stack, Typography } from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { useKayakContext } from "@/lib/KayakDataContext";
import { STATUS_COLORS } from "@/lib/statusColors";
import {
  DATA_STALE_THRESHOLD_MS,
  UPSTREAM_CSV_URL,
  WARNING_AREA,
} from "@/lib/config";
import { formatDataAge, getLondonHHMM } from "@/lib/time";
import { useNowTicking } from "@/lib/useNowTicking";
import { SourceOrigin } from "@/types";

// One dot per data source under the Paddling Status title, with the time the
// data was fetched beside them - in place of the single "Updated 10:33 ·
// 2 min ago" line, plus the "Gauge read …" and "As of …" captions that
// repeated the river's age further down. Each dot answers "is this one
// live?" on its own; a tap gives the times. Severnwatch has the same row.
//
// The River dot goes by the gauge's newest reading, not the fetch: the
// payload's fetchedAt is fresh even when the EA hasn't had a reading from
// the gauge for hours. It also turns amber when the upstream forecast is
// missing, since the forecast hours then run on the trend alone.

type Liveness = "updating" | "live" | "behind" | "failed";

// Past this the gauge's newest reading counts as behind. It reports every
// 15 minutes and normally reaches the EA within the half hour.
const RIVER_BEHIND_MS = 2 * 60 * 60 * 1000;

const DOT_COLOR: Record<Liveness, string> = {
  updating: STATUS_COLORS.grey,
  live: STATUS_COLORS.darkGreen,
  behind: STATUS_COLORS.amber,
  failed: STATUS_COLORS.red,
};

interface SourceView {
  key: string;
  label: string;
  liveness: Liveness;
  state: string; // "Live", "Behind", ...
  details: string[]; // the times behind it
}

// A step under body2, so the three sources and the time fit on one line on
// a 360px phone.
const rowTextSx = { fontSize: "0.8125rem" } as const;

const Dot: React.FC<{ liveness: Liveness }> = ({ liveness }) => (
  <Box
    aria-hidden
    sx={{
      width: 8,
      height: 8,
      borderRadius: "50%",
      flexShrink: 0,
      bgcolor: DOT_COLOR[liveness],
      // A slow pulse while a fetch is in flight. Reduced motion is handled
      // globally (MuiCssBaseline).
      animation:
        liveness === "updating"
          ? "livenessPulse 1.2s ease-in-out infinite"
          : "none",
      "@keyframes livenessPulse": {
        "0%, 100%": { opacity: 1 },
        "50%": { opacity: 0.3 },
      },
    }}
  />
);

const SourceLiveness: React.FC = () => {
  const { conditions, riverGraphData, sourceHealth, isRefreshing, isOffline } =
    useKayakContext();
  const now = useNowTicking(30 * 1000);
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const popoverId = useId();
  const nowMs = now.getTime();

  const fetchedAt = conditions?.lastUpdated ?? null;
  const fetchedMs = fetchedAt ? new Date(fetchedAt).getTime() : null;
  const fetchedClock =
    fetchedMs !== null ? getLondonHHMM(new Date(fetchedMs)) : null;
  const notRefreshed =
    fetchedMs !== null && nowMs - fetchedMs > DATA_STALE_THRESHOLD_MS;

  // The parts every source shares: in flight, no fetch finished yet,
  // offline, failed or from the saved copy. Null when none applies.
  const common = (
    origin: SourceOrigin | undefined
  ): Pick<SourceView, "liveness" | "state"> | null => {
    if (isRefreshing) return { liveness: "updating", state: "Updating…" };
    if (isOffline) return { liveness: "behind", state: "Offline" };
    if (!origin)
      return conditions
        ? { liveness: "behind", state: "Saved copy" }
        : { liveness: "failed", state: "Couldn't load" };
    if (origin === "missing")
      return { liveness: "failed", state: "Couldn't load" };
    if (origin === "saved") return { liveness: "behind", state: "Saved copy" };
    if (notRefreshed) return { liveness: "behind", state: "Not refreshed" };
    return null;
  };

  const river = ((): SourceView => {
    const last = riverGraphData?.[riverGraphData.length - 1];
    const readingMs = last ? new Date(last.dateTime).getTime() : null;
    const details = [
      readingMs !== null
        ? `EA gauge reading ${getLondonHHMM(new Date(readingMs))} (${formatDataAge(readingMs, now)})`
        : "EA river gauge",
    ];
    if (UPSTREAM_CSV_URL && sourceHealth) {
      details.push(
        sourceHealth.upstream
          ? "Upstream forecast in"
          : "No upstream forecast – the forecast follows the trend"
      );
    }
    const base = { key: "river", label: "River", details };
    const shared = common(sourceHealth?.river);
    if (shared) return { ...base, ...shared };
    if (readingMs === null || nowMs - readingMs > RIVER_BEHIND_MS) {
      return { ...base, liveness: "behind", state: "Gauge behind" };
    }
    if (UPSTREAM_CSV_URL && !sourceHealth?.upstream) {
      return { ...base, liveness: "behind", state: "No upstream forecast" };
    }
    return { ...base, liveness: "live", state: "Live" };
  })();

  const weather = ((): SourceView => {
    const base = {
      key: "weather",
      label: "Weather",
      details: ["Open-Meteo forecast"],
    };
    const shared = common(sourceHealth?.weather);
    return shared
      ? { ...base, ...shared }
      : { ...base, liveness: "live", state: "Live" };
  })();

  const warnings = ((): SourceView => {
    const count = conditions?.warnings?.length ?? 0;
    const base = {
      key: "warnings",
      label: "Warnings",
      details: [
        "Met Office warnings feed",
        ...(sourceHealth?.warnings
          ? [
              count === 0
                ? `None in force for ${WARNING_AREA}`
                : `${count} in force for ${WARNING_AREA}`,
            ]
          : []),
      ],
    };
    const shared = common(
      sourceHealth ? (sourceHealth.warnings ? "live" : "missing") : undefined
    );
    return shared
      ? { ...base, ...shared }
      : { ...base, liveness: "live", state: "Live" };
  })();

  const views = [river, weather, warnings];
  const timeText = isRefreshing ? "Updating…" : fetchedClock;

  return (
    <>
      <ButtonBase
        onClick={(e) => setAnchor(e.currentTarget)}
        aria-haspopup="dialog"
        aria-expanded={Boolean(anchor)}
        aria-controls={anchor ? popoverId : undefined}
        aria-label={`Data sources: ${views
          .map((v) => `${v.label} ${v.state}`)
          .join(
            ", "
          )}${fetchedClock ? `. Updated ${fetchedClock}` : ""}. Show details`}
        sx={{
          // Sits on the title's own left edge; the padding is the touch
          // target, pulled back out with the negative margin.
          mx: -1,
          px: 1,
          py: 0.5,
          borderRadius: 2,
          columnGap: 1.25,
          rowGap: 0.25,
          // At the narrowest phones the time and chevron drop to a second
          // line together rather than being cut off.
          flexWrap: "wrap",
          color: "text.secondary",
          justifyContent: "flex-start",
          maxWidth: "calc(100% + 16px)",
        }}
      >
        {views.map((v) => (
          <Stack
            key={v.key}
            direction="row"
            spacing={0.75}
            sx={{ alignItems: "center" }}
          >
            <Dot liveness={v.liveness} />
            <Typography variant="body2" component="span" sx={rowTextSx}>
              {v.label}
            </Typography>
          </Stack>
        ))}
        <Stack direction="row" sx={{ alignItems: "center" }}>
          {timeText && (
            <Typography
              variant="body2"
              component="span"
              sx={{ ...rowTextSx, whiteSpace: "nowrap" }}
            >
              · {timeText}
            </Typography>
          )}
          <ExpandMoreIcon aria-hidden sx={{ fontSize: 18 }} />
        </Stack>
      </ButtonBase>
      <Popover
        id={popoverId}
        open={Boolean(anchor)}
        anchorEl={anchor}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
        slotProps={{
          paper: { sx: { p: 2, maxWidth: 340, borderRadius: "16px" } },
        }}
      >
        <Stack spacing={1.5}>
          {fetchedMs !== null && (
            <Typography variant="body2" color="text.secondary">
              Updated {fetchedClock} ({formatDataAge(fetchedMs, now)})
            </Typography>
          )}
          {views.map((v) => (
            <Stack
              key={v.key}
              direction="row"
              spacing={1.25}
              sx={{ alignItems: "flex-start" }}
            >
              <Box sx={{ pt: "6px" }}>
                <Dot liveness={v.liveness} />
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {v.label} · {v.state}
                </Typography>
                {v.details.map((line) => (
                  <Typography
                    key={line}
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: "block" }}
                  >
                    {line}
                  </Typography>
                ))}
              </Box>
            </Stack>
          ))}
        </Stack>
      </Popover>
    </>
  );
};

export default SourceLiveness;
