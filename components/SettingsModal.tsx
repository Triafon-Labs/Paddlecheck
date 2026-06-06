"use client";

import React, { useState } from "react";
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
  IconButton,
  Chip,
  List,
  ListItem,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import CloseIcon from "@mui/icons-material/Close";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import {
  Air,
  Thermostat,
  AcUnit,
  Water,
  Waves,
  Tsunami,
  Flood,
  Visibility,
  WaterDrop,
  NightsStay,
  Thunderstorm,
  Foggy,
} from "@mui/icons-material";
import { useAppTheme, ThemeMode } from "@/lib/ThemeContext";
import { showNotification } from "@/lib/showNotification";
import { PaddlerType, Status } from "@/types";
import { RAG_STATUS_UI, THRESHOLDS, VISIBILITY_DESCRIPTIONS, USEFUL_LINKS } from "@/lib/config";

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
}

const RAG_DESCRIPTIONS: Record<Status, string> = {
  "Light Green":
    "Ideal conditions. Beginners need coach supervision. Improvers may paddle as a group without a coach. Intermediates may paddle solo.",
  "Dark Green":
    "Good conditions. Beginners and improvers need coach supervision. Intermediates may paddle with at least one other intermediate.",
  Amber:
    "Coach's discretion required. Beginners and improvers may only paddle at coach's discretion. Intermediates need supervision by an independent paddler or coach.",
  Red:
    "Risky conditions. No paddling for beginners or improvers. Intermediates at coach's discretion only (not above 10 steps from car park). PFDs must be worn by all.",
  "No Paddling": "Do not paddle. Triggered by thunderstorm risk or dangerously high river level.",
  Unknown: "Data unavailable.",
};

const StatusRow: React.FC<{ status: Status }> = ({ status }) => {
  const ui = RAG_STATUS_UI[status];
  const Icon = ui.icon;
  return (
    <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5, py: 0.75 }}>
      <Box
        sx={{
          width: 28,
          height: 28,
          borderRadius: "50%",
          bgcolor: ui.color,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          mt: 0.1,
        }}
      >
        <Icon sx={{ color: "#fff", fontSize: 16 }} />
      </Box>
      <Box>
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          {status}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {RAG_DESCRIPTIONS[status]}
        </Typography>
      </Box>
    </Box>
  );
};

// YIQ perceptual brightness — returns black or white for readable contrast
const contrastText = (hex: string): string => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 128 ? "#000" : "#fff";
};

interface ThresholdRowProps {
  icon: React.ReactNode;
  label: string;
  description: string;
  chipLabel?: string;
  chipColor?: "success" | "warning" | "error" | "default";
  // When set, overrides chipColor with the exact RAG hex colour
  ragColor?: string;
}

const ThresholdRow: React.FC<ThresholdRowProps> = ({ icon, label, description, chipLabel, chipColor, ragColor }) => (
  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, py: 0.5 }}>
    <Box sx={{ color: "text.secondary", display: "flex", flexShrink: 0 }}>{icon}</Box>
    <Box sx={{ flex: 1 }}>
      <Typography variant="body2" sx={{ fontWeight: 600 }}>
        {label}
      </Typography>
      <Typography variant="caption" color="text.secondary">
        {description}
      </Typography>
    </Box>
    {chipLabel && (
      ragColor ? (
        <Chip
          label={chipLabel}
          size="small"
          sx={{ backgroundColor: ragColor, color: contrastText(ragColor), fontWeight: 500 }}
        />
      ) : (
        <Chip label={chipLabel} color={chipColor ?? "default"} size="small" />
      )
    )}
  </Box>
);

const SettingsModal: React.FC<SettingsModalProps> = ({ open, onClose }) => {
  const { themeMode, setThemeMode } = useAppTheme();
  const [paddlerLevel, setPaddlerLevel] = useState<PaddlerType | "">(
    () => (typeof window !== "undefined" ? (localStorage.getItem("paddlerLevel") as PaddlerType | null) ?? "" : "")
  );
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(
    () => typeof window !== "undefined" && localStorage.getItem("notificationsEnabled") === "true"
  );
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(
    () => (typeof window !== "undefined" && "Notification" in window ? Notification.permission : "default")
  );

  const visKeys = Object.keys(VISIBILITY_DESCRIPTIONS) as (keyof typeof VISIBILITY_DESCRIPTIONS)[];

  const handleNotificationsChange = async (checked: boolean) => {
    if (checked && Notification.permission !== "granted") {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      if (permission !== "granted") return;
    }
    setNotificationsEnabled(checked);
    localStorage.setItem("notificationsEnabled", String(checked));
  };

  const handleTestNotification = () => {
    showNotification("✅ Paddlecheck", {
      body: "Test notification — notifications are working!",
      icon: "/web-app-manifest-192x192.png",
    });
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

  const paddlerTypes: PaddlerType[] = ["Beginner", "Improver", "Intermediate", "Independent"];

  return (
    <Drawer
      anchor="bottom"
      open={open}
      onClose={onClose}
      slotProps={{
        paper: {
          sx: {
            borderRadius: "16px 16px 0 0",
            maxHeight: "90vh",
            bgcolor: "background.paper",
            backgroundImage: "none",
            display: "flex",
            flexDirection: "column",
          },
        },
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: 2, pt: 2, pb: 1, flexShrink: 0 }}>
        <Typography variant="h5">Settings</Typography>
        <IconButton onClick={onClose} edge="end" aria-label="close">
          <CloseIcon />
        </IconButton>
      </Box>

      <Box sx={{ overflowY: "auto", px: 2, pb: 3 }}>

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
        <Button onClick={handleClearLevel} disabled={!paddlerLevel} fullWidth variant="outlined">
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
        {notificationsEnabled && notificationPermission === "granted" && (
          <Button
            onClick={handleTestNotification}
            fullWidth
            variant="outlined"
            size="small"
            sx={{ mt: 1 }}
          >
            Send test notification
          </Button>
        )}

        <Divider sx={{ my: 2 }} />

        <Typography variant="h6" gutterBottom>
          Useful Links
        </Typography>
        <List disablePadding>
          {USEFUL_LINKS.map((link) => (
            <ListItem
              key={link.name}
              component={Link}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              sx={{
                pl: 0,
                color: (theme) =>
                  theme.palette.mode === "dark" ? "common.white" : "primary.main",
              }}
            >
              <Typography sx={{ flexGrow: 1 }}>{link.name}</Typography>
              <OpenInNewIcon fontSize="small" />
            </ListItem>
          ))}
        </List>

        <Divider sx={{ my: 2 }} />

        <Accordion disableGutters elevation={0} sx={{ "&:before": { display: "none" }, mx: -2 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ px: 2 }}>
            <Typography variant="h6">Conditions Key</Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ px: 2, pt: 0 }}>

            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Status Colours
            </Typography>
            {(["Light Green", "Dark Green", "Amber", "Red", "No Paddling"] as Status[]).map((s) => (
              <StatusRow key={s} status={s} />
            ))}

            <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ mt: 2 }}>
              River Level
            </Typography>
            <ThresholdRow
              icon={<Water fontSize="small" />}
              label={`Below ${THRESHOLDS.RIVER_LEVEL_INITIAL_RAG_1} m`}
              description="Below the wooden landing stage. Good launch conditions."
              chipLabel="Light Green"
              ragColor={RAG_STATUS_UI["Light Green"].color}
            />
            <ThresholdRow
              icon={<Water fontSize="small" />}
              label={`${THRESHOLDS.RIVER_LEVEL_INITIAL_RAG_1} – ${THRESHOLDS.RIVER_LEVEL_INITIAL_RAG_2} m`}
              description="Between landing stage and concrete step. Still paddleable with care."
              chipLabel="Dark Green"
              ragColor={RAG_STATUS_UI["Dark Green"].color}
            />
            <ThresholdRow
              icon={<Waves fontSize="small" />}
              label={`${THRESHOLDS.RIVER_LEVEL_INITIAL_RAG_2} – ${THRESHOLDS.RIVER_LEVEL_INITIAL_RAG_3} m`}
              description="Above the concrete step. PFDs must be worn by all."
              chipLabel="Amber"
              ragColor={RAG_STATUS_UI["Amber"].color}
            />
            <ThresholdRow
              icon={<Tsunami fontSize="small" />}
              label={`${THRESHOLDS.RIVER_LEVEL_INITIAL_RAG_3} m and above`}
              description="Above 10 steps from the car park. No paddling for intermediates and below."
              chipLabel="Red"
              ragColor={RAG_STATUS_UI["Red"].color}
            />
            <ThresholdRow
              icon={<Flood fontSize="small" />}
              label={`${THRESHOLDS.RIVER_LEVEL_NO_PADDLING} m and above`}
              description="Boathouse flooding. No paddling under any circumstances."
              chipLabel="No Paddling"
              ragColor={RAG_STATUS_UI["No Paddling"].color}
            />

            <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ mt: 2 }}>
              Temperature
            </Typography>
            <ThresholdRow
              icon={<Thermostat fontSize="small" />}
              label={`${THRESHOLDS.TEMP_HIGH} °C and above`}
              description="Warm. No temperature penalty applied."
              chipLabel="No penalty"
              chipColor="success"
            />
            <ThresholdRow
              icon={<Thermostat fontSize="small" />}
              label={`${THRESHOLDS.TEMP_MODERATE} – ${THRESHOLDS.TEMP_HIGH} °C`}
              description="Cool. Raises the base risk rating. Rain also becomes a factor."
              chipLabel="Raises rating"
              chipColor="warning"
            />
            <ThresholdRow
              icon={<AcUnit fontSize="small" />}
              label={`Below ${THRESHOLDS.TEMP_MODERATE} °C`}
              description="Cold. Cold water shock risk. Significant increase in risk rating."
              chipLabel="Cold"
              chipColor="error"
            />

            <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ mt: 2 }}>
              Wind
            </Typography>
            <ThresholdRow
              icon={<Air fontSize="small" />}
              label={`Below ${THRESHOLDS.WIND_HIGH} mph`}
              description="Calm. No wind penalty applied."
              chipLabel="Calm"
              chipColor="success"
            />
            <ThresholdRow
              icon={<Air fontSize="small" />}
              label={`${THRESHOLDS.WIND_HIGH} mph and above`}
              description="Windy. Raises the risk rating at all temperatures."
              chipLabel="Raises rating"
              chipColor="error"
            />

            <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ mt: 2 }}>
              Visibility
            </Typography>
            {visKeys.map((key) => {
              const { min, desc } = VISIBILITY_DESCRIPTIONS[key];
              const nextKey = visKeys[visKeys.indexOf(key) - 1];
              const max = nextKey ? VISIBILITY_DESCRIPTIONS[nextKey].min : null;
              const range = max
                ? `${(min / 1000).toFixed(0)}–${(max / 1000).toFixed(0)} km`
                : `Over ${(min / 1000).toFixed(0)} km`;
              const isBad = min < THRESHOLDS.VISIBILITY_POOR;
              const isAtLimit = min === THRESHOLDS.VISIBILITY_POOR;
              const chipColor: "error" | "warning" | "success" = isBad ? "error" : isAtLimit ? "warning" : "success";
              return (
                <ThresholdRow
                  key={key}
                  icon={<Visibility fontSize="small" />}
                  label={`${desc} (${range})`}
                  description={
                    isBad
                      ? "Fog conditions — raises Green to Amber, and Amber to Red."
                      : isAtLimit
                      ? "Poor visibility — borderline fog threshold."
                      : "Acceptable visibility."
                  }
                  chipLabel={desc}
                  chipColor={chipColor}
                />
              );
            })}

            <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ mt: 2 }}>
              Other Factors
            </Typography>
            <ThresholdRow
              icon={<WaterDrop fontSize="small" />}
              label="Rain"
              description="Rain at cool temperatures (5–12°C) raises the risk rating."
              chipLabel="Raises rating"
              chipColor="warning"
            />
            <ThresholdRow
              icon={<NightsStay fontSize="small" />}
              label="Dark (streetlights on)"
              description="Raises Green to Amber, and Amber to Red."
              chipLabel="Raises rating"
              chipColor="warning"
            />
            <ThresholdRow
              icon={<Foggy fontSize="small" />}
              label="Fog"
              description="Raises Green to Amber, and Amber to Red."
              chipLabel="Raises rating"
              chipColor="warning"
            />
            <ThresholdRow
              icon={<Thunderstorm fontSize="small" />}
              label="Thunderstorm"
              description="No paddling when thunder is near — overrides all other conditions."
              chipLabel="No Paddling"
              chipColor="error"
            />
          </AccordionDetails>
        </Accordion>

        <Divider sx={{ my: 2 }} />

        <Typography variant="h6" gutterBottom>
          About
        </Typography>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography>Paddlecheck Version</Typography>
          <Typography>{process.env.NEXT_PUBLIC_APP_VERSION || "N/A"}</Typography>
        </Box>
        <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: "block" }}>
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
