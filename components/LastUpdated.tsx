"use client";

import React, { useState, useEffect } from "react";
import { Typography, Box } from "@mui/material";

interface LastUpdatedProps {
  date?: string;
}

const getRelativeTime = (date: Date): string => {
  const diffMs = Date.now() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "just now";
  if (diffMins === 1) return "1 minute ago";
  if (diffMins < 60) return `${diffMins} minutes ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours === 1) return "1 hour ago";
  return `${diffHours} hours ago`;
};

const LastUpdated: React.FC<LastUpdatedProps> = ({ date }) => {
  const [relativeTime, setRelativeTime] = useState<string>("");

  useEffect(() => {
    if (!date) return;
    const dateObj = new Date(date);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRelativeTime(getRelativeTime(dateObj));
    const interval = setInterval(() => {
      setRelativeTime(getRelativeTime(dateObj));
    }, 30000);
    return () => clearInterval(interval);
  }, [date]);

  if (!date || !relativeTime) return null;

  return (
    <Box sx={{ width: "100%", textAlign: "center" }}>
      <Typography variant="caption" color="text.secondary">
        Last updated: {relativeTime}
      </Typography>
    </Box>
  );
};

export default LastUpdated;
