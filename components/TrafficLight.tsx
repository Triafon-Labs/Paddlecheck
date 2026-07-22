"use client";

import React from "react";
import { Box, Typography, useTheme, Stack } from "@mui/material";
import { Status } from "@/types";
import { ragStatus } from "@/lib/rag";
import { springEasing } from "@/lib/m3-palette";

interface TrafficLightProps {
  status: Status;
}

const TrafficLight: React.FC<TrafficLightProps> = ({ status }) => {
  const theme = useTheme();
  const statuses = (Object.keys(ragStatus) as Status[]).filter(
    (s) => s !== "Unknown" && s !== "No Paddling"
  );

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
        {statuses.map((s) => {
          const { icon: Icon, color } = ragStatus[s];
          const isActive = s === status;

          return (
            <Box
              key={s}
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                width: isActive ? 80 : 50,
                height: isActive ? 80 : 50,
                borderRadius: "50%",
                backgroundColor: isActive
                  ? theme.palette.mode === "dark"
                    ? `rgba(${parseInt(color.slice(1, 3), 16)}, ${parseInt(
                        color.slice(3, 5),
                        16
                      )}, ${parseInt(color.slice(5, 7), 16)}, 0.25)`
                    : ragStatus[s].backgroundColor
                  : "transparent",
                border: `1px solid ${isActive ? color : theme.palette.divider}`,
                // M3 Expressive spring motion – slight overshoot on size change
                transition: `width 0.4s ${springEasing}, height 0.4s ${springEasing}, background-color 0.4s ${springEasing}, border-color 0.4s ${springEasing}, opacity 0.4s ${springEasing}`,
                opacity: isActive ? 1 : 0.45,
              }}
            >
              <Icon
                sx={{
                  fontSize: isActive ? 40 : 24,
                  color: isActive ? color : theme.palette.text.secondary,
                }}
              />
            </Box>
          );
        })}
      </Stack>
      <Typography variant="h6">{status}</Typography>
    </Box>
  );
};

export default TrafficLight;
