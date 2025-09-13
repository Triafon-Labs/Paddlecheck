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
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [linksAnchorEl, setLinksAnchorEl] = useState<null | HTMLElement>(null);

  const handleLinksClick = (event: React.MouseEvent<HTMLElement>) => {
    setLinksAnchorEl(event.currentTarget);
  };

  const handleLinksClose = () => {
    setLinksAnchorEl(null);
  };

  const linksOpen = Boolean(linksAnchorEl);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
    if (newValue === 0) {
      window.location.reload();
    } else if (newValue === 1) {
      setSettingsOpen(true);
    }
    // Note: The Links popover is now handled by its own click handler
    // on the BottomNavigationAction component
  };

  const handleSettingsClose = () => {
    setSettingsOpen(false);
  };

  return (
    <>
      <Paper
        sx={{ position: 'fixed', bottom: 0, left: 0, right: 0, bgcolor: 'background.paper' }}
        elevation={0}
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
      <SettingsModal open={settingsOpen} onClose={handleSettingsClose} />
      <LinksPopover
        open={linksOpen}
        anchorEl={linksAnchorEl}
        onClose={handleLinksClose}
      />
    </>
  );
};

export default BottomNavBar;
