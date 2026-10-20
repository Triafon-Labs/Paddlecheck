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
  <Card sx={{ width: "100%" }}>
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
      {/* 16px, the same value as the page gutter, the card inset and the
          section rhythm inside each card - one spacing step for the whole
          page. It was 32px, which was even with the cards' old 32px inset;
          once that halved, the space between two cards was twice the space
          inside them. */}
      <Stack spacing={2}>
        <Collapse
          in={!!error && error !== OFFLINE_NO_CACHE_ERROR}
          unmountOnExit
        >
          {/* Radius left to the MuiAlert override, which sets the M3 12px.
              Overriding it to 8 here made this the one status surface on the
              page with a shape of its own. */}
          <Alert severity="error">{error}</Alert>
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
