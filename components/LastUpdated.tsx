"use client";

import React from "react";
import { Typography, Box } from "@mui/material";
import { format } from "date-fns";

interface LastUpdatedProps {
  date?: string;
}

const LastUpdated: React.FC<LastUpdatedProps> = ({ date }) => {
  if (!date) {
    return null;
  }

  const formattedDate = format(new Date(date), "PPP p");

  return (
    <Box sx={{ width: "100%", textAlign: "center" }}>
      <Typography variant="caption" color="text.secondary">
        Last updated: {formattedDate}
      </Typography>
    </Box>
  );
};

export default LastUpdated;