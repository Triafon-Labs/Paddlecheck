"use client";

import React from "react";
import {
  Card,
  CardContent,
  Typography,
  Box,
  Skeleton,
  Grow,
  Paper,
  SvgIconProps,
} from "@mui/material";
import Visibility from "@mui/icons-material/Visibility";
import Air from "@mui/icons-material/Air";
import Navigation from "@mui/icons-material/Navigation";
import WbSunny from "@mui/icons-material/WbSunny";
import Bedtime from "@mui/icons-material/Bedtime";
import FilterDrama from "@mui/icons-material/FilterDrama";
import Cloud from "@mui/icons-material/Cloud";
import Foggy from "@mui/icons-material/Foggy";
import Grain from "@mui/icons-material/Grain";
import WaterDrop from "@mui/icons-material/WaterDrop";
import AcUnit from "@mui/icons-material/AcUnit";
import Thunderstorm from "@mui/icons-material/Thunderstorm";
import WbTwilight from "@mui/icons-material/WbTwilight";
import { KayakConditions } from "@/types";
import { degreesToCompass } from "@/lib/weather";
import {
  formatTemperature,
  formatVisibility,
  formatWindSpeed,
} from "@/lib/units";
import { springTransition } from "@/lib/m3-palette";
import { useKayakContext } from "@/lib/KayakDataContext";
import {
  getLondonHHMM,
  hhmmOfISO,
  minutesOfISO,
  useNowTicking,
} from "@/lib/time";
import { formatDuration } from "./ConditionFactors";

interface StatsCardProps {
  conditions: KayakConditions | null;
  loading: boolean;
}

const MINUTES_PER_DAY = 24 * 60;

// The sky icon for a WMO code. Clear skies after dark show the moon, so the
// panel doesn't put a sun up at 9pm.
const SkyIcon: React.FC<{ code?: number; dark?: boolean } & SvgIconProps> = ({
  code,
  dark,
  ...props
}) => {
  if (code === undefined) return <Cloud {...props} />;
  if (code >= 95) return <Thunderstorm {...props} />;
  if ((code >= 71 && code <= 77) || code === 85 || code === 86)
    return <AcUnit {...props} />;
  if (code >= 61) return <WaterDrop {...props} />;
  if (code >= 51) return <Grain {...props} />;
  if (code === 45 || code === 48) return <Foggy {...props} />;
  if (code === 3) return <Cloud {...props} />;
  if (code === 2) return <FilterDrama {...props} />;
  return dark ? <Bedtime {...props} /> : <WbSunny {...props} />;
};

// A tile that is one of the reasons behind the current status is filled in
// the warning container, so the card points at what's driving the verdict
// without repeating the Contributing Factors list. A fill rather than amber
// text or icons: the amber is around 2:1 as a bare glyph (lib/m3-palette.ts).
const tileSx = (flagged?: boolean) => ({
  p: 1.5,
  // See ChangeIndicator in RiverLevelGraph: without it a long value holds
  // the grid column wider than its share on a narrow phone.
  minWidth: 0,
  backgroundColor: flagged ? "warning.container" : "surfaces.containerHigh",
  color: flagged ? "warning.onContainer" : "text.primary",
});

// Secondary text inherits the flagged tile's on-colour instead of the grey,
// which washes out on the amber container.
const secondary = (flagged?: boolean) =>
  flagged ? "inherit" : "text.secondary";

const TileHeading: React.FC<{
  icon: React.ReactNode;
  label: string;
  flagged?: boolean;
}> = ({ icon, label, flagged }) => (
  <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
    <Box
      sx={{
        display: "flex",
        color: flagged ? "inherit" : "primary.main",
      }}
    >
      {icon}
    </Box>
    <Typography variant="subtitle2" color={secondary(flagged)}>
      {label}
    </Typography>
  </Box>
);

const StatTile: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  detail?: React.ReactNode;
  flagged?: boolean;
}> = ({ icon, label, value, detail, flagged }) => (
  <Paper elevation={0} sx={tileSx(flagged)}>
    <TileHeading icon={icon} label={label} flagged={flagged} />
    <Typography variant="h6" component="div" sx={{ mt: 0.5 }}>
      {value}
    </Typography>
    {detail && (
      <Typography variant="body2" color={secondary(flagged)}>
        {detail}
      </Typography>
    )}
  </Paper>
);

// The day as a 24-hour track: daylight is the lit stretch, the dot is now.
const DaylightTile: React.FC<{
  sunrise: string | null;
  sunset: string | null;
  tomorrowSunrise: string | null;
  nowMinutes: number;
}> = ({ sunrise, sunset, tomorrowSunrise, nowMinutes }) => {
  const riseMinutes = minutesOfISO(sunrise);
  const setMinutes = minutesOfISO(sunset);
  if (!sunrise || !sunset || riseMinutes === null || setMinutes === null) {
    return null;
  }

  // Same comparison as the current "Dark" factor (lib/hooks.ts).
  let summary: string;
  if (nowMinutes <= riseMinutes) {
    summary = `Sunrise in ${formatDuration(riseMinutes - nowMinutes)}`;
  } else if (nowMinutes >= setMinutes) {
    const next = tomorrowSunrise ? hhmmOfISO(tomorrowSunrise) : null;
    summary = next ? `Dark until ${next}` : "Dark";
  } else {
    summary = `${formatDuration(setMinutes - nowMinutes)} of daylight left`;
  }
  const isDark = nowMinutes <= riseMinutes || nowMinutes >= setMinutes;
  // On the amber container the primary-blue track would clash; the bar
  // follows the tile's on-colour instead.
  const accent = isDark ? "warning.onContainer" : "primary.main";
  const pct = (minutes: number) => `${(minutes / MINUTES_PER_DAY) * 100}%`;

  return (
    <Paper elevation={0} sx={{ ...tileSx(isDark), gridColumn: "1 / -1" }}>
      <TileHeading icon={<WbTwilight />} label="Daylight" flagged={isDark} />
      <Typography variant="h6" component="div" sx={{ mt: 0.5 }}>
        {summary}
      </Typography>
      <Box
        role="img"
        aria-label={`Sunrise ${hhmmOfISO(sunrise)}, sunset ${hhmmOfISO(sunset)}`}
        sx={{
          position: "relative",
          height: 8,
          mt: 1.5,
          borderRadius: 9999,
          backgroundColor: isDark
            ? "rgba(0, 0, 0, 0.12)"
            : "surfaces.containerHighest",
        }}
      >
        <Box
          sx={{
            position: "absolute",
            top: 0,
            bottom: 0,
            left: pct(riseMinutes),
            width: pct(setMinutes - riseMinutes),
            borderRadius: 9999,
            backgroundColor: accent,
            opacity: 0.35,
          }}
        />
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: pct(nowMinutes),
            width: 14,
            height: 14,
            borderRadius: "50%",
            transform: "translate(-50%, -50%)",
            backgroundColor: accent,
            border: "2px solid",
            borderColor: isDark
              ? "warning.container"
              : "surfaces.containerHigh",
          }}
        />
      </Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", mt: 1 }}>
        <Typography variant="body2" color={secondary(isDark)}>
          Sunrise {hhmmOfISO(sunrise)}
        </Typography>
        <Typography variant="body2" color={secondary(isDark)}>
          Sunset {hhmmOfISO(sunset)}
        </Typography>
      </Box>
    </Paper>
  );
};

const tileGridSx = {
  display: "grid",
  gridTemplateColumns: { xs: "repeat(2, 1fr)", sm: "repeat(3, 1fr)" },
  gap: 1,
  mt: 1,
  // Three tiles in two columns would leave Visibility on its own, half
  // width; it takes the row instead.
  "& > :nth-of-type(3)": { gridColumn: { xs: "1 / -1", sm: "auto" } },
} as const;

const StatsCard: React.FC<StatsCardProps> = ({ conditions, loading }) => {
  const { forecastDays } = useKayakContext();
  // Ticks so the daylight countdown stays right while the page is left open.
  const now = useNowTicking();

  if (loading) {
    return (
      <Card sx={{ width: "100%" }}>
        <CardContent>
          <Typography variant="h5" component="div" gutterBottom>
            Detailed Stats
          </Typography>
          <Skeleton
            variant="rounded"
            height={104}
            animation="wave"
            sx={{ mt: 1, borderRadius: "28px" }}
          />
          <Box sx={tileGridSx}>
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton
                key={i}
                variant="rounded"
                height={88}
                animation="wave"
              />
            ))}
            <Skeleton
              variant="rounded"
              height={120}
              animation="wave"
              sx={{ gridColumn: "1 / -1" }}
            />
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (!conditions) {
    return null;
  }

  const reasons = conditions.reasons ?? [];
  const [nowH, nowM] = getLondonHHMM(now).split(":").map(Number);
  const today = forecastDays?.[0];
  const compass =
    conditions.windDirection !== undefined
      ? degreesToCompass(conditions.windDirection)
      : null;

  return (
    <Card sx={{ width: "100%" }}>
      <CardContent>
        <Typography variant="h5" component="div" gutterBottom>
          Detailed Stats
        </Typography>
        <Grow in appear {...springTransition()}>
          <Box>
            <Paper
              elevation={0}
              sx={{
                mt: 1,
                p: 2,
                display: "flex",
                alignItems: "center",
                gap: 2,
                borderRadius: "28px",
                backgroundColor: "surfaces.containerHigh",
              }}
            >
              <Box
                sx={{
                  display: "grid",
                  placeItems: "center",
                  width: 64,
                  height: 64,
                  flexShrink: 0,
                  borderRadius: "50%",
                  backgroundColor: "primary.main",
                  color: "primary.contrastText",
                }}
              >
                <SkyIcon
                  code={conditions.weatherCode}
                  dark={conditions.dark}
                  sx={{ fontSize: 36 }}
                />
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Box sx={{ display: "flex", alignItems: "baseline", gap: 1 }}>
                  <Typography variant="h3" component="div">
                    {conditions.temperature !== undefined
                      ? formatTemperature(conditions.temperature)
                      : "N/A"}
                  </Typography>
                  {conditions.apparentTemperature !== undefined && (
                    <Typography variant="body2" color="text.secondary">
                      Feels like{" "}
                      {formatTemperature(conditions.apparentTemperature)}
                    </Typography>
                  )}
                </Box>
                <Typography variant="subtitle1" color="text.secondary">
                  {conditions.weatherDescription ?? "Unknown"}
                </Typography>
              </Box>
            </Paper>

            <Box sx={tileGridSx}>
              <StatTile
                icon={
                  conditions.windDirection !== undefined ? (
                    // Navigation points up; the wind's direction is where it
                    // comes from, so the arrow turns to where it's blowing.
                    <Navigation
                      sx={{
                        transform: `rotate(${conditions.windDirection + 180}deg)`,
                      }}
                    />
                  ) : (
                    <Air />
                  )
                }
                label="Wind"
                value={
                  conditions.windSpeed !== undefined
                    ? formatWindSpeed(conditions.windSpeed)
                    : "N/A"
                }
                detail={compass ? `From the ${compass}` : undefined}
                flagged={reasons.includes("High winds")}
              />
              <StatTile
                icon={<Air />}
                label="Gusts"
                value={
                  conditions.windGust !== undefined
                    ? formatWindSpeed(conditions.windGust)
                    : "N/A"
                }
                detail={
                  conditions.gustStatus
                    ? `${conditions.gustStatus} if sustained`
                    : undefined
                }
                flagged={!!conditions.gustStatus}
              />
              <StatTile
                icon={<Visibility />}
                label="Visibility"
                value={conditions.visibilityDescription ?? "N/A"}
                detail={
                  conditions.visibility !== undefined
                    ? formatVisibility(conditions.visibility)
                    : undefined
                }
                flagged={reasons.includes("Foggy")}
              />
              <DaylightTile
                sunrise={today?.sunrise ?? null}
                sunset={today?.sunset ?? null}
                tomorrowSunrise={forecastDays?.[1]?.sunrise ?? null}
                nowMinutes={nowH * 60 + nowM}
              />
            </Box>
          </Box>
        </Grow>
      </CardContent>
    </Card>
  );
};

export default StatsCard;
