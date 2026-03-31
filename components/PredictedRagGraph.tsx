"use client";

import React, { useState } from "react";
import {
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
  Paper,
  useTheme,
  Slider,
} from "@mui/material";
import {
  ComposedChart,
  Area,
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
import { DayForecast, PredictedGraphDataPoint } from "@/types";
import { ragStatus } from "@/lib/rag";
import { REASON_ICONS } from "@/lib/config";
import NightsStay from "@mui/icons-material/NightsStay";
import WbSunny from "@mui/icons-material/WbSunny";

interface PredictedRagGraphProps {
  forecastDays: DayForecast[] | null;
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
    const data = payload[0].payload as PredictedGraphDataPoint;
    return (
      <Paper sx={{ p: 2 }}>
        <Typography variant="body1">{`${label}`}</Typography>
        <Typography variant="body2">{`${data.status}`}</Typography>
        <Typography variant="body2" color="text.secondary">
          Predicted Level: {data.predictedLevel.toFixed(2)}m
        </Typography>
        {data.reasons && data.reasons.length > 0 && (
          <Box sx={{ mt: 1 }}>
            <Typography variant="subtitle2">Reasons:</Typography>
            {data.reasons.map((reason: string, index: number) => {
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
  data: PredictedGraphDataPoint[];
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

  if (entry.status === "No Paddling") {
    const Icon = ragStatus[entry.status]?.icon;
    if (Icon) {
      return (
        <g>
          <foreignObject
            x={x + width / 2 - 12}
            y={y - 28}
            width={24}
            height={24}
          >
            <Icon sx={{ color: theme.palette.error.main, fontSize: 24 }} />
          </foreignObject>
        </g>
      );
    }
  }
  return null;
};

const PredictedRagGraph: React.FC<PredictedRagGraphProps> = ({
  forecastDays,
  loading,
}) => {
  const theme = useTheme();
  const lineColor = theme.palette.text.secondary;
  const [selectedDay, setSelectedDay] = useState(0);

  const currentDay = forecastDays?.[selectedDay] ?? null;
  const data = currentDay?.graphData ?? null;
  const sunrise = currentDay?.sunrise ?? null;
  const sunset = currentDay?.sunset ?? null;

  const renderChart = () => {
    if (loading) {
      return (
        <Box sx={{ display: "flex", justifyContent: "center", my: 2 }}>
          <CircularProgress />
        </Box>
      );
    }
    if (data && data.length > 0) {
      const sunriseHour = sunrise
        ? parseInt(sunrise.split("T")[1].split(":")[0], 10)
        : null;
      const sunsetHour = sunset
        ? parseInt(sunset.split("T")[1].split(":")[0], 10)
        : null;

      const chartData = data.map((d) => ({
        ...d,
        scaledPredictedLevel: d.predictedLevel / 6.0,
      }));

      return (
        <ResponsiveContainer width="100%" height={200}>
          <ComposedChart data={chartData} margin={{ top: 40 }}>
            <defs>
              <linearGradient id="colorLevel" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor={theme.palette.primary.main}
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor={theme.palette.primary.main}
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>
            <XAxis dataKey="time" />
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
                    viewBox={{
                      x: 0,
                      y: 0,
                      width: 0,
                      height: 0,
                    }}
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
                    viewBox={{
                      x: 0,
                      y: 0,
                      width: 0,
                      height: 0,
                    }}
                  />
                }
              />
            )}
            <Area
              type="monotone"
              dataKey="scaledPredictedLevel"
              stroke={theme.palette.primary.main}
              fillOpacity={0}
              fill="url(#colorLevel)"
              strokeDasharray="5 5"
              dot={false}
              strokeWidth={2}
            />
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
          </ComposedChart>
        </ResponsiveContainer>
      );
    }
    return (
      <Typography variant="body1" sx={{ mt: 1, textAlign: "center" }}>
        Not enough data to predict.
      </Typography>
    );
  };

  return (
    <Card variant="outlined" sx={{ width: "100%", p: 2 }}>
      <CardContent>
        <Typography variant="h5" component="div">
          Paddling Forecast
        </Typography>
        {forecastDays && forecastDays.length > 0 && (
          <Box sx={{ px: 2, pt: 2, pb: 0 }}>
            <Slider
              value={selectedDay}
              onChange={(_, v) => setSelectedDay(v as number)}
              min={0}
              max={forecastDays.length - 1}
              step={1}
              marks={forecastDays.map((day, i) => ({ value: i, label: day.label }))}
            />
          </Box>
        )}
        {renderChart()}
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: "block", textAlign: "center", mt: 2 }}
        >
          This is an experimental prediction based on current trends and may not
          be accurate.
        </Typography>
      </CardContent>
    </Card>
  );
};

export default PredictedRagGraph;
