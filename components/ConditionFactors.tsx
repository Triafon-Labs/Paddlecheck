"use client";

import React from "react";
import { Box, Typography } from "@mui/material";
import HelpOutlined from "@mui/icons-material/HelpOutlined";
import StatTile, { tileGridSx } from "./StatTile";
import { CompactReadingRow } from "./RiverLevelLandmarks";
import { reasonIcons } from "@/lib/rag";
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

export const ContributingFactors: React.FC<ContributingFactorsProps> = ({
  reasons,
  temperature,
  windSpeed,
  weatherDescription,
  compact,
}) => {
  const size = factorSizes(compact);
  const items = reasons.map((reason) => ({
    reason,
    Icon: reasonIcons[reason] ?? HelpOutlined,
    chip: reasonChip(reason, { temperature, windSpeed }),
    tile: reasonTile(reason, { temperature, windSpeed, weatherDescription }),
  }));
  return (
    <Box sx={size.sectionSx}>
      <FactorHeading compact={compact}>Contributing Factors</FactorHeading>
      {compact ? (
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
