import React from "react";
import { Stack, Typography, Link, Box } from "@mui/material";
import WarningAmberOutlined from "@mui/icons-material/WarningAmberOutlined";
import { WeatherWarning, WarningSeverity } from "@/types";
import { WARNING_COLORS } from "@/lib/config";
import {
  londonNow,
  isWarningActiveNow,
  formatWarningTime,
} from "@/lib/warnings";

interface Props {
  warnings?: WeatherWarning[];
}

// The Met Office title reads "Yellow warning of rain affecting
// Worcestershire", which says the severity and the county the panel has
// already established. The warning subject is the part that isn't already on
// screen, so it takes the headline slot and the rest is dropped.
const describeWarning = (warning: WeatherWarning) => {
  const type = warning.type.trim();
  if (!type) return warning.headline;
  return type.charAt(0).toUpperCase() + type.slice(1);
};

const WeatherWarnings: React.FC<Props> = ({ warnings }) => {
  const displayWarnings = warnings ?? [];

  if (displayWarnings.length === 0) return null;

  const now = londonNow();

  // Filter for warnings active right now
  const activeWarnings = displayWarnings.filter((w) =>
    isWarningActiveNow(w, now)
  );

  if (activeWarnings.length === 0) return null;

  // Group active warnings by severity and headline, so a warning the Met
  // Office issues once per area becomes one panel listing its periods rather
  // than the same headline repeated down the card.
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

  // One panel per headline, most severe first.
  const panels = severityOrder.flatMap((severity) =>
    Object.entries(grouped[severity] ?? {}).map(
      ([headline, groupWarnings]) => ({ severity, headline, groupWarnings })
    )
  );

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="subtitle2" color="text.secondary">
        Weather Warnings
      </Typography>
      <Stack spacing={1} sx={{ mt: 1 }}>
        {panels.map(({ severity, headline, groupWarnings }) => {
          const severityColor = WARNING_COLORS[severity];

          return (
            // Same shape as the verdict panel in Who Can Paddle: the severity
            // arrives as an accent stripe rather than as a border or a fill,
            // so a warning reads as one of the app's status panels instead of
            // as an outlined box of its own kind.
            <Box
              key={`${severity}-${headline}`}
              sx={{
                display: "flex",
                borderRadius: "16px",
                overflow: "hidden",
                backgroundColor: "surfaces.containerHighest",
              }}
            >
              <Box
                sx={{ width: 6, backgroundColor: severityColor, flexShrink: 0 }}
                aria-hidden
              />
              <Box sx={{ p: 2, flex: 1, minWidth: 0 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                  <WarningAmberOutlined
                    sx={{ fontSize: 32, color: severityColor, flexShrink: 0 }}
                  />
                  <Box sx={{ minWidth: 0 }}>
                    <Typography
                      variant="overline"
                      color="text.secondary"
                      sx={{ display: "block", lineHeight: 1.2 }}
                    >
                      {severity} warning
                    </Typography>
                    <Typography
                      component="p"
                      sx={{
                        fontSize: "1.25rem",
                        fontWeight: 500,
                        lineHeight: 1.2,
                      }}
                    >
                      {describeWarning(groupWarnings[0])}
                    </Typography>
                  </Box>
                </Box>
                <Box
                  component="ul"
                  sx={{ m: 0, mt: 1.5, pl: 2.5, "& li": { mb: 0.25 } }}
                >
                  {groupWarnings.map((warning, wIdx) => (
                    <Typography key={wIdx} component="li" variant="body2">
                      {/* inline-flex rather than plain inline text so the
                          link drops to its own line when the period doesn't
                          leave room for it, instead of breaking mid-phrase.
                          The li itself stays list-item so it keeps its
                          marker. */}
                      <Box
                        component="span"
                        sx={{
                          display: "inline-flex",
                          flexWrap: "wrap",
                          columnGap: 1,
                        }}
                      >
                        <Box component="span">
                          {formatWarningTime(
                            warning.validFromISO,
                            warning.validFrom
                          )}
                          –
                          {formatWarningTime(
                            warning.validToISO,
                            warning.validTo
                          )}
                        </Box>
                        <Link
                          href={warning.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          color="inherit"
                          sx={{
                            textDecoration: "underline",
                            fontWeight: 600,
                            whiteSpace: "nowrap",
                          }}
                        >
                          UK Met Office
                        </Link>
                      </Box>
                    </Typography>
                  ))}
                </Box>
              </Box>
            </Box>
          );
        })}
      </Stack>
    </Box>
  );
};

export default WeatherWarnings;
