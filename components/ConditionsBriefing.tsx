"use client";

import React, { useEffect, useState } from "react";
import { Alert, Box, Typography } from "@mui/material";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import { KayakConditions } from "@/types";
import { useKayakContext } from "@/lib/KayakDataContext";
import { useBriefing } from "@/lib/useBriefing";

export const SETTINGS_CHANGED_EVENT = "paddlecheck:settings-changed";

interface Props {
  conditions: KayakConditions;
  model?: string;
  label?: string;
}

const DEFAULT_MODEL = "qwen/qwen3-32b";

const AI_SUMMARY_ENABLED = process.env.NEXT_PUBLIC_FEATURE_AI_SUMMARY !== "false";

export default function ConditionsBriefing({ conditions, model = DEFAULT_MODEL, label }: Props) {
  const { forecastDays } = useKayakContext();
  const [auto, setAuto] = useState(
    () => typeof window !== "undefined" && localStorage.getItem("autoSummarise") === "true"
  );

  useEffect(() => {
    const handler = () => setAuto(localStorage.getItem("autoSummarise") === "true");
    window.addEventListener(SETTINGS_CHANGED_EVENT, handler);
    return () => window.removeEventListener(SETTINGS_CHANGED_EVENT, handler);
  }, []);

  const { text, loading, failed, triggered, trigger } = useBriefing(conditions, forecastDays, auto, model);

  if (!AI_SUMMARY_ENABLED) return null;

  return (
    <Alert
      icon={<AutoAwesomeIcon fontSize="small" />}
      severity="info"
      sx={{
        mt: 2,
        backgroundColor: "action.hover",
        "& .MuiAlert-icon": { color: "text.secondary" },
      }}
    >
      {label && (
        <Typography variant="caption" color="text.disabled" display="block" sx={{ mb: 0.5 }}>
          {label}
        </Typography>
      )}
      {!triggered ? (
        <Typography
          variant="body2"
          color="text.secondary"
          onClick={trigger}
          sx={{ cursor: "pointer", textDecoration: "underline", textDecorationStyle: "dotted" }}
        >
          Generate AI Summary
        </Typography>
      ) : (
        <Typography variant="body2" sx={{ lineHeight: 1.65 }}>
          {failed ? (
            <>
              Summary unavailable.{" "}
              <Box
                component="span"
                onClick={trigger}
                sx={{ cursor: "pointer", textDecoration: "underline", textDecorationStyle: "dotted" }}
              >
                Try again?
              </Box>
            </>
          ) : loading && !text.trim()
            ? <Box component="span" sx={{
                fontStyle: "italic",
                display: "inline-block",
                animation: "thinking 2s ease-in-out infinite",
                "@keyframes thinking": {
                  "0%":   { opacity: 0.1, transform: "translateX(-6px)" },
                  "25%":  { opacity: 0.55, transform: "translateX(0)" },
                  "75%":  { opacity: 0.55, transform: "translateX(0)" },
                  "100%": { opacity: 0.1, transform: "translateX(6px)" },
                },
              }}>Thinking…</Box>
            : text}
          {loading && text.trim() && (
            <Box component="span" sx={{ opacity: 0.35 }}>▋</Box>
          )}
        </Typography>
      )}
    </Alert>
  );
}
