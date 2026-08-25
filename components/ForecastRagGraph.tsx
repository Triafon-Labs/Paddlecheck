"use client";

import React, { useCallback, useLayoutEffect, useRef, useState } from "react";
import {
  Card,
  CardContent,
  Typography,
  Box,
  Skeleton,
  Paper,
  useTheme,
  ToggleButton,
  Divider,
  Link,
  Stack,
  Grow,
  Collapse,
} from "@mui/material";
import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  TooltipContentProps,
  ReferenceLine,
  LabelList,
} from "recharts";
import { DayForecast, ForecastGraphDataPoint, WeatherWarning } from "@/types";
import { ragStatus, describeReason } from "@/lib/rag";
import { REASON_ICONS, WARNING_COLORS } from "@/lib/config";
import { formatRiverLevel, formatWindGust } from "@/lib/units";
import NightsStay from "@mui/icons-material/NightsStay";
import WbSunny from "@mui/icons-material/WbSunny";
import WarningIcon from "@mui/icons-material/Warning";
import Air from "@mui/icons-material/Air";
import WaterDrop from "@mui/icons-material/WaterDrop";
import FiberManualRecord from "@mui/icons-material/FiberManualRecord";
import { isWarningOnDay, formatWarningTime } from "@/lib/warnings";
import { springTransition } from "@/lib/m3-palette";
import { useTooltipDismiss } from "@/lib/useTooltipDismiss";
import SlidingToggleButtonGroup from "./SlidingToggleButtonGroup";

interface ForecastRagGraphProps {
  forecastDays: DayForecast[] | null;
  warnings?: WeatherWarning[];
  loading?: boolean;
}

import {
  NameType,
  ValueType,
} from "recharts/types/component/DefaultTooltipContent";

// Gap left between the tooltip and the edges of the viewport when it has to
// be pulled back into view.
const TOOLTIP_VIEWPORT_MARGIN = 8;

interface CustomTooltipProps extends TooltipContentProps<ValueType, NameType> {
  // Reports the rendered height back to the graph, which needs it to work out
  // how far the tooltip has to be shifted to stay on screen.
  onMeasure: (height: number) => void;
}

const CustomTooltip = ({
  active,
  payload,
  label,
  onMeasure,
}: CustomTooltipProps) => {
  const paperRef = useRef<HTMLDivElement>(null);
  const visible = !!(active && payload && payload.length);

  // Deliberately unkeyed: the height changes with the hovered hour, not just
  // with visibility, so it has to be re-read after every render. onMeasure
  // rounds and bails out on an unchanged value, so this settles immediately
  // rather than looping.
  useLayoutEffect(() => {
    if (visible && paperRef.current) {
      onMeasure(paperRef.current.offsetHeight);
    }
  });

  if (visible && payload) {
    const data = payload[0].payload as ForecastGraphDataPoint;
    return (
      <Paper
        ref={paperRef}
        sx={{
          p: 2,
          // The chart is only 200px tall and this content can run to twice
          // that, so cap it at the viewport as a floor under the positioning
          // below - there is nowhere to put a tooltip taller than the screen.
          // dvh to match the window.innerHeight the positioning above works
          // in - vh would let the cap exceed the visible viewport in a
          // browser tab, putting the tooltip back out of reach.
          maxHeight: `calc(100dvh - ${TOOLTIP_VIEWPORT_MARGIN * 2}px)`,
          overflowY: "auto",
        }}
      >
        <Typography variant="body1">{`${label}`}</Typography>
        <Typography variant="body2">{`${data.status}`}</Typography>
        <Typography variant="body2" color="text.secondary">
          Forecast Level: {formatRiverLevel(data.forecastLevel)}
        </Typography>
        <Typography variant="caption" color="text.disabled">
          {data.forecastSource === "bewdley"
            ? "Source: Bewdley upstream forecast"
            : "Source: Local trend (linear)"}
        </Typography>
        {data.reasons && data.reasons.length > 0 && (
          <Box sx={{ mt: 1 }}>
            <Typography variant="subtitle2" color="text.secondary">
              Contributing Factors
            </Typography>
            {data.reasons.map((reason: string, index: number) => {
              const Icon = REASON_ICONS[reason];
              const label = describeReason(reason, {
                temperature: data.temperature,
                windSpeed: data.windSpeed,
              });
              return (
                <Box
                  key={index}
                  sx={{ display: "flex", alignItems: "center", mt: 0.5 }}
                >
                  {Icon && <Icon fontSize="small" />}
                  <Typography variant="caption" sx={{ ml: 1 }}>
                    {label}
                  </Typography>
                </Box>
              );
            })}
          </Box>
        )}
        {(data.gustStatus || data.rainWhileWarm) && (
          <Box sx={{ mt: 1 }}>
            <Typography variant="subtitle2" color="text.secondary">
              Be Aware
            </Typography>
            {data.gustStatus && (
              <Box sx={{ display: "flex", alignItems: "center", mt: 0.5 }}>
                <Air fontSize="small" />
                <Typography variant="caption" sx={{ ml: 1 }}>
                  Gusts up to {formatWindGust(data.windGust!)}
                </Typography>
                <FiberManualRecord
                  titleAccess={`Would be ${data.gustStatus} if sustained`}
                  sx={{
                    fontSize: 8,
                    color: ragStatus[data.gustStatus].color,
                    ml: 1,
                    flexShrink: 0,
                  }}
                />
              </Box>
            )}
            {data.rainWhileWarm && (
              <Box sx={{ display: "flex", alignItems: "center", mt: 0.5 }}>
                <WaterDrop fontSize="small" />
                <Typography variant="caption" sx={{ ml: 1 }}>
                  {data.weatherDescription || "Rain"}
                </Typography>
              </Box>
            )}
          </Box>
        )}
      </Paper>
    );
  }

  return null;
};

import { format } from "date-fns";

interface IconLabelProps {
  viewBox: { x: number; y: number; width: number; height: number };
  icon: React.ReactElement;
  time: string;
}

const IconLabel = ({ viewBox, icon, time }: IconLabelProps) => {
  const { x } = viewBox;
  const timeText = time ? format(new Date(time), "HH:mm") : "";
  return (
    <foreignObject x={x - 30} y={0} width={60} height={40}>
      <Box
        sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}
      >
        {icon}
        <Typography variant="caption" sx={{ color: "text.secondary" }}>
          {timeText}
        </Typography>
      </Box>
    </foreignObject>
  );
};

interface BarLabelProps {
  x?: number;
  y?: number;
  width?: number;
  index?: number;
  data: ForecastGraphDataPoint[];
}

// Matches the <Bar> below's animationDuration/animationEasing so the No
// Paddling icon and gust dot fade in over the same span the bar itself
// grows in, rather than settling before (or after) the bar finishes.
const BAR_ANIMATION_DURATION = 400;
const BAR_ANIMATION_EASING = "ease";

const popIn = {
  animation: `barLabelPopIn ${BAR_ANIMATION_DURATION}ms ${BAR_ANIMATION_EASING} both`,
  "@keyframes barLabelPopIn": {
    from: { opacity: 0, transform: "scale(0.4)" },
    to: { opacity: 1, transform: "scale(1)" },
  },
} as const;

const BarLabel = (props: BarLabelProps) => {
  const { x, y, width, index, data } = props;

  if (
    x === undefined ||
    y === undefined ||
    width === undefined ||
    index === undefined
  ) {
    return null;
  }

  const entry = data[index];
  if (!entry) return null;

  const elements: React.ReactNode[] = [];
  let clearAbove = 0;

  if (entry.status === "No Paddling") {
    // Group contiguous "No Paddling" bars so a single icon is centered
    // over the run rather than rendering overlapping icons on every bar.
    let start = index;
    while (start > 0 && data[start - 1]?.status === "No Paddling") {
      start--;
    }
    let end = index;
    while (end < data.length - 1 && data[end + 1]?.status === "No Paddling") {
      end++;
    }
    const count = end - start + 1;
    const midIndex = Math.floor((start + end) / 2);

    if (index === midIndex) {
      const { icon: Icon, color } = ragStatus[entry.status];
      if (Icon) {
        const xShift = count % 2 === 0 ? width / 2 : 0;
        elements.push(
          <foreignObject
            key="no-paddling"
            x={x + width / 2 - 12 + xShift}
            y={y - 28}
            width={24}
            height={24}
          >
            <Icon sx={{ color, fontSize: 24, ...popIn }} />
          </foreignObject>
        );
      }
    }
    clearAbove = 28;
  }

  // Heads-up dot for a notable gust - coloured by the status that gust would
  // imply if it were sustained wind. Sits above any No Paddling icon so the
  // two never overlap.
  if (entry.gustStatus) {
    elements.push(
      <foreignObject
        key="gust-dot"
        x={x + width / 2 - 6}
        y={y - clearAbove - 13}
        width={12}
        height={12}
      >
        <Box
          title={`Would be ${entry.gustStatus} if sustained`}
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 12,
            height: 12,
            ...popIn,
          }}
        >
          <FiberManualRecord
            sx={{
              fontSize: 8,
              color: ragStatus[entry.gustStatus].color,
            }}
          />
        </Box>
      </foreignObject>
    );
  }

  if (elements.length === 0) return null;
  return <g>{elements}</g>;
};

const ForecastRagGraph: React.FC<ForecastRagGraphProps> = ({
  forecastDays,
  warnings,
  loading,
}) => {
  const theme = useTheme();
  const lineColor = theme.palette.text.secondary;
  const [selectedDay, setSelectedDay] = useState(0);
  const chartRef = useRef<HTMLDivElement>(null);
  const { tooltipActive, chartMoveProps } = useTooltipDismiss(chartRef);
  const [tooltipY, setTooltipY] = useState(0);

  // Recharts places the tooltip at the cursor and clamps it to the chart's own
  // box, which doesn't work here: the tooltip is routinely taller than the
  // 200px chart, so it spilled past the card and got cut off by the card's
  // overflow. Pin it to the top of the chart instead, then pull it up or down
  // by however much it takes to sit inside the viewport. Recharts honours a
  // numeric `position.y` verbatim, so this fully replaces its own clamping;
  // x is left alone and still tracks the cursor.
  const measureTooltip = useCallback((height: number) => {
    const chart = chartRef.current;
    if (!chart || !height) return;
    const { top } = chart.getBoundingClientRect();
    const lowestTop = TOOLTIP_VIEWPORT_MARGIN - top;
    const highestTop =
      window.innerHeight - TOOLTIP_VIEWPORT_MARGIN - height - top;
    // Anchored at 0 (the top of the chart) whenever that already fits.
    const next = Math.round(Math.max(lowestTop, Math.min(0, highestTop)));
    setTooltipY((prev) => (prev === next ? prev : next));
  }, []);

  const currentDay = forecastDays?.[selectedDay] ?? null;
  const data = currentDay?.graphData ?? null;
  const sunrise = currentDay?.sunrise ?? null;
  const sunset = currentDay?.sunset ?? null;

  // Find warnings active on the selected day
  const dailyWarnings =
    warnings?.filter((w) =>
      currentDay?.date ? isWarningOnDay(w, currentDay.date) : false
    ) || [];

  const renderChartBody = () => {
    if (data && data.length > 0) {
      const sunriseHour = sunrise
        ? parseInt(sunrise.split("T")[1].split(":")[0], 10)
        : null;
      const sunsetHour = sunset
        ? parseInt(sunset.split("T")[1].split(":")[0], 10)
        : null;

      const chartData = data.map((d, i) => {
        const scaled = d.forecastLevel / 6.0;
        const isBewdley = d.forecastSource === "bewdley";
        const prevSource = i > 0 ? data[i - 1].forecastSource : null;
        const nextSource =
          i < data.length - 1 ? data[i + 1].forecastSource : null;
        const inBewdleyLine = isBewdley || prevSource === "bewdley";
        const inLinearLine = !isBewdley || nextSource === "linear";
        return {
          ...d,
          bewdleyLevel: inBewdleyLine ? scaled : null,
          linearLevel: inLinearLine ? scaled : null,
        };
      });

      const xAxisTicks = chartData
        .filter((d) => parseInt(d.time, 10) % 3 === 0)
        .map((d) => d.time);

      return (
        <ResponsiveContainer width="100%" height={200}>
          <ComposedChart
            data={chartData}
            margin={{ top: 40, right: 15, left: 15, bottom: 5 }}
            {...chartMoveProps}
          >
            <XAxis
              dataKey="time"
              ticks={xAxisTicks}
              interval={0}
              tick={{ fontSize: 12 }}
            />
            <YAxis hide domain={[0, 1.2]} />
            <Tooltip
              content={(props: TooltipContentProps<ValueType, NameType>) => (
                <CustomTooltip {...props} onMeasure={measureTooltip} />
              )}
              cursor={{ fill: "transparent" }}
              active={tooltipActive}
              position={{ y: tooltipY }}
              // The pinned y is measured against the viewport, not the chart,
              // so recharts must not second-guess it.
              allowEscapeViewBox={{ x: false, y: true }}
            />
            {sunriseHour && sunrise && (
              <ReferenceLine
                x={`${sunriseHour}:00`}
                stroke={lineColor}
                strokeDasharray="3 3"
                label={
                  <IconLabel
                    icon={<WbSunny fontSize="small" fill={lineColor} />}
                    time={sunrise}
                    viewBox={{ x: 0, y: 0, width: 0, height: 0 }}
                  />
                }
              />
            )}
            {sunsetHour && sunset && (
              <ReferenceLine
                x={`${sunsetHour}:00`}
                stroke={lineColor}
                strokeDasharray="3 3"
                label={
                  <IconLabel
                    icon={<NightsStay fontSize="small" fill={lineColor} />}
                    time={sunset}
                    viewBox={{ x: 0, y: 0, width: 0, height: 0 }}
                  />
                }
              />
            )}
            <Bar
              dataKey="value"
              animationDuration={BAR_ANIMATION_DURATION}
              animationEasing={BAR_ANIMATION_EASING}
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={
                    ragStatus[entry.status]?.color ?? ragStatus.Unknown.color
                  }
                />
              ))}
              <LabelList
                dataKey="value"
                content={<BarLabel data={chartData} />}
                position="top"
              />
            </Bar>
            <Line
              type="monotone"
              dataKey="bewdleyLevel"
              stroke={theme.palette.primary.main}
              dot={false}
              strokeWidth={2}
              connectNulls={false}
            />
            <Line
              type="monotone"
              dataKey="linearLevel"
              stroke={theme.palette.primary.main}
              dot={false}
              strokeWidth={2}
              strokeDasharray="5 5"
              strokeOpacity={0.5}
              connectNulls={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      );
    }
    return (
      <Typography variant="body1" sx={{ mt: 1, textAlign: "center" }}>
        Not enough data to forecast.
      </Typography>
    );
  };

  const renderChart = () => {
    if (loading) {
      return (
        <Skeleton
          variant="rounded"
          width="100%"
          height={200}
          animation="wave"
        />
      );
    }
    return (
      <Grow in appear {...springTransition()}>
        <Box ref={chartRef}>{renderChartBody()}</Box>
      </Grow>
    );
  };

  return (
    // overflow is visible so the tooltip can hang outside the card - Card
    // clips to its rounded corners by default, which is what was cutting the
    // bottom off it. Nothing else in here paints outside the card's bounds.
    <Card sx={{ width: "100%", overflow: "visible" }}>
      <CardContent>
        <Typography variant="h5" component="div">
          Paddling Forecast
        </Typography>
        {loading ? (
          <Box sx={{ pt: 2, pb: 2, display: "flex", gap: 1 }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton
                key={i}
                variant="rounded"
                height={40.5}
                animation="wave"
                sx={{ flex: 1 }}
              />
            ))}
          </Box>
        ) : (
          forecastDays &&
          forecastDays.length > 0 && (
            <Box sx={{ pt: 2, pb: 2 }}>
              <SlidingToggleButtonGroup
                value={selectedDay}
                exclusive
                onChange={(_, val) => {
                  if (val !== null) setSelectedDay(val);
                }}
                fullWidth
                size="small"
              >
                {forecastDays.map((day, i) => (
                  <ToggleButton key={i} value={i}>
                    {day.label}
                  </ToggleButton>
                ))}
              </SlidingToggleButtonGroup>
            </Box>
          )
        )}

        {/* Daily warnings display – moved above chart */}
        <Collapse in={dailyWarnings.length > 0} unmountOnExit>
          <Box sx={{ mb: 2 }}>
            <Stack spacing={1}>
              {Object.entries(
                dailyWarnings.reduce(
                  (acc, w) => {
                    if (!acc[w.headline]) acc[w.headline] = [];
                    acc[w.headline].push(w);
                    return acc;
                  },
                  {} as Record<string, WeatherWarning[]>
                )
              ).map(([headline, warnings], i) => {
                const firstWarning = warnings[0];
                const color =
                  firstWarning.severity === "Red"
                    ? WARNING_COLORS.Red
                    : firstWarning.severity === "Amber"
                      ? WARNING_COLORS.Amber
                      : WARNING_COLORS.Yellow;
                return (
                  <Box key={i}>
                    <Box
                      sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}
                    >
                      <WarningIcon sx={{ color, fontSize: 16, mt: 0.2 }} />
                      <Box sx={{ flex: 1 }}>
                        <Typography
                          variant="caption"
                          sx={{ fontWeight: "bold", display: "block" }}
                        >
                          {headline}
                        </Typography>
                        {warnings.map((w, wIdx) => (
                          <Box
                            key={wIdx}
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                            }}
                          >
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {formatWarningTime(w.validFromISO, w.validFrom)}–
                              {formatWarningTime(w.validToISO, w.validTo)}
                            </Typography>
                            <Link
                              href={w.link}
                              target="_blank"
                              rel="noopener"
                              variant="caption"
                              sx={{ fontWeight: 700 }}
                            >
                              UK Met Office
                            </Link>
                          </Box>
                        ))}
                      </Box>
                    </Box>
                  </Box>
                );
              })}
            </Stack>
            <Divider sx={{ mt: 1.5 }} />
          </Box>
        </Collapse>

        {renderChart()}
      </CardContent>
    </Card>
  );
};

export default ForecastRagGraph;
