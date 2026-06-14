"use client";

import React from "react";
import { Alert, Box, Paper, Typography } from "@mui/material";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import { KayakConditions } from "@/types";
import { useKayakContext } from "@/lib/KayakDataContext";
import { useBriefing } from "@/lib/useBriefing";

interface Props {
  conditions: KayakConditions;
}

function BriefingText({
  text,
  loading,
  failed,
}: {
  text: string;
  loading: boolean;
  failed: boolean;
}) {
  return (
    <Typography variant="body2" sx={{ lineHeight: 1.65 }}>
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
  );
}

export function ConditionsBriefingPaper({ conditions }: Props) {
  const { forecastDays } = useKayakContext();
  const { text, loading, failed } = useBriefing(conditions, forecastDays);

  if (!loading && !text && !failed) return null;

  return (
    <Paper
      variant="outlined"
      sx={{ p: 1.5, mt: 2, backgroundColor: "action.hover" }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mb: 0.75 }}>
        <AutoAwesomeIcon sx={{ fontSize: 14, color: "text.secondary" }} />
        <Typography variant="caption" color="text.secondary">
          AI summary
        </Typography>
      </Box>
      <BriefingText text={text} loading={loading} failed={failed} />
    </Paper>
  );
}

export function ConditionsBriefingAlert({ conditions }: Props) {
  const { forecastDays } = useKayakContext();
  const { text, loading, failed } = useBriefing(conditions, forecastDays);

  if (!loading && !text && !failed) return null;

  return (
    <Alert
      icon={<AutoAwesomeIcon fontSize="small" />}
      severity="info"
      sx={{ mt: 2 }}
    >
      <BriefingText text={text} loading={loading} failed={failed} />
    </Alert>
  );
}
