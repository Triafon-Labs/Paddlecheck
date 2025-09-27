"use client";

import React from "react";
import { Typography, Box } from "@mui/material";
import { format, isToday, isYesterday } from "date-fns";
import { enGB } from "date-fns/locale";

interface LastUpdatedProps {
  date?: string;
}

const LastUpdated: React.FC<LastUpdatedProps> = ({ date }) => {
  if (!date) {
    return null;
  }

  const dateObj = new Date(date);
  let formattedDate: string;

  if (isToday(dateObj)) {
    formattedDate = `today at ${format(dateObj, "HH:mm")}`;
  } else if (isYesterday(dateObj)) {
    formattedDate = `yesterday at ${format(dateObj, "HH:mm")}`;
  } else {
    formattedDate = format(dateObj, "PPP 'at' HH:mm", {
      locale: enGB,
    });
  }

  return (
    <Box sx={{ width: "100%", textAlign: "center" }}>
      <Typography variant="caption" color="text.secondary">
        Last updated: {formattedDate}
      </Typography>
    </Box>
  );
};

export default LastUpdated;