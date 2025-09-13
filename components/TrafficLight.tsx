"use client";

import React from "react";
import { Box, Typography, useTheme } from "@mui/material";
import { Status } from "@/types";
import { ragStatus } from "@/lib/rag";

interface TrafficLightProps {
  status: Status;
}

const TrafficLight: React.FC<TrafficLightProps> = ({ status }) => {
  const theme = useTheme();
  const {
    icon: Icon,
    color,
    backgroundColor,
  } = ragStatus[status] || ragStatus.Unknown;

  const getStatusColor = () => {
    if (theme.palette.mode === 'dark') {
      // In dark mode, we can use the primary color for the status text
      // and a lighter version for the background.
      switch (status) {
        case 'Light Green':
        case 'Dark Green':
          return {
            backgroundColor: 'rgba(129, 199, 132, 0.2)',
            color: '#81C784',
          };
        case 'Amber':
          return {
            backgroundColor: 'rgba(255, 152, 0, 0.2)',
            color: '#FF9800',
          };
        case 'Red':
          return {
            backgroundColor: 'rgba(244, 67, 54, 0.2)',
            color: '#F44336',
          };
        default:
          return {
            backgroundColor: 'rgba(158, 158, 158, 0.2)',
            color: '#9E9E9E',
          };
      }
    }
    // Light mode uses the predefined colors
    return { backgroundColor, color };
  };

  const { backgroundColor: finalBgColor, color: finalColor } = getStatusColor();

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        width: 200,
        height: 200,
        borderRadius: "50%",
        backgroundColor: finalBgColor,
        border: `4px solid ${finalColor}`,
        transition: "all 0.3s ease-in-out",
        "&:hover": {
          transform: "scale(1.05)",
        },
      }}
    >
      <Icon sx={{ fontSize: 72, color: finalColor }} />
      <Typography variant="h6" sx={{ color: finalColor, mt: 1 }}>
        {status}
      </Typography>
    </Box>
  );
};

export default TrafficLight;
