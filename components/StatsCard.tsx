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
import { degreesToCompassName } from "@/lib/weather";
import {
  formatTemperature,
  formatVisibility,
  formatWindSpeed,
} from "@/lib/units";
import { springTransition } from "@/lib/m3-palette";
import { useKayakContext } from "@/lib/KayakDataContext";
import {
  formatDuration,
  getLondonHHMM,
  hhmmOfISO,
  minutesOfISO,
} from "@/lib/time";
import { useNowTicking } from "@/lib/useNowTicking";
import StatTile, { TileHeading, TileValue, tileSx } from "./StatTile";

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
  const pct = (minutes: number) => `${(minutes / MINUTES_PER_DAY) * 100}%`;

  return (
    <Paper elevation={0} sx={{ ...tileSx, gridColumn: "1 / -1" }}>
      <TileHeading icon={<WbTwilight />} label="Daylight" />
      <TileValue>{summary}</TileValue>
      <Box
        role="img"
        aria-label={`Sunrise ${hhmmOfISO(sunrise)}, sunset ${hhmmOfISO(sunset)}`}
        sx={{
          position: "relative",
          height: 6,
          mt: 1.25,
          borderRadius: 9999,
          backgroundColor: "surfaces.containerHighest",
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
            backgroundColor: "primary.main",
            opacity: 0.35,
          }}
        />
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: pct(nowMinutes),
            width: 12,
            height: 12,
            borderRadius: "50%",
            transform: "translate(-50%, -50%)",
            backgroundColor: "primary.main",
            border: "2px solid",
            borderColor: "surfaces.containerHigh",
          }}
        />
      </Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", mt: 1 }}>
        <Typography variant="body2" color="text.secondary">
          Sunrise {hhmmOfISO(sunrise)}
        </Typography>
        <Typography variant="body2" color="text.secondary">
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
            Weather
          </Typography>
          <Skeleton
            variant="rounded"
            height={64}
            animation="wave"
            sx={{ mt: 1 }}
          />
          <Box sx={tileGridSx}>
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton
                key={i}
                variant="rounded"
                height={76}
                animation="wave"
              />
            ))}
            <Skeleton
              variant="rounded"
              height={100}
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

  const [nowH, nowM] = getLondonHHMM(now).split(":").map(Number);
  const today = forecastDays?.[0];
  const compass =
    conditions.windDirection !== undefined
      ? degreesToCompassName(conditions.windDirection)
      : null;

  return (
    <Card sx={{ width: "100%" }}>
      <CardContent>
        <Typography variant="h5" component="div" gutterBottom>
          Weather
        </Typography>
        <Grow in appear {...springTransition()}>
          <Box>
            {/* Sized to sit with the cards above it rather than outrank
                them: the temperature is a step below the card title, like
                the Who Can Paddle verdict, not a display-size number on a
                filled disc, which made this the loudest card on the page. */}
            <Paper
              elevation={0}
              sx={{
                mt: 1,
                p: 1.5,
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                backgroundColor: "surfaces.containerHigh",
              }}
            >
              <SkyIcon
                code={conditions.weatherCode}
                dark={conditions.dark}
                sx={{ fontSize: 32, color: "primary.main", flexShrink: 0 }}
              />
              <Box sx={{ minWidth: 0 }}>
                <Typography
                  component="div"
                  sx={{ fontSize: "1.25rem", fontWeight: 500, lineHeight: 1.2 }}
                >
                  {conditions.temperature !== undefined
                    ? formatTemperature(conditions.temperature)
                    : "N/A"}
                  <Typography component="span" variant="body2" sx={{ ml: 1 }}>
                    {conditions.weatherDescription ?? "Unknown"}
                  </Typography>
                </Typography>
                {conditions.apparentTemperature !== undefined && (
                  <Typography variant="body2" color="text.secondary">
                    Feels like{" "}
                    {formatTemperature(conditions.apparentTemperature)}
                  </Typography>
                )}
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
              />
              <StatTile
                icon={<Air />}
                label="Gusts"
                value={
                  conditions.windGust !== undefined
                    ? formatWindSpeed(conditions.windGust)
                    : "N/A"
                }
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
