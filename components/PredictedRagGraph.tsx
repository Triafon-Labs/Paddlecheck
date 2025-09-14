"use client";

import React from "react";
import {
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
  useTheme,
  Paper,
} from "@mui/material";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { ragStatus } from "@/lib/rag";
import Air from "@mui/icons-material/Air";
import WaterDrop from "@mui/icons-material/WaterDrop";
import NightsStay from "@mui/icons-material/NightsStay";
import Grain from "@mui/icons-material/Grain";
import AcUnit from "@mui/icons-material/AcUnit";
import Thermostat from "@mui/icons-material/Thermostat";

interface PredictedRagGraphProps {
  data: any[] | null;
  loading?: boolean;
}

const reasonToIcon = {
  "High winds": <Air fontSize="small" />,
  Rain: <WaterDrop fontSize="small" />,
  Dark: <NightsStay fontSize="small" />,
  Foggy: <Grain fontSize="small" />,
  "Low temperature": <AcUnit fontSize="small" />,
  "Moderate temperature": <Thermostat fontSize="small" />,
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <Paper sx={{ p: 2 }}>
        <Typography variant="body1">{`${label}`}</Typography>
        <Typography variant="body2">{`Status: ${data.status}`}</Typography>
        {data.reasons && data.reasons.length > 0 && (
          <Box sx={{ mt: 1 }}>
            <Typography variant="subtitle2">Reasons:</Typography>
            {data.reasons.map((reason, index) => (
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

const PredictedRagGraph: React.FC<PredictedRagGraphProps> = ({
  data,
  loading,
}) => {
  const theme = useTheme();

  const renderContent = () => {
    if (loading) {
      return (
        <Box sx={{ display: "flex", justifyContent: "center", my: 2 }}>
          <CircularProgress />
        </Box>
      );
    }
    if (data && data.length > 0) {
      return (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <XAxis dataKey="time" />
            <YAxis hide />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
            <Bar dataKey="value">
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={ragStatus[entry.status]?.color || "#9E9E9E"}
                />
              ))}
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
        <Typography variant="h5" component="div" gutterBottom>
          Predicted RAG (next 24 hours)
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
