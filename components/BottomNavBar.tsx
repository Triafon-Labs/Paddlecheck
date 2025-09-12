'use client';

import React, { useState } from 'react';
import {
  Paper,
  BottomNavigation,
  BottomNavigationAction,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import SettingsIcon from '@mui/icons-material/Settings';
import LinkIcon from '@mui/icons-material/Link';
import SettingsModal from './SettingsModal';
import LinksModal from './LinksModal';

const BottomNavBar = () => {
  const [value, setValue] = useState(0);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [linksOpen, setLinksOpen] = useState(false);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
    if (newValue === 1) {
      setSettingsOpen(true);
    }
    if (newValue === 2) {
      setLinksOpen(true);
    }
    // TODO: Add handler for refresh button
  };

  const handleSettingsClose = () => {
    setSettingsOpen(false);
  };

  const handleLinksClose = () => {
    setLinksOpen(false);
  };

  return (
    <>
      <Paper
        sx={{ position: 'fixed', bottom: 0, left: 0, right: 0 }}
        elevation={3}
      >
        <BottomNavigation showLabels value={value} onChange={handleChange}>
          <BottomNavigationAction label="Refresh" icon={<RefreshIcon />} />
          <BottomNavigationAction label="Settings" icon={<SettingsIcon />} />
          <BottomNavigationAction label="Links" icon={<LinkIcon />} />
        </BottomNavigation>
      </Paper>
      <SettingsModal open={settingsOpen} onClose={handleSettingsClose} />
      <LinksModal open={linksOpen} onClose={handleLinksClose} />
    </>
  );
};

export default BottomNavBar;
