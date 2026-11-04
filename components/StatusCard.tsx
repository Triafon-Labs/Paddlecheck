"use client";

import React, { useMemo } from "react";
import {
  Card,
  CardContent,
  Typography,
  Box,
  Skeleton,
  Grow,
  Collapse,
} from "@mui/material";
import { KayakConditions } from "@/types";
import PaddlingStatusHero from "./PaddlingStatusHero";
import { STEP_NAMES } from "@/lib/rag";
import { ContributingFactors, FactorHeading } from "./ConditionFactors";
import { useKayakContext } from "@/lib/KayakDataContext";
import { formatDataAge } from "@/lib/time";
import { useNowTicking } from "@/lib/useNowTicking";
import { useFreshness } from "@/lib/useFreshness";
import { THRESHOLDS, CONDITIONS_REPORT_ENABLED } from "@/lib/config";
import { collapseMotion, springTransition } from "@/lib/m3-palette";
import ConditionsBriefing from "./ConditionsBriefing";
import WeatherWarnings from "./WeatherWarnings";
import RiverLevelLandmarks, {
  RiverLevelLandmarksSkeleton,
} from "./RiverLevelLandmarks";

interface StatusCardProps {
  conditions: KayakConditions | null;
  loading?: boolean;
}

// Mirrors the scale in PaddlingStatusHero so the skeleton lays out the same
// number of placeholder segments as the real strip.
const SCALE_SEGMENT_COUNT = STEP_NAMES.length;

const StatusCard: React.FC<StatusCardProps> = ({ conditions, loading }) => {
  const { riverGraphData, isRefreshing } = useKayakContext();
  const { freshnessText } = useFreshness(conditions?.lastUpdated);
  // Ticks so the reading's age stays right while the page is left open.
  const now = useNowTicking();
  const dataAgeLabel = useMemo(() => {
    if (!riverGraphData || riverGraphData.length === 0) return null;
    return formatDataAge(
      new Date(riverGraphData[riverGraphData.length - 1].dateTime).getTime(),
      now
    );
  }, [riverGraphData, now]);
  const renderContent = () => {
    if (loading) {
      return (
        <>
          <Box sx={{ mt: 2 }}>
            <Skeleton
              variant="rounded"
              height={120}
              animation="wave"
              sx={{ borderRadius: "28px" }}
            />
            <Box sx={{ display: "flex", gap: 0.75, mt: 1.5 }}>
              {Array.from({ length: SCALE_SEGMENT_COUNT }).map((_, i) => (
                <Skeleton
                  key={i}
                  variant="rounded"
                  height={6}
                  animation="wave"
                  sx={{ flex: 1, borderRadius: 9999 }}
                />
              ))}
            </Box>
          </Box>

          <Box sx={{ mt: 2 }}>
            <Skeleton variant="text" width={140} height={20} animation="wave" />
            <RiverLevelLandmarksSkeleton />
          </Box>

          <Box sx={{ mt: 2 }}>
            <Skeleton variant="text" width={140} height={20} animation="wave" />
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "repeat(2, 1fr)",
                gap: 1,
                mt: 1,
                "& > *:last-of-type:nth-of-type(odd)": {
                  gridColumn: "1 / -1",
                },
              }}
            >
              {/* Two factor tiles, the commonest count, at their real
                  height with a detail line. */}
              {Array.from({ length: 2 }).map((_, i) => (
                <Skeleton
                  key={i}
                  variant="rounded"
                  height={96}
                  animation="wave"
                />
              ))}
            </Box>
          </Box>

          <Skeleton
            variant="rounded"
            height={72}
            animation="wave"
            sx={{ mt: 2 }}
          />
        </>
      );
    }
    if (conditions) {
      return (
        <Grow in appear {...springTransition()}>
          <Box>
            {/* One panel for all six statuses, including No Paddling, which
                used to render as an entirely separate widget - so the top of
                the card changed shape depending on the reading. */}
            <Box sx={{ mt: 2 }}>
              <PaddlingStatusHero status={conditions.overallStatus} />
            </Box>

            {conditions.riverLevel !== undefined && (
              <Box sx={{ mt: 2 }}>
                <FactorHeading>
                  River Level
                  {conditions.levelChange &&
                    ` · ${
                      conditions.levelChange.value >
                      THRESHOLDS.RIVER_LEVEL_TREND_THRESHOLD
                        ? "Rising"
                        : conditions.levelChange.value <
                            -THRESHOLDS.RIVER_LEVEL_TREND_THRESHOLD
                          ? "Falling"
                          : "Steady"
                    }`}
                </FactorHeading>
                <RiverLevelLandmarks
                  riverLevel={conditions.riverLevel}
                  readingNote={dataAgeLabel && `Gauge read ${dataAgeLabel}`}
                />
              </Box>
            )}

            <Collapse
              in={!!conditions.reasons && conditions.reasons.length > 0}
              unmountOnExit
              {...collapseMotion}
            >
              <ContributingFactors
                reasons={conditions.reasons ?? []}
                temperature={conditions.temperature}
                windSpeed={conditions.windSpeed}
                weatherDescription={conditions.weatherDescription}
              />
            </Collapse>
            <WeatherWarnings warnings={conditions.warnings} />
            {CONDITIONS_REPORT_ENABLED && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Conditions Report
                </Typography>
                <Box sx={{ mt: 1 }}>
                  <ConditionsBriefing conditions={conditions} />
                </Box>
              </Box>
            )}
          </Box>
        </Grow>
      );
    }
    return (
      <Typography variant="body1" sx={{ mt: 1, textAlign: "center" }}>
        No data yet
      </Typography>
    );
  };

  return (
    <Card data-testid="status-card" sx={{ width: "100%" }}>
      <CardContent>
        <Typography variant="h5" component="div">
          Paddling Status
        </Typography>
        {/* When the data was fetched. The banners above the top bar take
            over once it's stale or an update has failed. */}
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mt: 0.25, mb: 1.5, minHeight: "1.43em" }}
        >
          {isRefreshing
            ? "Updating…"
            : freshnessText
              ? `Updated ${freshnessText}`
              : null}
        </Typography>
        {renderContent()}
      </CardContent>
    </Card>
  );
};

export default StatusCard;
