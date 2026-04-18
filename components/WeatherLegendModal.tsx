"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  Typography,
  Box,
  Divider,
  Chip,
} from "@mui/material";
import Slide from "@mui/material/Slide";
import { TransitionProps } from "@mui/material/transitions";
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

const Transition = React.forwardRef(function Transition(
  props: TransitionProps & { children: React.ReactElement },
  ref: React.Ref<unknown>
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

interface WeatherLegendModalProps {
  open: boolean;
  onClose: () => void;
}

const RAG_DESCRIPTIONS: Record<Status, string> = {
  "Light Green": "Ideal conditions — suitable for all paddlers.",
  "Dark Green": "Good conditions with minor elevated factors.",
  Amber: "Use caution — consult a coach if unsure.",
  Red: "Risky — not recommended for most paddlers.",
  "No Paddling": "Dangerous — do not paddle.",
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

  return (
    <Dialog
      open={open}
      onClose={onClose}
      TransitionComponent={Transition}
      fullWidth
      maxWidth="sm"
      PaperProps={{ sx: { borderRadius: 1, bgcolor: "background.paper" } }}
    >
      <DialogContent sx={{ p: 2 }}>
        <Typography variant="h5" gutterBottom>
          Conditions Key
        </Typography>

        {/* --- Status colours --- */}
        <Typography variant="h6" sx={{ mt: 1 }}>
          Status Colours
        </Typography>
        {(["Light Green", "Dark Green", "Amber", "Red", "No Paddling"] as Status[]).map(
          (s) => (
            <StatusRow key={s} status={s} />
          )
        )}

        <Divider sx={{ my: 2 }} />

        {/* --- River Level --- */}
        <Typography variant="h6" gutterBottom>
          River Level
        </Typography>
        <ThresholdRow
          icon={<Water fontSize="small" />}
          label={`Below ${THRESHOLDS.RIVER_LEVEL_INITIAL_RAG_1} m`}
          description="Low river — ideal launch conditions."
          chipLabel="Light Green"
          chipColor="success"
        />
        <ThresholdRow
          icon={<Water fontSize="small" />}
          label={`${THRESHOLDS.RIVER_LEVEL_INITIAL_RAG_1} – ${THRESHOLDS.RIVER_LEVEL_INITIAL_RAG_2} m`}
          description="Slightly elevated — still good conditions."
          chipLabel="Dark Green"
          chipColor="success"
        />
        <ThresholdRow
          icon={<Waves fontSize="small" />}
          label={`${THRESHOLDS.RIVER_LEVEL_INITIAL_RAG_2} – ${THRESHOLDS.RIVER_LEVEL_INITIAL_RAG_3} m`}
          description="Moderately elevated — increased caution needed."
          chipLabel="Amber"
          chipColor="warning"
        />
        <ThresholdRow
          icon={<Tsunami fontSize="small" />}
          label={`${THRESHOLDS.RIVER_LEVEL_INITIAL_RAG_3} m and above`}
          description="Significantly elevated — risky conditions."
          chipLabel="Red"
          chipColor="error"
        />
        <ThresholdRow
          icon={<Flood fontSize="small" />}
          label={`${THRESHOLDS.RIVER_LEVEL_NO_PADDLING} m and above`}
          description="Dangerously high — no paddling."
          chipLabel="No Paddling"
          chipColor="error"
        />

        <Divider sx={{ my: 2 }} />

        {/* --- Temperature --- */}
        <Typography variant="h6" gutterBottom>
          Temperature
        </Typography>
        <ThresholdRow
          icon={<Thermostat fontSize="small" />}
          label={`${THRESHOLDS.TEMP_HIGH} °C and above`}
          description="Warm — no temperature penalty applied."
          chipLabel="No penalty"
          chipColor="success"
        />
        <ThresholdRow
          icon={<Thermostat fontSize="small" />}
          label={`${THRESHOLDS.TEMP_MODERATE} – ${THRESHOLDS.TEMP_HIGH} °C`}
          description="Moderate cold — slight increase in risk rating."
          chipLabel="Moderate"
          chipColor="warning"
        />
        <ThresholdRow
          icon={<AcUnit fontSize="small" />}
          label={`Below ${THRESHOLDS.TEMP_MODERATE} °C`}
          description="Cold — cold water shock risk, significant rating increase."
          chipLabel="Cold"
          chipColor="error"
        />

        <Divider sx={{ my: 2 }} />

        {/* --- Wind --- */}
        <Typography variant="h6" gutterBottom>
          Wind
        </Typography>
        <ThresholdRow
          icon={<Air fontSize="small" />}
          label={`Below ${THRESHOLDS.WIND_HIGH} mph`}
          description="Calm — no wind penalty applied."
          chipLabel="Calm"
          chipColor="success"
        />
        <ThresholdRow
          icon={<Air fontSize="small" />}
          label={`${THRESHOLDS.WIND_HIGH} mph and above`}
          description="High winds — increases risk rating."
          chipLabel="High winds"
          chipColor="error"
        />

        <Divider sx={{ my: 2 }} />

        {/* --- Visibility --- */}
        <Typography variant="h6" gutterBottom>
          Visibility
        </Typography>
        {visKeys.map((key) => {
          const { min, desc } = VISIBILITY_DESCRIPTIONS[key];
          const nextKey = visKeys[visKeys.indexOf(key) - 1];
          const max = nextKey ? VISIBILITY_DESCRIPTIONS[nextKey].min : null;
          const range = max ? `${(min / 1000).toFixed(0)}–${(max / 1000).toFixed(0)} km` : `Over ${(min / 1000).toFixed(0)} km`;
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
                  ? "Fog detected — adds +1 to risk rating."
                  : isAtLimit
                  ? "Borderline poor — monitor conditions."
                  : "Acceptable visibility."
              }
              chipLabel={desc}
              chipColor={chipColor}
            />
          );
        })}

        <Divider sx={{ my: 2 }} />

        {/* --- Other factors --- */}
        <Typography variant="h6" gutterBottom>
          Other Factors
        </Typography>
        <ThresholdRow
          icon={<WaterDrop fontSize="small" />}
          label="Rain"
          description="Rain combined with cool temperatures increases risk rating."
          chipLabel="Raises rating"
          chipColor="warning"
        />
        <ThresholdRow
          icon={<NightsStay fontSize="small" />}
          label="Dark"
          description="Paddling after dark adds +1 to risk rating."
          chipLabel="+1 rating"
          chipColor="warning"
        />
        <ThresholdRow
          icon={<Foggy fontSize="small" />}
          label="Fog"
          description="Poor visibility adds +1 to risk rating."
          chipLabel="+1 rating"
          chipColor="warning"
        />
        <ThresholdRow
          icon={<Thunderstorm fontSize="small" />}
          label="Thunderstorm"
          description="Any thunderstorm risk overrides all — no paddling."
          chipLabel="No Paddling"
          chipColor="error"
        />
      </DialogContent>
    </Dialog>
  );
};

export default WeatherLegendModal;
