<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Paddlecheck – Agent Reference

## Project Overview

Paddlecheck is a Progressive Web App (PWA) for the Worcester Canoe Club that provides real-time kayaking conditions on the River Severn. It presents a RAG (Red-Amber-Green) traffic light safety status, detailed weather and river statistics, a skill-level paddling matrix, and a 5-day hourly forecast. There is no database. The browser only talks to the app's own Next.js API routes: `/api/conditions` fetches every upstream source server-side and caches the combined payload for 15 minutes, and `/api/briefing` generates the AI summary.

**Deployed on:** Vercel  
**Location hardcoded to:** Worcester, UK (lat 52.2, lon -2.2)

---

## Tech Stack

| Layer         | Technology                                                                    |
| ------------- | ----------------------------------------------------------------------------- |
| Framework     | Next.js 16 (App Router)                                                       |
| Library       | React 19                                                                      |
| Language      | TypeScript 6 (strict mode)                                                    |
| UI Library    | Material UI (MUI) 9 + Emotion                                                 |
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

## Club settings (`clubs/*.yaml`)

Everything club-specific – names, gauge, location, warnings area, status steps, rules,
thresholds, weather table, paddler levels, Who Can Paddle, landmarks and Conditions Key
text – lives in one file in `clubs/`. The `CLUB` environment variable picks it
(`CLUB=wcc` → `clubs/wcc.yaml`), read by `next.config.ts` when `next dev` or
`next build` starts – from the shell, `.env.local`, or the host's settings (Vercel:
Project Settings → Environment Variables). Unset, `next dev` uses `clubs/example.yaml` (the
starter for a new club) and prints a notice once, but `next build` throws: a deployment
must name its club, because a site built from the example would show a real-looking status
from made-up rules. Don't add a build-time fallback. A `CLUB` with no matching file throws
in both, listing the files there are. The production site is built with `CLUB=wcc`
(Vercel env var), and local Worcester work needs `CLUB=wcc` in `.env.local`. Forks add
their own `clubs/<club>.yaml` rather than editing `wcc.yaml` or `example.yaml`, so
syncing with this repo never conflicts on settings.

`next.config.ts` aliases `@club-config` to the chosen file (`turbopack.resolveAlias`) and
`yaml-loader` (a Turbopack rule) imports it as a module; `lib/clubConfig.ts` checks it and
throws one error listing every problem, which stops `next dev`/`next build`; `lib/config.ts`
re-exports it under the same constant names the code uses (`CLUB_NAME`, `STATUS_STEPS`,
`WHO_CAN_PADDLE`, `THRESHOLDS.TEMP_HIGH`, …). Never hard-code club-specific values in code –
add a setting to the club files, `lib/clubConfig.ts` and `club.schema.json` (editor hints)
together. Optional settings get their defaults in `DEFAULTS` (`lib/clubConfig.ts`). CI builds
every file in `clubs/` (the matrix in `ci.yml` – add a new club file there too). When helping a
club adapt the app, copy `clubs/example.yaml` to `clubs/<club>.yaml`, run
`CLUB=<club> npm run dev` to validate, and list anything in their rules that the club file
can't express rather than guessing.

## Directory Structure

```
clubs/                  One settings file per club, picked by CLUB (see above)
  example.yaml          Minimal starter for a new club, used when CLUB is unset (river level only, CHANGE markers)
  wcc.yaml              Worcester Canoe Club – nearly every setting (CLUB=wcc)
club.schema.json        JSON Schema for the club files – editor autocomplete and checks only
docs/club-yaml/         Colour and icon reference images for the club files – redraw with
                        `node scripts/club-yaml-reference.mjs` after changing STATUS_COLORS or ICONS

app/
  api/
    conditions/         All upstream data in one payload, cached 15 min (lib/conditions.ts)
      live/             Same payload with no cache – called when the cached one is stale
    briefing/           AI briefing (Groq) – builds its own inputs server-side, reads only `model` from the request
  layout.tsx            Root layout – Roboto Flex, ThemeRegistry, data provider, Analytics, safe-area frame
  page.tsx              Home page (client component, renders all cards)
  globals.css           Global resets only; type and colour come from the theme
  manifest.ts           PWA web manifest

components/
  StatusCard.tsx         Current RAG status with its "Updated" line, river level landmarks, contributing factors, warnings, conditions report
  PaddlingStatusHero.tsx The status panel and five-step scale strip at the top of StatusCard
  PaddlingMatrixCard.tsx Skill-level guidance table (Beginner/Improver/Intermediate/Independent)
  PaddlerLevelRow.tsx    One level's verdict as an expandable row – Who Can Paddle and the forecast hour's "You"
  StatusFace.tsx         The verdict faces (a face on a status-colour disc) and their labels
  StatsCard.tsx          Weather panel (sky, temp, feels-like) + tiles – wind, gusts, visibility, daylight
  RiverLevelLandmarks.tsx The reading between its nearest club landmarks, with distances (StatusCard); compact: the reading row alone (forecast hour)
  RiverLevelGraph.tsx    Historical + forecasted river levels, change tiles (Recharts)
  ForecastRagGraph.tsx   5-day hourly RAG forecast (Recharts bar chart) – tap/drag picks an hour
  ForecastHourDetails.tsx The picked forecast hour: header with prev/next stepping, and a details card flush below, opening with the verdict for your level
  TopNavBar.tsx          Header – club name (CLUB_SHORT_NAME) above APP_NAME, share, settings, refresh, stale/offline banners
  SettingsModal.tsx      Preferences drawer – theme, paddler level, links, conditions key
  ConditionsBriefing.tsx AI-generated conditions summary (Groq)
  WeatherWarnings.tsx    Met Office weather warning banners
  InfoPanel.tsx          Shared tonal "icon + text" panel, optionally a button
  StatTile.tsx           Labelled-figure tile (icon + label, value, detail) – weather, factors, river changes
  ConditionFactors.tsx   "Contributing Factors" section, shared by StatusCard and the forecast panel
  SlidingToggleButtonGroup.tsx  Segmented control with a sliding pill
  ThemeRegistry.tsx      Emotion cache + AppThemeProvider for SSR
  ServiceWorkerRegistration.tsx  Registers public/sw.js in production

lib/
  config.ts              The app's constants: the club's from clubs/<CLUB>.yaml, plus data sources, caching, chart styling
  clubConfig.ts          Reads and checks the club file (icon/colour names, placeholders, plain-English errors)
  conditions.ts          Builds the /api/conditions payload – every source in parallel
  fetchCache.ts          The shared 15-minute upstream cache window
  rag.ts                 RAG status calculation logic
  river.ts               Environment Agency API calls + upstream forecast logic
  weather.ts             Open-Meteo API calls + utilities
  metOfficeWarnings.ts   Met Office warnings RSS fetch and parsing
  warnings.ts            Warning display and per-day helpers
  forecast.ts            Best-paddling-time windows and forecast summaries
  chartMotion.ts         Chart entrances in CSS (bars grow, lines/areas wipe in) instead of recharts' JS animation
  paddlingMatrix.ts      Applies WHO_CAN_PADDLE + WHO_CAN_PADDLE_EXTRAS (config) for a status and river level
  usePaddlerLevel.ts     The paddler level from Settings, kept in step across components and tabs
  buildKayakData.ts      Pure: raw sources → current conditions + 5-day hourly forecast (client and /api/briefing)
  briefingInputs.ts      Pure: conditions + forecast → what the AI briefing is written from (server only)
  hooks.ts               useKayakData hook – fetching, fallbacks and state; calls buildKayakData
  KayakDataContext.tsx   React Context wrapping the hook for component tree access
  useBriefing.ts         AI briefing request (sends only the model) and state
  useShowNightHours.ts   The "Show night hours" setting, shared by Settings and the forecast chart
  units.ts               How each metric is formatted for display
  time.ts                Europe/London time helpers and data-age formatting
  useNowTicking.ts       Client hook: the current time, ticking each minute (kept out of time.ts so servers can import it)
  useFreshness.ts        "10:33 · just now" and whether data is stale – StatusCard and the top bar's banners
  storageKeys.ts         Canonical localStorage key names
  useTooltipDismiss.ts   Closes a recharts tooltip on an outside press
  statusColors.ts        The status colour vocabulary
  ThemeContext.tsx       Wraps MUI's colour-scheme provider/hook (light/dark/system)
  m3-palette.ts          Material Design 3 colour palettes + motion tokens
  themes.ts              One MUI theme carrying both schemes as CSS variables

types/
  index.ts               All shared TypeScript types
  yaml.d.ts              Lets the club file be imported as @club-config (untyped until clubConfig.ts checks it)

public/                  Static assets – icons, favicon, sw.js (offline shell)
```

---

## Key Files to Understand First

| File             | Why                                                                               |
| ---------------- | --------------------------------------------------------------------------------- |
| `clubs/*.yaml`   | Every club-specific setting – steps, thresholds, station IDs, rules, landmarks    |
| `lib/rag.ts`     | The core algorithm – how a river level + weather combination becomes a RAG status |
| `lib/hooks.ts`   | Entry point for all data – fetch logic, retry, error handling, state shape        |
| `types/index.ts` | The full type vocabulary – read this before touching any data flow                |
| `app/page.tsx`   | The single page – component layout and data context provision                     |

---

## Data Sources

| Data                             | API                                                                             | Notes                                   |
| -------------------------------- | ------------------------------------------------------------------------------- | --------------------------------------- |
| River level readings             | Environment Agency Flood-Monitoring API – station `2642` (Worcester, Barbourne) | Historical readings                     |
| Upstream forecast                | `check-for-flooding.service.gov.uk/station-csv/2001` (Bewdley)                  | 0–~42 h forecast, 6 h lag; `null` = off |
| Weather (current + 5-day hourly) | Open-Meteo `api.open-meteo.com/v1/forecast`                                     | No API key required; wind see below     |
| Weather warnings                 | Met Office warnings RSS, West Midlands region (`MET_OFFICE_WARNINGS_RSS_URL`)   | Parsed in `lib/metOfficeWarnings.ts`    |

All of these are fetched server-side by `lib/conditions.ts` for `/api/conditions`; the
browser never calls them directly.

Wind speed and gusts (current and hourly) are the highest of Open-Meteo's default
`best_match` and the models in `EXTRA_WIND_MODELS` (UK Met Office, ECMWF). On a
borderline day `best_match` can sit at the calm end of the models and under the 15 mph
threshold while other forecasts are over it. Open-Meteo returns only one model for
`current`, so each extra model is its own request. A failed extra model is ignored;
every other weather field still comes from `best_match` alone.

`npm run dev` needs no environment variables (it falls back to `clubs/example.yaml`);
`npm run build` needs `CLUB`, and the AI briefing needs `GROQ_API_KEY`. `next.config.ts` turns its presence at build time into
`NEXT_PUBLIC_CONDITIONS_REPORT` (`CONDITIONS_REPORT_ENABLED` in `lib/config.ts`); without it
the Conditions Report section and its Settings switch aren't rendered at all.

---

## RAG Status Logic (`lib/rag.ts`)

The RAG status is calculated from river level first, then modifiers are applied:

The steps themselves – how many, their names, where each starts, colours, icons and
descriptions – are `steps` in the club file (`STATUS_STEPS` in code). `lib/rag.ts` derives
everything from it (`STEP_NAMES`, `TOP_STEP`, `BEST_TIME_STEPS`, `statusUi()`,
`ragHeight()`, the river level reasons); `lib/clubConfig.ts` has already checked it and the
weather table. Never hard-code a step name in code.

**Worcester's base status by river level (metres):**

- < 1.0 m → Light Green
- 1.0–1.48 m → Dark Green
- 1.48–2.75 m → Amber
- 2.75–5.0 m → Red
- ≥ 5.0 m → No Paddling

**Modifiers (applied in order).** Each can be switched off in `rules` (club file) –
`WEATHER_TABLE` covers 1–3. A switched-off factor neither changes the status nor appears
in `reasons`.

1. **Temperature** – at or below 5°C raises status significantly (cold water shock); 5–13°C raises status moderately and enables rain as a factor
2. **Wind** – above 15 mph raises status at any temperature
3. **Rain** – a factor whenever temp is below 13°C
4. **Darkness** – raises the status one step. A forecast hour is dark when more than a quarter of it (`DARK_HOUR_FRACTION`, i.e. over 15 minutes) is before sunrise or after sunset (`isDarkHour`, `lib/time.ts`); the Weather card's Daylight tile counts down to sunset
5. **Poor visibility** – below 1 000 m raises the status one step
6. **Thunderstorms** – overrides everything → the top step (No Paddling)

Weather, darkness and fog cap one step below the top step; only the river level's own
`fromLevel` or a thunderstorm reaches it.

The word "raises" means incrementing one step up the severity scale.

A `Status` is a step `name` (or `"Unknown"`). Look a status up with `statusUi()` from
`lib/rag.ts`, which falls back to Unknown for a name no longer in `STATUS_STEPS` (e.g. from an
older cache). Verdict colours in "Who Can Paddle" are fixed green/amber/red
(`components/StatusFace.tsx`), independent of the steps. Whether an hour
is dark is the forecast point's own `dark` flag (`isDarkSlot`, `lib/forecast.ts`), not the
"Dark" reason, which is absent when `RULES.DARKNESS` is off.

---

## River Level Prediction

Two sources are combined transparently:

- **Upstream delta transfer** (primary, as far as the published forecast reaches plus the 6 h travel time – about 42 h for a 36 h feed): Upstream (Bewdley) readings are shifted 6 h forward and applied as a delta to the latest Barbourne reading, measured from the upstream gauge 6 h before that reading was taken so the forecast starts exactly on it. The upstream gauge's published forecast is shifted to start on its latest observation, and levels are interpolated between points. Displayed as tightly dashed lines in both graphs; the river level graph only draws the first `RIVER_GRAPH_FORECAST_HOURS` (24 h).
- **Linear trend** (fallback, beyond the upstream horizon): Continues the upstream trend over the last `UPSTREAM_TREND_HOURS` (6 h) of its series from where the upstream forecast ends, for at most `LINEAR_FORECAST_HOURS` (18 h). With no upstream data it uses a regression over the last 8 h of Barbourne readings instead – Barbourne lags the upstream gauge by the travel time, so on a rise its own trend is still flat when the upstream data runs out. Displayed as medium dashed lines.
- **Held** (everything after that): The level is held flat at the last linear estimate, so the RAG status for those hours is driven by the weather. No line is drawn for these hours, and the tooltip reads "Assumed Level" / "Source: None – level held".

The dash patterns live in `FORECAST_LINE_DASH` (`lib/config.ts`).

Upstream data failure (or `UPSTREAM_CSV_URL = null`) is non-fatal – the app falls back to linear regression silently.

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
  lastFetchStale: boolean   // the data was already stale when the last fetch finished
  isRefreshing: boolean     // mirrors loading; true for the full duration of any online fetch
  refetch: () => void
}
```

The hook makes one request, `GET /api/conditions`, retried up to twice with backoff.
That route builds its payload server-side in `lib/conditions.ts`: river, weather,
future-weather, the upstream forecast and Met Office warnings are fetched in parallel
(`Promise.all`, each promise wrapped in its own `.catch`), and the whole response is
cached for 15 minutes (`revalidate = 900`) with `fetchedAt` stamped when it was built.
If the request fails, or its `fetchedAt` is older than `LIVE_REFETCH_AFTER_MS` (the
15-minute cache window – an entry that old is one the cache has already expired), the
hook makes one forced call to `/api/conditions/live`, which runs the same fetch with no
cache. The hook then hands the sources to `buildKayakData` (`lib/buildKayakData.ts`),
which `/api/briefing` also calls on the server so the briefing is written from the same
picture without trusting anything the browser sends.

A source that failed server-side comes back `null` (upstream as an empty forecast,
warnings as `[]`), and the hook falls back to its own last-known copy of just that
source (`paddlecheck_riverDataRaw` / `paddlecheck_weatherDataRaw` /
`paddlecheck_futureWeatherDataRaw` in `localStorage`); if the whole request fails, all
three fall back. So a single source blipping doesn't discard data that arrived fine
from the others. Upstream and warnings have no client cache. `lastUpdated` is the
response's `fetchedAt`, or the previous cached conditions' timestamp when no response
arrived at all.

`loading` / `forecastLoading` intentionally show a spinner for _every_ online fetch –
initial load, background refetch, manual refresh alike – so the spinner disappearing is
always a guarantee the data on screen just came from the network, never a silently-stale
cache. The one exception is being fully offline with a cache already loaded: there's no
fetch that can succeed to wait on, so the cache displays immediately and the "Offline –
showing cached data" banner (`TopNavBar`) communicates that it isn't live, instead of
spinning forever.

There is no background poll. Past `DATA_STALE_THRESHOLD_MS` (two cache windows, 30
minutes), the banner above the app bar distinguishes a failed update from data that has
simply aged: "Live update failed" only when `lastFetchStale` says the last fetch itself
couldn't get anything inside the cache window, and "Showing data from … – refresh for the
latest" when the page has just been left open since a successful fetch. Keep the banner
threshold well above `LIVE_REFETCH_AFTER_MS`: a successful refresh can return data up to
one window old, so a banner set just above the window comes back a minute or two after a
refresh that worked. Returning to the app (tab shown, signal back, back/forward restore)
refetches past `LIVE_REFETCH_AFTER_MS`, before the banner is due. `useFreshness` works
out staleness during render from a ticking clock rather than holding it in state, so the
render where a refresh lands never pairs the new data with the old "stale" flag.

`KayakDataContext.tsx` wraps this hook in React Context so all components can access it without prop drilling.

---

## Local Storage Keys

Canonical names live in `lib/storageKeys.ts`; cached payload keys are all
prefixed `paddlecheck_` and omitted here.

| Key                   | Value                                                                     |
| --------------------- | ------------------------------------------------------------------------- |
| `themeMode`           | `"light"` \| `"dark"` \| `"system"` (read/written by MUI)                 |
| `paddlerLevel`        | One of `paddlerLevels` (club file); anything else reads as unset          |
| `riverGraphTimeRange` | `"1h"` \| `"8h"` \| `"24h"` \| `"5d"` \| `"forecast"`                     |
| `autoSummarise`       | `"true"` \| `"false"` – auto-generate the AI summary on load              |
| `forecastShowNight`   | `"true"` \| `"false"` – show night hours in the forecast chart (Settings) |

---

## TypeScript Types (`types/index.ts`)

| Type                     | Description                                                                                                             |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| `Status`                 | A `STATUS_STEPS` name, or `"Unknown"` – Worcester: `"Light Green" \| "Dark Green" \| "Amber" \| "Red" \| "No Paddling"` |
| `KayakConditions`        | Full snapshot – status, river level, weather readings, reasons, timestamps                                              |
| `DayForecast`            | 24-hour bucket with hourly `ForecastGraphDataPoint[]`                                                                   |
| `ForecastGraphDataPoint` | Single hourly forecast – status, level, reasons, source (`"upstream"` \| `"linear"` \| `"held"`)                        |
| `RiverReading`           | `{ dateTime: string; value: number }`                                                                                   |
| `WeatherData`            | Current weather snapshot                                                                                                |
| `FutureWeatherData`      | 5-day hourly forecast + daily sunrise/sunset                                                                            |
| `PaddlingMatrix`         | One entry per `PaddlerType`, built from `WHO_CAN_PADDLE` (config) → verdict and guidance                                |

---

## Development Commands

```bash
npm install       # Install dependencies
npm run dev       # Start dev server at http://localhost:3000
npm run build     # Production build (needs CLUB, e.g. CLUB=wcc npm run build)
npm run lint      # ESLint check
```

Pre-commit lint runs via Husky. A `commit-msg` hook also runs commitlint,
rejecting commits whose first line isn't a valid Conventional Commit
(`type: subject`, type one of `feat`/`fix`/`perf`/`refactor`/`docs`/`chore`/
`style`/`test`/`build`/`ci`/`revert`). Merge commits are exempt.

---

## CI Pipeline

- **ci.yml** – runs `lint`, and `build` once per club file (`CLUB` matrix), on every push/PR to `main` (Node 22)
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
- No environment variables required to run `npm run dev` (`npm run build` needs `CLUB`)
- No multi-location support (hardcoded to Worcester)

---

## Key Configuration Constants (`lib/config.ts`)

Worcester's values, set in `clubs/wcc.yaml` except where noted.

| Constant                                       | Value                            | Meaning                                       |
| ---------------------------------------------- | -------------------------------- | --------------------------------------------- |
| `RIVER_STATION_ID`                             | `2642`                           | EA API station (Worcester, Barbourne)         |
| `UPSTREAM_CSV_URL`                             | `…/station-csv/2001`             | Upstream forecast CSV (`null` disables it)    |
| `UPSTREAM_TRAVEL_HOURS`                        | `6`                              | Travel time upstream → club gauge             |
| `UPSTREAM_TREND_HOURS`                         | `6`                              | Upstream trend window for the linear fallback |
| `LINEAR_FORECAST_HOURS`                        | `18`                             | Linear trend after upstream; level held after |
| `STATUS_STEPS[].fromLevel`                     | `0, 1.0, 1.48, 2.75, 5.0`        | Where each step starts (metres)               |
| `THRESHOLDS.TEMP_HIGH`                         | `13°C`                           | At or above: no temperature penalty           |
| `THRESHOLDS.TEMP_MODERATE`                     | `5°C`                            | At or below: cold water shock risk            |
| `THRESHOLDS.WIND_HIGH`                         | `15` mph                         | Above this: wind penalty applied              |
| `THRESHOLDS.VISIBILITY_POOR`                   | `1000` m                         | Below this: fog penalty applied               |
| `MET_OFFICE_WARNINGS_RSS_URL` / `WARNING_AREA` | `…/Region/wm` / `Worcestershire` | Warnings feed and the area filter             |
| Coordinates                                    | `52.2, -2.2`                     | Open-Meteo weather location                   |
