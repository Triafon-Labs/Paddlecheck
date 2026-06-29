# Paddlecheck

A kayaking conditions dashboard providing real-time river levels, weather, and a RAG (Red-Amber-Green) paddling safety status. Built for Worcester Canoe Club on the River Severn, but designed to be adapted for any club or river with an [Environment Agency](https://environment.data.gov.uk/flood-monitoring/doc/api-reference.html) monitoring station.

> **Note:** This is primarily a hobby project, vibe coded for fun. Expect rough edges, and feel free to use it as inspiration for your own projects.

## Features

- **RAG status** – Red/Amber/Green paddling safety rating based on river level, temperature, wind, visibility, and time of day
- **River level graph** – historical readings plus a near-future forecast using an upstream gauge
- **5-day forecast** – hourly RAG status for the coming days
- **Skill-level matrix** – paddling guidance broken down by paddler level (Beginner → Independent)
- **PWA** – installable as a mobile app for quick access on the water
- **Light/dark/system theme**

## How It Works

The app fetches live data from two public APIs (no authentication or API keys required):

- **River levels** – [Environment Agency flood-monitoring API](https://environment.data.gov.uk/flood-monitoring/doc/api-reference.html)
- **Weather** – [Open-Meteo API](https://open-meteo.com/)

River level, temperature, wind speed, visibility, weather codes, and time of day are combined into a RAG status using a configurable threshold table. An optional upstream gauge reading is shifted forward by a configurable number of hours to improve near-future level forecasts.

## Tech Stack

- [Next.js](https://nextjs.org/) (App Router)
- [Material UI (MUI)](https://mui.com/)
- [TypeScript](https://www.typescriptlang.org/)
- [Recharts](https://recharts.org/) – graphs
- [Workbox](https://developer.chrome.com/docs/workbox/) – PWA / service worker

## Getting Started

### Prerequisites

- Node.js v18 or later
- npm

### Installation

```bash
git clone <repository-url>
cd paddlecheck
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Adapting for Your Club

All club-specific configuration lives in **`lib/config.ts`**. No other files need to change for a basic adaptation. Here is what to update:

### 1. Club identity

```ts
export const CLUB_NAME = "Worcester Canoe Club";
export const CONTACT_EMAIL = "REDACTED";
```

Update these to your club name and a contact email for the About section.

### 2. Useful links

```ts
export const USEFUL_LINKS = [ ... ];
```

Replace or extend with links relevant to your venue (e.g. your own station page, club website).

### 3. River gauge station

The app uses the Environment Agency flood-monitoring API. To find your station:

1. Browse stations at [https://environment.data.gov.uk/flood-monitoring/id/stations](https://environment.data.gov.uk/flood-monitoring/id/stations) – you can filter by `?label=<river name>` or `?town=<town>`.
2. Copy the numeric station ID from the URL (e.g. `2642` from `.../stations/2642`).

```ts
export const RIVER_STATION_ID = "2642"; // replace with your station ID
```

### 4. Location coordinates

Set your club's latitude and longitude. These are used to fetch local weather from Open-Meteo.

```ts
export const LATITUDE = 52.2;
export const LONGITUDE = -2.2;
```

### 5. Safety thresholds

`THRESHOLDS` controls when the status escalates between Green, Amber, Red, and No Paddling. Adjust these to match your club's safety guidelines:

| Key                         | Meaning                                                        |
| --------------------------- | -------------------------------------------------------------- |
| `RIVER_LEVEL_INITIAL_RAG_1` | Level (m) at which status moves from Light Green → Dark Green  |
| `RIVER_LEVEL_INITIAL_RAG_2` | Level (m) at which status moves to Amber                       |
| `RIVER_LEVEL_INITIAL_RAG_3` | Level (m) at which status moves to Red                         |
| `RIVER_LEVEL_NO_PADDLING`   | Level (m) above which paddling is forbidden                    |
| `TEMP_HIGH`                 | Temperature (°C) above which cold water is not a factor        |
| `TEMP_MODERATE`             | Temperature (°C) below which cold water raises the risk rating |
| `WIND_HIGH`                 | Wind speed (mph) above which wind raises the risk rating       |

### 6. River level descriptions

`LEVEL_DESCRIPTIONS` maps specific gauge readings (in metres) to landmark-based descriptions, e.g. "water over the landing stage". These are entirely specific to your venue.

Build your own list by visiting your river at different levels and noting the gauge reading alongside what you observe. You can leave this empty until you have enough observations.

```ts
export const LEVEL_DESCRIPTIONS: Record<number, string> = {
  1.0: "Able to launch from the landing stage",
  // ...
};
```

### 7. Conditions key descriptions

`RAG_DESCRIPTIONS` and `RIVER_LEVEL_BAND_DESCRIPTIONS` contain the text shown in the Settings drawer conditions key. Update these to reflect your own venue landmarks and club safety rules.

### 8. Upstream station (optional)

The app can use an upstream gauge to improve near-future level forecasts. The upstream reading is shifted forward by `BEWDLEY_TRAVEL_HOURS` to estimate when a flood wave will arrive at your location.

```ts
export const BEWDLEY_CSV_URL =
  "https://check-for-flooding.service.gov.uk/station-csv/2001";
export const BEWDLEY_TRAVEL_HOURS = 6;
```

CSV export URLs follow the pattern `https://check-for-flooding.service.gov.uk/station-csv/<station-id>`. If you don't have a useful upstream station, the forecast feature will simply not show.

### 9. Venue-specific flood plain (optional)

`PITCHCROFT_PADDLEABILITY` describes paddleability of Worcester's Pitchcroft flood plain at high water. Remove or replace this if your venue doesn't have a similar feature.

## Deployment

The app is a standard Next.js application. [Vercel](https://vercel.com) is the simplest deployment option – connect your fork and it deploys automatically on every push to `main`. No environment variables are required.

## Built With

- [Next.js](https://nextjs.org/)
- [Material-UI (MUI)](https://mui.com/)
- [TypeScript](https://www.typescriptlang.org/)
- [Recharts](https://recharts.org/)
- [Open-Meteo](https://open-meteo.com/)
- [Environment Agency flood-monitoring API](https://environment.data.gov.uk/flood-monitoring/doc/api-reference.html)
