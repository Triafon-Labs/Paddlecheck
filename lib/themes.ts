import {
  createTheme,
  type CSSObject,
  type Theme,
  type ThemeOptions,
} from "@mui/material/styles";
import {
  m3Light,
  m3Dark,
  type M3Palette,
  m3Easing,
  m3Duration,
} from "./m3-palette";

// M3 type scale mapped to MUI variants, exploiting Roboto Flex variable axes:
//   wght (weight 100–900), wdth (width 25–151), opsz (optical size 8–144)
const m3Typography: ThemeOptions["typography"] = {
  fontFamily: '"Roboto Flex", "Roboto", "Helvetica", "Arial", sans-serif',
  // Display Large – rarely used in app, included for completeness
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
  // Headline Small – used for card titles ("Paddling Status", "Detailed Stats")
  h5: {
    fontSize: "1.5rem",
    fontWeight: 600,
    lineHeight: 1.333,
    letterSpacing: "0em",
    fontVariationSettings: '"wght" 600, "wdth" 110, "opsz" 24',
  },
  // Title Large – used for settings section headings
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
  // Label Large – button text
  button: {
    fontSize: "0.875rem",
    fontWeight: 500,
    lineHeight: 1.429,
    letterSpacing: "0.00625em",
    textTransform: "none",
    fontVariationSettings: '"wght" 500, "wdth" 100, "opsz" 14',
  },
};

// Blue-tinted dark surface tokens – keeps the original navy feel while
// providing the M3 tonal elevation steps that the component overrides need.
const m3DarkNavy: M3Palette = {
  ...m3Dark,
  surface: "#0A1929", // original page background
  onSurface: "#FFFFFF",
  surfaceContainerLowest: "#061221",
  surfaceContainerLow: "#132F4C", // original paper / drawer / AppBar
  surfaceContainer: "#193A5E", // card background – one step lighter
  surfaceContainerHigh: "#1E4168",
  surfaceContainerHighest: "#254B75",
  outlineVariant: "#2A4F73",
  onSurfaceVariant: "#9EAAB8",
};

// Emits one declaration per colour scheme from a single token-keyed rule:
// the light values apply at the base selector, the dark ones inside the
// theme's `.dark` scheme selector. Returned as an array so `applyStyles`
// always lands last, which is what MUI's docs require for correct ordering.
const perScheme = (
  theme: Theme,
  rule: (m3: M3Palette) => CSSObject
): CSSObject[] => [rule(m3Light), theme.applyStyles("dark", rule(m3DarkNavy))];

// Shared component overrides. Using compound selectors (&.MuiPaper-outlined)
// ensures higher specificity than MUI's own variant rules, reliably stripping
// the outlined border from Cards while leaving other Paper components (e.g.
// chart tooltips) untouched.
const components: ThemeOptions["components"] = {
  MuiCard: {
    styleOverrides: {
      root: ({ theme }) => [
        {
          borderRadius: 16,
          // Strip both variant styles so cards always show the tonal surface
          "&.MuiPaper-outlined": { border: "none" },
          "&.MuiPaper-elevation": { boxShadow: "none" },
        },
        ...perScheme(theme, (m3) => ({
          backgroundColor: m3.surfaceContainer,
        })),
      ],
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
      root: ({ theme }) => [
        { boxShadow: "none" },
        ...perScheme(theme, (m3) => ({
          backgroundColor: m3.surfaceContainerLow,
          color: m3.onSurface,
          borderBottom: `1px solid ${m3.outlineVariant}`,
        })),
      ],
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
      root: ({ theme }) => [
        { borderRadius: 9999 },
        // M3 focus indicator – thin primary outline on keyboard focus
        ...perScheme(theme, (m3) => ({
          "&.Mui-focusVisible": {
            outline: `3px solid ${m3.primary}`,
            outlineOffset: 2,
            transition: `outline ${m3Duration.short2}ms ${m3Easing.standard}`,
          },
        })),
      ],
    },
  },
  MuiChip: {
    styleOverrides: {
      root: { borderRadius: 8 },
    },
  },
  // Segmented pill control – container + individual pill buttons
  MuiToggleButtonGroup: {
    styleOverrides: {
      root: ({ theme }) => [
        {
          borderRadius: 9999,
          padding: 4,
          border: "none",
          gap: 4,
        },
        ...perScheme(theme, (m3) => ({
          backgroundColor: m3.surfaceContainerHighest,
        })),
      ],
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
      root: ({ theme }) => [
        {
          borderRadius: 9999,
          border: "none",
          textTransform: "none",
        },
        ...perScheme(theme, (m3) => ({
          "&.Mui-selected": {
            backgroundColor: m3.primary,
            color: m3.onPrimary,
            // M3 state layers via pseudo-element overlay
            position: "relative",
            overflow: "hidden",
            "&::after": {
              content: '""',
              position: "absolute",
              inset: 0,
              borderRadius: "inherit",
              backgroundColor: m3.onPrimary,
              opacity: 0,
              transition: `opacity ${m3Duration.short2}ms ${m3Easing.standard}`,
              pointerEvents: "none",
            },
            "&:hover::after": { opacity: 0.08 },
            "&.Mui-focusVisible::after": { opacity: 0.12 },
            "&:active::after": { opacity: 0.12 },
            "&:hover": { backgroundColor: m3.primary },
          },
        })),
      ],
    },
  },
  MuiDrawer: {
    styleOverrides: {
      paper: ({ theme }) => [
        { backgroundImage: "none" },
        ...perScheme(theme, (m3) => ({
          backgroundColor: m3.surfaceContainerLow,
        })),
      ],
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
  // MUI's own defaults animate the summary row (height/margin/chevron) at
  // theme.transitions.duration.shortest (50ms), far quicker than the
  // auto-height Collapse driving the details panel below it - the header
  // snaps into its expanded shape well before the body finishes unfurling.
  // Slowing the summary row to match keeps both halves reading as one motion.
  MuiAccordionSummary: {
    styleOverrides: {
      root: {
        transition: `min-height ${m3Duration.short3}ms ${m3Easing.standard}, background-color ${m3Duration.short3}ms ${m3Easing.standard}`,
      },
      content: {
        transition: `margin ${m3Duration.short3}ms ${m3Easing.standard}`,
      },
      expandIconWrapper: {
        transition: `transform ${m3Duration.short3}ms ${m3Easing.standard}`,
      },
    },
  },
  MuiDivider: {
    styleOverrides: {
      root: ({ theme }) =>
        perScheme(theme, (m3) => ({ borderColor: m3.outlineVariant })),
    },
  },
  MuiTableRow: {
    styleOverrides: {
      root: ({ theme }) => [
        {
          "&:last-child td, &:last-child th": { border: 0 },
          transition: `background-color ${m3Duration.short2}ms ${m3Easing.standard}`,
        },
        // M3 hover state layer at 4% onSurface
        ...perScheme(theme, (m3) => ({
          "&:hover": { backgroundColor: `${m3.onSurface}0A` },
        })),
      ],
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
      notchedOutline: ({ theme }) =>
        perScheme(theme, (m3) => ({ borderColor: m3.outline })),
    },
  },
  MuiAlert: {
    styleOverrides: {
      root: { borderRadius: 12 },
    },
  },
};

// M3-compliant MUI transitions config – propagates to all MUI components
// that use theme.transitions.create() (Drawer, Accordion, Collapse, Fade…)
const m3Transitions: ThemeOptions["transitions"] = {
  easing: {
    easeInOut: m3Easing.standard, // everyday state transitions
    easeOut: m3Easing.decelerate, // elements entering the screen
    easeIn: m3Easing.accelerate, // elements leaving the screen
    sharp: m3Easing.standard, // quick discrete changes
  },
  duration: {
    shortest: m3Duration.short1,
    shorter: m3Duration.short3,
    short: m3Duration.short4,
    standard: m3Duration.medium2,
    complex: m3Duration.medium4,
    enteringScreen: m3Duration.medium3,
    leavingScreen: m3Duration.short4,
  },
};

// One theme carrying both colour schemes as CSS variables, rather than two
// themes swapped at runtime. Both schemes' variables are emitted during SSR
// and InitColorSchemeScript (see app/layout.tsx) picks the right one before
// first paint, so a dark-mode visitor never sees a flash of light theme.
// `colorSchemeSelector: "class"` pairs with that script's `attribute="class"`:
// it toggles a `light`/`dark` class on <html>.
export const theme = createTheme({
  cssVariables: { colorSchemeSelector: "class" },
  colorSchemes: {
    light: {
      palette: {
        primary: { main: m3Light.primary, contrastText: m3Light.onPrimary },
        secondary: {
          main: m3Light.secondary,
          contrastText: m3Light.onSecondary,
        },
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
    },
    dark: {
      palette: {
        primary: { main: m3Dark.primary, contrastText: m3Dark.onPrimary },
        secondary: { main: m3Dark.secondary, contrastText: m3Dark.onSecondary },
        error: { main: m3Light.error, contrastText: m3Light.onError },
        background: {
          default: m3DarkNavy.surface,
          paper: m3DarkNavy.surfaceContainerLow,
        },
        text: {
          primary: "#FFFFFF",
          secondary: "#BDBDBD",
        },
        divider: m3DarkNavy.outlineVariant,
      },
    },
  },
  shape: { borderRadius: 12 },
  typography: m3Typography,
  transitions: m3Transitions,
  components,
});
