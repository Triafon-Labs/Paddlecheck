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
import LinksPopover from './LinksPopover';

const BottomNavBar = () => {
  const [value, setValue] = useState(0);
  const [settingsAnchorEl, setSettingsAnchorEl] =
    useState<null | HTMLElement>(null);
  const [linksAnchorEl, setLinksAnchorEl] = useState<null | HTMLElement>(null);

  const handleLinksClick = (event: React.MouseEvent<HTMLElement>) => {
    setLinksAnchorEl(event.currentTarget);
  };

  const handleLinksClose = () => {
    setLinksAnchorEl(null);
  };

  const handleSettingsClick = (event: React.MouseEvent<HTMLElement>) => {
    setSettingsAnchorEl(event.currentTarget);
  };

  const handleSettingsClose = () => {
    setSettingsAnchorEl(null);
  };

  const linksOpen = Boolean(linksAnchorEl);
  const settingsOpen = Boolean(settingsAnchorEl);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
    if (newValue === 0) {
      window.location.reload();
    }
    // Note: Settings and Links popovers are now handled by their own click handlers
  };

  return (
    <>
      <Paper
        sx={{ position: 'fixed', bottom: 0, left: 0, right: 0 }}
        elevation={3}
      >
        <BottomNavigation showLabels value={value} onChange={handleChange}>
          <BottomNavigationAction
            label="Refresh"
            icon={<RefreshIcon />}
            sx={{
              '&.Mui-selected': {
                color: (theme) =>
                  theme.palette.mode === 'dark' ? 'common.white' : 'primary.main',
              },
            }}
          />
          <BottomNavigationAction
            label="Settings"
            icon={<SettingsIcon />}
            onClick={handleSettingsClick}
            sx={{
              '&.Mui-selected': {
                color: (theme) =>
                  theme.palette.mode === 'dark' ? 'common.white' : 'primary.main',
              },
            }}
          />
          <BottomNavigationAction
            label="Links"
            icon={<LinkIcon />}
            onClick={handleLinksClick}
            sx={{
              '&.Mui-selected': {
                color: (theme) =>
                  theme.palette.mode === 'dark' ? 'common.white' : 'primary.main',
              },
            }}
          />
        </BottomNavigation>
      </Paper>
      <SettingsModal
        open={settingsOpen}
        anchorEl={settingsAnchorEl}
        onClose={handleSettingsClose}
      />
      <LinksPopover
        open={linksOpen}
        anchorEl={linksAnchorEl}
        onClose={handleLinksClose}
      />
    </>
  );
};

export default BottomNavBar;
