'use client';

import React, { useState, useEffect } from "react";
import { Container, Stack, Box, Divider } from "@mui/material";
import LastUpdated from "@/components/LastUpdated";
import StatusCard from "@/components/StatusCard";
import PaddlingMatrixCard from "@/components/PaddlingMatrixCard";
import StatsCard from "@/components/StatsCard";
import RiverLevelGraph from "@/components/RiverLevelGraph";
import PredictedRagGraph from "@/components/PredictedRagGraph";
import Disclaimer from "@/components/Disclaimer";
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
  ragHeight,
} from "@/lib/rag";
import { fetchRiverData, predictRiverLevel } from "@/lib/river";
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
  const [riverChange1h, setRiverChange1h] = useState<number | null>(null);
  const [riverChange24h, setRiverChange24h] = useState<number | null>(null);
  const [riverChange8h, setRiverChange8h] = useState<number | null>(null);
  const [riverChange5d, setRiverChange5d] = useState<number | null>(null);
  const [sunrise, setSunrise] = useState<string | null>(null);
  const [sunset, setSunset] = useState<string | null>(null);

  useEffect(() => {
    const getData = async () => {
      try {
        const riverData = await fetchRiverData("2642", 5);
        setRiverGraphData(riverData.historicalData);
        setRiverChange1h(riverData.change1h);
        setRiverChange24h(riverData.change24h);
        setRiverChange8h(riverData.change8h);
        setRiverChange5d(riverData.change5d);

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
        const riverData = await fetchRiverData("2642", 5);
        const futureWeatherData = await fetchFutureWeatherData(52.2, -2.2);

        setSunrise(futureWeatherData.daily.sunrise[0]);
        setSunset(futureWeatherData.daily.sunset[0]);

        const graphData: PredictedGraphDataPoint[] = [];
        const now = new Date();
        const currentHour = now.getHours();

        // Find the index for the current hour in the fetched data
        const startIndex = futureWeatherData.hourly.time.findIndex((t) => {
          const hour = parseInt(t.split("T")[1].split(":")[0], 10);
          return hour >= currentHour;
        });

        if (startIndex === -1) {
          setPredictLoading(false);
          return;
        }

        // Create graph data for the next 24 hours from the startIndex
        for (let i = 0; i < 24; i++) {
          const index = startIndex + i;
          if (index >= futureWeatherData.hourly.time.length) break;

          const timeStr = futureWeatherData.hourly.time[index];
          const hour = parseInt(timeStr.split("T")[1].split(":")[0], 10);

          const predictedRiverLevel = predictRiverLevel(
            riverData.latestLevel || 0,
            riverData.historicalData,
            i + 1
          );

          const sunriseHour = futureWeatherData.daily.sunrise[0]
            ? parseInt(
                futureWeatherData.daily.sunrise[0].split("T")[1].split(":")[0],
                10
              )
            : null;
          const sunsetHour = futureWeatherData.daily.sunset[0]
            ? parseInt(
                futureWeatherData.daily.sunset[0].split("T")[1].split(":")[0],
                10
              )
            : null;

          let dark;
          if (sunriseHour && sunsetHour) {
            dark = hour <= sunriseHour || hour >= sunsetHour;
          } else {
            dark = !futureWeatherData.hourly.is_day[index];
          }

          const predictedConditions: Partial<KayakConditions> = {
            riverLevel: predictedRiverLevel,
            temperature: futureWeatherData.hourly.temperature_2m[index],
            windSpeed: futureWeatherData.hourly.wind_speed_10m[index],
            rain: futureWeatherData.hourly.precipitation[index] > 0,
            dark: dark,
            visibility: futureWeatherData.hourly.visibility[index],
            weatherCode: futureWeatherData.hourly.weather_code[index],
          };

          const { status, reasons } =
            calculateFinalRagStatus(predictedConditions);
          graphData.push({
            time: `${hour}:00`,
            status: status,
            reasons: reasons,
            value: ragHeight[status] || 0.1,
            predictedLevel: predictedRiverLevel,
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
        {conditions && (
          <PaddlingMatrixCard
            overallStatus={conditions.overallStatus}
            riverLevel={conditions.riverLevel}
          />
        )}
        <StatsCard conditions={conditions} />
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