'use client';

import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
} from '@mui/material';
import { KayakConditions, Status } from '@/types';
import TrafficLight from './TrafficLight';
import { ragStatus } from '@/lib/rag';

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
      if (conditions.overallStatus === 'No Paddling') {
        const statusInfo = ragStatus['No Paddling'];
        const Icon = statusInfo.icon;
        return (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              mt: 2,
              p: 2,
              borderRadius: 4,
              backgroundColor: statusInfo.backgroundColor,
              border: `2px solid ${statusInfo.color}`,
            }}
          >
            <Icon sx={{ fontSize: 40, color: statusInfo.color, mb: 1 }} />
            <Typography variant="h6" sx={{ color: statusInfo.color }}>
              No Paddling
            </Typography>
          </Box>
        );
      }
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
    <Card variant="outlined" sx={{ width: '100%', p: 2 }}>
      <CardContent>
        <Typography variant="h5" component="div" gutterBottom>
          RAG Status
        </Typography>
        {renderContent()}
      </CardContent>
    </Card>
  );
};

export default StatusCard;
