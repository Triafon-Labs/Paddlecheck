'use client';

import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
} from '@mui/material';
import { KayakConditions } from '@/types';
import TrafficLight from './TrafficLight';

interface StatusCardProps {
  conditions: KayakConditions | null;
  loading?: boolean;
}

const StatusCard: React.FC<StatusCardProps> = ({
  conditions,
  loading,
}) => {
  const renderContent = () => {
    if (loading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
          <CircularProgress />
        </Box>
      );
    }
    if (conditions) {
      return (
        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
          <TrafficLight status={conditions.overallStatus} />
        </Box>
      );
    }
    return (
      <Typography variant="body1" sx={{ mt: 1, textAlign: 'center' }}>
        No data yet
      </Typography>
    );
  };

  return (
    <Card sx={{ minWidth: 275, width: '100%' }}>
      <CardContent>
        <Typography sx={{ fontSize: 14 }} color="text.secondary" gutterBottom>
          RAG Status
        </Typography>
        {renderContent()}
      </CardContent>
    </Card>
  );
};

export default StatusCard;
