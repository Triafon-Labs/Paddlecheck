import React from "react";
import { Alert, Stack, Typography, Link, Box, Divider } from "@mui/material";
import WarningIcon from "@mui/icons-material/Warning";
import { WeatherWarning, WarningSeverity } from "@/types";

interface Props {
  warnings?: WeatherWarning[];
}

const severityToColor: Record<WarningSeverity, "warning" | "error" | "info"> = {
  Yellow: "warning",
  Amber: "warning",
  Red: "error",
};

/**
 * Formats Met Office validity string "HHmm Day DD Mon" to "Day DD Mon HH:mm"
 * e.g. "0800 Wed 24 Jun" -> "Wed 24 Jun, 08:00"
 */
const formatMetTime = (timeStr: string) => {
  if (!timeStr) return "";
  const match = timeStr.match(/^(\d{2})(\d{2})\s+(.*)$/);
  if (match) {
    const [, hh, mm, date] = match;
    return `${date}, ${hh}:${mm}`;
  }
  return timeStr;
};

const WeatherWarnings: React.FC<Props> = ({ warnings }) => {
  if (!warnings || warnings.length === 0) return null;

  // Group warnings by severity
  const grouped = warnings.reduce((acc, w) => {
    if (!acc[w.severity]) acc[w.severity] = [];
    acc[w.severity].push(w);
    return acc;
  }, {} as Record<WarningSeverity, WeatherWarning[]>);

  const severityOrder: WarningSeverity[] = ["Red", "Amber", "Yellow"];

  return (
    <Stack spacing={1.5} sx={{ mt: 2 }}>
      {severityOrder.map((severity) => {
        const group = grouped[severity];
        if (!group || group.length === 0) return null;

        const alertSeverity = severityToColor[severity];
        const isRed = severity === "Red";

        return (
          <Alert
            key={severity}
            severity={alertSeverity}
            icon={<WarningIcon />}
            sx={{
              borderRadius: 2,
              backgroundColor: isRed ? "#d32f2f" : undefined,
              color: isRed ? "#fff" : undefined,
              "& .MuiAlert-icon": {
                color: isRed ? "#fff" : undefined,
                alignItems: "center",
              },
              "& .MuiAlert-message": {
                width: "100%",
                p: 0,
              },
            }}
          >
            <Stack spacing={1} sx={{ py: 0.5 }}>
              {group.map((warning, idx) => (
                <Box key={idx}>
                  {idx > 0 && <Divider sx={{ my: 1, opacity: 0.2, borderColor: isRed ? "white" : "inherit" }} />}
                  <Typography
                    variant="subtitle2"
                    sx={{ fontWeight: "bold", lineHeight: 1.2, mb: 0.5 }}
                  >
                    {warning.headline}
                  </Typography>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-end",
                      gap: 1,
                    }}
                  >
                    <Typography variant="caption" sx={{ opacity: 0.9 }}>
                      Valid: {formatMetTime(warning.validFrom)} —{" "}
                      {formatMetTime(warning.validTo)}
                    </Typography>
                    <Link
                      href={warning.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      color="inherit"
                      sx={{
                        typography: "caption",
                        textDecoration: "underline",
                        fontWeight: "bold",
                        whiteSpace: "nowrap",
                      }}
                    >
                      UK Met Office
                    </Link>
                  </Box>
                </Box>
              ))}
            </Stack>
          </Alert>
        );
      })}
    </Stack>
  );
};

export default WeatherWarnings;
