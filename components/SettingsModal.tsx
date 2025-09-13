'use client';

import React from 'react';
import {
  Popover,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListSubheader,
  Switch,
  Divider,
  Box,
} from '@mui/material';
import { useAppTheme } from '@/lib/ThemeContext';
import CheckIcon from '@mui/icons-material/Check';
import { useEffect, useState } from 'react';

interface SettingsModalProps {
  open: boolean;
  anchorEl: null | HTMLElement;
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({
  open,
  anchorEl,
  onClose,
}) => {
  const { themeMode, setThemeMode } = useAppTheme();
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotificationsEnabled(Notification.permission === 'granted');
    }
  }, []);

  const handleNotificationToggle = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        // This part is tricky - you can't programmatically "un-grant" permission.
        // This toggle will therefore only reflect the "granted" state.
        // For a real app, you'd manage this state on your server.
        alert("Notification permissions can only be changed in your browser's settings.");
        return;
      }

      const permission = await Notification.requestPermission();
      setNotificationsEnabled(permission === 'granted');
    } else {
      alert('This browser does not support desktop notification');
    }
  };

  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{
        vertical: 'top',
        horizontal: 'center',
      }}
      transformOrigin={{
        vertical: 'bottom',
        horizontal: 'center',
      }}
      PaperProps={{
        sx: {
          borderRadius: 4,
          boxShadow: '0px 8px 24px rgba(0,0,0,0.12)',
          backgroundColor: 'background.paper',
        },
      }}
    >
      <Box sx={{ p: 2, backgroundColor: 'primary.main', color: 'primary.contrastText' }}>
        <Typography variant="h6">Settings</Typography>
      </Box>
      <List sx={{ minWidth: 280 }}>
        <ListSubheader>Theme</ListSubheader>
        <ListItem button onClick={() => setThemeMode('light')}>
          <ListItemText primary="Light" />
          {themeMode === 'light' && <CheckIcon />}
        </ListItem>
        <ListItem button onClick={() => setThemeMode('dark')}>
          <ListItemText primary="Dark" />
          {themeMode === 'dark' && <CheckIcon />}
        </ListItem>
        <ListItem button onClick={() => setThemeMode('system')}>
          <ListItemText primary="System" />
          {themeMode === 'system' && <CheckIcon />}
        </ListItem>
        <Divider />
        <ListSubheader>Notifications</ListSubheader>
        <ListItem>
          <ListItemText
            primary="Enable Notifications"
            secondary={
              typeof window !== 'undefined' && !('Notification' in window)
                ? 'Not supported by this browser'
                : ''
            }
          />
          <Switch
            edge="end"
            checked={notificationsEnabled}
            onChange={handleNotificationToggle}
            disabled={
              typeof window !== 'undefined' && !('Notification' in window)
            }
          />
        </ListItem>
        <Divider />
        <ListSubheader>About</ListSubheader>
        <ListItem>
          <ListItemText primary="Paddlecheck Version" secondary="0.2.0" />
        </ListItem>
      </List>
    </Popover>
  );
};

export default SettingsModal;
