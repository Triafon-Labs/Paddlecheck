// Single source of truth for how each metric is displayed. Anywhere a
// river level, temperature, wind speed, or wind gust reaches text (UI,
// notification copy, or AI prompt context) should go through these so the
// precision and spacing stay consistent across the app.

// A non-breaking space between the number and unit keeps them from
// wrapping onto separate lines when rendered in narrow containers.
export const formatRiverLevel = (value: number): string =>
  `${value.toFixed(2)} m`;

// Temperature and wind are whole numbers, as UK forecasts give them: the
// readings are model output, and a tenth of a degree or a mph is precision
// they don't have. The RAG thresholds are judged on the same whole numbers
// (lib/rag.ts), so the figure on screen always agrees with the status.
// River level keeps two places - its thresholds and hourly changes are a
// matter of centimetres.
// Math.round(-0.4) is -0, which would print as "-0°C"; adding 0 clears it.
export const whole = (value: number): number => Math.round(value) + 0;

export const formatTemperature = (value: number): string => `${whole(value)}°C`;

// Also used for gusts.
export const formatWindSpeed = (value: number): string => `${whole(value)} mph`;

// Visibility is metres from the API. Under a kilometre it stays in metres -
// that's where the fog threshold sits, so 600 m shouldn't read as "1 km".
export const formatVisibility = (metres: number): string =>
  metres < 1000
    ? `${Math.round(metres / 100) * 100} m`
    : `${Math.round(metres / 1000)} km`;
