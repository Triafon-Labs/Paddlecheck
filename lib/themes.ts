import { createTheme, type ThemeOptions } from "@mui/material/styles";
import { m3Light, m3Dark } from "./m3-palette";

// M3 type scale mapped to MUI variants, exploiting Roboto Flex variable axes:
//   wght (weight 100–900), wdth (width 25–151), opsz (optical size 8–144)
const m3Typography: ThemeOptions["typography"] = {
  fontFamily: '"Roboto Flex", "Roboto", "Helvetica", "Arial", sans-serif',
  // Display Large — rarely used in app, included for completeness
  h1: {
    fontSize: "3.5625rem",
    fontWeight: 400,
    lineHeight: 1.127,
    letterSpacing: "-0.015625em",
    fontVariationSettings: '"wght" 400, "wdth" 112, "opsz" 57',
  },
  // Display Medium
  h2: {
    fontSize: "2.8125rem",
    fontWeight: 400,
    lineHeight: 1.156,
    letterSpacing: "0em",
    fontVariationSettings: '"wght" 400, "wdth" 110, "opsz" 45',
  },
  // Display Small
  h3: {
    fontSize: "2.25rem",
    fontWeight: 400,
    lineHeight: 1.222,
    letterSpacing: "0em",
    fontVariationSettings: '"wght" 400, "wdth" 108, "opsz" 36',
  },
  // Headline Large
  h4: {
    fontSize: "2rem",
    fontWeight: 400,
    lineHeight: 1.25,
    letterSpacing: "0em",
    fontVariationSettings: '"wght" 400, "wdth" 106, "opsz" 32',
  },
  // Headline Small — used for card titles ("Paddling Status", "Detailed Stats")
  h5: {
    fontSize: "1.5rem",
    fontWeight: 600,
    lineHeight: 1.333,
    letterSpacing: "0em",
    fontVariationSettings: '"wght" 600, "wdth" 110, "opsz" 24',
  },
  // Title Large — used for settings section headings
  h6: {
    fontSize: "1.375rem",
    fontWeight: 500,
    lineHeight: 1.273,
    letterSpacing: "0em",
    fontVariationSettings: '"wght" 500, "wdth" 105, "opsz" 22',
  },
  // Title Medium
  subtitle1: {
    fontSize: "1rem",
    fontWeight: 500,
    lineHeight: 1.5,
    letterSpacing: "0.009375em",
    fontVariationSettings: '"wght" 500, "wdth" 100, "opsz" 16',
  },
  // Title Small
  subtitle2: {
    fontSize: "0.875rem",
    fontWeight: 500,
    lineHeight: 1.429,
    letterSpacing: "0.00714em",
    fontVariationSettings: '"wght" 500, "wdth" 100, "opsz" 14',
  },
  // Body Large
  body1: {
    fontSize: "1rem",
    fontWeight: 400,
    lineHeight: 1.5,
    letterSpacing: "0.03125em",
    fontVariationSettings: '"wght" 400, "wdth" 100, "opsz" 16',
  },
  // Body Medium
  body2: {
    fontSize: "0.875rem",
    fontWeight: 400,
    lineHeight: 1.429,
    letterSpacing: "0.015625em",
    fontVariationSettings: '"wght" 400, "wdth" 100, "opsz" 14',
  },
  // Body Small
  caption: {
    fontSize: "0.75rem",
    fontWeight: 400,
    lineHeight: 1.333,
    letterSpacing: "0.025em",
    fontVariationSettings: '"wght" 400, "wdth" 100, "opsz" 12',
  },
  // Label Small
  overline: {
    fontSize: "0.6875rem",
    fontWeight: 500,
    lineHeight: 1.455,
    letterSpacing: "0.0454em",
    textTransform: "uppercase",
    fontVariationSettings: '"wght" 500, "wdth" 90, "opsz" 11',
  },
  // Label Large — button text
  button: {
    fontSize: "0.875rem",
    fontWeight: 500,
    lineHeight: 1.429,
    letterSpacing: "0.00625em",
    textTransform: "none",
    fontVariationSettings: '"wght" 500, "wdth" 100, "opsz" 14',
  },
};

// Shared component overrides parameterised by the active M3 palette.
// Using compound selectors (&.MuiPaper-outlined) ensures higher specificity
// than MUI's own variant rules, reliably stripping the outlined border from
// Cards while leaving other Paper components (e.g. chart tooltips) untouched.
const makeComponents = (
  m3: typeof m3Light
): ThemeOptions["components"] => ({
  MuiCard: {
    styleOverrides: {
      root: {
        backgroundColor: m3.surfaceContainer,
        borderRadius: 16,
        // Strip both variant styles so cards always show the tonal surface
        "&.MuiPaper-outlined": { border: "none" },
        "&.MuiPaper-elevation": { boxShadow: "none" },
      },
    },
  },
  MuiCardContent: {
    styleOverrides: {
      root: {
        "&:last-child": { paddingBottom: 16 },
      },
    },
  },
  MuiAppBar: {
    styleOverrides: {
      root: {
        backgroundColor: m3.surfaceContainerLow,
        color: m3.onSurface,
        boxShadow: "none",
        borderBottom: `1px solid ${m3.outlineVariant}`,
      },
    },
  },
  MuiButton: {
    defaultProps: { disableElevation: true },
    styleOverrides: {
      root: {
        borderRadius: 9999,
        textTransform: "none",
        paddingLeft: 24,
        paddingRight: 24,
      },
    },
  },
  MuiIconButton: {
    styleOverrides: {
      root: {
        borderRadius: 9999,
      },
    },
  },
  MuiChip: {
    styleOverrides: {
      root: { borderRadius: 8 },
    },
  },
  // Segmented pill control — container + individual pill buttons
  MuiToggleButtonGroup: {
    styleOverrides: {
      root: {
        borderRadius: 9999,
        padding: 4,
        backgroundColor: m3.surfaceContainerHighest,
        border: "none",
        gap: 4,
      },
      grouped: {
        // Remove MUI's inter-button borders; shape is set per-button
        border: "none !important",
        borderRadius: "9999px !important",
        margin: "0 !important",
      },
    },
  },
  MuiToggleButton: {
    styleOverrides: {
      root: {
        borderRadius: 9999,
        border: "none",
        textTransform: "none",
        "&.Mui-selected": {
          backgroundColor: m3.primary,
          color: m3.onPrimary,
          "&:hover": {
            backgroundColor: m3.primary,
            opacity: 0.92,
          },
        },
      },
    },
  },
  MuiDrawer: {
    styleOverrides: {
      paper: {
        backgroundColor: m3.surfaceContainerLow,
        backgroundImage: "none",
      },
    },
  },
  MuiAccordion: {
    styleOverrides: {
      root: {
        backgroundColor: "transparent",
        backgroundImage: "none",
      },
    },
  },
  MuiDivider: {
    styleOverrides: {
      root: { borderColor: m3.outlineVariant },
    },
  },
  MuiTableRow: {
    styleOverrides: {
      root: {
        "&:last-child td, &:last-child th": { border: 0 },
      },
    },
  },
  MuiSelect: {
    styleOverrides: {
      root: { borderRadius: 12 },
    },
  },
  MuiOutlinedInput: {
    styleOverrides: {
      root: { borderRadius: 12 },
      notchedOutline: { borderColor: m3.outline },
    },
  },
  MuiAlert: {
    styleOverrides: {
      root: { borderRadius: 12 },
    },
  },
});

export const lightTheme = createTheme({
  palette: {
    mode: "light",
    primary: { main: m3Light.primary, contrastText: m3Light.onPrimary },
    secondary: { main: m3Light.secondary, contrastText: m3Light.onSecondary },
    error: { main: m3Light.error, contrastText: m3Light.onError },
    background: {
      default: m3Light.surface,
      paper: m3Light.surfaceContainerLow,
    },
    text: {
      primary: m3Light.onSurface,
      secondary: m3Light.onSurfaceVariant,
    },
    divider: m3Light.outlineVariant,
  },
  shape: { borderRadius: 12 },
  typography: m3Typography,
  components: makeComponents(m3Light),
});

export const darkTheme = createTheme({
  palette: {
    mode: "dark",
    primary: { main: m3Dark.primary, contrastText: m3Dark.onPrimary },
    secondary: { main: m3Dark.secondary, contrastText: m3Dark.onSecondary },
    error: { main: m3Dark.error, contrastText: m3Dark.onError },
    background: {
      default: m3Dark.surface,
      paper: m3Dark.surfaceContainerLow,
    },
    text: {
      primary: m3Dark.onSurface,
      secondary: m3Dark.onSurfaceVariant,
    },
    divider: m3Dark.outlineVariant,
  },
  shape: { borderRadius: 12 },
  typography: m3Typography,
  components: makeComponents(m3Dark),
});
