"use client";

import React, { useRef, useState } from "react";
import {
  Card,
  CardContent,
  Typography,
  Box,
  Skeleton,
  useTheme,
  ToggleButton,
  Divider,
  Link,
  Stack,
  Grow,
  Collapse,
  Button,
} from "@mui/material";
import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
  LabelList,
} from "recharts";
import { DayForecast, ForecastGraphDataPoint, WeatherWarning } from "@/types";
import { ragStatus } from "@/lib/rag";
import { WARNING_COLORS } from "@/lib/config";
import NightsStay from "@mui/icons-material/NightsStay";
import WbSunny from "@mui/icons-material/WbSunny";
import WarningIcon from "@mui/icons-material/Warning";
import FiberManualRecord from "@mui/icons-material/FiberManualRecord";
import { isWarningOnDay, formatWarningTime } from "@/lib/warnings";
import { springTransition } from "@/lib/m3-palette";
import { hourOfISO, isDarkHour } from "@/lib/time";
import { useShowNightHours } from "@/lib/useShowNightHours";
import SlidingToggleButtonGroup from "./SlidingToggleButtonGroup";
import { ForecastHourHeader, ForecastHourBodies } from "./ForecastHourDetails";

interface ForecastRagGraphProps {
  forecastDays: DayForecast[] | null;
  warnings?: WeatherWarning[];
  loading?: boolean;
}

import { format } from "date-fns";

const CHART_MARGIN = { top: 40, right: 15, left: 15, bottom: 5 };

// The same rule as the "Dark" factor in lib/hooks.ts, worked out again from
// the times rather than read from an hour's reasons, which skip "Dark" when
// something overrides it - a thunderstorm at 2am would otherwise count as
// daylight.
const isNightHour = (point: ForecastGraphDataPoint, day: DayForecast) =>
  isDarkHour(parseInt(point.time, 10), day.sunrise, day.sunset);

// The hour shown when a day is first opened: the next hour for Today, and the
// first hour of daylight for later days - nobody planning Saturday wants to
// land on midnight.
const defaultHourIndex = (
  hours: ForecastGraphDataPoint[],
  day: DayForecast,
  dayIndex: number
): number => {
  if (dayIndex === 0) return 0;
  const firstLight = hours.findIndex((h) => !isNightHour(h, day));
  return firstLight === -1 ? 0 : firstLight;
};

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

// A chart slot: a shown hour, or a "ghost" - a hidden night hour kept as an
// empty slot because the sun rises or sets in it, so its marker can sit in
// its true place rather than on a neighbouring bar.
type ChartRow = Omit<ForecastGraphDataPoint, "value"> & {
  value: number | null;
  ghost?: boolean;
};

interface BarLabelProps {
  x?: number;
  y?: number;
  width?: number;
  // The bar's hour ("H:00"), from LabelList's dataKey. Matched on rather than
  // on LabelList's index, which counts only the bars actually drawn and so
  // drifts by one past an empty sunrise slot.
  value?: string | number;
  data: ChartRow[];
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
  const { x, y, width, value, data } = props;

  if (x === undefined || y === undefined || width === undefined) {
    return null;
  }

  const entry = data.find((d) => d.time === value);
  if (!entry || entry.ghost) return null;

  const elements: React.ReactNode[] = [];
  let clearAbove = 0;

  if (entry.status === "No Paddling") {
    // Straight from the RAG palette rather than the theme's error role: this
    // icon captions a bar the <Bar> below fills from that same palette, so
    // the two have to be the one red no matter what the theme does.
    const { icon: Icon, color } = ragStatus[entry.status];
    if (Icon) {
      elements.push(
        <foreignObject
          key="no-paddling"
          x={x + width / 2 - 12}
          y={y - 28}
          width={24}
          height={24}
        >
          <Icon sx={{ color, fontSize: 24, ...popIn }} />
        </foreignObject>
      );
      clearAbove = 28;
    }
  }

  // Heads-up dot for a notable gust - coloured by the status that gust would
  // imply if it were sustained wind. Sits above any No Paddling icon so the
  // two never overlap. Skipped when the gust wouldn't change the status: a
  // dot the same colour as the bar beneath it says nothing.
  if (entry.gustStatus && entry.gustStatus !== entry.status) {
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
  // The picked hour as its "H:00" label rather than an index: Today's first
  // bar drops off every hour, so an index would silently slide onto the next
  // hour after a refetch. null means the day's default hour.
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const chartRef = useRef<HTMLDivElement>(null);
  // Night hours are hidden unless turned on in Settings (see
  // useShowNightHours for why).
  const [showNight, setShowNight] = useShowNightHours();

  const visibleHours = (day: DayForecast) =>
    showNight
      ? day.graphData
      : day.graphData.filter((h) => !isNightHour(h, day));

  const currentDay = forecastDays?.[selectedDay] ?? null;
  const data = currentDay ? visibleHours(currentDay) : null;
  // Every shown hour of all five days, which the details panel sizes itself
  // to so it keeps one height whichever hour or day is picked.
  const allShownHours = (forecastDays ?? []).flatMap((day) =>
    visibleHours(day).map((point) => ({ point, sunset: day.sunset }))
  );
  // What the chart draws: the shown hours, plus the hidden sunrise/sunset
  // hours as empty slots for their markers to sit in.
  const chartRows: ChartRow[] | null = currentDay
    ? currentDay.graphData.flatMap((h) => {
        if (data?.includes(h)) return [h];
        const hour = parseInt(h.time, 10);
        const sunCrossing =
          hour === hourOfISO(currentDay.sunrise) ||
          hour === hourOfISO(currentDay.sunset);
        return sunCrossing ? [{ ...h, ghost: true }] : [];
      })
    : null;
  const sunrise = currentDay?.sunrise ?? null;
  const sunset = currentDay?.sunset ?? null;

  const foundIndex =
    data && selectedTime !== null
      ? data.findIndex((d) => d.time === selectedTime)
      : -1;
  const selectedIndex =
    foundIndex !== -1
      ? foundIndex
      : data && currentDay
        ? defaultHourIndex(data, currentDay, selectedDay)
        : -1;
  const selectedPoint = data?.[selectedIndex] ?? null;

  const selectDay = (day: number, time: string | null = null) => {
    setSelectedDay(day);
    setSelectedTime(time);
  };

  // Steps one hour, carrying on into the neighbouring day at either end so
  // the five days read as one timeline. Days with no hours shown (Today
  // after dark, with night hours hidden) are skipped over.
  const findStep = (direction: 1 | -1): [number, string] | null => {
    if (!forecastDays || !data) return null;
    const next = data[selectedIndex + direction];
    if (next) return [selectedDay, next.time];
    for (
      let d = selectedDay + direction;
      d >= 0 && d < forecastDays.length;
      d += direction
    ) {
      const hours = visibleHours(forecastDays[d]);
      if (hours.length > 0) {
        return [d, hours[direction === 1 ? 0 : hours.length - 1].time];
      }
    }
    return null;
  };
  const prevStep = findStep(-1);
  const nextStep = findStep(1);
  const step = (target: [number, string] | null) => {
    if (target) selectDay(...target);
  };

  // Picks the hour under the pointer. Worked out from the pointer's x against
  // the plot area rather than read back from recharts' tooltip state, which
  // is updated a frame late on touch and only exists with a <Tooltip>. The
  // bars sit on a band scale, so each hour owns an equal slice of the width.
  const pickHourAt = (clientX: number) => {
    const box = chartRef.current;
    if (!box || !chartRows || !data || data.length === 0) return;
    const { left, width } = box.getBoundingClientRect();
    const plotWidth = width - CHART_MARGIN.left - CHART_MARGIN.right;
    if (plotWidth <= 0) return;
    const raw = Math.floor(
      ((clientX - left - CHART_MARGIN.left) / plotWidth) * chartRows.length
    );
    const index = Math.min(Math.max(raw, 0), chartRows.length - 1);
    // An empty sunrise/sunset slot isn't an hour you can pick; the nearest
    // shown hour is. Ghosts only ever sit at the ends, so that's the first
    // or last shown hour.
    const row = chartRows[index];
    const time = row.ghost
      ? index === 0
        ? data[0].time
        : data[data.length - 1].time
      : row.time;
    if (time !== selectedPoint?.time) setSelectedTime(time);
  };

  const stepProps = {
    onPrev: () => step(prevStep),
    onNext: () => step(nextStep),
    canPrev: prevStep !== null,
    canNext: nextStep !== null,
  };
  const showDetails = !loading && selectedPoint !== null;

  const handleChartKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") step(prevStep);
    else if (e.key === "ArrowRight") step(nextStep);
    else return;
    e.preventDefault();
  };

  // Find warnings active on the selected day
  const dailyWarnings =
    warnings?.filter((w) =>
      currentDay?.date ? isWarningOnDay(w, currentDay.date) : false
    ) || [];

  const renderChartBody = () => {
    if (data && data.length > 0) {
      const rows: ChartRow[] = chartRows ?? data;
      const sunriseHour = hourOfISO(sunrise);
      const sunsetHour = hourOfISO(sunset);
      const inChart = (hour: number | null) =>
        hour !== null && rows.some((r) => parseInt(r.time, 10) === hour);

      const maxForecastLevel = Math.max(...data.map((d) => d.forecastLevel));
      const dayMaxLevel = Math.max(Math.ceil(maxForecastLevel), 1);

      const chartData = rows.map((d, i) => {
        // An empty slot draws nothing - no bar, no level line, no label.
        if (d.ghost) {
          return { ...d, value: null, bewdleyLevel: null, linearLevel: null };
        }
        const scaled = d.forecastLevel / dayMaxLevel;
        const isBewdley = d.forecastSource === "bewdley";
        const prevSource = i > 0 ? rows[i - 1].forecastSource : null;
        const nextSource =
          i < rows.length - 1 ? rows[i + 1].forecastSource : null;
        const inBewdleyLine = isBewdley || prevSource === "bewdley";
        // Held hours get no line at all: they aren't a forecast, and a flat
        // line would read as one that says the river will stay steady.
        const inLinearLine =
          d.forecastSource === "linear" || nextSource === "linear";
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
          <ComposedChart data={chartData} margin={CHART_MARGIN}>
            <XAxis
              dataKey="time"
              ticks={xAxisTicks}
              interval={0}
              tick={{ fontSize: 12 }}
            />
            <YAxis hide domain={[0, 1.2]} />
            {inChart(sunriseHour) && sunrise && (
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
            {inChart(sunsetHour) && sunset && (
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
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={
                    ragStatus[entry.status]?.color ?? ragStatus.Unknown.color
                  }
                  // The picked hour is outlined; every bar keeps its full
                  // colour so the day still reads at a glance.
                  stroke={
                    entry.time === selectedPoint?.time
                      ? theme.palette.text.primary
                      : "none"
                  }
                  strokeWidth={2}
                />
              ))}
              <LabelList
                dataKey="time"
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
    if (!showNight && currentDay && currentDay.graphData.length > 0) {
      return (
        <Box sx={{ mt: 1, textAlign: "center" }}>
          <Typography variant="body1">
            {selectedDay === 0
              ? "No daylight left today."
              : "No daylight hours forecast for this day."}
          </Typography>
          <Button onClick={() => setShowNight(true)} sx={{ mt: 1 }}>
            Show night hours
          </Button>
        </Box>
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
        <Box
          ref={chartRef}
          tabIndex={0}
          role="group"
          aria-label="Hourly forecast chart. Use the left and right arrow keys to change hour."
          onPointerDown={(e) => pickHourAt(e.clientX)}
          // Only while pressed: following a hovering mouse would move the
          // selection on the way down to the hour buttons below.
          onPointerMove={(e) => {
            if (e.buttons !== 0) pickHourAt(e.clientX);
          }}
          onKeyDown={handleChartKeyDown}
          sx={{
            // A horizontal drag scrubs through the hours; a vertical one
            // still scrolls the page.
            touchAction: "pan-y",
            userSelect: "none",
            WebkitTapHighlightColor: "transparent",
            borderRadius: 1,
            "&:focus-visible": {
              outline: `2px solid ${theme.palette.primary.main}`,
              outlineOffset: 2,
            },
          }}
        >
          {renderChartBody()}
        </Box>
      </Grow>
    );
  };

  return (
    // With an hour picked, the card's bottom edge is handed to the details
    // card that continues it (ForecastHourBodies), so this one squares off
    // its bottom corners and drops its bottom padding to meet it flush.
    <Box sx={{ width: "100%" }}>
      <Card
        sx={
          showDetails
            ? { borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }
            : undefined
        }
      >
        <CardContent
          sx={showDetails ? { pb: 0, "&:last-child": { pb: 0 } } : undefined}
        >
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
                    if (val !== null) selectDay(val);
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
                        sx={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: 1,
                        }}
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
                                {formatWarningTime(w.validFromISO, w.validFrom)}
                                –{formatWarningTime(w.validToISO, w.validTo)}
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
          {(loading || selectedPoint) && (
            <ForecastHourHeader
              point={selectedPoint}
              dayLabel={currentDay?.label ?? ""}
              loading={loading}
              {...stepProps}
            />
          )}
        </CardContent>
      </Card>
      {showDetails && selectedPoint && (
        <ForecastHourBodies
          point={selectedPoint}
          hours={allShownHours}
          sunset={currentDay?.sunset ?? null}
          {...stepProps}
        />
      )}
    </Box>
  );
};

export default ForecastRagGraph;
