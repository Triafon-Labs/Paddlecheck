"use client";

import React, { useState, useEffect } from "react";
import { Container, Stack } from "@mui/material";
import StatusCard from "@/components/StatusCard";
import StatsCard from "@/components/StatsCard";
import RiverLevelGraph from "@/components/RiverLevelGraph";
import { KayakConditions, ChartDataPoint } from "@/types";
import {
  calculateFinalRagStatus,
  findLevelDescription,
} from "@/lib/rag";
import { fetchRiverData } from "@/lib/river";
import { fetchWeatherData } from "@/lib/weather";

export default function HomePage() {
  const [conditions, setConditions] = useState<KayakConditions | null>(null);
  const [loading, setLoading] = useState(true);
  const [riverGraphData, setRiverGraphData] = useState<ChartDataPoint[] | null>(
    null
  );
  const [riverChange24h, setRiverChange24h] = useState<number | null>(null);
  const [riverChange8h, setRiverChange8h] = useState<number | null>(null);

  useEffect(() => {
    const getData = async () => {
      try {
        const riverData = await fetchRiverData();
        setRiverGraphData(riverData.historicalData);
        setRiverChange24h(riverData.change24h);
        setRiverChange8h(riverData.change8h);

        const weatherData = await fetchWeatherData(52.2, -2.2);

        // Consolidate all conditions for calculation
        const currentConditions: Partial<KayakConditions> = {
          riverLevel: riverData.latestLevel === null ? undefined : riverData.latestLevel,
          temperature: weatherData.temperature,
          windSpeed: weatherData.windSpeed,
          rain: weatherData.rain,
          dark: weatherData.dark,
          visibility: weatherData.visibility,
          weatherCode: weatherData.weatherCode,
        };

        const { status, reasons } = calculateFinalRagStatus(currentConditions);

        // Set the final state for the UI
        setConditions({
          ...currentConditions,
          overallStatus: status,
          reasons: reasons,
          levelChange: {
            value: riverData.change8h || 0,
            period: "8h",
          },
          launchMessage: findLevelDescription(riverData.latestLevel || 0),
          lastUpdated: new Date().toISOString(),
        });
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    };

    getData();

    // Register service worker
    if ("serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/sw.js")
          .then((registration) => {
            console.log("SW registered: ", registration);
          })
          .catch((registrationError) => {
            console.log("SW registration failed: ", registrationError);
          });
      });
    }
  }, []);

  return (
    <Container maxWidth="md">
      <Stack spacing={4} sx={{ py: 2, pb: 16 }}>
        <StatusCard conditions={conditions} loading={loading} />
        <StatsCard conditions={conditions} />
        <RiverLevelGraph
          data={riverGraphData}
          loading={loading}
          change24h={riverChange24h}
          change8h={riverChange8h}
        />
      </Stack>
    </Container>
  );
}
