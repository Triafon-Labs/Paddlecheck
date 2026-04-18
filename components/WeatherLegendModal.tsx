"use client";

import React, { useRef } from "react";
import {
  SwipeableDrawer,
  Typography,
  Box,
  Divider,
  Chip,
} from "@mui/material";
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
import { RAG_STATUS_UI, THRESHOLDS, VISIBILITY_DESCRIPTIONS } from "@/lib/config";
import { Status } from "@/types";

interface WeatherLegendModalProps {
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
        <Typography variant="body2" fontWeight={600}>
          {status}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {RAG_DESCRIPTIONS[status]}
        </Typography>
      </Box>
    </Box>
  );
};

interface ThresholdRowProps {
  icon: React.ReactNode;
  label: string;
  description: string;
  chipLabel?: string;
  chipColor?: "success" | "warning" | "error" | "default";
}

const ThresholdRow: React.FC<ThresholdRowProps> = ({
  icon,
  label,
  description,
  chipLabel,
  chipColor,
}) => (
  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, py: 0.5 }}>
    <Box sx={{ color: "text.secondary", display: "flex", flexShrink: 0 }}>{icon}</Box>
    <Box sx={{ flex: 1 }}>
      <Typography variant="body2" fontWeight={600}>
        {label}
      </Typography>
      <Typography variant="caption" color="text.secondary">
        {description}
      </Typography>
    </Box>
    {chipLabel && (
      <Chip label={chipLabel} color={chipColor ?? "default"} size="small" />
    )}
  </Box>
);

const WeatherLegendModal: React.FC<WeatherLegendModalProps> = ({ open, onClose }) => {
  const visKeys = Object.keys(VISIBILITY_DESCRIPTIONS) as (keyof typeof VISIBILITY_DESCRIPTIONS)[];

  const scrollRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef(0);
  const atBottom = useRef(false);

  const checkAtBottom = () => {
    const el = scrollRef.current;
    if (!el) return;
    atBottom.current = el.scrollHeight - el.scrollTop <= el.clientHeight + 2;
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
    checkAtBottom();
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!atBottom.current) return;
    if (e.touches[0].clientY - touchStartY.current > 50) onClose();
  };

  return (
    <SwipeableDrawer
      anchor="bottom"
      open={open}
      onClose={onClose}
      onOpen={() => {}}
      disableSwipeToOpen
      swipeAreaWidth={0}
      PaperProps={{
        sx: {
          borderRadius: "16px 16px 0 0",
          maxHeight: "90vh",
          bgcolor: "background.paper",
          display: "flex",
          flexDirection: "column",
        },
      }}
    >
      {/* Drag handle */}
      <Box sx={{ display: "flex", justifyContent: "center", pt: 1.5, pb: 0.5, flexShrink: 0 }}>
        <Box sx={{ width: 36, height: 4, borderRadius: 2, bgcolor: "divider" }} />
      </Box>

      {/* Scrollable content */}
      <Box
        ref={scrollRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        sx={{ overflowY: "auto", px: 2, pb: 3 }}
      >
        <Typography variant="h5" gutterBottom sx={{ mt: 1 }}>
          Conditions Key
        </Typography>

        <Typography variant="h6" sx={{ mt: 1 }}>
          Status Colours
        </Typography>
        {(["Light Green", "Dark Green", "Amber", "Red", "No Paddling"] as Status[]).map((s) => (
          <StatusRow key={s} status={s} />
        ))}

        <Divider sx={{ my: 2 }} />

        <Typography variant="h6" gutterBottom>
          River Level
        </Typography>
        <ThresholdRow
          icon={<Water fontSize="small" />}
          label={`Below ${THRESHOLDS.RIVER_LEVEL_INITIAL_RAG_1} m — below the wooden landing stage`}
          description="River is low. Good launch conditions."
          chipLabel="Light Green"
          chipColor="success"
        />
        <ThresholdRow
          icon={<Water fontSize="small" />}
          label={`${THRESHOLDS.RIVER_LEVEL_INITIAL_RAG_1} – ${THRESHOLDS.RIVER_LEVEL_INITIAL_RAG_2} m — between landing stage and concrete step`}
          description="Slightly elevated. Still paddleable with care."
          chipLabel="Dark Green"
          chipColor="success"
        />
        <ThresholdRow
          icon={<Waves fontSize="small" />}
          label={`${THRESHOLDS.RIVER_LEVEL_INITIAL_RAG_2} – ${THRESHOLDS.RIVER_LEVEL_INITIAL_RAG_3} m — above the concrete step`}
          description="Moderately elevated. PFDs must be worn by all."
          chipLabel="Amber"
          chipColor="warning"
        />
        <ThresholdRow
          icon={<Tsunami fontSize="small" />}
          label={`${THRESHOLDS.RIVER_LEVEL_INITIAL_RAG_3} m and above — above 10 steps from the car park`}
          description="Significantly elevated. PFDs must be worn by all. No paddling for intermediates and below."
          chipLabel="Red"
          chipColor="error"
        />
        <ThresholdRow
          icon={<Flood fontSize="small" />}
          label={`${THRESHOLDS.RIVER_LEVEL_NO_PADDLING} m and above — boathouse flooding`}
          description="Dangerously high river. No paddling under any circumstances."
          chipLabel="No Paddling"
          chipColor="error"
        />

        <Divider sx={{ my: 2 }} />

        <Typography variant="h6" gutterBottom>
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

        <Divider sx={{ my: 2 }} />

        <Typography variant="h6" gutterBottom>
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

        <Divider sx={{ my: 2 }} />

        <Typography variant="h6" gutterBottom>
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
          const chipColor: "error" | "warning" | "success" = isBad
            ? "error"
            : isAtLimit
            ? "warning"
            : "success";
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

        <Divider sx={{ my: 2 }} />

        <Typography variant="h6" gutterBottom>
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
      </Box>
    </SwipeableDrawer>
  );
};

export default WeatherLegendModal;
