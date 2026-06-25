import React from "react";
import { Alert, Stack, Typography, Link, Box, Divider } from "@mui/material";
import WarningIcon from "@mui/icons-material/Warning";
import { WeatherWarning, WarningSeverity } from "@/types";
import { parseISO } from "date-fns";
import { tz, TZDate } from "@date-fns/tz";
import { formatMetTime } from "@/lib/weather";
import { ragStatus } from "@/lib/rag";

interface Props {
  warnings?: WeatherWarning[];
}

const severityStyles: Record<
  WarningSeverity,
  { color: string; backgroundColor: string; borderColor: string; dividerColor: string }
> = {
  Red: {
    color: "#fff",
    backgroundColor: ragStatus["Red"].color,
    borderColor: ragStatus["Red"].color,
    dividerColor: "rgba(255, 255, 255, 0.2)",
  },
  Amber: {
    color: "#E65100",
    backgroundColor: "#FFF3E0",
    borderColor: "#FF8F00",
    dividerColor: "rgba(230, 81, 0, 0.2)",
  },
  Yellow: {
    color: "#F57F17",
    backgroundColor: "#FFFDE7",
    borderColor: "#FBC02D",
    dividerColor: "rgba(245, 127, 23, 0.2)",
  },
};

const WeatherWarnings: React.FC<Props> = ({ warnings }) => {
  if (!warnings || warnings.length === 0) return null;

  const now = new TZDate(new Date(), "Europe/London");

  // Filter for unexpired warnings (active or upcoming)
  const relevantWarnings = warnings.filter((w) => {
    if (!w.validToISO) return true;
    try {
      const end = parseISO(w.validToISO, { in: tz("Europe/London") });
      return end > now;
    } catch {
      return true;
    }
  });

  if (relevantWarnings.length === 0) return null;

  // Group warnings by severity
  const groupedBySeverity = relevantWarnings.reduce((acc, w) => {
    if (!acc[w.severity]) acc[w.severity] = [];
    acc[w.severity].push(w);
    return acc;
  }, {} as Record<WarningSeverity, WeatherWarning[]>);

  const severityOrder: WarningSeverity[] = ["Red", "Amber", "Yellow"];

  return (
    <Stack spacing={1.5} sx={{ mt: 2 }}>
      {severityOrder.map((severity) => {
        const group = groupedBySeverity[severity];
        if (!group || group.length === 0) return null;

        const style = severityStyles[severity];

        return (
          <Alert
            key={severity}
            severity="info" // Use info as base to avoid MUI's default colors
            icon={<WarningIcon sx={{ color: style.color }} />}
            sx={{
              backgroundColor: style.backgroundColor,
              color: style.color,
              border: `1px solid ${style.borderColor}`,
              "& .MuiAlert-icon": {
                alignItems: "center",
              },
              "& .MuiAlert-message": {
                width: "100%",
                p: 0,
              },
            }}
          >
            <Stack spacing={1} sx={{ py: 0.5 }}>
              {Object.entries(
                group.reduce((acc, w) => {
                  if (!acc[w.headline]) acc[w.headline] = [];
                  acc[w.headline].push(w);
                  return acc;
                }, {} as Record<string, WeatherWarning[]>)
              ).map(([headline, warnings], hIdx) => (
                <Box key={headline}>
                  {hIdx > 0 && (
                    <Divider
                      sx={{
                        my: 1,
                        borderColor: style.dividerColor,
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
                        mt: wIdx > 0 ? 0.5 : 0,
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
