'use client';

import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Chip,
  Box,
  CircularProgress,
} from '@mui/material';
import { KayakConditions, Status } from '@/types';
import { green, amber, red } from '@mui/material/colors';

interface StatusCardProps {
  conditions: KayakConditions | null;
  loading?: boolean;
}

const statusColors: Record<Status, string> = {
  Unknown: 'default',
  'Light Green': green[300],
  'Dark Green': green[600],
  Amber: amber[500],
  Red: red[500],
};

const StatusCard: React.FC<StatusCardProps> = ({
  conditions,
  loading,
}) => {
  const status = conditions?.overallStatus ?? 'Unknown';
  const chipColor =
    status === 'Unknown'
      ? 'default'
      : status === 'Light Green' || status === 'Dark Green'
      ? 'success'
      : status === 'Amber'
      ? 'warning'
      : 'error';

  const renderContent = () => {
    if (loading) {
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
          <CircularProgress size={24} sx={{ mr: 2 }} />
          <Typography variant="h5">Loading...</Typography>
        </Box>
      );
    }
    if (conditions) {
      return (
        <Chip
          label={status}
          color={chipColor}
          sx={{
            mt: 1,
            color: chipColor !== 'default' ? '#fff' : 'inherit',
            backgroundColor: statusColors[status],
          }}
        />
      );
    }
    return (
      <Typography variant="body1" sx={{ mt: 1 }}>
        No data yet
      </Typography>
    );
  };

  return (
    <Card sx={{ minWidth: 275, m: 2, width: '100%' }}>
      <CardContent>
        <Typography sx={{ fontSize: 14 }} color="text.secondary" gutterBottom>
          Status
        </Typography>
        {renderContent()}
      </CardContent>
    </Card>
  );
};

export default StatusCard;
