import React from "react";
import { Alert, Stack, Typography, Link, Box, Divider } from "@mui/material";
import WarningIcon from "@mui/icons-material/Warning";
import { WeatherWarning, WarningSeverity } from "@/types";
import { isWithinInterval, parseISO } from "date-fns";
import { formatMetTime } from "@/lib/weather";

interface Props {
  warnings?: WeatherWarning[];
}

const severityToColor: Record<WarningSeverity, "warning" | "error" | "info"> = {
  Yellow: "warning",
  Amber: "warning",
  Red: "error",
};

const WeatherWarnings: React.FC<Props> = ({ warnings }) => {
  if (!warnings || warnings.length === 0) return null;

  const now = new Date();

  // Filter for warnings active right now
  const activeWarnings = warnings.filter((w) => {
    if (!w.validFromISO || !w.validToISO) return true; // Fallback if parsing failed
    try {
      return isWithinInterval(now, {
        start: parseISO(w.validFromISO),
        end: parseISO(w.validToISO),
      });
    } catch {
      return true;
    }
  });

  if (activeWarnings.length === 0) return null;

  // Group active warnings by severity
  const grouped = activeWarnings.reduce((acc, w) => {
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
              backgroundColor: isRed ? "#B71C1C" : undefined, // Darker Red
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
