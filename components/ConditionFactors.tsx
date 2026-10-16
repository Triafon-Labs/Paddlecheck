"use client";

import React from "react";
import { Box, Typography } from "@mui/material";
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

interface ContributingFactorsProps {
  reasons: string[];
  temperature?: number;
  windSpeed?: number;
}

export const ContributingFactors: React.FC<ContributingFactorsProps> = ({
  reasons,
  temperature,
  windSpeed,
}) => (
  <Box sx={{ mt: 2 }}>
    <Typography variant="subtitle2" color="text.secondary">
      Contributing Factors
    </Typography>
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: "repeat(2, 1fr)",
        gap: 1,
        mt: 1,
        "& > *:last-of-type:nth-of-type(odd)": {
          gridColumn: "1 / -1",
        },
      }}
    >
      {reasons.map((reason, index) => {
        const Icon = reasonIcons[reason] ?? HelpOutlined;
        const label = describeReason(reason, { temperature, windSpeed });
        return (
          <InfoPanel key={index}>
            <Icon fontSize="small" sx={{ color: "primary.main" }} />
            <Typography variant="body2">{label}</Typography>
          </InfoPanel>
        );
      })}
    </Box>
  </Box>
);

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

export const BeAware: React.FC<{ items: BeAwareItem[] }> = ({ items }) => (
  <Box sx={{ mt: 2 }}>
    <Typography variant="subtitle2" color="text.secondary">
      Be Aware
    </Typography>
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1, mt: 1 }}>
      {items.map(({ key, Icon, text, dotStatus, dotTitle }) => (
        <InfoPanel key={key}>
          <Icon fontSize="small" sx={{ color: "primary.main" }} />
          <Typography variant="body2">{text}</Typography>
          {dotStatus && (
            <FiberManualRecord
              titleAccess={dotTitle}
              sx={{
                fontSize: 8,
                color: ragStatus[dotStatus].color,
                flexShrink: 0,
                ml: "auto",
              }}
            />
          )}
        </InfoPanel>
      ))}
    </Box>
  </Box>
);
