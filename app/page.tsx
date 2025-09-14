"use client";

import React, { useState, useEffect } from "react";
import { Container, Stack } from "@mui/material";
import StatusCard from "@/components/StatusCard";
import StatsCard from "@/components/StatsCard";
import RiverLevelGraph from "@/components/RiverLevelGraph";
import PredictedRagGraph from "@/components/PredictedRagGraph";
import {
  KayakConditions,
  ChartDataPoint,
  PredictedGraphDataPoint,
} from "@/types";
import {
  calculateFinalRagStatus,
  findLevelDescription,
  calculateInitialRagStatus,
  RAG_STATUS_MAP,
} from "@/lib/rag";
import { fetchRiverData } from "@/lib/river";
import {
  fetchWeatherData,
  getVisibilityDescription,
  fetchFutureWeatherData,
} from "@/lib/weather";

export default function HomePage() {
  const [conditions, setConditions] = useState<KayakConditions | null>(null);
  const [predictedGraphData, setPredictedGraphData] = useState<
    PredictedGraphDataPoint[] | null
  >(null);
  const [loading, setLoading] = useState(true);
  const [predictLoading, setPredictLoading] = useState(true);
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
          riverLevel:
            riverData.latestLevel === null ? undefined : riverData.latestLevel,
          temperature: weatherData.temperature,
          windSpeed: weatherData.windSpeed,
          rain: weatherData.rain,
          dark: weatherData.dark,
          visibility: weatherData.visibility,
          weatherCode: weatherData.weatherCode,
        };

        const initialRagNumber = calculateInitialRagStatus(
          currentConditions.riverLevel || 0
        );
        const initialStatus = RAG_STATUS_MAP[initialRagNumber];
        const { status, reasons } = calculateFinalRagStatus(currentConditions);
        const visibilityDescription = getVisibilityDescription(
          currentConditions.visibility || 0
        );

        // Set the final state for the UI
        setConditions({
          ...currentConditions,
          initialStatus,
          overallStatus: status,
          reasons: reasons,
          levelChange: {
            value: riverData.change8h || 0,
            period: "8h",
          },
          launchMessage: findLevelDescription(riverData.latestLevel || 0),
          lastUpdated: new Date().toISOString(),
          visibilityDescription,
        });
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    };

    const getPredictedData = async () => {
      try {
        const riverData = await fetchRiverData();
        const futureWeatherData = await fetchFutureWeatherData(52.2, -2.2);

        const graphData = [];
        const now = new Date();

        for (let i = 0; i < 24; i++) {
          const futureTime = new Date(now.getTime() + i * 60 * 60 * 1000);
          const futureTimeStr = futureTime.toISOString().slice(0, 14) + "00";
          const index = futureWeatherData.time.findIndex(
            (t: string) => t >= futureTimeStr
          );

          if (index === -1) continue;

          const hourlyRiverLevelChange = (riverData.change8h || 0) / 8;
          const predictedRiverLevel =
            (riverData.latestLevel || 0) + hourlyRiverLevelChange * i;

          const hour = futureTime.getHours();
          const dark = hour > 20 || hour < 6;

          const predictedConditions: Partial<KayakConditions> = {
            riverLevel: predictedRiverLevel,
            temperature: futureWeatherData.temperature_2m[index],
            windSpeed: futureWeatherData.wind_speed_10m[index],
            rain: futureWeatherData.precipitation[index] > 0,
            dark: dark,
            visibility: futureWeatherData.visibility[index],
            weatherCode: futureWeatherData.weather_code[index],
          };

          const { status, reasons } =
            calculateFinalRagStatus(predictedConditions);
          graphData.push({
            time: `${futureTime.getHours()}:00`,
            status: status,
            reasons: reasons,
            value: 1, // Dummy value for bar height
          });
        }
        setPredictedGraphData(graphData);
      } catch (error) {
        console.error("Failed to fetch predicted data:", error);
      } finally {
        setPredictLoading(false);
      }
    };

    getData();
    getPredictedData();

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
        <PredictedRagGraph data={predictedGraphData} loading={predictLoading} />
      </Stack>
    </Container>
  );
}
