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
  const displayWarnings = warnings ?? [];

  if (displayWarnings.length === 0) return null;

  const now = new TZDate(new Date(), "Europe/London");

  // Filter for warnings active right now
  const activeWarnings = displayWarnings.filter((w) => {
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
  const grouped = activeWarnings.reduce(
    (acc, w) => {
      if (!acc[w.severity]) acc[w.severity] = {};
      if (!acc[w.severity][w.headline]) acc[w.severity][w.headline] = [];
      acc[w.severity][w.headline].push(w);
      return acc;
    },
    {} as Record<WarningSeverity, Record<string, WeatherWarning[]>>
  );

  const severityOrder: WarningSeverity[] = ["Red", "Amber", "Yellow"];

  return (
    <Stack spacing={1.5} sx={{ mt: 2 }}>
      {severityOrder.map((severity) => {
        const group = grouped[severity];
        if (!group || Object.keys(group).length === 0) return null;

        const isRed = severity === "Red";
        const isAmber = severity === "Amber";

        // Keep the card neutral like the AI summary and only tint the icon.
        const alertColors = isRed
          ? { icon: WARNING_COLORS.Red }
          : isAmber
            ? { icon: WARNING_COLORS.Amber }
            : { icon: WARNING_COLORS.Yellow };

        return (
          <Alert
            key={severity}
            icon={<WarningIcon sx={{ color: alertColors.icon }} />}
            sx={{
              backgroundColor: "background.paper",
              color: "text.secondary",
              borderRadius: 1.5,
              border: "1px solid",
              borderColor: "divider",
              boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
              "& .MuiAlert-icon": {
                color: alertColors.icon,
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
                  {idx > 0 && (
                    <Divider
                      sx={{
                        my: 1,
                        opacity: 0.3,
                      }}
                    />
                  )}
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
