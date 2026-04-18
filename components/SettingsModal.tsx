"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  Drawer,
  Typography,
  FormControl,
  Select,
  MenuItem,
  Button,
  SelectChangeEvent,
  Box,
  Divider,
  Link,
  ToggleButtonGroup,
  ToggleButton,
} from "@mui/material";
import { useAppTheme, ThemeMode } from "@/lib/ThemeContext";
import { PaddlerType } from "@/types";

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ open, onClose }) => {
  const { themeMode, setThemeMode } = useAppTheme();
  const [paddlerLevel, setPaddlerLevel] = useState<PaddlerType | "">("");
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [notificationPermission, setNotificationPermission] =
    useState<NotificationPermission>("default");

  const scrollRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef(0);
  const touchStartScrollTop = useRef(0);

  useEffect(() => {
    const savedLevel = localStorage.getItem("paddlerLevel") as PaddlerType | undefined;
    if (savedLevel) setPaddlerLevel(savedLevel);
    setNotificationsEnabled(localStorage.getItem("notificationsEnabled") === "true");
    if ("Notification" in window) setNotificationPermission(Notification.permission);
  }, []);

  const handleNotificationsChange = async (checked: boolean) => {
    if (checked && Notification.permission !== "granted") {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      if (permission !== "granted") return;
    }
    setNotificationsEnabled(checked);
    localStorage.setItem("notificationsEnabled", String(checked));
  };

  const handleLevelChange = (event: SelectChangeEvent<PaddlerType | "">) => {
    const level = event.target.value as PaddlerType | "";
    setPaddlerLevel(level);
    if (level) localStorage.setItem("paddlerLevel", level);
    else localStorage.removeItem("paddlerLevel");
  };

  const handleClearLevel = () => {
    setPaddlerLevel("");
    localStorage.removeItem("paddlerLevel");
  };

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
    touchStartScrollTop.current = scrollRef.current?.scrollTop ?? 0;
  };

  const onTouchMove = (e: React.TouchEvent) => {
    const dy = e.touches[0].clientY - touchStartY.current;
    if (touchStartScrollTop.current === 0 && dy > 60) onClose();
  };

  const paddlerTypes: PaddlerType[] = ["Beginner", "Improver", "Intermediate", "Independent"];

  return (
    <Drawer
      anchor="bottom"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          borderRadius: "16px 16px 0 0",
          maxHeight: "90vh",
          bgcolor: "background.paper",
          backgroundImage: "none",
          display: "flex",
          flexDirection: "column",
        },
      }}
    >
      {/* Drag handle */}
      <Box
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        sx={{ display: "flex", justifyContent: "center", pt: 1.5, pb: 0.5, flexShrink: 0 }}
      >
        <Box sx={{ width: 36, height: 4, borderRadius: 2, bgcolor: "divider" }} />
      </Box>

      {/* Scrollable content */}
      <Box
        ref={scrollRef}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        sx={{ overflowY: "auto", px: 2, pb: 3 }}
      >
        <Typography variant="h5" gutterBottom sx={{ mt: 1 }}>
          Settings
        </Typography>

        <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
          Theme
        </Typography>
        <ToggleButtonGroup
          value={themeMode}
          exclusive
          onChange={(_, val: ThemeMode | null) => { if (val) setThemeMode(val); }}
          fullWidth
          size="small"
        >
          <ToggleButton value="light">Light</ToggleButton>
          <ToggleButton value="system">System</ToggleButton>
          <ToggleButton value="dark">Dark</ToggleButton>
        </ToggleButtonGroup>

        <Divider sx={{ my: 2 }} />

        <Typography variant="h6" gutterBottom>
          My Paddling Level
        </Typography>
        <FormControl fullWidth sx={{ mb: 2 }}>
          <Select
            id="paddler-level-select"
            value={paddlerLevel}
            onChange={handleLevelChange}
            displayEmpty
            inputProps={{ "aria-label": "Paddling Level" }}
          >
            {paddlerTypes.map((level) => (
              <MenuItem key={level} value={level}>
                {level}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Button onClick={handleClearLevel} disabled={!paddlerLevel} fullWidth>
          Clear Selection
        </Button>

        <Divider sx={{ my: 2 }} />

        <Typography variant="h6" gutterBottom>
          Notifications
        </Typography>
        <ToggleButtonGroup
          value={notificationsEnabled ? "on" : "off"}
          exclusive
          onChange={(_, val) => { if (val) handleNotificationsChange(val === "on"); }}
          fullWidth
          size="small"
          disabled={notificationPermission === "denied"}
        >
          <ToggleButton value="off">Off</ToggleButton>
          <ToggleButton value="on">On</ToggleButton>
        </ToggleButtonGroup>
        {notificationPermission === "denied" && (
          <Typography variant="caption" color="error" sx={{ mt: 0.5, display: "block" }}>
            Notifications are blocked in your browser settings.
          </Typography>
        )}

        <Divider sx={{ my: 2 }} />

        <Typography variant="h6" gutterBottom>
          About
        </Typography>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography>Paddlecheck Version</Typography>
          <Typography>{process.env.NEXT_PUBLIC_APP_VERSION || "N/A"}</Typography>
        </Box>
        <Typography variant="caption" color="text.secondary" sx={{ mt: 2 }}>
          This is a hobby project, so there might be mistakes. Always check
          conditions yourself and talk to coaches or experienced paddlers before
          heading out.{" "}
          <Link href="mailto:REDACTED" color="inherit">
            Feedback welcome here!
          </Link>
        </Typography>
      </Box>
    </Drawer>
  );
};

export default SettingsModal;
