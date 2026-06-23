"use client";

import React from "react";
import { Container, Stack, Box, Alert } from "@mui/material";
import LastUpdated from "@/components/LastUpdated";
import StatusCard from "@/components/StatusCard";
import PaddlingMatrixCard from "@/components/PaddlingMatrixCard";
import StatsCard from "@/components/StatsCard";
import RiverLevelGraph from "@/components/RiverLevelGraph";
import PredictedRagGraph from "@/components/PredictedRagGraph";
import { useKayakContext } from "@/lib/KayakDataContext";

export default function HomePage() {
  const {
    conditions,
    forecastDays,
    predictionData,
    loading,
    predictLoading,
    riverGraphData,
    riverChange1h,
    riverChange24h,
    riverChange8h,
    riverChange5d,
    error,
    isOffline,
  } = useKayakContext();

  return (
    <Container maxWidth="md">
      <Stack spacing={4}>
        {isOffline && (
          <Alert severity="warning" sx={{ borderRadius: 1 }}>
            You&apos;re offline — showing cached data where available.
          </Alert>
        )}
        {error && (
          <Alert severity="error" sx={{ borderRadius: 1 }}>
            {error}
          </Alert>
        )}
        <StatusCard conditions={conditions} loading={loading} />
        <PaddlingMatrixCard
          loading={loading}
          overallStatus={conditions?.overallStatus}
          riverLevel={conditions?.riverLevel}
        />
        <StatsCard
          conditions={conditions}
          loading={loading}
          reasons={conditions?.reasons || []}
        />
        <RiverLevelGraph
          data={riverGraphData}
          predictionData={predictionData}
          loading={loading}
          change1h={riverChange1h}
          change24h={riverChange24h}
          change8h={riverChange8h}
          change5d={riverChange5d}
        />
        <PredictedRagGraph
          forecastDays={forecastDays}
          warnings={conditions?.warnings}
          loading={predictLoading}
        />
        <Box sx={{ width: "100%", textAlign: "center" }}>
          <LastUpdated date={conditions?.lastUpdated} />
        </Box>
      </Stack>
    </Container>
  );
}
