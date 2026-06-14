"use client";

import React, { useRef, useState } from "react";
import { Box, Chip, Collapse, Typography } from "@mui/material";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import { KayakConditions } from "@/types";
import { useKayakContext } from "@/lib/KayakDataContext";
import { buildBestPaddlingTimes } from "@/lib/forecast";

interface Props {
  conditions: KayakConditions;
}

export default function ConditionsBriefing({ conditions }: Props) {
  const { forecastDays } = useKayakContext();
  const [expanded, setExpanded] = useState(false);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const fetchedForRef = useRef<string | null>(null);

  const fetchBriefing = async () => {
    const key = conditions.lastUpdated ?? JSON.stringify(conditions);
    if (fetchedForRef.current === key) return;
    fetchedForRef.current = key;

    setText("");
    setLoading(true);
    setFailed(false);

    const todayForecast = forecastDays?.[0] ?? null;
    const currentlyDark = conditions.dark ?? false;
    const bestTimes = currentlyDark ? null : buildBestPaddlingTimes(todayForecast);
    const sunset = todayForecast?.sunset
      ? todayForecast.sunset.split("T")[1]?.slice(0, 5)
      : null;

    try {
      const res = await fetch("/api/briefing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conditions, bestTimes, sunset, currentlyDark }),
      });

      if (!res.ok || !res.body) {
        setFailed(true);
        setLoading(false);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        setText((prev) => prev + decoder.decode(value));
      }
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = () => {
    const next = !expanded;
    setExpanded(next);
    if (next) fetchBriefing();
  };

  return (
    <Box sx={{ mt: 2 }}>
      {!expanded && (
        <Chip
          icon={<AutoAwesomeIcon />}
          label="Summarise conditions"
          variant="outlined"
          onClick={handleToggle}
          size="small"
          sx={{ cursor: "pointer" }}
        />
      )}

      <Collapse in={expanded}>
        <Box sx={{ borderTop: "1px solid", borderColor: "divider", pt: 1.5 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mb: 1 }}>
            <AutoAwesomeIcon sx={{ fontSize: 14, color: "text.secondary" }} />
            <Typography variant="caption" color="text.secondary">
              AI summary
            </Typography>
          </Box>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ lineHeight: 1.65 }}
          >
            {failed
              ? "Summary unavailable."
              : loading && !text
                ? "…"
                : text}
            {loading && text && (
              <Box component="span" sx={{ opacity: 0.35 }}>
                ▋
              </Box>
            )}
          </Typography>
        </Box>
      </Collapse>
    </Box>
  );
}
