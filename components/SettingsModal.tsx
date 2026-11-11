"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
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
  Visibility,
  WaterDrop,
  NightsStay,
  Thunderstorm,
  Foggy,
} from "@mui/icons-material";
import { useAppTheme, ThemeMode } from "@/lib/ThemeContext";
import { useShowNightHours } from "@/lib/useShowNightHours";
import { PaddlerType, StatusStep } from "@/types";
import {
  STATUS_STEPS,
  APP_NAME,
  THRESHOLDS,
  VISIBILITY_DESCRIPTIONS,
  USEFUL_LINKS,
  FEEDBACK_URL,
  CLUB_NAME,
  DISCLAIMER,
  RULES,
  CONDITIONS_KEY_WEATHER,
  CONDITIONS_REPORT_ENABLED,
} from "@/lib/config";
import { statusUi, TOP_STEP } from "@/lib/rag";
import { paddlerTypes, toPaddlerLevel } from "@/lib/paddlingMatrix";
import { formatRiverLevel } from "@/lib/units";
import {
  STORAGE_KEYS,
  SETTINGS_CHANGED_EVENT,
  PADDLER_LEVEL_CHANGED_EVENT,
} from "@/lib/storageKeys";
import { m3Duration, m3Easing, m3Spring, spring } from "@/lib/m3-palette";
import SlidingToggleButtonGroup from "./SlidingToggleButtonGroup";

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
}

const STEPS: readonly StatusStep[] = STATUS_STEPS;

const StatusRow: React.FC<{ step: StatusStep }> = ({ step: ui }) => {
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
          {ui.name}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {ui.description}
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
        // --chip-bg/--chip-fg rather than backgroundColor/color: see the
        // MuiChip override in lib/themes.ts for why the direct properties
        // lose to the theme in dark mode.
        <Chip
          label={chipLabel}
          size="small"
          sx={{
            "--chip-bg": ragColor,
            "--chip-fg": contrastText(ragColor),
            fontWeight: 500,
          }}
        />
      ) : (
        <Chip label={chipLabel} color={chipColor ?? "default"} size="small" />
      ))}
  </Box>
);

// How far down the sheet has to be dragged to dismiss on release, as a share
// of its own height, and the flick speed that dismisses regardless of
// distance. A short, fast swipe reads as "get rid of this" even when it
// covered barely any ground, which is why velocity gets its own threshold.
const DISMISS_DISTANCE_RATIO = 0.3;
const DISMISS_VELOCITY_PX_PER_MS = 0.5;

// An inline link in the About text, opened in a new tab.
const SourceLink: React.FC<{ href: string; children: React.ReactNode }> = ({
  href,
  children,
}) => (
  <Link href={href} target="_blank" rel="noopener noreferrer" color="inherit">
    {children}
  </Link>
);

const SettingsModal: React.FC<SettingsModalProps> = ({ open, onClose }) => {
  const [activeTab, setActiveTab] = useState<"settings" | "info">("settings");
  // Both tab panels stay mounted (see the grid below), so the Conditions Key
  // accordion's expanded state would otherwise persist in the background -
  // leaving Settings sized to match an accordion the user can't even see.
  // Resetting it on every tab change keeps each visit to Info predictable
  // and avoids that phantom height.
  const [conditionsKeyOpen, setConditionsKeyOpen] = useState(false);
  const { themeMode, setThemeMode } = useAppTheme();
  const [paddlerLevel, setPaddlerLevel] = useState<PaddlerType | "">(() =>
    typeof window !== "undefined"
      ? (toPaddlerLevel(localStorage.getItem(STORAGE_KEYS.PADDLER_LEVEL)) ?? "")
      : ""
  );
  const [autoSummarise, setAutoSummarise] = useState(
    () =>
      typeof window !== "undefined" &&
      localStorage.getItem(STORAGE_KEYS.AUTO_SUMMARISE) === "true"
  );

  const [showNightHours, setShowNightHours] = useShowNightHours();

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

  // --- Drag to dismiss ---
  //
  // The sheet grew a drag handle, and a handle that doesn't drag is a label
  // for a gesture that isn't there. The transform is written straight to the
  // node rather than held in state: this runs on every pointermove, and a
  // React render per frame is how a drag ends up trailing the finger.
  //
  // Only the header drags. The panels below it scroll, and a sheet that
  // dismisses when you try to scroll its contents is worse than one that
  // doesn't drag at all.
  const paperRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<{
    startY: number;
    startedAt: number;
    dy: number;
  } | null>(null);

  const setSheetOffset = useCallback((y: number, animate: boolean) => {
    const paper = paperRef.current;
    if (!paper) return;
    paper.style.transition = animate
      ? spring("transform", m3Spring.spatialDefault)
      : "none";
    paper.style.transform = y > 0 ? `translateY(${y}px)` : "";
  }, []);

  // Clear any leftover offset when the sheet reopens, so a sheet flung shut
  // doesn't come back part-way down the screen. MUI's Slide writes its own
  // transform during the open and close transitions and overwrites whatever
  // is here, which is what makes a dismissing drag hand off to the exit
  // animation from wherever the finger left it.
  useEffect(() => {
    if (open) setSheetOffset(0, false);
  }, [open, setSheetOffset]);

  const handleDragStart = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    dragRef.current = {
      startY: e.clientY,
      startedAt: performance.now(),
      dy: 0,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handleDragMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag) return;
    // Downward only. Dragging up would lift the sheet off the bottom of the
    // screen and expose the page behind it.
    drag.dy = Math.max(0, e.clientY - drag.startY);
    setSheetOffset(drag.dy, false);
  };

  const handleDragEnd = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag) return;
    dragRef.current = null;
    e.currentTarget.releasePointerCapture?.(e.pointerId);

    const height = paperRef.current?.offsetHeight ?? 0;
    const velocity = drag.dy / Math.max(1, performance.now() - drag.startedAt);
    if (
      drag.dy > height * DISMISS_DISTANCE_RATIO ||
      velocity > DISMISS_VELOCITY_PX_PER_MS
    ) {
      onClose();
    } else {
      setSheetOffset(0, true);
    }
  };

  const [prebuilt, setPrebuilt] = useState(false);
  useEffect(() => {
    const build = () => setPrebuilt(true);
    // Safari has no requestIdleCallback; a few seconds after load stands in.
    if (typeof window.requestIdleCallback === "function") {
      const id = window.requestIdleCallback(build, { timeout: 5000 });
      return () => window.cancelIdleCallback(id);
    }
    const id = window.setTimeout(build, 3000);
    return () => window.clearTimeout(id);
  }, []);

  return (
    <Drawer
      anchor="bottom"
      open={open}
      onClose={onClose}
      // Built ahead of time once the page is idle, then kept, so opening is
      // only the slide. Built on the tap, the whole sheet - and every style
      // Emotion has to insert for it - held the first frame for ~200-450 ms
      // on a phone-speed CPU.
      ModalProps={{ keepMounted: prebuilt }}
      slotProps={{
        paper: {
          ref: paperRef,
          sx: {
            borderRadius: "16px 16px 0 0",
            // dvh, not vh: in a browser tab vh is the viewport with the URL
            // bar retracted, so 90vh can be taller than what's on screen.
            maxHeight: "90dvh",
            bgcolor: "background.paper",
            backgroundImage: "none",
            display: "flex",
            flexDirection: "column",
            // The drawer is portalled to <body>, so it sits outside the
            // safe-area frame in app/layout.tsx and has to inset itself. It
            // is anchored to the bottom of the screen, which on an installed
            // iOS app is behind the home indicator.
            pb: "env(safe-area-inset-bottom)",
          },
        },
      }}
    >
      <Box
        onPointerDown={handleDragStart}
        onPointerMove={handleDragMove}
        onPointerUp={handleDragEnd}
        onPointerCancel={handleDragEnd}
        sx={{
          flexShrink: 0,
          // Without this the browser claims vertical drags for scrolling
          // before the pointermove handler ever sees them.
          touchAction: "none",
          cursor: "grab",
          "&:active": { cursor: "grabbing" },
        }}
      >
        {/* M3's 32x4dp drag handle. Decorative rather than a control: the
            close button beside it and Escape both already dismiss the sheet,
            so announcing a third way to a screen reader adds noise, not a
            route. */}
        <Box
          aria-hidden
          sx={{
            width: 32,
            height: 4,
            mx: "auto",
            mt: 1.5,
            mb: 0.5,
            borderRadius: 9999,
            backgroundColor: "surfaces.onVariant",
            opacity: 0.4,
          }}
        />
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            px: 2,
            pt: 1,
            pb: 1,
          }}
        >
          <Typography variant="h5">Settings</Typography>
          <IconButton
            onClick={onClose}
            edge="end"
            aria-label="close"
            // The button sits inside the drag region, so its own presses have
            // to stay out of the drag: without this, pressing close starts a
            // zero-distance drag that captures the pointer and swallows the
            // click.
            onPointerDown={(e) => e.stopPropagation()}
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </Box>

      <Tabs
        value={activeTab}
        onChange={(_, val: "settings" | "info") => {
          setActiveTab(val);
          setConditionsKeyOpen(false);
        }}
        variant="fullWidth"
        sx={{ px: 2, flexShrink: 0, borderBottom: 1, borderColor: "divider" }}
      >
        <Tab value="settings" label="Settings" />
        <Tab value="info" label="Info" />
      </Tabs>

      {/* Both panels are always mounted, stacked in the same grid cell, so
          the row's auto-sized height is the taller of the two - switching
          tabs never resizes the drawer, it just crossfades which panel is
          visible. Simpler and steadier than animating the height itself.

          The active panel's visibility is "inherit" rather than "visible":
          the drawer is kept mounted while closed (`prebuilt` above), and an
          explicit "visible" overrides the closed drawer's own hidden -
          leaving that panel's controls in the tab order while it's shut. */}
      <Box sx={{ display: "grid", overflowY: "auto" }}>
        <Box
          aria-hidden={activeTab !== "settings"}
          sx={{
            gridArea: "1 / 1",
            px: 2,
            pb: 3,
            opacity: activeTab === "settings" ? 1 : 0,
            pointerEvents: activeTab === "settings" ? "auto" : "none",
            transition:
              activeTab === "settings"
                ? `opacity ${m3Duration.short4}ms ${m3Easing.standard}`
                : `opacity ${m3Duration.short4}ms ${m3Easing.standard}, visibility 0s linear ${m3Duration.short4}ms`,
            visibility: activeTab === "settings" ? "inherit" : "hidden",
          }}
        >
          <Box>
            <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
              Theme
            </Typography>
            <SlidingToggleButtonGroup
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
            </SlidingToggleButtonGroup>

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

            {CONDITIONS_REPORT_ENABLED && (
              <>
                <Divider sx={{ my: 2 }} />

                <Typography variant="h6" gutterBottom>
                  Conditions Report
                </Typography>
                <FormControlLabel
                  control={
                    <Switch
                      checked={autoSummarise}
                      onChange={handleAutoSummariseChange}
                    />
                  }
                  label="Show the conditions report on load"
                />
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: "block", mt: 0.5 }}
                >
                  When off, tap &ldquo;Show Conditions Report&rdquo; inside the
                  status card to get one on demand.
                </Typography>
              </>
            )}

            <Divider sx={{ my: 2 }} />

            <Typography variant="h6" gutterBottom>
              Paddling Forecast
            </Typography>
            <FormControlLabel
              control={
                <Switch
                  checked={showNightHours}
                  onChange={(e) => setShowNightHours(e.target.checked)}
                />
              }
              label="Show night hours"
            />
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: "block", mt: 0.5 }}
            >
              When off, the forecast chart shows daylight hours only.
            </Typography>
          </Box>
        </Box>

        <Box
          aria-hidden={activeTab !== "info"}
          sx={{
            gridArea: "1 / 1",
            px: 2,
            pb: 3,
            opacity: activeTab === "info" ? 1 : 0,
            pointerEvents: activeTab === "info" ? "auto" : "none",
            transition:
              activeTab === "info"
                ? `opacity ${m3Duration.short4}ms ${m3Easing.standard}`
                : `opacity ${m3Duration.short4}ms ${m3Easing.standard}, visibility 0s linear ${m3Duration.short4}ms`,
            visibility: activeTab === "info" ? "inherit" : "hidden",
          }}
        >
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
                  // `primary` is the M3 role for a link, and the dark scheme's
                  // primary is already a light blue that clears contrast on
                  // the drawer surface - so the previous common.white branch
                  // for dark mode was both off-token and unnecessary.
                  sx={{ pl: 0, color: "primary.main" }}
                >
                  <Typography sx={{ flexGrow: 1 }}>{link.name}</Typography>
                  <OpenInNewIcon fontSize="small" />
                </ListItem>
              ))}
            </List>

            <Divider sx={{ my: 2 }} />

            <Accordion
              expanded={conditionsKeyOpen}
              onChange={(_, isExpanded) => setConditionsKeyOpen(isExpanded)}
              disableGutters
              elevation={0}
              sx={{ "&:before": { display: "none" }, mx: -2 }}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ px: 2 }}>
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
                {STEPS.map((step) => (
                  <StatusRow key={step.name} step={step} />
                ))}

                <Typography
                  variant="subtitle2"
                  color="text.secondary"
                  gutterBottom
                  sx={{ mt: 2 }}
                >
                  River Level
                </Typography>
                {STEPS.map((step, i) => {
                  const next = STEPS[i + 1];
                  const BandIcon = step.reasonIcon ?? Water;
                  return (
                    <ThresholdRow
                      key={step.name}
                      icon={<BandIcon fontSize="small" />}
                      label={
                        i === 0
                          ? `Below ${formatRiverLevel(next.fromLevel)}`
                          : next
                            ? `${formatRiverLevel(step.fromLevel)}–${formatRiverLevel(next.fromLevel)}`
                            : `${formatRiverLevel(step.fromLevel)} and above`
                      }
                      description={step.riverDescription}
                      chipLabel={step.name}
                      ragColor={step.color}
                    />
                  );
                })}

                {RULES.WEATHER_TABLE && (
                  <>
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
                      description={CONDITIONS_KEY_WEATHER.tempWarm}
                      chipLabel="No Penalty"
                      chipColor="success"
                    />
                    <ThresholdRow
                      icon={<Thermostat fontSize="small" />}
                      label={`Over ${THRESHOLDS.TEMP_MODERATE}°C, below ${THRESHOLDS.TEMP_HIGH}°C`}
                      description={CONDITIONS_KEY_WEATHER.tempCool}
                      chipLabel="Raises Rating"
                      chipColor="warning"
                    />
                    <ThresholdRow
                      icon={<AcUnit fontSize="small" />}
                      label={`${THRESHOLDS.TEMP_MODERATE}°C and below`}
                      description={CONDITIONS_KEY_WEATHER.tempCold}
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
                      description={CONDITIONS_KEY_WEATHER.windCalm}
                      chipLabel="Calm"
                      chipColor="success"
                    />
                    <ThresholdRow
                      icon={<Air fontSize="small" />}
                      label={`${THRESHOLDS.WIND_HIGH} mph and above`}
                      description={CONDITIONS_KEY_WEATHER.windHigh}
                      chipLabel="Raises Rating"
                      chipColor="error"
                    />
                  </>
                )}
                {RULES.FOG && (
                  <>
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
                          // The chip already names the band, so the label is just
                          // its range - like the wind rows' "Below 15 mph".
                          label={range}
                          description={
                            isBad
                              ? `Fog conditions. ${CONDITIONS_KEY_WEATHER.fog}`
                              : isAtLimit
                                ? "Poor visibility – borderline fog threshold."
                                : "Acceptable visibility."
                          }
                          chipLabel={desc}
                          chipColor={chipColor}
                        />
                      );
                    })}
                  </>
                )}
                {(RULES.WEATHER_TABLE ||
                  RULES.DARKNESS ||
                  RULES.FOG ||
                  RULES.THUNDERSTORMS) && (
                  <Typography
                    variant="subtitle2"
                    color="text.secondary"
                    gutterBottom
                    sx={{ mt: 2 }}
                  >
                    Other Factors
                  </Typography>
                )}
                {RULES.WEATHER_TABLE && (
                  <>
                    <ThresholdRow
                      icon={<WaterDrop fontSize="small" />}
                      label={`Rain below ${THRESHOLDS.TEMP_HIGH}°C`}
                      description={CONDITIONS_KEY_WEATHER.rainCool}
                      chipLabel="Raises Rating"
                      chipColor="warning"
                    />
                    {CONDITIONS_KEY_WEATHER.rainCold && (
                      <>
                        <ThresholdRow
                          icon={<WaterDrop fontSize="small" />}
                          label={`Rain at ${THRESHOLDS.TEMP_MODERATE}°C and below`}
                          description={CONDITIONS_KEY_WEATHER.rainCold}
                          chipLabel="Stricter Than Rules"
                          chipColor="default"
                        />
                      </>
                    )}
                    <ThresholdRow
                      icon={<WaterDrop fontSize="small" />}
                      label={`Rain at ${THRESHOLDS.TEMP_HIGH}°C+`}
                      description={CONDITIONS_KEY_WEATHER.rainWarm}
                      chipLabel="No Change"
                      chipColor="default"
                    />
                  </>
                )}
                {RULES.DARKNESS && (
                  <>
                    <ThresholdRow
                      icon={<NightsStay fontSize="small" />}
                      label="Dark"
                      description={CONDITIONS_KEY_WEATHER.dark}
                      chipLabel="Raises Rating"
                      chipColor="warning"
                    />
                  </>
                )}
                {RULES.FOG && (
                  <>
                    <ThresholdRow
                      icon={<Foggy fontSize="small" />}
                      label="Fog"
                      description={CONDITIONS_KEY_WEATHER.fog}
                      chipLabel="Raises Rating"
                      chipColor="warning"
                    />
                  </>
                )}
                {RULES.THUNDERSTORMS && (
                  <>
                    <ThresholdRow
                      icon={<Thunderstorm fontSize="small" />}
                      label="Thunderstorm"
                      description={CONDITIONS_KEY_WEATHER.thunderstorm}
                      chipLabel={TOP_STEP}
                      ragColor={statusUi(TOP_STEP).color}
                    />
                  </>
                )}
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
              <Typography>{APP_NAME} Version</Typography>
              <Typography>
                {process.env.NEXT_PUBLIC_APP_VERSION || "N/A"}
              </Typography>
            </Box>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ mt: 2, display: "block" }}
            >
              {DISCLAIMER}
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ mt: 1, display: "block" }}
            >
              Built for {CLUB_NAME}.{" "}
              <Link
                href={FEEDBACK_URL}
                target="_blank"
                rel="noopener noreferrer"
                color="inherit"
              >
                Feedback welcome here!
              </Link>
            </Typography>
            {/* Required by the sources' licences: the Environment Agency's
                Open Government Licence asks for this exact statement, and
                Open-Meteo's CC BY 4.0 for a credit. */}
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ mt: 1, display: "block" }}
            >
              This uses Environment Agency flood and river level data from the
              real-time data API (Beta), under the{" "}
              <SourceLink href="https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/">
                Open Government Licence
              </SourceLink>
              . Weather data by{" "}
              <SourceLink href="https://open-meteo.com/">Open-Meteo</SourceLink>{" "}
              (
              <SourceLink href="https://creativecommons.org/licenses/by/4.0/">
                CC BY 4.0
              </SourceLink>
              ). Weather warnings from the{" "}
              <SourceLink href="https://www.metoffice.gov.uk/weather/warnings-and-advice/uk-warnings">
                Met Office
              </SourceLink>
              .
            </Typography>
          </Box>
        </Box>
      </Box>
    </Drawer>
  );
};

export default SettingsModal;
