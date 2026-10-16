"use client";

import React from "react";
import { Box, Chip, Typography } from "@mui/material";
import HelpOutlined from "@mui/icons-material/HelpOutlined";
import Air from "@mui/icons-material/Air";
import WaterDrop from "@mui/icons-material/WaterDrop";
import FiberManualRecord from "@mui/icons-material/FiberManualRecord";
import { Status } from "@/types";
import InfoPanel from "./InfoPanel";
import { ragStatus, reasonIcons, describeReason } from "@/lib/rag";
import { formatWindGust } from "@/lib/units";

// The "Contributing Factors" and "Be Aware" sections, shared by the current
// status (StatusCard) and a picked forecast hour (ForecastHourDetails) so the
// two always read the same way.
//
// `compact` is the forecast's size: the same layout one step smaller, so a
// forecast hour reads as secondary to the current status above it.
export const factorSizes = (compact?: boolean) =>
  compact
    ? ({
        sectionSx: { mt: 1.5 },
        heading: {
          variant: "caption",
          sx: { display: "block", fontWeight: 500 },
        },
        listMt: 0.5,
      } as const)
    : ({
        sectionSx: { mt: 2 },
        heading: { variant: "subtitle2", sx: {} },
        listMt: 1,
      } as const);

// The compact form of a factor: a small chip in the same style for every
// section, so the headings - not the element - say what kind of item it is.
export const FactorChip: React.FC<{
  Icon: React.ElementType;
  label: React.ReactNode;
}> = ({ Icon, label }) => (
  <Chip
    size="small"
    icon={<Icon sx={{ fontSize: 16, "&&": { color: "primary.main" } }} />}
    label={label}
  />
);

export const FactorChipRow: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => (
  <Box
    sx={{
      display: "flex",
      flexWrap: "wrap",
      alignItems: "center",
      gap: 0.75,
      mt: 0.5,
    }}
  >
    {children}
  </Box>
);

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
  compact?: boolean;
}

export const ContributingFactors: React.FC<ContributingFactorsProps> = ({
  reasons,
  temperature,
  windSpeed,
  compact,
}) => {
  const size = factorSizes(compact);
  const items = reasons.map((reason) => ({
    reason,
    Icon: reasonIcons[reason] ?? HelpOutlined,
    label: describeReason(reason, { temperature, windSpeed }),
  }));
  return (
    <Box sx={size.sectionSx}>
      <FactorHeading compact={compact}>Contributing Factors</FactorHeading>
      {compact ? (
        <FactorChipRow>
          {items.map(({ reason, Icon, label }) => (
            <FactorChip key={reason} Icon={Icon} label={label} />
          ))}
        </FactorChipRow>
      ) : (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: 1,
            mt: size.listMt,
            "& > *:last-of-type:nth-of-type(odd)": {
              gridColumn: "1 / -1",
            },
          }}
        >
          {items.map(({ reason, Icon, label }) => (
            <InfoPanel key={reason}>
              <Icon fontSize="small" sx={{ color: "primary.main" }} />
              <Typography variant="body2">{label}</Typography>
            </InfoPanel>
          ))}
        </Box>
      )}
    </Box>
  );
};

export interface BeAwareItem {
  key: string;
  Icon: React.ElementType;
  text: string;
  // A trailing dot in this status's colour, e.g. what a gust would make the
  // status if it were sustained.
  dotStatus?: Status;
  dotTitle?: string;
}

// The gust and warm-rain heads-ups, which neither change the status nor
// would otherwise show anywhere.
export const beAwareItemsFor = ({
  gustStatus,
  windGust,
  rainWhileWarm,
  weatherDescription,
}: {
  gustStatus?: Status;
  windGust?: number;
  rainWhileWarm?: boolean;
  weatherDescription?: string;
}): BeAwareItem[] => [
  ...(gustStatus && windGust !== undefined
    ? [
        {
          key: "gust",
          Icon: Air,
          text: `Gusts up to ${formatWindGust(windGust)}`,
          dotStatus: gustStatus,
          dotTitle: `Would be ${gustStatus} if sustained`,
        },
      ]
    : []),
  ...(rainWhileWarm
    ? [{ key: "rain", Icon: WaterDrop, text: weatherDescription || "Rain" }]
    : []),
];

export const BeAware: React.FC<{
  items: BeAwareItem[];
  compact?: boolean;
}> = ({ items, compact }) => {
  const size = factorSizes(compact);
  const dot = (
    status: Status,
    title?: string,
    ml: number | string = "auto"
  ) => (
    <FiberManualRecord
      titleAccess={title}
      sx={{
        fontSize: 8,
        color: ragStatus[status].color,
        flexShrink: 0,
        ml,
      }}
    />
  );
  return (
    <Box sx={size.sectionSx}>
      <FactorHeading compact={compact}>Be Aware</FactorHeading>
      {compact ? (
        <FactorChipRow>
          {items.map(({ key, Icon, text, dotStatus, dotTitle }) => (
            <FactorChip
              key={key}
              Icon={Icon}
              label={
                dotStatus ? (
                  <Box
                    component="span"
                    sx={{ display: "inline-flex", alignItems: "center" }}
                  >
                    {text}
                    {dot(dotStatus, dotTitle, 0.75)}
                  </Box>
                ) : (
                  text
                )
              }
            />
          ))}
        </FactorChipRow>
      ) : (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 1,
            mt: size.listMt,
          }}
        >
          {items.map(({ key, Icon, text, dotStatus, dotTitle }) => (
            <InfoPanel key={key}>
              <Icon fontSize="small" sx={{ color: "primary.main" }} />
              <Typography variant="body2">{text}</Typography>
              {dotStatus && dot(dotStatus, dotTitle)}
            </InfoPanel>
          ))}
        </Box>
      )}
    </Box>
  );
};
