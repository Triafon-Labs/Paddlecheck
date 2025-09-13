'use client';

import React, { useState, useEffect } from 'react';
import { Container, Box, Typography } from '@mui/material';
import KayakingIcon from '@mui/icons-material/Kayaking';
import StatusCard from '@/components/StatusCard';
import { KayakConditions } from '@/types';

const mockConditions: KayakConditions = {
  overallStatus: 'Amber',
  statusReason: 'Dark',
  riverLevel: 0.44,
  temperature: 13.5,
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
      setConditions(mockConditions);
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
    <Container maxWidth="sm">
      <Box
        sx={{
          py: 2,
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <StatusCard conditions={conditions} loading={loading} />
      </Box>
    </Container>
  );
}
