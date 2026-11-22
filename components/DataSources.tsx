"use client";

import React from "react";
import { Box, Stack, Typography } from "@mui/material";
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

// How live each data source is, worked out once and shown in two places
// (Severnwatch has the same):
//
// - DataSourcesList, in Settings → Info: every source, with its times. It
//   replaced the "Updated 10:33 · 2 min ago" line under the Paddling Status
//   title and the "Gauge read …" / "As of …" captions that repeated the
//   river's age further down.
// - SourceAlerts, under the Paddling Status title: only a source with a
//   problem nothing else on the page already reports, and nothing when all
//   is well. Being offline, a failed update and data left to age are the
//   banners' to say. River or weather with nothing at all to show is the
//   page's own error alert.
//
// The River state goes by the gauge's newest reading, not the fetch: the
// payload's fetchedAt is fresh even when the EA hasn't had a reading from
// the gauge for hours. It is also flagged when the upstream forecast is
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
  // Worth flagging on the home page (see the note at the top).
  notable: boolean;
}

type Judged = Pick<SourceView, "liveness" | "state" | "notable">;
const LIVE: Judged = { liveness: "live", state: "Live", notable: false };

const useSourceViews = () => {
  const { conditions, riverGraphData, sourceHealth, isRefreshing, isOffline } =
    useKayakContext();
  const now = useNowTicking(30 * 1000);
  const nowMs = now.getTime();

  const fetchedAt = conditions?.lastUpdated ?? null;
  const fetchedMs = fetchedAt ? new Date(fetchedAt).getTime() : null;
  const notRefreshed =
    fetchedMs !== null && nowMs - fetchedMs > DATA_STALE_THRESHOLD_MS;

  // The parts every source shares. Null when none applies and the source's
  // own check decides.
  const common = (origin: SourceOrigin | undefined): Judged | null => {
    if (isRefreshing) {
      return { liveness: "updating", state: "Updating…", notable: false };
    }
    if (isOffline) {
      return { liveness: "behind", state: "Offline", notable: false };
    }
    // No fetch has finished yet: what's on screen is the saved copy.
    if (!origin) {
      return conditions
        ? { liveness: "behind", state: "Saved copy", notable: false }
        : { liveness: "failed", state: "Couldn't load", notable: false };
    }
    if (origin === "missing") {
      return { liveness: "failed", state: "Couldn't load", notable: false };
    }
    // One source fell back to the saved copy inside a response that was
    // otherwise fresh - the banners go by the response, so they don't see it.
    if (origin === "saved") {
      return { liveness: "behind", state: "Saved copy", notable: true };
    }
    if (notRefreshed) {
      return { liveness: "behind", state: "Not refreshed", notable: false };
    }
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
      return {
        ...base,
        liveness: "behind",
        state: "Gauge behind",
        notable: true,
      };
    }
    if (UPSTREAM_CSV_URL && !sourceHealth?.upstream) {
      return {
        ...base,
        liveness: "behind",
        state: "No upstream forecast",
        notable: true,
      };
    }
    return { ...base, ...LIVE };
  })();

  const weather = ((): SourceView => {
    const base = {
      key: "weather",
      label: "Weather",
      details: ["Open-Meteo forecast"],
    };
    return { ...base, ...(common(sourceHealth?.weather) ?? LIVE) };
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
    const judged =
      sourceHealth && !sourceHealth.warnings && !isRefreshing && !isOffline
        ? // An empty list from a failed feed reads as "no warnings", so this
          // one is always worth saying.
          {
            liveness: "failed" as const,
            state: "Couldn't check",
            notable: true,
          }
        : (common(sourceHealth ? "live" : undefined) ?? LIVE);
    return { ...base, ...judged };
  })();

  return { now, fetchedMs, views: [river, weather, warnings] };
};

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

// One source as a dot, its name and state, and the details beneath.
const SourceRow: React.FC<{ view: SourceView }> = ({ view }) => (
  <Stack direction="row" spacing={1.25} sx={{ alignItems: "flex-start" }}>
    <Box sx={{ pt: "6px" }}>
      <Dot liveness={view.liveness} />
    </Box>
    <Box sx={{ minWidth: 0 }}>
      <Typography variant="body2" sx={{ fontWeight: 600 }}>
        {view.label} · {view.state}
      </Typography>
      {view.details.map((line) => (
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
);

// Under the Paddling Status title: only the sources worth flagging, and
// nothing at all otherwise.
export const SourceAlerts: React.FC = () => {
  const { views } = useSourceViews();
  const notable = views.filter((v) => v.notable);
  if (notable.length === 0) return null;
  return (
    // The card's content opens with its own top margin, so this only needs
    // space above it.
    <Stack spacing={1} role="status" sx={{ mt: 1.5 }}>
      {notable.map((v) => (
        <SourceRow key={v.key} view={v} />
      ))}
    </Stack>
  );
};

// Settings → Info: every source, and when the data was fetched.
export const DataSourcesList: React.FC = () => {
  const { now, fetchedMs, views } = useSourceViews();
  return (
    <Stack spacing={1.5}>
      {fetchedMs !== null && (
        <Typography variant="body2" color="text.secondary">
          Updated {getLondonHHMM(new Date(fetchedMs))} (
          {formatDataAge(fetchedMs, now)})
        </Typography>
      )}
      {views.map((v) => (
        <SourceRow key={v.key} view={v} />
      ))}
    </Stack>
  );
};
