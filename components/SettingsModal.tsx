"use client";

import React from "react";
import {
  Dialog,
  Typography,
  FormControl,
  Select,
  MenuItem,
  Button,
  SelectChangeEvent,
  DialogContent,
  Box,
  Divider,
  Link,
  ToggleButtonGroup,
  ToggleButton,
} from "@mui/material";
import Slide from "@mui/material/Slide";
import { TransitionProps } from "@mui/material/transitions";
import { useAppTheme } from "@/lib/ThemeContext";
import { useEffect, useState } from "react";
import { PaddlerType } from "@/types";

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
  const [paddlerLevel, setPaddlerLevel] = useState<PaddlerType | "">("");
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [notificationPermission, setNotificationPermission] =
    useState<NotificationPermission>("default");

  useEffect(() => {
    const savedLevel = localStorage.getItem("paddlerLevel") as
      | PaddlerType
      | undefined;
    if (savedLevel) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPaddlerLevel(savedLevel);
    }
    setNotificationsEnabled(
      localStorage.getItem("notificationsEnabled") === "true"
    );
    if ("Notification" in window) {
      setNotificationPermission(Notification.permission);
    }
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
    if (level) {
      localStorage.setItem("paddlerLevel", level);
    } else {
      localStorage.removeItem("paddlerLevel");
    }
  };

  const handleClearLevel = () => {
    setPaddlerLevel("");
    localStorage.removeItem("paddlerLevel");
  };

  const paddlerTypes: PaddlerType[] = [
    "Junior",
    "Beginner",
    "Improver",
    "Intermediate",
    "Independent",
  ];

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
          bgcolor: "background.paper",
        },
      }}
    >
      <DialogContent sx={{ bgcolor: "background.paper", p: 2 }}>
        <Typography variant="h5" component="div" gutterBottom>
          Settings
        </Typography>

        <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
          Theme
        </Typography>
        <ToggleButtonGroup
          value={themeMode}
          exclusive
          onChange={(_, val) => { if (val) setThemeMode(val); }}
          fullWidth
          size="small"
        >
          <ToggleButton value="light">Light</ToggleButton>
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
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography>Paddlecheck Version</Typography>
          <Typography>
            {process.env.NEXT_PUBLIC_APP_VERSION || "N/A"}
          </Typography>
        </Box>
        <Typography variant="caption" color="text.secondary" sx={{ mt: 2 }}>
          This is a hobby project, so there might be mistakes. Always check
          conditions yourself and talk to coaches or experienced paddlers before
          heading out.{" "}
          <Link href="mailto:REDACTED" color="inherit">
            Feedback welcome here!
          </Link>
        </Typography>
      </DialogContent>
    </Dialog>
  );
};

export default SettingsModal;
