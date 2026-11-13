"use client";

import React from "react";
import { Box, Typography } from "@mui/material";
import ArrowForward from "@mui/icons-material/ArrowForward";
import HelpOutlined from "@mui/icons-material/HelpOutlined";
import Water from "@mui/icons-material/Water";
import StatTile, { tileGridSx } from "./StatTile";
import { CompactReadingRow } from "./RiverLevelLandmarks";
import { reasonIcons, statusLabel, statusUi } from "@/lib/rag";
import { ReasonChange, Status } from "@/types";
import { formatTemperature, formatWindSpeed } from "@/lib/units";

// The "Contributing Factors" section, shared by the current status
// (StatusCard) and a picked forecast hour (ForecastHourDetails) so the two
// always read the same way.
//
// `compact` is the forecast's size: the same layout one step smaller, so a
// forecast hour reads as secondary to the current status above it.
export const factorSizes = (compact?: boolean) =>
  compact
    ? ({
        sectionSx: { mt: 1.5 },
        // The same heading as the current status's; the forecast stays a
        // step down through its tighter spacing, not smaller text.
        heading: { variant: "subtitle2", sx: {} },
        listMt: 0.5,
      } as const)
    : ({
        sectionSx: { mt: 2 },
        heading: { variant: "subtitle2", sx: {} },
        listMt: 1,
      } as const);

// A section heading in the given size.
export const FactorHeading: React.FC<{
  compact?: boolean;
  children: React.ReactNode;
}> = ({ compact, children }) => {
  const { heading } = factorSizes(compact);
  return (
    <Typography
      variant={heading.variant}
      color="text.secondary"
      sx={heading.sx}
    >
      {children}
    </Typography>
  );
};

interface ContributingFactorsProps {
  reasons: string[];
  // The step the river level gives on its own, where the status chain
  // starts (KayakConditions.initialStatus).
  initialStatus?: Status;
  // The status each reason moved conditions from and to - missing from data
  // cached by older versions, when the factors are listed without it.
  reasonChanges?: Record<string, ReasonChange>;
  temperature?: number;
  windSpeed?: number;
  weatherDescription?: string;
  compact?: boolean;
}

interface TileText {
  label: string;
  value: string;
  detail?: string;
}

// A reason split into the Weather card's tile shape: what it's about, the
// reading, and how the rules class it - "Temperature", "10°C", "Moderately
// low". The chips use reasonChip below.
const reasonTile = (
  reason: string,
  values: {
    temperature?: number;
    windSpeed?: number;
    weatherDescription?: string;
  }
): TileText => {
  // "Slightly elevated river level (> 1.00 m)" and its siblings - the
  // wording before "river level" is each step's riverReason.
  const river = reason.match(/^(.+) river level \(> (.+)\)$/);
  if (river) {
    return {
      label: "River level",
      value: river[1],
      detail: `Above ${river[2]}`,
    };
  }
  switch (reason) {
    case "Low temperature":
    case "Moderately low temperature":
      return {
        label: "Temperature",
        value:
          values.temperature !== undefined
            ? formatTemperature(values.temperature)
            : reason,
        detail: reason === "Low temperature" ? "Low" : "Moderately low",
      };
    case "High winds":
      return {
        label: "Wind",
        value:
          values.windSpeed !== undefined
            ? formatWindSpeed(values.windSpeed)
            : reason,
        detail: "High",
      };
    case "Rain":
      return { label: "Rain", value: values.weatherDescription ?? "Rain" };
    case "Dark":
      return { label: "Daylight", value: "Dark" };
    case "Foggy":
      return { label: "Visibility", value: "Fog" };
    case "River level is dangerously high":
      return { label: "River level", value: "Dangerously high" };
    case "Thunderstorms":
      return { label: "Weather", value: "Thunderstorms" };
    default:
      return { label: "Conditions", value: reason };
  }
};

// What a factor did to the status, by name - "Light Green → Amber" - so the
// factors read as a chain ending on the status shown, in the club's own
// terms. Not a count of steps: clubs' landmarks talk about real steps ("the
// concrete step"). "No extra effect" when another factor already accounts
// for it (the weather table can give the same result with or without wind).
const changeText = (change: ReasonChange | undefined): string | undefined => {
  if (!change) return undefined;
  if (change.from === change.to) return "No extra effect";
  return `${statusLabel(change.from)} → ${statusLabel(change.to)}`;
};

const joinDetail = (...parts: (string | undefined)[]): string | undefined =>
  parts.filter(Boolean).join(" · ") || undefined;

// A reason in one of the forecast's compact rows: the reason, and its
// figure beneath - "Moderately low temperature" / "12°C".
const reasonChip = (
  reason: string,
  values: { temperature?: number; windSpeed?: number }
): { label: string; aside?: string } => {
  const river = reason.match(/^(.+ river level) \(> (.+)\)$/);
  if (river) return { label: river[1], aside: `over ${river[2]}` };
  if (
    (reason === "Low temperature" || reason === "Moderately low temperature") &&
    values.temperature !== undefined
  ) {
    return { label: reason, aside: formatTemperature(values.temperature) };
  }
  if (reason === "High winds" && values.windSpeed !== undefined) {
    return { label: reason, aside: formatWindSpeed(values.windSpeed) };
  }
  return { label: reason };
};

// One rung of the chain: a disc in the status colour holding the factor's
// icon, what it is, and the status it leaves conditions on. A factor that
// changed nothing (the weather table can give the same step either way, or
// the cap below the top step stops it) is an empty ring with no status.
interface Rung {
  key: string;
  Icon: React.ElementType;
  title: string;
  caption?: string;
  status?: Status;
}

// The disc and the gap between rungs; the track runs disc centre to centre.
// The forecast hour's chain is a size down, like its other rows.
const chainSizes = (compact?: boolean) =>
  compact
    ? { disc: 24, icon: 14, gap: 8, py: 1, mt: 0.5, track: 3 }
    : { disc: 32, icon: 18, gap: 12, py: 1.5, mt: 1, track: 4 };

const FactorChain: React.FC<{ rungs: Rung[]; compact?: boolean }> = ({
  rungs,
  compact,
}) => {
  const {
    disc: DISC,
    icon,
    gap: RUNG_GAP,
    py,
    mt,
    track,
  } = chainSizes(compact);
  // The colour conditions are at after each rung: its own status, or the one
  // before it for a factor that changed nothing. The track between two rungs
  // blends from one to the next, so the chain reads as one status moving
  // down it rather than a list with tags.
  const colours: string[] = [];
  rungs.forEach(({ status }, i) =>
    colours.push(status ? statusUi(status).color : (colours[i - 1] ?? ""))
  );
  const blend = (a: string, b: string) => `color-mix(in srgb, ${a} 50%, ${b})`;
  // Half of the track between two rungs: from the row's middle (behind the
  // disc) to half-way across the gap, above or below.
  const halfTrack = (below: boolean, from: string, to: string) =>
    ({
      position: "absolute",
      left: DISC / 2 - track / 2,
      width: track,
      ...(below
        ? { top: "50%", bottom: -RUNG_GAP / 2 }
        : { top: -RUNG_GAP / 2, bottom: "50%" }),
      background: `linear-gradient(${from}, ${to})`,
    }) as const;
  return (
    <Box
      sx={{
        mt,
        px: 1.5,
        py,
        backgroundColor: "surfaces.containerHigh",
        borderRadius: "16px",
        display: "flex",
        flexDirection: "column",
        gap: `${RUNG_GAP}px`,
      }}
    >
      {rungs.map(({ key, Icon, title, caption, status }, i) => {
        const ui = status ? statusUi(status) : undefined;
        // After the starting point each status is where that factor takes
        // conditions to - "→ Amber", not a label saying the factor is amber.
        // Plain text: the disc and track already carry the colour.
        return (
          <Box
            key={key}
            sx={{ display: "flex", alignItems: "center", gap: 1.5 }}
          >
            <Box
              sx={{
                position: "relative",
                alignSelf: "stretch",
                display: "flex",
                alignItems: "center",
                flexShrink: 0,
              }}
            >
              {/* The track, drawn behind the discs a half at a time so it
                  meets each disc's centre whatever the row heights. */}
              {i > 0 && (
                <Box
                  sx={halfTrack(
                    false,
                    blend(colours[i - 1], colours[i]),
                    colours[i]
                  )}
                />
              )}
              {i < rungs.length - 1 && (
                <Box
                  sx={halfTrack(
                    true,
                    colours[i],
                    blend(colours[i], colours[i + 1])
                  )}
                />
              )}
              <Box
                sx={{
                  position: "relative",
                  width: DISC,
                  height: DISC,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxSizing: "border-box",
                  "& svg": { fontSize: icon },
                  ...(ui
                    ? { backgroundColor: ui.color, color: ui.onColor }
                    : {
                        backgroundColor: "surfaces.containerHigh",
                        border: 2,
                        borderColor: "divider",
                        color: "text.secondary",
                      }),
                }}
              >
                <Icon />
              </Box>
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {title}
              </Typography>
              {caption && (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  component="div"
                >
                  {caption}
                </Typography>
              )}
            </Box>
            {ui && (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.5,
                  flexShrink: 0,
                }}
              >
                {i > 0 && (
                  <ArrowForward
                    titleAccess="to"
                    sx={{
                      fontSize: compact ? 16 : 18,
                      color: "text.secondary",
                    }}
                  />
                )}
                <Typography
                  variant="body2"
                  component="span"
                  sx={{ fontWeight: 600, whiteSpace: "nowrap" }}
                >
                  {ui.name}
                </Typography>
              </Box>
            )}
          </Box>
        );
      })}
    </Box>
  );
};

// The chain for a status: where the river level alone puts it,
// then each factor in the order the rules apply them, ending on the status
// shown above. Null when a reason has no recorded change - data cached by an
// older version, or a thunderstorm or flood that skips straight to the top -
// and the tiles are shown instead.
const chainRungs = (
  reasons: string[],
  reasonChanges: Record<string, ReasonChange> | undefined,
  values: {
    initialStatus?: Status;
    temperature?: number;
    windSpeed?: number;
    weatherDescription?: string;
  }
): Rung[] | null => {
  if (!reasonChanges || values.initialStatus === undefined) return null;
  if (reasons.some((reason) => !reasonChanges[reason])) return null;

  const isRiver = (reason: string) => / river level \(> .+\)$/.test(reason);
  const riverReason = reasons.find(isRiver);
  const start: Rung = {
    key: "river",
    Icon: (riverReason && reasonIcons[riverReason]) || Water,
    // No figure: the River Level section just above already gives it.
    title: "River level",
    caption: riverReason
      ? reasonTile(riverReason, values).value
      : "Starting point",
    status: values.initialStatus,
  };

  const rungs = reasons
    .filter((reason) => !isRiver(reason))
    .map((reason): Rung => {
      const tile = reasonTile(reason, values);
      const change = reasonChanges[reason];
      const changed = change.from !== change.to;
      // "Temperature 3°C" / "Low"; "Rain" / "Light drizzle"; "Dark".
      const withFigure = tile.label === "Temperature" || tile.label === "Wind";
      const title = withFigure
        ? `${tile.label} ${tile.value}`
        : tile.label === "Rain"
          ? "Rain"
          : tile.value;
      const detail = withFigure
        ? tile.detail
        : tile.label === "Rain" && tile.value !== "Rain"
          ? tile.value
          : undefined;
      return {
        key: reason,
        Icon: reasonIcons[reason] ?? HelpOutlined,
        title,
        caption: changed ? detail : joinDetail(detail, changeText(change)),
        status: changed ? change.to : undefined,
      };
    });
  return [start, ...rungs];
};

export const ContributingFactors: React.FC<ContributingFactorsProps> = ({
  reasons,
  reasonChanges,
  initialStatus,
  temperature,
  windSpeed,
  weatherDescription,
  compact,
}) => {
  const size = factorSizes(compact);
  const values = {
    initialStatus,
    temperature,
    windSpeed,
    weatherDescription,
  };
  const rungs = chainRungs(reasons, reasonChanges, values);
  const items = reasons.map((reason) => {
    const change = changeText(reasonChanges?.[reason]);
    const chip = reasonChip(reason, { temperature, windSpeed });
    return {
      reason,
      Icon: reasonIcons[reason] ?? HelpOutlined,
      chip: { ...chip, aside: joinDetail(chip.aside, change) },
      tile: reasonTile(reason, values),
    };
  });
  return (
    <Box sx={size.sectionSx}>
      <FactorHeading compact={compact}>Contributing Factors</FactorHeading>
      {rungs ? (
        <FactorChain rungs={rungs} compact={compact} />
      ) : compact ? (
        // Rows like the river level and weather above them, one per reason
        // at the panel's full width - chips sized to their text sat ragged
        // under those rows.
        <Box sx={{ mt: size.listMt }}>
          {items.map(({ reason, Icon, chip }) => (
            <CompactReadingRow
              key={reason}
              icon={<Icon />}
              label={chip.label}
              note={chip.aside}
            />
          ))}
        </Box>
      ) : (
        <Box sx={{ ...tileGridSx, mt: size.listMt }}>
          {items.map(({ reason, Icon, tile }) => (
            <StatTile key={reason} icon={<Icon />} {...tile} />
          ))}
        </Box>
      )}
    </Box>
  );
};
