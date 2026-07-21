"use client";

import React, { useState } from "react";
import {
  Card,
  CardContent,
  Typography,
  Box,
  Skeleton,
  Paper,
  useTheme,
  ToggleButtonGroup,
  ToggleButton,
  Divider,
  Link,
  Stack,
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
import { ragStatus } from "@/lib/rag";
import { REASON_ICONS, WARNING_COLORS } from "@/lib/config";
import NightsStay from "@mui/icons-material/NightsStay";
import WbSunny from "@mui/icons-material/WbSunny";
import WarningIcon from "@mui/icons-material/Warning";
import Air from "@mui/icons-material/Air";
import { isSameDay, parseISO } from "date-fns";
import { tz } from "@date-fns/tz";
import { formatMetTime } from "@/lib/weather";

interface ForecastRagGraphProps {
  forecastDays: DayForecast[] | null;
  warnings?: WeatherWarning[];
  loading?: boolean;
}

import {
  NameType,
  ValueType,
} from "recharts/types/component/DefaultTooltipContent";

const CustomTooltip = ({
  active,
  payload,
  label,
}: TooltipContentProps<ValueType, NameType>) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload as ForecastGraphDataPoint;
    return (
      <Paper sx={{ p: 2 }}>
        <Typography variant="body1">{`${label}`}</Typography>
        <Typography variant="body2">{`${data.status}`}</Typography>
        <Typography variant="body2" color="text.secondary">
          Forecast Level: {data.forecastLevel.toFixed(2)}m
        </Typography>
        <Typography variant="caption" color="text.disabled">
          {data.forecastSource === "bewdley"
            ? "Source: Bewdley upstream forecast"
            : "Source: Local trend (linear)"}
        </Typography>
        {((data.reasons && data.reasons.length > 0) || data.gustStatus) && (
          <Box sx={{ mt: 1 }}>
            <Typography variant="subtitle2" color="text.secondary">
              Contributing Factors
            </Typography>
            {data.reasons?.map((reason: string, index: number) => {
              const Icon = REASON_ICONS[reason];
              return (
                <Box
                  key={index}
                  sx={{ display: "flex", alignItems: "center", mt: 0.5 }}
                >
                  {Icon && <Icon fontSize="small" />}
                  <Typography variant="caption" sx={{ ml: 1 }}>
                    {reason}
                  </Typography>
                </Box>
              );
            })}
            {data.gustStatus && (
              <Box sx={{ display: "flex", alignItems: "center", mt: 0.5 }}>
                <Air fontSize="small" />
                <Typography variant="caption" sx={{ ml: 1 }}>
                  Gusts up to {Math.round(data.windGust!)} mph
                </Typography>
                <Box
                  title={`Would be ${data.gustStatus} if sustained`}
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    backgroundColor: ragStatus[data.gustStatus].color,
                    ml: 1,
                    flexShrink: 0,
                  }}
                />
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

const BarLabel = (props: BarLabelProps) => {
  const { x, y, width, index, data } = props;
  const theme = useTheme();

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
    const Icon = ragStatus[entry.status]?.icon;
    if (Icon) {
      elements.push(
        <foreignObject
          key="no-paddling"
          x={x + width / 2 - 12}
          y={y - 28}
          width={24}
          height={24}
        >
          <Icon sx={{ color: theme.palette.error.main, fontSize: 24 }} />
        </foreignObject>
      );
      clearAbove = 28;
    }
  }

  // Heads-up dot for a notable gust - coloured by the status that gust would
  // imply if it were sustained wind. Sits above any No Paddling icon so the
  // two never overlap.
  if (entry.gustStatus) {
    elements.push(
      <foreignObject
        key="gust-dot"
        x={x + width / 2 - 5}
        y={y - clearAbove - 14}
        width={10}
        height={10}
      >
        <Box
          sx={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            backgroundColor: ragStatus[entry.gustStatus].color,
            border: `1px solid ${theme.palette.background.paper}`,
          }}
        />
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

  const currentDay = forecastDays?.[selectedDay] ?? null;
  const data = currentDay?.graphData ?? null;
  const sunrise = currentDay?.sunrise ?? null;
  const sunset = currentDay?.sunset ?? null;

  // Find warnings active on the selected day
  const dailyWarnings = warnings?.filter((w) => {
    if (!w.validFromISO || !w.validToISO || !currentDay?.date) return false;
    const dayDate = parseISO(currentDay.date, { in: tz("Europe/London") });
    const start = parseISO(w.validFromISO, { in: tz("Europe/London") });
    const end = parseISO(w.validToISO, { in: tz("Europe/London") });

    // Check if the warning overlaps with the selected day
    // Met Office warnings can span multiple days
    return (
      isSameDay(dayDate, start, { in: tz("Europe/London") }) ||
      isSameDay(dayDate, end, { in: tz("Europe/London") }) ||
      (dayDate > start && dayDate < end)
    );
  }) || [];

  const renderChart = () => {
    if (loading) {
      return (
        <Skeleton variant="rounded" width="100%" height={200} animation="wave" />
      );
    }
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
        const nextSource = i < data.length - 1 ? data[i + 1].forecastSource : null;
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
          >
            <XAxis
              dataKey="time"
              ticks={xAxisTicks}
              interval={0}
              tick={{ fontSize: 12 }}
            />
            <YAxis hide domain={[0, 1.2]} />
            <Tooltip content={CustomTooltip} cursor={{ fill: "transparent" }} />
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
            <Bar dataKey="value">
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={ragStatus[entry.status]?.color || "#9E9E9E"}
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

  return (
    <Card variant="outlined" sx={{ width: "100%", p: 2 }}>
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
          forecastDays && forecastDays.length > 0 && (
            <Box sx={{ pt: 2, pb: 2 }}>
              <ToggleButtonGroup
                value={selectedDay}
                exclusive
                onChange={(_, val) => { if (val !== null) setSelectedDay(val); }}
                fullWidth
                size="small"
              >
                {forecastDays.map((day, i) => (
                  <ToggleButton key={i} value={i}>{day.label}</ToggleButton>
                ))}
              </ToggleButtonGroup>
            </Box>
          )
        )}

        {/* Daily warnings display – moved above chart */}
        {dailyWarnings.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Stack spacing={1}>
              {Object.entries(
                dailyWarnings.reduce((acc, w) => {
                  if (!acc[w.headline]) acc[w.headline] = [];
                  acc[w.headline].push(w);
                  return acc;
                }, {} as Record<string, WeatherWarning[]>)
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
                    <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
                      <WarningIcon sx={{ color, fontSize: 16, mt: 0.2 }} />
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="caption" sx={{ fontWeight: "bold", display: "block" }}>
                          {headline}
                        </Typography>
                        {warnings.map((w, wIdx) => (
                          <Box key={wIdx} sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <Typography variant="caption" color="text.secondary">
                              {formatMetTime(w.validFrom)}–{formatMetTime(w.validTo)}
                            </Typography>
                            <Link href={w.link} target="_blank" rel="noopener" sx={{ fontSize: "0.7rem", fontWeight: "bold" }}>
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
        )}

        {renderChart()}

        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: "block", textAlign: "center", mt: 2 }}
        >
          Solid line uses Bewdley upstream forecast (24h). Dashed line uses
          local trend only. For guidance only.
        </Typography>
      </CardContent>
    </Card>
  );
};

export default ForecastRagGraph;
