"use client";

import React from "react";
import {
  Dialog,
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListSubheader,
  Switch,
  Divider,
  ListItemIcon,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import Slide from "@mui/material/Slide";
import { TransitionProps } from "@mui/material/transitions";
import { useAppTheme } from "@/lib/ThemeContext";
import CheckIcon from "@mui/icons-material/Check";
import { useEffect, useState } from "react";
import {
  DarkMode,
  LightMode,
  Phone,
  SettingsBrightness,
  SystemSecurityUpdate,
} from "@mui/icons-material";
import { Cormorant_Garamond } from "next/font/google";

const Transition = React.forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement;
  },
  ref: React.Ref<unknown>
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ open, onClose }) => {
  const { themeMode, setThemeMode } = useAppTheme();
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setNotificationsEnabled(Notification.permission === "granted");
    }
  }, []);

  const handleNotificationToggle = async () => {
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "granted") {
        // This part is tricky - you can't programmatically "un-grant" permission.
        // This toggle will therefore only reflect the "granted" state.
        // For a real app, you'd manage this state on your server.
        alert(
          "Notification permissions can only be changed in your browser's settings."
        );
        return;
      }

      const permission = await Notification.requestPermission();
      setNotificationsEnabled(permission === "granted");
    } else {
      alert("This browser does not support desktop notification");
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      TransitionComponent={Transition}
      fullWidth
      maxWidth="sm"
      PaperProps={{
        sx: {
          borderRadius: 1,
        },
      }}
    >
      <AppBar sx={{ position: "relative" }}>
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            onClick={onClose}
            aria-label="close"
          >
            <CloseIcon />
          </IconButton>
          <Typography sx={{ ml: 2, flex: 1 }} variant="h6" component="div">
            Settings
          </Typography>
        </Toolbar>
      </AppBar>
      <List>
        <ListSubheader>Theme</ListSubheader>
        <ListItemButton onClick={() => setThemeMode("light")}>
          <ListItemIcon>
            <LightMode />
          </ListItemIcon>
          <ListItemText primary="Light" />
          {themeMode === "light" && <CheckIcon />}
        </ListItemButton>
        <ListItemButton onClick={() => setThemeMode("dark")}>
          <ListItemIcon>
            <DarkMode />
          </ListItemIcon>
          <ListItemText primary="Dark" />
          {themeMode === "dark" && <CheckIcon />}
        </ListItemButton>
        <ListItemButton onClick={() => setThemeMode("system")}>
          <ListItemIcon>
            <SettingsBrightness />
          </ListItemIcon>
          <ListItemText primary="System" />
          {themeMode === "system" && <CheckIcon />}
        </ListItemButton>
        <Divider />
        <ListSubheader>Notifications</ListSubheader>
        <ListItem>
          <ListItemText
            primary="Enable Notifications"
            secondary={
              typeof window !== "undefined" && !("Notification" in window)
                ? "Not supported by this browser"
                : ""
            }
          />
          <Switch
            edge="end"
            checked={notificationsEnabled}
            onChange={handleNotificationToggle}
            disabled={
              typeof window !== "undefined" && !("Notification" in window)
            }
          />
        </ListItem>
        <Divider />
        <ListSubheader>About</ListSubheader>
        <ListItem>
          <ListItemText primary="Paddlecheck Version" secondary="0.2.0" />
        </ListItem>
      </List>
    </Dialog>
  );
};

export default SettingsModal;
