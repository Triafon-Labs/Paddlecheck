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
  error: "#BA1A1A",
  onError: "#FFFFFF",
  errorContainer: "#FFDAD6",
  onErrorContainer: "#410002",
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
  error: "#FFB4AB",
  onError: "#690005",
  errorContainer: "#93000A",
  onErrorContainer: "#FFDAD6",
  inverseSurface: "#E3E2E9",
  inverseOnSurface: "#2F3038",
  inversePrimary: "#005AC1",
} as const;

// CSS linear() spring approximation — spring(1, 100, 15, 0), duration ~400ms
// Gives a slight overshoot for M3 Expressive's "springy" feel.
// Falls back to a regular transition in older browsers.
export const springEasing =
  "linear(0, 0.009, 0.035 2.1%, 0.141, 0.281 6.7%, 0.723 12.9%, 0.938 16.7%, 1.017, 1.057 20.8%, 1.099, 1.115 24.6%, 1.121, 1.109 29.2%, 1.063 33.3%, 1.039, 1.019 40%, 0.997 43.8%, 0.985, 0.979 50%, 0.988 54.2%, 1 63.8%, 1.007 70%, 1.009 78.5%, 1.003 85.4%, 1)";
