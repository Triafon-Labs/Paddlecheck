# Paddlecheck – Agent Reference

## Project Overview

Paddlecheck is a Progressive Web App (PWA) for the Worcester Canoe Club that provides real-time kayaking conditions on the River Severn. It presents a RAG (Red-Amber-Green) traffic light safety status, detailed weather and river statistics, a skill-level paddling matrix, and a 5-day hourly forecast. There is no backend – all data is fetched client-side from public APIs, with some proxying through Next.js API routes.

**Current version:** 1.16.7
**Deployed on:** Vercel  
**Location hardcoded to:** Worcester, UK (lat 52.2, lon -2.2)

---

## Tech Stack

| Layer         | Technology                                                                    |
| ------------- | ----------------------------------------------------------------------------- |
| Framework     | Next.js 16 (App Router)                                                       |
| Library       | React 19                                                                      |
| Language      | TypeScript 6 (strict mode)                                                    |
| UI Library    | Material UI (MUI) 7 + Emotion                                                 |
| Charts        | Recharts 3                                                                    |
| Date handling | date-fns 4                                                                    |
| AI            | Groq SDK (Briefing feature)                                                   |
| Analytics     | Vercel Analytics + Speed Insights                                             |
| PWA           | Web manifest + hand-rolled service worker (`public/sw.js`)                    |
| Linting       | ESLint 10, Prettier 3                                                         |
| Git hooks     | Husky 9 + commitlint (Conventional Commits)                                   |
| CI            | GitHub Actions (lint + build on PR)                                           |
| Releases      | commit-and-tag-version (auto version bump + changelog + tag on merge to main) |

---

## Important Development Notes

### Build Requirements

Both `next build` and `next dev` use Turbopack (see `next.config.ts`). The
service worker is a plain static file served from `public/`, so no bundler
plugin or build step generates it.

### Timezone & Localization

- All time-based logic and comparisons with external API data must use the **`Europe/London`** timezone to ensure consistency with the Worcester location.
- The project adheres to **UK English** spelling conventions (e.g., 'Licence', 'Customise', 'Colour').

### AI Briefing

- The AI summary feature uses the Groq SDK.
- There is a hard limit of `max_tokens: 2048` in the API route to handle reasoning blocks and prevent truncation.

---

## Directory Structure

```
app/
  api/
    briefing/           AI briefing generation endpoint
    river/              EA API proxy
    weather/            Open-Meteo API proxy
  layout.tsx            Root layout – ThemeRegistry, Analytics
  page.tsx              Home page (client component, renders all cards)
  globals.css           Global resets and Roboto Flex font
  manifest.ts           PWA web manifest

components/
  StatusCard.tsx         Current RAG status + reasons + traffic light
  PaddlingMatrixCard.tsx Skill-level guidance table (Beginner/Improver/Intermediate/Independent)
  StatsCard.tsx          Numeric stats – river level, temp, wind, visibility, launch notes
  RiverLevelGraph.tsx    Historical + forecasted river levels (Recharts)
  ForecastRagGraph.tsx   5-day hourly RAG forecast (Recharts bar chart)
  TopNavBar.tsx          Header – share, settings, refresh buttons
  SettingsModal.tsx      Preferences drawer – theme, paddler level, links, conditions key
  TrafficLight.tsx       4-circle RAG visual indicator with animation
  ThemeRegistry.tsx      Emotion cache + AppThemeProvider for SSR
  ConditionsBriefing.tsx AI-generated conditions summary (Groq)
  WeatherWarnings.tsx    Met Office weather warning banners
  ServiceWorkerRegistration.tsx  Registers public/sw.js in production

lib/
  config.ts              All thresholds, station IDs, descriptions, coordinates
  rag.ts                 RAG status calculation logic
  river.ts               Environment Agency API calls + Bewdley forecast logic
  weather.ts             Open-Meteo API calls + utilities
  hooks.ts               useKayakData hook – orchestrates all fetching and state
  KayakDataContext.tsx   React Context wrapping the hook for component tree access
  ThemeContext.tsx       Wraps MUI's colour-scheme provider/hook (light/dark/system)
  m3-palette.ts          Material Design 3 colour palettes
  themes.ts              One MUI theme carrying both schemes as CSS variables

types/
  index.ts               All shared TypeScript types

public/                  Static assets – icons, favicon, sw.js (offline shell)
```

---

## Key Files to Understand First

| File             | Why                                                                                                                 |
| ---------------- | ------------------------------------------------------------------------------------------------------------------- |
| `lib/config.ts`  | All magic numbers live here – river thresholds, station IDs, temperature/wind/visibility limits, level descriptions |
| `lib/rag.ts`     | The core algorithm – how a river level + weather combination becomes a RAG status                                   |
| `lib/hooks.ts`   | Entry point for all data – fetch logic, retry, error handling, state shape                                          |
| `types/index.ts` | The full type vocabulary – read this before touching any data flow                                                  |
| `app/page.tsx`   | The single page – component layout and data context provision                                                       |

---

## Data Sources

| Data                             | API                                                                          | Notes                                        |
| -------------------------------- | ---------------------------------------------------------------------------- | -------------------------------------------- |
| River level readings             | Environment Agency Flood-Monitoring API – station `2642` (Diglis, Worcester) | Historical readings                          |
| Upstream forecast                | `check-for-flooding.service.gov.uk/station-csv/2001` (Bewdley)               | Used for 0–24 h forecast with 6 h travel lag |
| Weather (current + 5-day hourly) | Open-Meteo `api.open-meteo.com/v1/forecast`                                  | No API key required                          |

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

1. **Temperature** – below 5°C raises status significantly (cold water shock); 5–13°C raises status moderately and enables rain as a factor
2. **Wind** – above 15 mph raises status at any temperature
3. **Rain** – only a factor when temp is 5–13°C (moderate)
4. **Darkness** – raises Green → Amber, Amber → Red
5. **Poor visibility** – below 1 000 m raises Green → Amber, Amber → Red
6. **Thunderstorm** – overrides everything → No Paddling

The word "raises" means incrementing one step up the severity scale.

---

## River Level Prediction

Two sources are combined transparently:

- **Bewdley delta transfer** (primary, 0–24 h forecast): Upstream Bewdley readings are shifted 6 h forward and applied as a delta to the current Diglis level. Displayed as solid lines in graphs.
- **Linear regression** (fallback, beyond Bewdley horizon): Uses the last 8 h of Diglis readings to extrapolate a trend. Displayed as dashed lines.

Bewdley data failure is non-fatal – the app falls back to linear regression silently.

---

## State Management

`lib/hooks.ts` contains `useKayakData()`, the single source of truth. It returns:

```ts
{
  conditions: KayakConditions | null   // current status, river level, weather, reasons (includes lastUpdated)
  riverGraphData: ChartDataPoint[] | null  // historical readings for the graph
  forecastDays: DayForecast[] | null    // 5-day hourly RAG forecasts
  forecastData: ChartDataPoint[] | null // combined forecast series
  riverChange1h: number | null
  riverChange8h: number | null
  riverChange24h: number | null
  riverChange5d: number | null
  loading: boolean          // true for every online fetch (initial, background, manual refresh)
  forecastLoading: boolean  // same, for the forecast section specifically
  error: string | null      // set only when there's truly nothing to show (no cache fallback)
  isOffline: boolean
  usingCachedData: boolean  // true when the latest fetch fell back to cache for any source
  isRefreshing: boolean     // mirrors loading; true for the full duration of any online fetch
  refetch: () => void
}
```

River, weather and future-weather are fetched independently (`Promise.all` with each
promise wrapped in its own `.then/.catch`), each falling back to its own last-known
cached value (`paddlecheck_riverDataRaw` / `paddlecheck_weatherDataRaw` /
`paddlecheck_futureWeatherDataRaw` in `localStorage`) on failure. This means a single
source blipping doesn't discard data that arrived fine from the others.

`loading` / `forecastLoading` intentionally show a spinner for _every_ online fetch –
initial load, background refetch, manual refresh alike – so the spinner disappearing is
always a guarantee the data on screen just came from the network, never a silently-stale
cache. The one exception is being fully offline with a cache already loaded: there's no
fetch that can succeed to wait on, so the cache displays immediately and the "Offline –
showing cached data" banner (`TopNavBar`) communicates that it isn't live, instead of
spinning forever.

`KayakDataContext.tsx` wraps this hook in React Context so all components can access it without prop drilling.

---

## Local Storage Keys

Canonical names live in `lib/storageKeys.ts`; cached payload keys are all
prefixed `paddlecheck_` and omitted here.

| Key                   | Value                                                               |
| --------------------- | ------------------------------------------------------------------- |
| `themeMode`           | `"light"` \| `"dark"` \| `"system"` (read/written by MUI)           |
| `paddlerLevel`        | `"Beginner"` \| `"Improver"` \| `"Intermediate"` \| `"Independent"` |
| `riverGraphTimeRange` | `"1h"` \| `"8h"` \| `"24h"` \| `"5d"` \| `"forecast"`               |
| `autoSummarise`       | `"true"` \| `"false"` – auto-generate the AI summary on load        |

---

## TypeScript Types (`types/index.ts`)

| Type                     | Description                                                                         |
| ------------------------ | ----------------------------------------------------------------------------------- |
| `Status`                 | `"Light Green" \| "Dark Green" \| "Amber" \| "Red" \| "No Paddling" \| "Unknown"`   |
| `KayakConditions`        | Full snapshot – status, river level, weather readings, reasons, timestamps          |
| `DayForecast`            | 24-hour bucket with hourly `ForecastGraphDataPoint[]`                               |
| `ForecastGraphDataPoint` | Single hourly forecast – status, level, reasons, source (`"bewdley"` \| `"linear"`) |
| `RiverReading`           | `{ dateTime: string; value: number }`                                               |
| `WeatherData`            | Current weather snapshot                                                            |
| `FutureWeatherData`      | 5-day hourly forecast + daily sunrise/sunset                                        |
| `PaddlingMatrix`         | Skill level → status mapping with guidance text                                     |

---

## Development Commands

```bash
npm install       # Install dependencies
npm run dev       # Start dev server at http://localhost:3000
npm run build     # Production build
npm run lint      # ESLint check
```

Pre-commit lint runs via Husky. A `commit-msg` hook also runs commitlint,
rejecting commits whose first line isn't a valid Conventional Commit
(`type: subject`, type one of `feat`/`fix`/`perf`/`refactor`/`docs`/`chore`/
`style`/`test`/`build`/`ci`/`revert`). Merge commits are exempt.

---

## CI Pipeline

- **ci.yml** – runs `lint` then `build` on every push/PR to `main` (Node 22)
- **auto-tag.yml** – on every push to `main` (i.e. right after a PR merges), runs
  `commit-and-tag-version` to bump `package.json`'s version, update `CHANGELOG.md`,
  commit both directly to `main`, and push a `paddlecheck-vX.Y.Z` tag. No release PR,
  no approval step. Commit types are enforced locally via commitlint (see
  `commitlint.config.js`) – `feat:` commits get a minor bump, `fix:`/`perf:`/etc.
  get a patch bump with a changelog entry, and a `BREAKING CHANGE:` footer bumps
  major. The job skips itself when the triggering commit is its own
  `chore(release): ...` commit, to avoid a loop.

Both workflows install through `.github/actions/npm-install` rather than calling
`npm ci` directly. See below for why.

The Node version is pinned to 22 in both workflows and declared as
`engines.node` in `package.json`, which is also what Vercel reads when picking a
build image. Node 20 reached end of life in April 2026, and parts of the release
toolchain (`@conventional-changelog/template`, `@simple-libs/*`, `argue-cli`)
already require `node >=22` — on Node 20 they only emitted `EBADENGINE` warnings,
but nothing guaranteed they would keep working. Keep the two workflows, the
`engines` field, and the README in step with each other.

`ci.yml` cancels superseded runs on the same ref. `auto-tag.yml` deliberately
does **not** cancel: releases are queued one at a time so two quick merges cannot
bump from the same base and race each other's tag push.

### Dependabot and the lockfile

Dependabot regenerates `package-lock.json` with its own resolver, and that
resolver does not write **nested optional peer dependencies** that npm itself
installs ([dependabot-core#6317](https://github.com/dependabot/dependabot-core/issues/6317)).
`npm ci` then rejects the lockfile as out of sync and the PR fails on a build
error that has nothing to do with the package being bumped.

Two things keep this from recurring:

1. **`conventional-commits-filter` and `conventional-commits-parser` are direct
   `devDependencies`.** Nothing in this repo imports them. They are declared so
   that npm resolves them at the top level instead of nesting them under
   `@commitlint/read` to satisfy the optional peer dependencies of
   `@conventional-changelog/git-client`. A nested optional peer is the exact
   shape Dependabot drops; a direct dependency is one it must keep. Removing
   these two entries as "unused" reintroduces the failure — `commit-and-tag-version`
   pulls in the older v3/v4 line of the same packages, which is what forces the
   nesting.
2. **`.github/actions/npm-install` heals an out-of-sync lockfile** rather than
   failing, but only for Dependabot's own runs (and always in `auto-tag.yml`).
   For anyone else a lockfile that does not match the manifest is still a hard
   error, because there it means the lockfile was not committed.

Related: the `postcss` entry under `overrides` is bounded to `^8.5.10` rather
than `>=8.5.10`. An override replaces the range **every** package in the tree
asked for, so an open-ended `>=` would pull in a future postcss 9 the day it
ships and hand it to Next's build with nothing to catch it. Keep overrides
bounded to a major.

---

## Troubleshooting Husky Hooks

If Git hooks are not firing:

1. Run `npm install`.
2. Check if `.husky/_` exists and contains the hook wrappers.
3. Verify `git config core.hooksPath` is set to `.husky/_`.

---

## What This Project Does Not Have

- No database
- No authentication
- No automated tests (Jest/Vitest/Playwright)
- No environment variables required for core functionality
- No multi-location support (hardcoded to Worcester)

---

## Key Configuration Constants (`lib/config.ts`)

| Constant               | Value                  | Meaning                                |
| ---------------------- | ---------------------- | -------------------------------------- |
| `DIGLIS_STATION_ID`    | `2642`                 | EA API station for current river level |
| `BEWDLEY_STATION_ID`   | `2001`                 | Upstream station for forecast          |
| `BEWDLEY_LAG_HOURS`    | `6`                    | Travel time Bewdley → Worcester        |
| `RAG_THRESHOLDS`       | `[1.0, 1.4, 2.2, 5.0]` | River level breakpoints (metres)       |
| `TEMP_HIGH`            | `13°C`                 | Above this: no temperature penalty     |
| `TEMP_LOW`             | `5°C`                  | Below this: cold water shock risk      |
| `WIND_THRESHOLD`       | `15` mph               | Above this: wind penalty applied       |
| `VISIBILITY_THRESHOLD` | `1000` m               | Below this: fog penalty applied        |
| Coordinates            | `52.2, -2.2`           | Open-Meteo weather location            |
