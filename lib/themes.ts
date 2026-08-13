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
  m3Spring,
  spring,
} from "./m3-palette";

// The tonal surface roles, exposed on the palette so components can reach
// them through `sx` (e.g. `bgcolor: "surfaces.containerHigh"`) instead of
// importing the raw token maps and re-implementing the light/dark split.
// M3 draws a firm line between these and the `action.*` state-layer colours:
// state layers are translucent overlays that express interaction, so using
// one as a component's resting background (as several cards used to) reads
// as a permanently-hovered surface and drifts with any state-layer change.
interface M3Surfaces {
  containerLowest: string;
  containerLow: string;
  container: string;
  containerHigh: string;
  containerHighest: string;
  variant: string;
  onVariant: string;
  outline: string;
  inverse: string;
  onInverse: string;
}

// Opts the MUI types into their CSS-theme-variables branch, which is what
// makes `theme.vars` and the provider's `forceThemeRerender` prop visible to
// TypeScript. Without it the types describe the non-variables theme even
// though `cssVariables` is set below.
declare module "@mui/material/styles" {
  interface CssThemeVariables {
    enabled: true;
  }
  interface Palette {
    surfaces: M3Surfaces;
  }
  interface PaletteOptions {
    surfaces?: M3Surfaces;
  }
  // M3 pairs every accent role with a lower-emphasis container role. MUI's
  // PaletteColor only models main/light/dark/contrastText, so the container
  // pair is added here rather than hard-coding tonal values at call sites.
  interface PaletteColor {
    container: string;
    onContainer: string;
  }
  interface SimplePaletteColorOptions {
    container?: string;
    onContainer?: string;
  }
}

// Both schemes' surface sets, derived from the same token maps that drive
// the component overrides below.
const surfacesFor = (m3: M3Palette): M3Surfaces => ({
  containerLowest: m3.surfaceContainerLowest,
  containerLow: m3.surfaceContainerLow,
  container: m3.surfaceContainer,
  containerHigh: m3.surfaceContainerHigh,
  containerHighest: m3.surfaceContainerHighest,
  variant: m3.surfaceVariant,
  onVariant: m3.onSurfaceVariant,
  outline: m3.outline,
  inverse: m3.inverseSurface,
  onInverse: m3.inverseOnSurface,
});

// M3 type scale mapped to MUI variants, exploiting Roboto Flex variable axes:
//   wght (weight 100–900), wdth (width 25–151), opsz (optical size 8–144)
//
// Note the wght axis is deliberately *not* listed in fontVariationSettings:
// it's driven by each variant's `fontWeight` instead. Setting it here would
// pin the axis, and since font-variation-settings outranks font-weight, every
// `sx={{ fontWeight: … }}` at a call site would silently do nothing - which
// takes M3's emphasised type styles off the table. The wdth and opsz axes
// have no equivalent CSS property worth overriding, so they stay explicit.
const m3Typography: ThemeOptions["typography"] = {
  // next/font renames the family it registers, so naming "Roboto Flex" here
  // matched nothing and every MUI component quietly fell through to Helvetica
  // - taking the variable axes below with it, since a static fallback has no
  // wdth or opsz to set. The variable is declared by the localFont() call in
  // app/layout.tsx and already expands to the family plus its metric-matched
  // fallback, so only the generic families follow it.
  fontFamily: "var(--font-roboto-flex), Helvetica, Arial, sans-serif",
  // Display Large – rarely used in app, included for completeness
  h1: {
    fontSize: "3.5625rem",
    fontWeight: 400,
    lineHeight: 1.127,
    letterSpacing: "-0.015625em",
    fontVariationSettings: '"wdth" 112, "opsz" 57',
  },
  // Display Medium
  h2: {
    fontSize: "2.8125rem",
    fontWeight: 400,
    lineHeight: 1.156,
    letterSpacing: "0em",
    fontVariationSettings: '"wdth" 110, "opsz" 45',
  },
  // Display Small
  h3: {
    fontSize: "2.25rem",
    fontWeight: 400,
    lineHeight: 1.222,
    letterSpacing: "0em",
    fontVariationSettings: '"wdth" 108, "opsz" 36',
  },
  // Headline Large
  h4: {
    fontSize: "2rem",
    fontWeight: 400,
    lineHeight: 1.25,
    letterSpacing: "0em",
    fontVariationSettings: '"wdth" 106, "opsz" 32',
  },
  // Headline Small – used for card titles ("Paddling Status", "Detailed Stats")
  h5: {
    fontSize: "1.5rem",
    fontWeight: 600,
    lineHeight: 1.333,
    letterSpacing: "0em",
    fontVariationSettings: '"wdth" 110, "opsz" 24',
  },
  // Title Large – used for settings section headings
  h6: {
    fontSize: "1.375rem",
    fontWeight: 500,
    lineHeight: 1.273,
    letterSpacing: "0em",
    fontVariationSettings: '"wdth" 105, "opsz" 22',
  },
  // Title Medium
  subtitle1: {
    fontSize: "1rem",
    fontWeight: 500,
    lineHeight: 1.5,
    letterSpacing: "0.009375em",
    fontVariationSettings: '"wdth" 100, "opsz" 16',
  },
  // Title Small
  subtitle2: {
    fontSize: "0.875rem",
    fontWeight: 500,
    lineHeight: 1.429,
    letterSpacing: "0.00714em",
    fontVariationSettings: '"wdth" 100, "opsz" 14',
  },
  // Body Large
  body1: {
    fontSize: "1rem",
    fontWeight: 400,
    lineHeight: 1.5,
    letterSpacing: "0.03125em",
    fontVariationSettings: '"wdth" 100, "opsz" 16',
  },
  // Body Medium
  body2: {
    fontSize: "0.875rem",
    fontWeight: 400,
    lineHeight: 1.429,
    letterSpacing: "0.015625em",
    fontVariationSettings: '"wdth" 100, "opsz" 14',
  },
  // Body Small
  caption: {
    fontSize: "0.75rem",
    fontWeight: 400,
    lineHeight: 1.333,
    letterSpacing: "0.025em",
    fontVariationSettings: '"wdth" 100, "opsz" 12',
  },
  // Label Small
  overline: {
    fontSize: "0.6875rem",
    fontWeight: 500,
    lineHeight: 1.455,
    letterSpacing: "0.0454em",
    textTransform: "uppercase",
    fontVariationSettings: '"wdth" 90, "opsz" 11',
  },
  // Label Large – button text
  button: {
    fontSize: "0.875rem",
    fontWeight: 500,
    lineHeight: 1.429,
    letterSpacing: "0.00625em",
    textTransform: "none",
    fontVariationSettings: '"wdth" 100, "opsz" 14',
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
  surfaceVariant: "#20405F",
  outline: "#8A9BAD",
  outlineVariant: "#2A4F73",
  onSurfaceVariant: "#9EAAB8",
};

// One palette shape, filled from whichever token map a scheme uses, so a
// role can't end up defined for light and forgotten for dark.
const paletteFor = (m3: M3Palette) => ({
  primary: {
    main: m3.primary,
    contrastText: m3.onPrimary,
    container: m3.primaryContainer,
    onContainer: m3.onPrimaryContainer,
  },
  secondary: {
    main: m3.secondary,
    contrastText: m3.onSecondary,
    container: m3.secondaryContainer,
    onContainer: m3.onSecondaryContainer,
  },
  error: {
    main: m3.error,
    contrastText: m3.onError,
    container: m3.errorContainer,
    onContainer: m3.onErrorContainer,
  },
  success: {
    main: m3.success,
    contrastText: m3.onSuccess,
    container: m3.successContainer,
    onContainer: m3.onSuccessContainer,
  },
  warning: {
    main: m3.warning,
    contrastText: m3.onWarning,
    container: m3.warningContainer,
    onContainer: m3.onWarningContainer,
  },
  background: { default: m3.surface, paper: m3.surfaceContainerLow },
  text: { primary: m3.onSurface, secondary: m3.onSurfaceVariant },
  divider: m3.outlineVariant,
  surfaces: surfacesFor(m3),
});

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
  MuiCssBaseline: {
    styleOverrides: {
      // Everything M3 Expressive adds - the springs, the pop-ins, the
      // spinning refresh affordance - is motion a vestibular-sensitive
      // viewer has asked not to see. M3's accessibility guidance is to
      // honour the request globally rather than component by component, so
      // transitions collapse to a single frame and looping animations stop
      // at their first keyframe. `!important` is needed because most of the
      // durations it's overriding are themselves inline emotion styles.
      "@media (prefers-reduced-motion: reduce)": {
        "*, *::before, *::after": {
          animationDuration: "0.01ms !important",
          animationIterationCount: "1 !important",
          transitionDuration: "0.01ms !important",
          scrollBehavior: "auto !important",
        },
      },
    },
  },
  // MUI still paints Material 2's dark-mode "elevation overlay" - a white
  // linear-gradient laid over the paper colour - on every elevated Paper.
  // M3 replaced that idea outright with the tonal surfaceContainer ramp, so
  // the gradient is stripped here and elevated papers (chart tooltips, menus,
  // popovers) sit on a genuine tonal surface instead.
  MuiPaper: {
    styleOverrides: {
      root: ({ theme }) => [
        { backgroundImage: "none" },
        // Deliberately limited to the low elevations, which is what a bare
        // <Paper> in this app uses (chart tooltips). The components that ride
        // on higher elevations - Drawer at 16, Menu at 8, SnackbarContent at
        // 6 - each pick their own tonal surface further down. Matching every
        // non-zero elevation here would out-specify those rules, because
        // `applyStyles` compiles this one to a longer selector than theirs.
        ...perScheme(theme, (m3) => ({
          "&.MuiPaper-elevation1, &.MuiPaper-elevation2, &.MuiPaper-elevation3, &.MuiPaper-elevation4":
            {
              backgroundColor: m3.surfaceContainerHigh,
            },
        })),
      ],
    },
  },
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
      root: ({ theme }) => [
        { borderRadius: 8 },
        // The semantic chips in the conditions key annotate a rule ("raises
        // the rating"); the RAG chips beside them name the status itself and
        // set their colour inline. Giving the annotations the tonal container
        // pair keeps that hierarchy legible - filling both sets with a
        // saturated accent, as MUI does by default, put two competing ambers
        // side by side and gave equal weight to the quieter of the two.
        ...perScheme(theme, (m3) => ({
          "&.MuiChip-filled.MuiChip-colorSuccess": {
            backgroundColor: m3.successContainer,
            color: m3.onSuccessContainer,
          },
          "&.MuiChip-filled.MuiChip-colorWarning": {
            backgroundColor: m3.warningContainer,
            color: m3.onWarningContainer,
          },
          "&.MuiChip-filled.MuiChip-colorError": {
            backgroundColor: m3.errorContainer,
            color: m3.onErrorContainer,
          },
          // Read through custom properties rather than set outright: the RAG
          // chips carry their own exact status colour, and `applyStyles`
          // emits the dark rule under a `.dark` ancestor selector, which
          // outranks the single class an `sx` background compiles to. The
          // chips would have gone flat grey in dark mode only. Setting
          // --chip-bg/--chip-fg at the call site wins regardless of
          // specificity, since there is nothing to out-specify.
          "&.MuiChip-filled.MuiChip-colorDefault": {
            backgroundColor: `var(--chip-bg, ${m3.surfaceContainerHighest})`,
            color: `var(--chip-fg, ${m3.onSurfaceVariant})`,
          },
        })),
      ],
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
          // Lets label/icon colour recolour in step with SlidingToggleButtonGroup's
          // pill sliding underneath, rather than flipping instantly. Colour is
          // an "effects" change in M3's motion system, so it gets the
          // critically-damped spring - overshooting a colour just looks wrong.
          transition: spring("color", m3Spring.effectsDefault),
        },
        ...perScheme(theme, (m3) => ({
          "&.Mui-focusVisible": {
            outline: `3px solid ${m3.primary}`,
            outlineOffset: -1,
            zIndex: 1,
          },
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
      root: ({ theme }) => [
        { borderRadius: 12 },
        // M3 uses the tonal container pair for inline status surfaces, where
        // MUI's default reaches for a tinted background plus a saturated
        // `main` text colour - a Material 2 recipe that leaves dark mode with
        // a near-black panel.
        ...perScheme(theme, (m3) => ({
          "&.MuiAlert-standardError": {
            backgroundColor: m3.errorContainer,
            color: m3.onErrorContainer,
            "& .MuiAlert-icon": { color: m3.onErrorContainer },
          },
          "&.MuiAlert-standardWarning": {
            backgroundColor: m3.warningContainer,
            color: m3.onWarningContainer,
            "& .MuiAlert-icon": { color: m3.onWarningContainer },
          },
          "&.MuiAlert-standardSuccess": {
            backgroundColor: m3.successContainer,
            color: m3.onSuccessContainer,
            "& .MuiAlert-icon": { color: m3.onSuccessContainer },
          },
        })),
      ],
    },
  },
  // M3's switch is a different component from Material 2's, not a restyle:
  // a 52×32 track with an outline when off, a thumb that grows from 16dp to
  // 24dp as it travels, and a state layer that only appears on interaction.
  // MUI still ships the M2 shape, so the whole thing is rebuilt here.
  MuiSwitch: {
    defaultProps: { disableRipple: true },
    styleOverrides: {
      root: {
        width: 52,
        height: 32,
        padding: 0,
        overflow: "visible",
        marginRight: 8,
      },
      switchBase: ({ theme }) => [
        {
          // 8px of padding around the 16px thumb keeps the hit target at
          // 32×32 even though the thumb itself is small.
          padding: 8,
          transition: spring("transform", m3Spring.spatialFast),
          "&:hover, &.Mui-focusVisible": { backgroundColor: "transparent" },
          "&.Mui-checked": { transform: "translateX(20px)" },
        },
        ...perScheme(theme, (m3) => ({
          color: m3.outline,
          "&.Mui-checked": { color: m3.onPrimary },
          // The state layer is a 40dp halo around the thumb rather than a
          // fill, so it lives on a pseudo-element instead of the usual MUI
          // hover background.
          "&::before": {
            content: '""',
            position: "absolute",
            inset: -4,
            borderRadius: "50%",
            backgroundColor: m3.onSurface,
            opacity: 0,
            transition: `opacity ${m3Duration.short2}ms ${m3Easing.standard}`,
            pointerEvents: "none",
          },
          "&:hover::before": { opacity: 0.08 },
          "&.Mui-focusVisible::before": { opacity: 0.12 },
          "&.Mui-checked::before": { backgroundColor: m3.primary },
          "&.Mui-disabled": { color: `${m3.onSurface}61` },
        })),
      ],
      thumb: {
        width: 16,
        height: 16,
        boxShadow: "none",
        transition: spring("width, height, margin", m3Spring.spatialFast),
        ".Mui-checked &": { width: 24, height: 24, margin: -4 },
      },
      track: ({ theme }) => [
        {
          borderRadius: 16,
          opacity: 1,
          border: "2px solid",
          transition: `background-color ${m3Duration.short4}ms ${m3Easing.standard}, border-color ${m3Duration.short4}ms ${m3Easing.standard}`,
        },
        ...perScheme(theme, (m3) => ({
          backgroundColor: m3.surfaceVariant,
          borderColor: m3.outline,
          ".Mui-checked + &": {
            backgroundColor: `${m3.primary} !important`,
            borderColor: m3.primary,
            opacity: "1 !important",
          },
        })),
      ],
    },
  },
  // MUI hangs control labels 11px into the left margin to cancel out the
  // padding on its own Material 2 switch. The M3 switch above carries no such
  // padding, so that compensation would pull the row out of alignment with
  // every heading beside it.
  MuiFormControlLabel: {
    styleOverrides: {
      root: { marginLeft: 0 },
    },
  },
  // M3 primary tabs: label-large text, and an indicator that's a 3dp bar with
  // rounded top corners inset to the label, not MUI's full-width 2dp square rule.
  MuiTabs: {
    styleOverrides: {
      root: { minHeight: 48 },
      indicator: {
        height: 3,
        borderRadius: "3px 3px 0 0",
      },
    },
  },
  MuiTab: {
    styleOverrides: {
      root: ({ theme }) => [
        {
          textTransform: "none",
          minHeight: 48,
          fontWeight: 500,
          transition: `color ${m3Duration.short4}ms ${m3Easing.standard}`,
        },
        ...perScheme(theme, (m3) => ({
          color: m3.onSurfaceVariant,
          "&.Mui-selected": { color: m3.primary },
          "&.Mui-focusVisible": {
            outline: `3px solid ${m3.primary}`,
            outlineOffset: -3,
            borderRadius: 8,
          },
        })),
      ],
    },
  },
  // M3 plain tooltip - inverse surface, body-small text, 4dp corners. MUI's
  // default is Material 2's translucent grey.
  MuiTooltip: {
    styleOverrides: {
      tooltip: ({ theme }) => [
        {
          borderRadius: 4,
          fontSize: "0.75rem",
          lineHeight: 1.333,
          letterSpacing: "0.025em",
          fontWeight: 400,
          padding: "4px 8px",
        },
        ...perScheme(theme, (m3) => ({
          backgroundColor: m3.inverseSurface,
          color: m3.inverseOnSurface,
        })),
      ],
      arrow: ({ theme }) =>
        perScheme(theme, (m3) => ({ color: m3.inverseSurface })),
    },
  },
  // Same inverse-surface pairing for snackbars, which MUI otherwise renders
  // in a fixed Material 2 grey that ignores the colour scheme entirely.
  MuiSnackbarContent: {
    styleOverrides: {
      root: ({ theme }) => [
        { borderRadius: 4, boxShadow: "none" },
        ...perScheme(theme, (m3) => ({
          backgroundColor: m3.inverseSurface,
          color: m3.inverseOnSurface,
        })),
      ],
    },
  },
  MuiMenu: {
    styleOverrides: {
      paper: ({ theme }) => [
        { borderRadius: 12, boxShadow: "none" },
        ...perScheme(theme, (m3) => ({
          backgroundColor: m3.surfaceContainer,
          border: `1px solid ${m3.outlineVariant}`,
        })),
      ],
    },
  },
  MuiMenuItem: {
    styleOverrides: {
      root: ({ theme }) =>
        perScheme(theme, (m3) => ({
          "&.Mui-selected": {
            backgroundColor: m3.secondaryContainer,
            color: m3.onSecondaryContainer,
            "&:hover": { backgroundColor: m3.secondaryContainer },
          },
        })),
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
    light: { palette: paletteFor(m3Light) },
    dark: { palette: paletteFor(m3DarkNavy) },
  },
  shape: { borderRadius: 12 },
  typography: m3Typography,
  transitions: m3Transitions,
  components,
});
