"use client";

import React, { useState, useRef, useLayoutEffect } from "react";
import {
  Drawer,
  Typography,
  FormControl,
  Select,
  MenuItem,
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
  FormControlLabel,
  Switch,
  Tabs,
  Tab,
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
import { SETTINGS_CHANGED_EVENT } from "@/components/ConditionsBriefing";
import { PADDLER_LEVEL_CHANGED_EVENT } from "@/components/PaddlingMatrixCard";
import { PaddlerType, Status } from "@/types";
import {
  RAG_STATUS_UI,
  THRESHOLDS,
  VISIBILITY_DESCRIPTIONS,
  USEFUL_LINKS,
  RAG_DESCRIPTIONS,
  RIVER_LEVEL_BAND_DESCRIPTIONS,
  CONTACT_EMAIL,
  CLUB_NAME,
} from "@/lib/config";
import { formatRiverLevel } from "@/lib/units";
import { STORAGE_KEYS } from "@/lib/storageKeys";
import { m3Duration, m3Easing } from "@/lib/m3-palette";

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
}

const StatusRow: React.FC<{ status: Status }> = ({ status }) => {
  const ui = RAG_STATUS_UI[status];
  const Icon = ui.icon;
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, py: 1 }}>
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

// YIQ perceptual brightness – returns black or white for readable contrast
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

const ThresholdRow: React.FC<ThresholdRowProps> = ({
  icon,
  label,
  description,
  chipLabel,
  chipColor,
  ragColor,
}) => (
  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, py: 0.5 }}>
    <Box
      sx={{
        color: "text.secondary",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        width: 20,
      }}
    >
      {icon}
    </Box>
    <Box sx={{ flex: 1 }}>
      <Typography variant="body2" sx={{ fontWeight: 600 }}>
        {label}
      </Typography>
      <Typography variant="caption" color="text.secondary">
        {description}
      </Typography>
    </Box>
    {chipLabel &&
      (ragColor ? (
        <Chip
          label={chipLabel}
          size="small"
          sx={{
            backgroundColor: ragColor,
            color: contrastText(ragColor),
            fontWeight: 500,
          }}
        />
      ) : (
        <Chip label={chipLabel} color={chipColor ?? "default"} size="small" />
      ))}
  </Box>
);

const SettingsModal: React.FC<SettingsModalProps> = ({ open, onClose }) => {
  const [activeTab, setActiveTabState] = useState<"settings" | "info">(
    "settings"
  );
  const { themeMode, setThemeMode } = useAppTheme();
  const [paddlerLevel, setPaddlerLevel] = useState<PaddlerType | "">(() =>
    typeof window !== "undefined"
      ? ((localStorage.getItem(
          STORAGE_KEYS.PADDLER_LEVEL
        ) as PaddlerType | null) ?? "")
      : ""
  );
  const [autoSummarise, setAutoSummarise] = useState(
    () =>
      typeof window !== "undefined" &&
      localStorage.getItem(STORAGE_KEYS.AUTO_SUMMARISE) === "true"
  );

  const handleAutoSummariseChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const val = e.target.checked;
    setAutoSummarise(val);
    localStorage.setItem(STORAGE_KEYS.AUTO_SUMMARISE, val ? "true" : "false");
    window.dispatchEvent(new Event(SETTINGS_CHANGED_EVENT));
  };
  const visKeys = Object.keys(
    VISIBILITY_DESCRIPTIONS
  ) as (keyof typeof VISIBILITY_DESCRIPTIONS)[];

  const handleLevelChange = (event: SelectChangeEvent<PaddlerType | "">) => {
    const level = event.target.value as PaddlerType | "";
    setPaddlerLevel(level);
    if (level) localStorage.setItem(STORAGE_KEYS.PADDLER_LEVEL, level);
    else localStorage.removeItem(STORAGE_KEYS.PADDLER_LEVEL);
    window.dispatchEvent(new Event(PADDLER_LEVEL_CHANGED_EVENT));
  };

  const paddlerTypes: PaddlerType[] = [
    "Beginner",
    "Improver",
    "Intermediate",
    "Independent",
  ];

  // The Info tab (links + the long Conditions Key accordion + About) is
  // noticeably taller than Settings, so switching tabs used to snap the
  // whole drawer to the new height. Animate the wrapper to the incoming
  // tab's height instead - only while switching tabs, though: the wrapper
  // sits at "auto" the rest of the time, so in-tab height changes (e.g.
  // expanding the accordion) just track its own Collapse animation for
  // free via ordinary block layout, no JS measurement needed.
  //
  // A block-level wrapper reflows to fit new content the instant it's
  // committed, before any effect gets a chance to read the "old" height -
  // so the outgoing height has to be captured synchronously in the click
  // handler, before the tab switch, rather than reactively afterwards.
  const wrapperRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [panelHeight, setPanelHeight] = useState<number | "auto">("auto");

  const handleTabChange = (
    _: React.SyntheticEvent,
    val: "settings" | "info"
  ) => {
    if (wrapperRef.current) {
      setPanelHeight(wrapperRef.current.getBoundingClientRect().height);
    }
    setActiveTabState(val);
  };

  useLayoutEffect(() => {
    const wrapper = wrapperRef.current;
    const panel = panelRef.current;
    if (!wrapper || !panel) return;
    // Force the browser to flush the frozen height set above into actual
    // layout before changing it again below - otherwise both writes land
    // in the same frame and there's nothing for the CSS transition to
    // animate from.
    void wrapper.getBoundingClientRect();
    setPanelHeight(panel.scrollHeight);
  }, [activeTab]);

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
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: 2,
          pt: 2,
          pb: 1,
          flexShrink: 0,
        }}
      >
        <Typography variant="h5">Settings</Typography>
        <IconButton onClick={onClose} edge="end" aria-label="close">
          <CloseIcon />
        </IconButton>
      </Box>

      <Tabs
        value={activeTab}
        onChange={handleTabChange}
        variant="fullWidth"
        sx={{ px: 2, flexShrink: 0, borderBottom: 1, borderColor: "divider" }}
      >
        <Tab value="settings" label="Settings" />
        <Tab value="info" label="Info" />
      </Tabs>

      <Box
        ref={wrapperRef}
        onTransitionEnd={(e) => {
          // Once settled, release back to "auto" so it doesn't need a fresh
          // JS measurement to track subsequent in-tab height changes.
          if (e.target === wrapperRef.current && e.propertyName === "height") {
            setPanelHeight("auto");
          }
        }}
        sx={{
          overflowY: "auto",
          transition: `height ${m3Duration.medium2}ms ${m3Easing.standard}`,
        }}
        style={{ height: panelHeight }}
      >
        <Box ref={panelRef} sx={{ px: 2, pb: 3 }}>
          {activeTab === "settings" && (
            <Box>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Theme
              </Typography>
              <ToggleButtonGroup
                value={themeMode}
                exclusive
                onChange={(_, val: ThemeMode | null) => {
                  if (val) setThemeMode(val);
                }}
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
                  <MenuItem value="">
                    <em>No preference</em>
                  </MenuItem>
                  {paddlerTypes.map((level) => (
                    <MenuItem key={level} value={level}>
                      {level}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {process.env.NEXT_PUBLIC_FEATURE_AI_SUMMARY !== "false" && (
                <>
                  <Divider sx={{ my: 2 }} />

                  <Typography variant="h6" gutterBottom>
                    AI Summary
                  </Typography>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={autoSummarise}
                        onChange={handleAutoSummariseChange}
                      />
                    }
                    label="Auto-summarise conditions on load"
                  />
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    display="block"
                    sx={{ mt: 0.5 }}
                  >
                    When off, tap &ldquo;Generate AI Summary&rdquo; inside the
                    status card to generate one on demand.
                  </Typography>
                </>
              )}
            </Box>
          )}

          {activeTab === "info" && (
            <Box>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
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
                        theme.palette.mode === "dark"
                          ? "common.white"
                          : "primary.main",
                    }}
                  >
                    <Typography sx={{ flexGrow: 1 }}>{link.name}</Typography>
                    <OpenInNewIcon fontSize="small" />
                  </ListItem>
                ))}
              </List>

              <Divider sx={{ my: 2 }} />

              <Accordion
                disableGutters
                elevation={0}
                sx={{ "&:before": { display: "none" }, mx: -2 }}
              >
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon />}
                  sx={{ px: 2 }}
                >
                  <Typography variant="h6">Conditions Key</Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ px: 2, pt: 0 }}>
                  <Typography
                    variant="subtitle2"
                    color="text.secondary"
                    gutterBottom
                  >
                    Status Colours
                  </Typography>
                  {(
                    [
                      "Light Green",
                      "Dark Green",
                      "Amber",
                      "Red",
                      "No Paddling",
                    ] as Status[]
                  ).map((s) => (
                    <StatusRow key={s} status={s} />
                  ))}

                  <Typography
                    variant="subtitle2"
                    color="text.secondary"
                    gutterBottom
                    sx={{ mt: 2 }}
                  >
                    River Level
                  </Typography>
                  <ThresholdRow
                    icon={<Water fontSize="small" />}
                    label={`Below ${formatRiverLevel(THRESHOLDS.RIVER_LEVEL_INITIAL_RAG_1)}`}
                    description={RIVER_LEVEL_BAND_DESCRIPTIONS.belowRag1}
                    chipLabel="Light Green"
                    ragColor={RAG_STATUS_UI["Light Green"].color}
                  />
                  <ThresholdRow
                    icon={<Water fontSize="small" />}
                    label={`${formatRiverLevel(THRESHOLDS.RIVER_LEVEL_INITIAL_RAG_1)}–${formatRiverLevel(THRESHOLDS.RIVER_LEVEL_INITIAL_RAG_2)}`}
                    description={RIVER_LEVEL_BAND_DESCRIPTIONS.rag1ToRag2}
                    chipLabel="Dark Green"
                    ragColor={RAG_STATUS_UI["Dark Green"].color}
                  />
                  <ThresholdRow
                    icon={<Waves fontSize="small" />}
                    label={`${formatRiverLevel(THRESHOLDS.RIVER_LEVEL_INITIAL_RAG_2)}–${formatRiverLevel(THRESHOLDS.RIVER_LEVEL_INITIAL_RAG_3)}`}
                    description={RIVER_LEVEL_BAND_DESCRIPTIONS.rag2ToRag3}
                    chipLabel="Amber"
                    ragColor={RAG_STATUS_UI["Amber"].color}
                  />
                  <ThresholdRow
                    icon={<Tsunami fontSize="small" />}
                    label={`${formatRiverLevel(THRESHOLDS.RIVER_LEVEL_INITIAL_RAG_3)} and above`}
                    description={RIVER_LEVEL_BAND_DESCRIPTIONS.rag3Plus}
                    chipLabel="Red"
                    ragColor={RAG_STATUS_UI["Red"].color}
                  />
                  <ThresholdRow
                    icon={<Flood fontSize="small" />}
                    label={`${formatRiverLevel(THRESHOLDS.RIVER_LEVEL_NO_PADDLING)} and above`}
                    description={RIVER_LEVEL_BAND_DESCRIPTIONS.noPaddling}
                    chipLabel="No Paddling"
                    ragColor={RAG_STATUS_UI["No Paddling"].color}
                  />

                  <Typography
                    variant="subtitle2"
                    color="text.secondary"
                    gutterBottom
                    sx={{ mt: 2 }}
                  >
                    Temperature
                  </Typography>
                  <ThresholdRow
                    icon={<Thermostat fontSize="small" />}
                    label={`${THRESHOLDS.TEMP_HIGH}°C and above`}
                    description="Warm. No temperature penalty applied."
                    chipLabel="No penalty"
                    chipColor="success"
                  />
                  <ThresholdRow
                    icon={<Thermostat fontSize="small" />}
                    label={`${THRESHOLDS.TEMP_MODERATE}–${THRESHOLDS.TEMP_HIGH}°C`}
                    description="Cool. Raises the base risk rating. Rain also becomes a factor."
                    chipLabel="Raises rating"
                    chipColor="warning"
                  />
                  <ThresholdRow
                    icon={<AcUnit fontSize="small" />}
                    label={`Below ${THRESHOLDS.TEMP_MODERATE}°C`}
                    description="Cold air, and likely cold water too - capsizing is far more dangerous with nowhere warm to recover. Significant increase in risk rating."
                    chipLabel="Cold"
                    chipColor="error"
                  />

                  <Typography
                    variant="subtitle2"
                    color="text.secondary"
                    gutterBottom
                    sx={{ mt: 2 }}
                  >
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
                  <ThresholdRow
                    icon={
                      <Box
                        sx={{
                          width: 10,
                          height: 10,
                          borderRadius: "50%",
                          backgroundColor: "text.secondary",
                        }}
                      />
                    }
                    label={`Gust dot (${THRESHOLDS.WIND_GUST_NOTABLE} mph+)`}
                    description="Not a rating change - shown for awareness. Colour shows what the rating would be if the gust were sustained wind."
                    chipLabel="Be Aware"
                    chipColor="default"
                  />

                  <Typography
                    variant="subtitle2"
                    color="text.secondary"
                    gutterBottom
                    sx={{ mt: 2 }}
                  >
                    Visibility
                  </Typography>
                  {visKeys.map((key) => {
                    const { min, desc } = VISIBILITY_DESCRIPTIONS[key];
                    const nextKey = visKeys[visKeys.indexOf(key) - 1];
                    const max = nextKey
                      ? VISIBILITY_DESCRIPTIONS[nextKey].min
                      : null;
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
                        icon={
                          isBad ? (
                            <Foggy fontSize="small" />
                          ) : (
                            <Visibility fontSize="small" />
                          )
                        }
                        label={`${desc} (${range})`}
                        description={
                          isBad
                            ? "Fog conditions – raises Green to Amber, and Amber to Red."
                            : isAtLimit
                              ? "Poor visibility – borderline fog threshold."
                              : "Acceptable visibility."
                        }
                        chipLabel={desc}
                        chipColor={chipColor}
                      />
                    );
                  })}

                  <Typography
                    variant="subtitle2"
                    color="text.secondary"
                    gutterBottom
                    sx={{ mt: 2 }}
                  >
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
                    icon={<WaterDrop fontSize="small" />}
                    label={`Rain at ${THRESHOLDS.TEMP_HIGH}°C+`}
                    description="Not a rating change - shown for awareness. Lets you know it's raining, even though rain doesn't count against the rating once it's this warm."
                    chipLabel="Be Aware"
                    chipColor="default"
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
                    description="No paddling when thunder is near – overrides all other conditions."
                    chipLabel="No Paddling"
                    chipColor="error"
                  />
                </AccordionDetails>
              </Accordion>

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
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ mt: 2, display: "block" }}
              >
                Built for {CLUB_NAME}. This is a hobby project, so there might
                be mistakes. Always check conditions yourself and talk to
                coaches or experienced paddlers before heading out.{" "}
                <Link href={`mailto:${CONTACT_EMAIL}`} color="inherit">
                  Feedback welcome here!
                </Link>
              </Typography>
            </Box>
          )}
        </Box>
      </Box>
    </Drawer>
  );
};

export default SettingsModal;
