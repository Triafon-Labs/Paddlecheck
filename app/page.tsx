"use client";

import { Container, Stack, Alert } from "@mui/material";
import StatusCard from "@/components/StatusCard";
import PaddlingMatrixCard from "@/components/PaddlingMatrixCard";
import StatsCard from "@/components/StatsCard";
import RiverLevelGraph from "@/components/RiverLevelGraph";
import ForecastRagGraph from "@/components/ForecastRagGraph";
import { useKayakContext } from "@/lib/KayakDataContext";

export default function HomePage() {
  const {
    conditions,
    forecastDays,
    forecastData,
    loading,
    forecastLoading,
    riverGraphData,
    riverChange1h,
    riverChange24h,
    riverChange8h,
    riverChange5d,
    error,
  } = useKayakContext();

  return (
    <Container maxWidth="md">
      <Stack spacing={4}>
        {error && error !== "Offline – no cached data (reconnect and refresh)" && (
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
          forecastData={forecastData}
          loading={loading}
          change1h={riverChange1h}
          change24h={riverChange24h}
          change8h={riverChange8h}
          change5d={riverChange5d}
        />
        <ForecastRagGraph
          forecastDays={forecastDays}
          warnings={conditions?.warnings}
          loading={forecastLoading}
        />
      </Stack>
    </Container>
  );
}
