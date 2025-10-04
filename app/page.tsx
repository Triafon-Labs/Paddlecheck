'use client';

import React from "react";
import { Container, Stack, Box, Divider } from "@mui/material";
import LastUpdated from "@/components/LastUpdated";
import StatusCard from "@/components/StatusCard";
import PaddlingMatrixCard from "@/components/PaddlingMatrixCard";
import StatsCard from "@/components/StatsCard";
import RiverLevelGraph from "@/components/RiverLevelGraph";
import PredictedRagGraph from "@/components/PredictedRagGraph";
import Disclaimer from "@/components/Disclaimer";
import { useKayakContext } from "@/lib/KayakDataContext";

export default function HomePage() {
  const {
    conditions,
    predictedGraphData,
    loading,
    predictLoading,
    riverGraphData,
    riverChange1h,
    riverChange24h,
    riverChange8h,
    riverChange5d,
    sunrise,
    sunset,
  } = useKayakContext();

  return (
    <Container maxWidth="md">
      <Stack spacing={4} sx={{ py: 2, pb: 16 }}>
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
          loading={loading}
          change1h={riverChange1h}
          change24h={riverChange24h}
          change8h={riverChange8h}
          change5d={riverChange5d}
        />
        <PredictedRagGraph
          data={predictedGraphData}
          loading={predictLoading}
          sunrise={sunrise}
          sunset={sunset}
        />
        <Box sx={{ width: "100%", textAlign: "center" }}>
          <LastUpdated date={conditions?.lastUpdated} />
          <Divider sx={{ my: 2, width: "50%", mx: "auto" }} />
          <Disclaimer />
        </Box>
      </Stack>
    </Container>
  );
}