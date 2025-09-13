"use client";

import React from "react";
import { Box, Typography } from "@mui/material";
import { Status } from "@/types";
import { ragStatus } from "@/lib/rag";

interface TrafficLightProps {
  status: Status;
}

const TrafficLight: React.FC<TrafficLightProps> = ({ status }) => {
  const lights = ["Red", "Amber", "Dark Green", "Light Green"];

  const getLightColor = (light: Status) => {
    if (status === light) return ragStatus[light].color;
    return "#bdbdbd"; // Default grey color
  };

  if (status === "No Paddling") {
    return (
      <Box sx={{ textAlign: "center", my: 2 }}>
        <Typography variant="h1">⛔</Typography>
        <Typography variant="h6">No Paddling</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", justifyContent: "center" }}>
      <Box
        sx={{
          bgcolor: "black",
          borderRadius: "10px",
          p: 2,
          display: "flex",
          flexDirection: "row",
          gap: 1,
        }}
      >
        {lights.map((light) => (
          <Box
            key={light}
            sx={{
              width: 80,
              height: 80,
              borderRadius: "50%",
              backgroundColor: getLightColor(light as Status),
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "2px solid #424242",
            }}
          >
            <Typography
              variant="caption"
              sx={{ color: "white", fontWeight: "bold", textAlign: "center" }}
            >
              {light.replace(" ", "\n")}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default TrafficLight;
