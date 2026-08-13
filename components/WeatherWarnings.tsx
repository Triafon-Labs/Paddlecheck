import React from "react";
import { Stack, Typography, Link, Box, Divider } from "@mui/material";
import WarningIcon from "@mui/icons-material/Warning";
import { WeatherWarning, WarningSeverity } from "@/types";
import InfoPanel from "./InfoPanel";
import { formatMetTime } from "@/lib/weather";
import { WARNING_COLORS } from "@/lib/config";
import { londonNow, isWarningActiveNow } from "@/lib/warnings";

interface Props {
  warnings?: WeatherWarning[];
}

const WeatherWarnings: React.FC<Props> = ({ warnings }) => {
  const displayWarnings = warnings ?? [];

  if (displayWarnings.length === 0) return null;

  const now = londonNow();

  // Filter for warnings active right now
  const activeWarnings = displayWarnings.filter((w) =>
    isWarningActiveNow(w, now)
  );

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
    <Box sx={{ mt: 2 }}>
      <Typography variant="subtitle2" color="text.secondary">
        Weather Warnings
      </Typography>
      <Stack spacing={1} sx={{ mt: 1 }}>
        {severityOrder.map((severity) => {
          const group = grouped[severity];
          if (!group || Object.keys(group).length === 0) return null;

          const isRed = severity === "Red";
          const isAmber = severity === "Amber";

          const severityColor = isRed
            ? WARNING_COLORS.Red
            : isAmber
              ? WARNING_COLORS.Amber
              : WARNING_COLORS.Yellow;

          return (
            <InfoPanel
              key={severity}
              align="flex-start"
              sx={{ border: "1.5px solid", borderColor: severityColor }}
            >
              <WarningIcon
                fontSize="small"
                sx={{ color: severityColor, mt: "2px" }}
              />
              <Stack spacing={1} sx={{ flex: 1 }}>
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
                      variant="body2"
                      sx={{ fontWeight: 600, lineHeight: 1.2, mb: 0.5 }}
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
                        <Typography variant="caption" color="text.secondary">
                          {formatMetTime(warning.validFrom)}–
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
            </InfoPanel>
          );
        })}
      </Stack>
    </Box>
  );
};

export default WeatherWarnings;
