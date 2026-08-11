"use client";

import dynamic from "next/dynamic";
import {
  Container,
  Stack,
  Alert,
  Collapse,
  Card,
  CardContent,
  Skeleton,
} from "@mui/material";
import StatusCard from "@/components/StatusCard";
import PaddlingMatrixCard from "@/components/PaddlingMatrixCard";
import StatsCard from "@/components/StatsCard";
import { useKayakContext } from "@/lib/KayakDataContext";
import { OFFLINE_NO_CACHE_ERROR } from "@/lib/hooks";

// Placeholder shown only while a chart's JS chunk downloads - the components
// render their own richer skeletons once mounted and `loading` is true.
const ChartCardFallback = ({ height }: { height: number }) => (
  <Card variant="outlined" sx={{ width: "100%", p: 2 }}>
    <CardContent>
      <Skeleton variant="text" width={140} height={32} animation="wave" />
      <Skeleton
        variant="rounded"
        width="100%"
        height={height}
        animation="wave"
        sx={{ mt: 2 }}
      />
    </CardContent>
  </Card>
);

// The graphs pull in recharts, by far the heaviest client dependency - load
// them as separate chunks so the status/matrix/stats cards paint sooner.
// They're client-only components anyway (ResponsiveContainer needs a real
// layout to measure), so nothing is lost by skipping SSR.
const RiverLevelGraph = dynamic(() => import("@/components/RiverLevelGraph"), {
  ssr: false,
  loading: () => <ChartCardFallback height={430} />,
});
const ForecastRagGraph = dynamic(
  () => import("@/components/ForecastRagGraph"),
  { ssr: false, loading: () => <ChartCardFallback height={260} /> }
);

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
        <Collapse
          in={!!error && error !== OFFLINE_NO_CACHE_ERROR}
          unmountOnExit
        >
          <Alert severity="error" sx={{ borderRadius: 1 }}>
            {error}
          </Alert>
        </Collapse>
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
          riverReadings={riverGraphData}
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
