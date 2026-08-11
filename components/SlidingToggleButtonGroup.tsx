"use client";

import React, { useLayoutEffect, useRef, useState } from "react";
import { Box, ToggleButtonGroup, ToggleButtonGroupProps } from "@mui/material";
import { m3Duration, m3Easing } from "@/lib/m3-palette";

// Matches the MuiToggleButtonGroup theme override in lib/themes.ts (padding: 4).
const GROUP_PADDING = 4;

interface PillRect {
  left: number;
  width: number;
}

// Drop-in replacement for MUI's ToggleButtonGroup that adds a sliding pill
// behind the selected button, instead of the selected button's background
// just flipping on instantly. Used anywhere a segmented control picks one
// of several options (theme, time range, forecast day).
const SlidingToggleButtonGroup = React.forwardRef<
  HTMLDivElement,
  ToggleButtonGroupProps
>(({ value, children, sx, ...props }, forwardedRef) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pill, setPill] = useState<PillRect | null>(null);

  const measure = () => {
    const container = containerRef.current;
    const selected = container?.querySelector<HTMLElement>(".Mui-selected");
    setPill(
      selected
        ? { left: selected.offsetLeft, width: selected.offsetWidth }
        : null
    );
  };

  // Re-measure whenever the selection or the set of buttons changes (e.g.
  // the forecast day count arriving after load). queueMicrotask still runs
  // before paint (same convention as TopNavBar.tsx), it just satisfies the
  // lint rule against calling setState synchronously in an effect body.
  useLayoutEffect(() => {
    queueMicrotask(measure);
  }, [value, children]);

  // Buttons are usually fullWidth, so their positions shift on container
  // resize (window resize, orientation change) without `value` changing.
  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  return (
    <ToggleButtonGroup
      ref={(node: HTMLDivElement | null) => {
        containerRef.current = node;
        if (typeof forwardedRef === "function") forwardedRef(node);
        else if (forwardedRef) forwardedRef.current = node;
      }}
      value={value}
      sx={{
        position: "relative",
        // The pill is the only thing providing the selected background now
        // (see the pill Box below) - without this the button's own flat
        // background would still hard-cut instead of sliding.
        "& .MuiToggleButton-root.Mui-selected": {
          backgroundColor: "transparent !important",
          "&:hover": { backgroundColor: "transparent !important" },
        },
        ...sx,
      }}
      {...props}
    >
      {pill && (
        <Box
          aria-hidden
          sx={{
            position: "absolute",
            top: GROUP_PADDING,
            bottom: GROUP_PADDING,
            borderRadius: 9999,
            bgcolor: "primary.main",
            transition: `left ${m3Duration.short4}ms ${m3Easing.standard}, width ${m3Duration.short4}ms ${m3Easing.standard}`,
            pointerEvents: "none",
            zIndex: 0,
          }}
          style={{ left: pill.left, width: pill.width }}
        />
      )}
      {children}
    </ToggleButtonGroup>
  );
});

SlidingToggleButtonGroup.displayName = "SlidingToggleButtonGroup";

export default SlidingToggleButtonGroup;
