"use client";

import React from "react";
import { Box, Typography, useTheme, Stack } from "@mui/material";
import { Status } from "@/types";
import { ragStatus } from "@/lib/rag";

interface TrafficLightProps {
  status: Status;
  disabled?: boolean;
}

const TrafficLight: React.FC<TrafficLightProps> = ({ status, disabled }) => {
  const theme = useTheme();
  const statuses = (Object.keys(ragStatus) as Status[]).filter(
    (s) => s !== "Unknown" && s !== "No Paddling",
  );

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        filter: disabled ? "grayscale(100%)" : "none",
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
        {statuses.map((s) => {
          const { icon: Icon, color } = ragStatus[s];
          const isActive = s === status && !disabled;

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
                        16,
                      )}, ${parseInt(color.slice(5, 7), 16)}, 0.2)`
                    : ragStatus[s].backgroundColor
                  : "transparent",
                border: `2px solid ${isActive ? color : theme.palette.divider}`,
                transition: "all 0.3s ease-in-out",
                opacity: isActive ? 1 : 0.5,
                transform: isActive ? "scale(1.1)" : "scale(1)",
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
