// Single source of truth for how each metric is displayed. Anywhere a
// river level, temperature, wind speed, or wind gust reaches text (UI,
// notification copy, or AI prompt context) should go through these so the
// precision and spacing stay consistent across the app.

// A non-breaking space between the number and unit keeps them from
// wrapping onto separate lines when rendered in narrow containers.
export const formatRiverLevel = (value: number): string =>
  `${value.toFixed(2)} m`;

export const formatTemperature = (value: number): string =>
  `${value.toFixed(1)}°C`;

export const formatWindSpeed = (value: number): string =>
  `${value.toFixed(1)} mph`;

// Gusts are noisy instantaneous peaks phrased as "gusts up to X mph" -
// whole-number rounding is intentional here, not a gap to close.
export const formatWindGust = (value: number): string =>
  `${Math.round(value)} mph`;
