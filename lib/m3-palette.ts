// M3 tonal color tokens derived from seed #005AC1 (primary blue)
export const m3Light = {
  primary: "#005AC1",
  onPrimary: "#FFFFFF",
  primaryContainer: "#D8E2FF",
  onPrimaryContainer: "#001849",
  secondary: "#575E71",
  onSecondary: "#FFFFFF",
  secondaryContainer: "#DBE2F9",
  onSecondaryContainer: "#141B2C",
  surface: "#F8F9FF",
  onSurface: "#1A1C22",
  surfaceVariant: "#E1E2EC",
  onSurfaceVariant: "#44474F",
  surfaceContainerLowest: "#FFFFFF",
  surfaceContainerLow: "#F3F4FC",
  surfaceContainer: "#EDEEF7",
  surfaceContainerHigh: "#E7E8F1",
  surfaceContainerHighest: "#E1E2EC",
  outline: "#74777F",
  outlineVariant: "#C4C6D0",
  error: "#B71C1C", // WARNING_COLORS.Red - the RAG palette's red
  onError: "#FFFFFF",
  errorContainer: "#FFDAD6",
  onErrorContainer: "#410002",
  // Extended (custom) colour roles. M3 has no built-in success/warning, and
  // MUI's stock M2 green/orange don't belong to this app's colour language
  // either - so the accents are taken straight from the RAG palette in
  // lib/config.ts (Dark Green, Amber, Red). A "raises the rating" chip then
  // reads in the same amber as the Amber status chip beside it, instead of
  // introducing a third, unrelated orange. The container tones stay on the
  // M3 tonal ramp, since they back low-emphasis surfaces rather than
  // signalling status.
  //
  // `warning` is only ever used as a fill (chips, the status strip); at 2:1
  // against the app's surfaces it must not be used for text or icons.
  success: "#008000",
  onSuccess: "#FFFFFF",
  successContainer: "#A2F5AC",
  onSuccessContainer: "#00210A",
  warning: "#FF8F00",
  onWarning: "#271900",
  warningContainer: "#FFDEA6",
  onWarningContainer: "#271900",
  inverseSurface: "#2F3038",
  inverseOnSurface: "#F2F0F7",
  inversePrimary: "#ADC6FF",
} as const;

export const m3Dark = {
  primary: "#ADC6FF",
  onPrimary: "#002E6A",
  primaryContainer: "#003F8E",
  onPrimaryContainer: "#D8E2FF",
  secondary: "#BFC6DC",
  onSecondary: "#293042",
  secondaryContainer: "#404659",
  onSecondaryContainer: "#DBE2F9",
  surface: "#12131A",
  onSurface: "#E3E2E9",
  surfaceVariant: "#44474F",
  onSurfaceVariant: "#C4C6D0",
  surfaceContainerLowest: "#0C0E14",
  surfaceContainerLow: "#1C1D25",
  surfaceContainer: "#21232C",
  surfaceContainerHigh: "#2C2E38",
  surfaceContainerHighest: "#363840",
  outline: "#8E9099",
  outlineVariant: "#44474F",
  // Lifted versions of the same RAG accents. The light-scheme values are too
  // dark to read as icons against the navy surfaces, so each is raised to the
  // next step up the same hue - success lands on the RAG palette's own Light
  // Green - while staying recognisably the same colour language.
  error: "#FF5449",
  onError: "#410002",
  errorContainer: "#93000A",
  onErrorContainer: "#FFDAD6",
  success: "#4CBB17", // RAG "Light Green"
  onSuccess: "#00210A",
  successContainer: "#00531F",
  onSuccessContainer: "#A2F5AC",
  warning: "#FFB300",
  onWarning: "#271900",
  warningContainer: "#5F4100",
  onWarningContainer: "#FFDEA6",
  inverseSurface: "#E3E2E9",
  inverseOnSurface: "#2F3038",
  inversePrimary: "#005AC1",
} as const;

// Widened type – maps each key to string so both m3Light and m3Dark satisfy it.
export type M3Palette = { [K in keyof typeof m3Light]: string };

// M3 Expressive motion-physics springs, sampled into CSS `linear()` curves.
//
// The spec expresses these as a mass-1 spring with a stiffness and a damping
// ratio; each entry below records the pair it was generated from, along with
// the settling time that becomes its duration. Spatial springs move things
// (position, size) and carry a deliberate overshoot – that gentle bounce *is*
// the Expressive part. Effects springs change things that shouldn't overshoot
// (colour, opacity, elevation), so they're critically damped.
//
// Browsers without `linear()` fall back to the UA default easing rather than
// breaking, so this degrades to a plain timed transition.
export const m3Spring = {
  // stiffness 800, damping 0.6 – peaks at 1.095
  spatialFast: {
    easing:
      "linear(0, 0.028, 0.101, 0.202, 0.32, 0.444, 0.565, 0.679, 0.78, 0.866, 0.938, 0.994, 1.036, 1.066, 1.084, 1.093, 1.095, 1.091, 1.083, 1.073, 1.062, 1.05, 1.039, 1.028, 1.019, 1.011, 1.005, 1, 0.996, 0.993, 0.992, 0.991, 0.991, 0.992, 0.992, 0.993, 0.994, 0.995, 0.997, 0.998, 1)",
    duration: 350,
  },
  // stiffness 380, damping 0.8 – peaks at 1.015
  spatialDefault: {
    easing:
      "linear(0, 0.018, 0.066, 0.133, 0.212, 0.297, 0.382, 0.466, 0.545, 0.618, 0.684, 0.743, 0.795, 0.839, 0.877, 0.909, 0.935, 0.956, 0.973, 0.986, 0.996, 1.003, 1.008, 1.012, 1.014, 1.015, 1.015, 1.015, 1.014, 1.013, 1.012, 1.01, 1.009, 1.008, 1.007, 1.006, 1.005, 1.004, 1.003, 1.002, 1)",
    duration: 420,
  },
  // stiffness 200, damping 0.8 – peaks at 1.015
  spatialSlow: {
    easing:
      "linear(0, 0.018, 0.066, 0.133, 0.211, 0.296, 0.381, 0.465, 0.544, 0.617, 0.683, 0.742, 0.794, 0.838, 0.876, 0.908, 0.934, 0.955, 0.972, 0.985, 0.995, 1.003, 1.008, 1.012, 1.014, 1.015, 1.015, 1.015, 1.014, 1.013, 1.012, 1.011, 1.009, 1.008, 1.007, 1.006, 1.005, 1.004, 1.003, 1.002, 1)",
    duration: 570,
  },
  // stiffness 3800, critically damped
  effectsFast: {
    easing:
      "linear(0, 0.021, 0.072, 0.141, 0.219, 0.299, 0.378, 0.453, 0.522, 0.586, 0.643, 0.693, 0.738, 0.776, 0.81, 0.839, 0.864, 0.886, 0.904, 0.919, 0.932, 0.944, 0.953, 0.961, 0.967, 0.973, 0.977, 0.981, 0.984, 0.987, 0.989, 0.991, 0.993, 0.994, 0.995, 0.996, 0.997, 0.997, 0.998, 0.998, 1)",
    duration: 140,
  },
  // stiffness 1600, critically damped
  effectsDefault: {
    easing:
      "linear(0, 0.02, 0.07, 0.138, 0.214, 0.294, 0.372, 0.446, 0.515, 0.579, 0.636, 0.686, 0.731, 0.77, 0.804, 0.834, 0.859, 0.881, 0.9, 0.916, 0.929, 0.941, 0.95, 0.958, 0.965, 0.971, 0.976, 0.98, 0.983, 0.986, 0.989, 0.99, 0.992, 0.993, 0.995, 0.996, 0.996, 0.997, 0.997, 0.998, 1)",
    duration: 215,
  },
  // stiffness 800, critically damped
  effectsSlow: {
    easing:
      "linear(0, 0.02, 0.07, 0.137, 0.213, 0.292, 0.37, 0.444, 0.513, 0.576, 0.633, 0.684, 0.729, 0.768, 0.802, 0.832, 0.858, 0.88, 0.898, 0.914, 0.928, 0.94, 0.949, 0.958, 0.965, 0.97, 0.975, 0.979, 0.983, 0.986, 0.988, 0.99, 0.992, 0.993, 0.994, 0.995, 0.996, 0.997, 0.997, 0.998, 1)",
    duration: 305,
  },
} as const;

// M3 motion easing curves
export const m3Easing = {
  // Standard: everyday transitions – color, opacity, small layout shifts
  standard: "cubic-bezier(0.2, 0, 0, 1)",
  // Decelerate: elements entering the screen (slide in, expand)
  decelerate: "cubic-bezier(0, 0, 0, 1)",
  // Accelerate: elements leaving the screen (slide out, collapse)
  accelerate: "cubic-bezier(0.3, 0, 1, 1)",
} as const;

// M3 motion duration tokens (milliseconds)
export const m3Duration = {
  short1: 50,
  short2: 100,
  short3: 150,
  short4: 200,
  medium1: 250,
  medium2: 300,
  medium3: 350,
  medium4: 400,
} as const;

type SpringToken = { easing: string; duration: number };

// Shorthand for `transition` values driven by a spring token, e.g.
//   transition: spring("transform", m3Spring.spatialFast)
export const spring = (
  properties: string,
  token: SpringToken = m3Spring.spatialDefault
): string =>
  properties
    .split(",")
    .map((p) => `${p.trim()} ${token.duration}ms ${token.easing}`)
    .join(", ");

// The same token spread over MUI's transition components (Grow, Fade, Slide),
// which take easing and timeout as separate props. Spread it in place of a
// bare `easing` so entrances land with the spring rather than easing to a
// dead stop: `<Grow in appear {...springTransition()}>`.
export const springTransition = (
  token: SpringToken = m3Spring.spatialDefault
) => ({
  easing: { enter: token.easing, exit: m3Easing.accelerate },
  timeout: { enter: token.duration, exit: m3Duration.short4 },
});
