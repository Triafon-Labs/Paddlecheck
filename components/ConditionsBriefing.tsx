"use client";

import React, { useRef, useState } from "react";
import { Box, Collapse, IconButton, Typography } from "@mui/material";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
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
    <Box sx={{ mt: 2, borderTop: "1px solid", borderColor: "divider", pt: 1 }}>
      <Box
        role="button"
        tabIndex={0}
        onClick={handleToggle}
        onKeyDown={(e) => e.key === "Enter" && handleToggle()}
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          cursor: "pointer",
          userSelect: "none",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
          <AutoAwesomeIcon sx={{ fontSize: 13, color: "text.disabled" }} />
          <Typography variant="caption" color="text.disabled">
            AI summary
          </Typography>
        </Box>
        <IconButton size="small" sx={{ color: "text.disabled", p: 0.25 }}>
          <ExpandMoreIcon
            sx={{
              fontSize: 16,
              transition: "transform 0.2s",
              transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
            }}
          />
        </IconButton>
      </Box>

      <Collapse in={expanded}>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mt: 1, lineHeight: 1.65 }}
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
      </Collapse>
    </Box>
  );
}
