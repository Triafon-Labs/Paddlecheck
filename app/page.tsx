'use client';

import React, { useState, useEffect } from 'react';
import { Container, Box } from '@mui/material';
import StatusCard from '@/components/StatusCard';
import StatsCard from '@/components/StatsCard';
import RiverLevelGraph from '@/components/RiverLevelGraph';
import { KayakConditions } from '@/types';
import { calculateInitialRag, calculateFinalRagStatus, levelDescriptions } from '@/lib/rag';

const mockConditions: Omit<KayakConditions, 'overallStatus' | 'statusReason' | 'initialStatus'> = {
  riverLevel: 0.45,
  levelChange: {
    value: 0.01,
    period: '8h',
  },
  launchMessage: 'Able to launch from the landing stage - OK.',
  temperature: 11.1,
  windSpeed: 3.6,
  rain: true,
  dark: true,
  visibility: 10.0,
  lastUpdated: new Date().toISOString(),
};

export default function HomePage() {
  const [conditions, setConditions] = useState<KayakConditions | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate fetching data
    const timer = setTimeout(() => {
      const initialStatus = calculateInitialRag(mockConditions.riverLevel!)
      const overallStatus = calculateFinalRagStatus({ ...mockConditions, initialStatus });
      const statusReason = levelDescriptions[Math.round(mockConditions.riverLevel! * 2) / 2];
      setConditions({ ...mockConditions, initialStatus, overallStatus, statusReason });
      setLoading(false);
    }, 2000); // 2 second delay

    // Register service worker
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((registration) => {
            console.log('SW registered: ', registration);
          })
          .catch((registrationError) => {
            console.log('SW registration failed: ', registrationError);
          });
      });
    }

    return () => clearTimeout(timer);
  }, []);

  return (
    <Container maxWidth="md">
      <Box
        sx={{
          py: 2,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          pb: 16,
        }}
      >
        <StatusCard conditions={conditions} loading={loading} />
        <StatsCard conditions={conditions} />
        <RiverLevelGraph />
      </Box>
    </Container>
  );
}

