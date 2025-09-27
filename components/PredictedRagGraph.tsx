"use client";

import React from "react";
import {
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
  Paper,
  useTheme,
} from "@mui/material";
import {
  BarChart,
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
import { PredictedGraphDataPoint } from "@/types";
import { ragStatus } from "@/lib/rag";
import Air from "@mui/icons-material/Air";
import WaterDrop from "@mui/icons-material/WaterDrop";
import NightsStay from "@mui/icons-material/NightsStay";
import Grain from "@mui/icons-material/Grain";
import AcUnit from "@mui/icons-material/AcUnit";
import Thermostat from "@mui/icons-material/Thermostat";
import WbSunny from "@mui/icons-material/WbSunny";
import TrendingUp from "@mui/icons-material/TrendingUp";
import Warning from "@mui/icons-material/Warning";
import Flood from "@mui/icons-material/Flood";

interface PredictedRagGraphProps {
  data: PredictedGraphDataPoint[] | null;
  loading?: boolean;
  sunrise: string | null;
  sunset: string | null;
}

const reasonToIcon: { [key: string]: React.ReactElement } = {
  "High winds": <Air fontSize="small" />,
  Rain: <WaterDrop fontSize="small" />,
  Dark: <NightsStay fontSize="small" />,
  Foggy: <Grain fontSize="small" />,
  "Low temperature": <AcUnit fontSize="small" />,
  "Moderately low temperature": <Thermostat fontSize="small" />,
  "Slightly elevated river level": <TrendingUp fontSize="small" />,
  "Moderately elevated river level": <Warning fontSize="small" />,
  "Significantly elevated river level": <Flood fontSize="small" />,
};

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
        {data.reasons && data.reasons.length > 0 && (
          <Box sx={{ mt: 1 }}>
            <Typography variant="subtitle2">Reasons:</Typography>
            {data.reasons.map((reason: string, index: number) => (
              <Box
                key={index}
                sx={{ display: "flex", alignItems: "center", mt: 0.5 }}
              >
                {reasonToIcon[reason]}
                <Typography variant="caption" sx={{ ml: 1 }}>
                  {reason}
                </Typography>
              </Box>
            ))}
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

  if (x === undefined || y === undefined || width === undefined || index === undefined) {
    return null;
  }

  const entry = data[index];

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
  data,
  loading,
  sunrise,
  sunset,
}) => {
  const theme = useTheme();
  const lineColor = theme.palette.text.secondary;

  const renderContent = () => {
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

      return (
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data} margin={{ top: 40 }}>
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
            <Bar dataKey="value">
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={ragStatus[entry.status]?.color || "#9E9E9E"}
                />
              ))}
              <LabelList
                dataKey="value"
                content={<BarLabel data={data} />}
                position="top"
              />
            </Bar>
          </BarChart>
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
          RAG Forecast
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" gutterBottom>
          Next 24 Hours
        </Typography>
        {renderContent()}
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
