"use client";

import React, { useEffect, useState } from "react";
import { Alert, Box, Paper, Typography } from "@mui/material";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import { KayakConditions } from "@/types";
import { useKayakContext } from "@/lib/KayakDataContext";
import { useBriefing } from "@/lib/useBriefing";

export const SETTINGS_CHANGED_EVENT = "paddlecheck:settings-changed";

interface Props {
  conditions: KayakConditions;
}

interface BodyProps {
  text: string;
  loading: boolean;
  failed: boolean;
  triggered: boolean;
  trigger: () => void;
}

function BriefingBody({ text, loading, failed, triggered, trigger }: BodyProps) {
  if (!triggered) {
    return (
      <Typography
        variant="body2"
        color="text.secondary"
        onClick={trigger}
        sx={{ cursor: "pointer", textDecoration: "underline", textDecorationStyle: "dotted" }}
      >
        Generate AI summary
      </Typography>
    );
  }
  return (
    <Typography variant="body2" sx={{ lineHeight: 1.65 }}>
      {failed
        ? "Summary unavailable."
        : loading && !text
          ? "…"
          : text}
      {loading && text && (
        <Box component="span" sx={{ opacity: 0.35 }}>▋</Box>
      )}
    </Typography>
  );
}

export function ConditionsBriefingPaper({ conditions }: Props) {
  const { forecastDays } = useKayakContext();
  const [auto, setAuto] = useState(
    () => typeof window !== "undefined" && localStorage.getItem("autoSummarise") === "true"
  );

  useEffect(() => {
    const handler = () => setAuto(localStorage.getItem("autoSummarise") === "true");
    window.addEventListener(SETTINGS_CHANGED_EVENT, handler);
    return () => window.removeEventListener(SETTINGS_CHANGED_EVENT, handler);
  }, []);

  const { text, loading, failed, triggered, trigger } = useBriefing(conditions, forecastDays, auto);

  return (
    <Paper variant="outlined" sx={{ p: 1.5, mt: 2, backgroundColor: "action.hover" }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mb: triggered ? 0.75 : 0 }}>
        <AutoAwesomeIcon sx={{ fontSize: 14, color: "text.secondary" }} />
        <Typography variant="caption" color="text.secondary">AI summary</Typography>
      </Box>
      <BriefingBody text={text} loading={loading} failed={failed} triggered={triggered} trigger={trigger} />
    </Paper>
  );
}

export function ConditionsBriefingAlert({ conditions }: Props) {
  const { forecastDays } = useKayakContext();
  const [auto, setAuto] = useState(
    () => typeof window !== "undefined" && localStorage.getItem("autoSummarise") === "true"
  );

  useEffect(() => {
    const handler = () => setAuto(localStorage.getItem("autoSummarise") === "true");
    window.addEventListener(SETTINGS_CHANGED_EVENT, handler);
    return () => window.removeEventListener(SETTINGS_CHANGED_EVENT, handler);
  }, []);

  const { text, loading, failed, triggered, trigger } = useBriefing(conditions, forecastDays, auto);

  return (
    <Alert icon={<AutoAwesomeIcon fontSize="small" />} severity="info" sx={{ mt: 2 }}>
      <BriefingBody text={text} loading={loading} failed={failed} triggered={triggered} trigger={trigger} />
    </Alert>
  );
}
