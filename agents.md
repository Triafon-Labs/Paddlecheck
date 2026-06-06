# Paddlecheck — Agent Reference

## Project Overview

Paddlecheck is a Progressive Web App (PWA) for the Worcester Canoe Club that provides real-time kayaking conditions on the River Severn. It presents a RAG (Red-Amber-Green) traffic light safety status, detailed weather and river statistics, a skill-level paddling matrix, and a 5-day hourly forecast. There is no backend — all data is fetched client-side from public APIs.

**Current version:** 1.3.0  
**Deployed on:** Vercel  
**Location hardcoded to:** Worcester, UK (lat 52.2, lon -2.2)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 6 (strict mode) |
| UI Library | Material UI (MUI) 7 + Emotion |
| Charts | Recharts 3 |
| Date handling | date-fns 4 |
| Analytics | Vercel Analytics + Speed Insights |
| PWA | Workbox 7 (service worker) |
| Linting | ESLint 10, Prettier 3 |
| Git hooks | Husky 9 + Commitlint |
| CI | GitHub Actions (lint + build on PR/push to main) |
| Releases | release-please (conventional commits → auto changelog) |

---

## Directory Structure

```
app/
  layout.tsx            Root layout — ThemeRegistry, Analytics
  page.tsx              Home page (client component, renders all cards)
  globals.css           Global resets and Roboto Flex font
  manifest.ts           PWA web manifest

components/
  StatusCard.tsx         Current RAG status + reasons + traffic light
  PaddlingMatrixCard.tsx Skill-level guidance table (Beginner/Improver/Intermediate/Independent)
  StatsCard.tsx          Numeric stats — river level, temp, wind, visibility, launch notes
  RiverLevelGraph.tsx    Historical + predicted river levels (Recharts)
  PredictedRagGraph.tsx  5-day hourly RAG forecast (Recharts bar chart)
  TopNavBar.tsx          Header — share, settings, refresh buttons
  SettingsModal.tsx      Preferences drawer — theme, paddler level, links, conditions key
  TrafficLight.tsx       4-circle RAG visual indicator with animation
  LastUpdated.tsx        Relative "last updated" timestamp (refreshes every 30 s)
  MaterialSwitch.tsx     Styled MUI switch used in settings
  ThemeRegistry.tsx      Emotion cache + AppThemeProvider for SSR

lib/
  config.ts              All thresholds, station IDs, descriptions, coordinates
  rag.ts                 RAG status calculation logic
  river.ts               Environment Agency API calls + Bewdley prediction logic
  weather.ts             Open-Meteo API calls + utilities
  hooks.ts               useKayakData hook — orchestrates all fetching and state
  KayakDataContext.tsx   React Context wrapping the hook for component tree access
  ThemeContext.tsx        Light/dark/system mode state + localStorage persistence
  m3-palette.ts          Material Design 3 colour palettes
  themes.ts              MUI theme definitions (light + dark variants)

types/
  index.ts               All shared TypeScript types

public/                  Static assets — icons, favicon
```

---

## Key Files to Understand First

| File | Why |
|---|---|
| `lib/config.ts` | All magic numbers live here — river thresholds, station IDs, temperature/wind/visibility limits, level descriptions |
| `lib/rag.ts` | The core algorithm — how a river level + weather combination becomes a RAG status |
| `lib/hooks.ts` | Entry point for all data — fetch logic, retry, error handling, state shape |
| `types/index.ts` | The full type vocabulary — read this before touching any data flow |
| `app/page.tsx` | The single page — component layout and data context provision |

---

## Data Sources

| Data | API | Notes |
|---|---|---|
| River level readings | Environment Agency Flood-Monitoring API — station `2642` (Diglis, Worcester) | Historical readings |
| Upstream forecast | `check-for-flooding.service.gov.uk/station-csv/2001` (Bewdley) | Used for 0–30 h prediction with 6 h travel lag |
| Weather (current + 5-day hourly) | Open-Meteo `api.open-meteo.com/v1/forecast` | No API key required |

There are no environment variables required for local development.

---

## RAG Status Logic (`lib/rag.ts`)

The RAG status is calculated from river level first, then modifiers are applied:

**Base status by river level (metres):**
- < 1.0 m → Light Green
- 1.0–1.4 m → Dark Green
- 1.4–2.2 m → Amber
- 2.2–5.0 m → Red
- ≥ 5.0 m → No Paddling

**Modifiers (applied in order):**
1. **Temperature** — below 5 °C raises status significantly (cold water shock); 5–13 °C raises status moderately and enables rain as a factor
2. **Wind** — above 15 mph raises status at any temperature
3. **Rain** — only a factor when temp is 5–13 °C (moderate)
4. **Darkness** — raises Green → Amber, Amber → Red
5. **Poor visibility** — below 1 000 m raises Green → Amber, Amber → Red
6. **Thunderstorm** — overrides everything → No Paddling

The word "raises" means incrementing one step up the severity scale.

---

## River Level Prediction

Two sources are combined transparently:

- **Bewdley delta transfer** (primary, 0–~30 h): Upstream Bewdley readings are shifted 6 h forward and applied as a delta to the current Diglis level. Displayed as solid lines in graphs.
- **Linear regression** (fallback, beyond Bewdley horizon): Uses the last 8 h of Diglis readings to extrapolate a trend. Displayed as dashed lines.

Bewdley data failure is non-fatal — the app falls back to linear regression silently.

---

## State Management

`lib/hooks.ts` contains `useKayakData()`, the single source of truth. It returns:

```ts
{
  conditions: KayakConditions | null   // current status, river level, weather, reasons
  riverGraphData: RiverReading[]       // historical readings for the graph
  forecastDays: DayForecast[]          // 5-day hourly RAG forecasts
  predictedData: PredictedGraphDataPoint[]  // combined prediction series
  isLoading: boolean
  isBewdleyLoading: boolean
  error: string | null
  bewdleyError: string | null
  isOffline: boolean
  lastUpdated: Date | null
  refresh: () => void
}
```

`KayakDataContext.tsx` wraps this hook in React Context so all components can access it without prop drilling.

---

## Local Storage Keys

| Key | Value |
|---|---|
| `theme` | `"light"` \| `"dark"` \| `"system"` |
| `paddlerLevel` | `"Beginner"` \| `"Improver"` \| `"Intermediate"` \| `"Independent"` |
| `riverLevelRange` | `"1h"` \| `"8h"` \| `"24h"` \| `"5d"` \| `"pred"` |

---

## TypeScript Types (`types/index.ts`)

| Type | Description |
|---|---|
| `Status` | `"Light Green" \| "Dark Green" \| "Amber" \| "Red" \| "No Paddling" \| "Unknown"` |
| `KayakConditions` | Full snapshot — status, river level, weather readings, reasons, timestamps |
| `DayForecast` | 24-hour bucket with hourly `PredictedGraphDataPoint[]` |
| `PredictedGraphDataPoint` | Single hourly prediction — status, level, reasons, source (`"bewdley"` \| `"linear"`) |
| `RiverReading` | `{ dateTime: string; value: number }` |
| `WeatherData` | Current weather snapshot |
| `FutureWeatherData` | 5-day hourly forecast + daily sunrise/sunset |
| `PaddlingMatrix` | Skill level → status mapping with guidance text |

---

## Development Commands

```bash
npm install       # Install dependencies
npm run dev       # Start dev server at http://localhost:3000
npm run build     # Production build
npm run lint      # ESLint check
```

Conventional commits are enforced by commitlint. Pre-commit lint runs via Husky.

---

## CI / Release Pipeline

- **ci.yml** — runs `lint` then `build` on every push/PR to `main` (Node 20)
- **release-please.yml** — on merge to `main`, bumps version and updates `CHANGELOG.md` automatically based on conventional commit types (`feat`, `fix`, `chore`, etc.)

---

## What This Project Does Not Have

- No backend or API routes
- No database
- No authentication
- No automated tests (Jest/Vitest/Playwright)
- No environment variables required
- No multi-location support (hardcoded to Worcester)

---

## Key Configuration Constants (`lib/config.ts`)

| Constant | Value | Meaning |
|---|---|---|
| `DIGLIS_STATION_ID` | `2642` | EA API station for current river level |
| `BEWDLEY_STATION_ID` | `2001` | Upstream station for prediction |
| `BEWDLEY_LAG_HOURS` | `6` | Travel time Bewdley → Worcester |
| `RAG_THRESHOLDS` | `[1.0, 1.4, 2.2, 5.0]` | River level breakpoints (metres) |
| `TEMP_HIGH` | `13` °C | Above this: no temperature penalty |
| `TEMP_LOW` | `5` °C | Below this: cold water shock risk |
| `WIND_THRESHOLD` | `15` mph | Above this: wind penalty applied |
| `VISIBILITY_THRESHOLD` | `1000` m | Below this: fog penalty applied |
| Coordinates | `52.2, -2.2` | Open-Meteo weather location |
