"use client";

import { useEffect, useState } from "react";
import { Box, Typography } from "@mui/material";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import { KayakConditions } from "@/types";
import InfoPanel from "./InfoPanel";
import { useKayakContext } from "@/lib/KayakDataContext";
import { useBriefing } from "@/lib/useBriefing";
import { DEFAULT_AI_MODEL } from "@/lib/config";
import { STORAGE_KEYS } from "@/lib/storageKeys";

export const SETTINGS_CHANGED_EVENT = "paddlecheck:settings-changed";

interface Props {
  conditions: KayakConditions;
  model?: string;
}

const AI_SUMMARY_ENABLED = process.env.NEXT_PUBLIC_FEATURE_AI_SUMMARY !== "false";

export default function ConditionsBriefing({ conditions, model = DEFAULT_AI_MODEL }: Props) {
  const { forecastDays } = useKayakContext();
  const [auto, setAuto] = useState(
    () =>
      typeof window !== "undefined" &&
      localStorage.getItem(STORAGE_KEYS.AUTO_SUMMARISE) === "true"
  );

  useEffect(() => {
    const handler = () =>
      setAuto(localStorage.getItem(STORAGE_KEYS.AUTO_SUMMARISE) === "true");
    window.addEventListener(SETTINGS_CHANGED_EVENT, handler);
    return () => window.removeEventListener(SETTINGS_CHANGED_EVENT, handler);
  }, []);

  const { text, loading, failed, triggered, trigger } = useBriefing(conditions, forecastDays, auto, model);

  if (!AI_SUMMARY_ENABLED) return null;

  return (
    <InfoPanel align="flex-start">
      <AutoAwesomeIcon
        fontSize="small"
        sx={{ color: "primary.main", mt: "2px" }}
      />
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
                animation: "thinking 2s ease-in-out infinite",
                "@keyframes thinking": {
                  "0%, 100%": { opacity: 0.15 },
                  "50%":      { opacity: 0.65 },
                },
              }}>Thinking…</Box>
            : text}
          {loading && text.trim() && (
            <Box component="span" sx={{ opacity: 0.35 }}>▋</Box>
          )}
        </Typography>
      )}
    </InfoPanel>
  );
}
