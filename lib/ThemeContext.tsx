"use client";

import { ReactNode } from "react";
import { flushSync } from "react-dom";
import { ThemeProvider, useColorScheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { theme } from "./themes";
import { STORAGE_KEYS } from "@/lib/storageKeys";

export type ThemeMode = "light" | "dark" | "system";

export const AppThemeProvider = ({ children }: { children: ReactNode }) => (
  // modeStorageKey keeps MUI reading and writing the same localStorage key the
  // app used before CSS theme variables, so existing saved preferences (which
  // already use MUI's own "light" | "dark" | "system" vocabulary) carry over.
  //
  // forceThemeRerender is required, not optional polish: with CSS variables
  // alone, `theme.palette` stays pinned to the default (light) scheme, so
  // anything reading a colour in JS rather than through CSS gets light values
  // in dark mode. That silently broke the traffic light (light pastel fills
  // on navy) and both Recharts graphs, which pass colours as SVG attributes -
  // dark-blue lines and dark-grey axis labels on a navy background. This
  // recalculates theme values when the mode changes so those reads are
  // correct; the CSS variables still drive first paint, so no flash returns.
  <ThemeProvider
    theme={theme}
    defaultMode="system"
    modeStorageKey={STORAGE_KEYS.THEME_MODE}
    forceThemeRerender
  >
    <CssBaseline />
    {children}
  </ThemeProvider>
);

// Thin wrapper over MUI's useColorScheme, preserving the API the settings
// drawer already uses. `mode` is undefined until hydration finishes; treating
// that as "system" matches the pre-hydration default rather than flipping the
// toggle group to a wrong value for a frame.
//
// A change of theme cross-fades through a view transition: the browser
// snapshots the page, applies the new scheme, and blends the two on the
// compositor (timing in app/globals.css). Without it every colour on the page
// switched in one frame, after the forceThemeRerender above re-rendered the
// whole app - which the old snapshot now covers. The update is flushed inside
// the transition so the new snapshot has the new colours; MUI applies the
// scheme in a layout effect, which flushSync runs. Browsers without view
// transitions, or a reader who asks for reduced motion, get the instant
// switch as before.
export const useAppTheme = () => {
  const { mode, setMode } = useColorScheme();
  const setThemeMode = (nextMode: ThemeMode) => {
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (!document.startViewTransition || reduceMotion) {
      setMode(nextMode);
      return;
    }
    document.startViewTransition(() => flushSync(() => setMode(nextMode)));
  };
  return {
    themeMode: (mode ?? "system") as ThemeMode,
    setThemeMode,
  };
};
