import React from "react";
import { Alert, Stack, Typography, Link, Box, Divider } from "@mui/material";
import WarningIcon from "@mui/icons-material/Warning";
import { WeatherWarning, WarningSeverity } from "@/types";
import { isWithinInterval, parseISO } from "date-fns";
import { tz, TZDate } from "@date-fns/tz";
import { formatMetTime } from "@/lib/weather";
import { WARNING_COLORS } from "@/lib/config";

interface Props {
  warnings?: WeatherWarning[];
}

const WeatherWarnings: React.FC<Props> = ({ warnings }) => {
  if (!warnings || warnings.length === 0) return null;

  const now = new TZDate(new Date(), "Europe/London");

  // Filter for warnings active right now
  const activeWarnings = warnings.filter((w) => {
    if (!w.validFromISO || !w.validToISO) return true; // Fallback if parsing failed
    try {
      return isWithinInterval(now, {
        start: parseISO(w.validFromISO, { in: tz("Europe/London") }),
        end: parseISO(w.validToISO, { in: tz("Europe/London") }),
      });
    } catch {
      return true;
    }
  });

  if (activeWarnings.length === 0) return null;

  // Group active warnings by severity and headline to nest similar warnings
  const grouped = activeWarnings.reduce((acc, w) => {
    if (!acc[w.severity]) acc[w.severity] = {};
    if (!acc[w.severity][w.headline]) acc[w.severity][w.headline] = [];
    acc[w.severity][w.headline].push(w);
    return acc;
  }, {} as Record<WarningSeverity, Record<string, WeatherWarning[]>>);

  const severityOrder: WarningSeverity[] = ["Red", "Amber", "Yellow"];

  return (
    <Stack spacing={1.5} sx={{ mt: 2 }}>
      {severityOrder.map((severity) => {
        const group = grouped[severity];
        if (!group || (Object.keys(group).length === 0)) return null;

        const isRed = severity === "Red";
        const isAmber = severity === "Amber";

        // Map severity to specific colors matching RAG system where possible
        const alertColors = isRed
          ? { text: "#fff", bg: WARNING_COLORS.Red }
          : isAmber
          ? { text: "#fff", bg: WARNING_COLORS.Amber }
          : { text: "rgba(0, 0, 0, 0.87)", bg: WARNING_COLORS.Yellow }; // Yellow - use dark text for contrast

        return (
          <Alert
            key={severity}
            variant="filled"
            icon={<WarningIcon sx={{ color: alertColors.text }} />}
            sx={{
              backgroundColor: alertColors.bg,
              color: alertColors.text,
              "& .MuiAlert-icon": {
                color: alertColors.text,
                alignItems: "center",
              },
              "& .MuiAlert-message": {
                width: "100%",
                p: 0,
              },
            }}
          >
            <Stack spacing={1} sx={{ py: 0.5 }}>
              {Object.entries(group).map(([headline, warnings], idx) => (
                <Box key={headline}>
                  {idx > 0 && <Divider sx={{ my: 1, opacity: 0.3, borderColor: alertColors.text }} />}
                  <Typography
                    variant="subtitle2"
                    sx={{ fontWeight: "bold", lineHeight: 1.2, mb: 0.5 }}
                  >
                    {headline}
                  </Typography>
                  {warnings.map((warning, wIdx) => (
                    <Box
                      key={wIdx}
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-end",
                        gap: 1,
                        mb: wIdx < warnings.length - 1 ? 0.5 : 0,
                      }}
                    >
                      <Typography variant="caption" sx={{ opacity: 0.9 }}>
                        {formatMetTime(warning.validFrom)} —{" "}
                        {formatMetTime(warning.validTo)}
                      </Typography>
                      {wIdx === 0 && (
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
                      )}
                    </Box>
                  ))}
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
