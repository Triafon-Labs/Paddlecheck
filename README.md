# Paddlecheck

A kayaking conditions dashboard providing real-time river levels, weather, and a RAG (Red-Amber-Green) paddling safety status. Built for Worcester Canoe Club on the River Severn, but designed to be adapted for any club in England on a river with an [Environment Agency](https://environment.data.gov.uk/flood-monitoring/doc/api-reference.html) monitoring station.

> **Note:** This is primarily a hobby project, vibe coded for fun. Expect rough edges, and feel free to use it as inspiration for your own projects.

> **Safety:** Paddlecheck is a guide, not a substitute for judgement. Its status comes from automated feeds that can be late, wrong or missing, and from rules that were written for one stretch of one river. Always check conditions on the bank, and follow your own club's rules and coaches.

## Features

- **RAG status** – a five-step rating (Light Green, Dark Green, Amber, Red, No Paddling) from river level, temperature, wind, rain, visibility, thunderstorms and daylight
- **Who can paddle** – what each paddler level (Beginner, Improver, Intermediate, Independent) may do under the current status
- **River level graph** – the last five days of readings, plus a short forecast from an upstream gauge
- **5-day forecast** – hourly RAG status for the coming days; tap an hour for its details
- **Landmarks** – the current reading placed between the club's own recorded landmarks ("water over the landing stage")
- **Met Office weather warnings** for the club's area
- **AI conditions summary** (optional) – a short plain-English briefing, generated with [Groq](https://groq.com/)
- **PWA** – installable on a phone's home screen, and opens offline with the last data it fetched
- **Light/dark/system theme**

## How It Works

The browser only talks to the app's own API routes. `/api/conditions` fetches every upstream source server-side, in parallel, and caches the combined result for 15 minutes, so the number of visitors doesn't change how often the upstream services are hit.

| Data                             | Source                                                                                                             | Key needed           |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------ | -------------------- |
| River level readings             | [Environment Agency flood-monitoring API](https://environment.data.gov.uk/flood-monitoring/doc/api-reference.html) | No                   |
| Upstream river forecast          | The station CSV download on [Check for flooding](https://check-for-flooding.service.gov.uk/)                       | No                   |
| Weather (current + 5-day hourly) | [Open-Meteo](https://open-meteo.com/)                                                                              | No                   |
| Weather warnings                 | [Met Office regional warnings RSS](https://www.metoffice.gov.uk/weather/guides/rss)                                | No                   |
| AI summary                       | [Groq](https://console.groq.com/)                                                                                  | Yes (`GROQ_API_KEY`) |

The river level sets a base status. Temperature, wind and (in cool weather) rain then adjust it through a lookup table, and darkness and fog each push Green to Amber and Amber to Red. Thunderstorms or a river above the top threshold mean No Paddling regardless.

The level forecast works in three stages: an upstream gauge's published forecast, shifted forward by the time water takes to travel down to your gauge; then a continuation of the recent trend for up to 18 hours; then the level held flat, so the furthest-out hours are driven by the weather alone.

If one source fails, the rest still load, and the browser falls back to its own last copy of the failed source.

## Tech Stack

- [Next.js](https://nextjs.org/) 16 (App Router) and React 19
- [Material UI (MUI)](https://mui.com/)
- [TypeScript](https://www.typescriptlang.org/)
- [Recharts](https://recharts.org/) – graphs
- [Groq SDK](https://console.groq.com/docs/libraries) – AI summary
- A small hand-written service worker (`public/sw.js`) for offline support

There's no database, no login, and no automated test suite.

## Getting Started

### Prerequisites

- Node.js v22 or later (matches CI and `engines.node` in `package.json`)
- npm
- Git

### Installation

```bash
git clone https://github.com/dylanr97/Paddlecheck.git
cd Paddlecheck
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser. Everything except the AI summary works with no further setup.

### AI summary (optional)

The summary needs a [Groq API key](https://console.groq.com/keys) (Groq has a free tier). Create a file called `.env.local` in the project root:

```bash
GROQ_API_KEY=your-key-here
```

Without a key the rest of the app is unaffected, but the summary panel will show an error when it's asked to generate one. The model used is `DEFAULT_AI_MODEL` in `lib/config.ts`.

The server builds the summary from its own copy of the conditions and only reads the model name from the browser, so visitors can't send their own text to Groq on your key. Generated summaries are cached for each 15-minute data window, so most visits don't make a Groq call at all.

### Commands

```bash
npm run dev     # Development server at http://localhost:3000
npm run build   # Production build
npm start       # Serve the production build
npm run lint    # ESLint
```

The service worker only registers in a production build, so use `npm run build && npm start` to test offline behaviour or installing the app.

## Adapting for Your Club

### Before you start: will it work for your river?

- **England only, as it stands.** River levels come from the Environment Agency, which covers England. Wales (Natural Resources Wales), Scotland (SEPA) and Northern Ireland have separate services with different APIs, so a club there would need to rewrite `fetchRiverData` in `lib/river.ts`. The weather and Met Office warnings cover the whole UK; Open-Meteo works worldwide.
- **You need a level gauge** near your launch point. Check that it reports a level in metres (some stations only report flow) and that it updates regularly – most report every 15 minutes.
- **UK time is assumed.** Times are handled in `Europe/London` throughout (`lib/time.ts`, `lib/warnings.ts`, `lib/weather.ts`).
- **The rules are Worcester's.** The thresholds, the weather table, which factors count and the "who can paddle" guidance all encode Worcester Canoe Club's rules. Don't deploy for your club until you've replaced them with your own, agreed by whoever is responsible for safety in your club.

### Fork or clone?

- **Fork on GitHub** if you want your own hosted copy. This is the simplest route, and it lets you pull in later improvements from this repository (GitHub's "Sync fork" button).
- **Clone and push to a new repository** if you'd rather your copy had no visible link back to this one. You can still pull updates by adding this repository as a second remote.

Either way, if your changes stay in `club.yaml` (and `public/` for icons), taking updates later is painless: they'll almost never touch the same files.

### Your settings: `club.yaml`

Everything about your club is in **`club.yaml`** at the top of the project – no other file needs to change, except to swap the icons. Every setting has a comment above it explaining what it does, so the file itself is the main guide. This section covers the parts that need more than a comment.

YAML is a plain-text settings format. The things that trip people up:

- **Indentation is meaningful.** Use spaces, two per level, never tabs, and keep items in the same section lined up.
- **Quote text that contains `: ` or ` #`**, or starts with a symbol (`*`, `&`, `!`, `[`, `{`, `>`, `|`, `%`, `@` or a quote mark).
- **Quote `"Yes"` and `"No"`** in verdicts.

**Checking your changes.** `npm run dev` and `npm run build` check `club.yaml` first and stop with a message naming any problem:

```text
club.yaml has 2 problems:
  • steps → "Amber" → colour: "orange" isn't one of: red, maroon, amber, yellow, darkGreen, lightGreen, grey
  • whoCanPaddle → "Amber": "Improver" is missing – give one verdict for everyone, or one for every level
```

An indentation slip gives the line and column instead. With `npm run dev` running, changes show up in the browser as soon as you save.

**Editor help (optional).** In [VS Code](https://code.visualstudio.com/) with the [YAML extension](https://marketplace.visualstudio.com/items?itemName=redhat.vscode-yaml), `club.yaml` gets suggestions as you type and mistakes underlined. The first line of the file links it to `club.schema.json`, which describes every setting.

#### River gauge (`river.stationId`)

To find your station:

1. Search the [station list](https://environment.data.gov.uk/flood-monitoring/id/stations?parameter=level) – add `&riverName=<river>`, `&town=<town>` or `&search=<name>` to the URL to narrow it down, or `&lat=<lat>&long=<long>&dist=10` for stations within 10 km of your club.
2. Copy the station's `stationReference` (or the last part of its `@id` URL).

**There are two ID schemes, and they're easy to mix up.** The flood-monitoring API (used here) and the public [Check for flooding](https://check-for-flooding.service.gov.uk/) website number stations differently. Worcester Barbourne is `2642` in the API but `2092` on the website – the website's number is the `RLOIid` field in the API's station record. `stationId` needs the API number; `usefulLinks` and `forecastCsv` use the website's.

Check you have the right one by opening `https://environment.data.gov.uk/flood-monitoring/id/stations/<ID>/readings?_sorted&_limit=5` – you should see recent level readings.

#### Level forecast (`river.forecastCsv`, `river.travelHours`)

A gauge with an Environment Agency forecast lets the app see a rise coming. Its forecast is shifted forward by `travelHours`, and the change it predicts is added to your own gauge's latest reading.

- **Only some stations publish a forecast** – generally the larger rivers. Open `https://check-for-flooding.service.gov.uk/station-csv/<website-ID>`: a usable station's CSV has a third column marked `observed` or `forecast`. With only two columns there's no forecast, and the app carries on as if there were no forecast gauge.
- **Your own gauge has a forecast?** Use its CSV with `travelHours: 0`. The app then follows your gauge's own forecast, which beats estimating from upstream.
- **An upstream gauge instead?** `travelHours` is how long a change there takes to show at yours. Estimate it by comparing the two gauges' graphs after a rise, peak to peak.
- **Neither?** Use `forecastCsv: null`. The forecast continues your gauge's trend over the last 8 hours, for up to 18 hours, then holds the level flat.

The CSV comes from the Check for flooding website rather than a documented API, so it could change without notice. If it does, the app falls back to the trend.

#### Status steps (`steps`)

The scale conditions are rated on, best first – Worcester has five, use as many as your rules have. **Levels are relative to your gauge**, not depth: each station has its own datum, so `fromLevel` values have to come from your own observations.

The last step is special. Only the river passing its `fromLevel`, or a thunderstorm, can reach it; weather, darkness and fog stop one step short. It doesn't have to mean "no paddling" – what each level may do on it is up to `whoCanPaddle` – but as thunderstorms also lead there, give it a name that fits both.

#### Weather (`rules`, `thresholds`, `weatherTable`)

`rules` switches each factor on or off; with all four off, the river level alone sets the status. When `weatherTable` is on, each row of the table gives the resulting step for each river level band, with steps numbered from 0 in `steps` order – so there's one entry per step except the last. For Worcester, `moderate: windy: [2, 2, 2, 3]` means cool and windy is at least Amber.

#### Who can paddle (`paddlerLevels`, `whoCanPaddle`, `whoCanPaddleExtras`)

`whoCanPaddle` gives each step either one verdict for everyone or one per paddler level. `whoCanPaddleExtras` covers what a table can't – rules that depend on the river level rather than the step, or that add the same line to several levels. Worcester's three show the patterns: no intermediates above the 10th step even when the weather made it Red, PFDs above the concrete step, and luminous bibs.

#### Landmarks (`landmarks`)

What the river looks like at particular gauge readings, shown either side of the current level. Build it up by noting the gauge reading each time you visit at a different level; it can start empty (`landmarks: {}`).

#### Icons (optional)

The logo and app icons are the files in `public/`. The installable icons are all rendered from `public/favicon.svg`, so replace that and regenerate the PNGs at the same sizes ([RealFaviconGenerator](https://realfavicongenerator.net/) does the lot).

### Going further

If you want to change behaviour rather than settings, these are the places to start:

| File                        | What it does                                             |
| --------------------------- | -------------------------------------------------------- |
| `lib/clubConfig.ts`         | Reads and checks `club.yaml`                             |
| `lib/config.ts`             | The app's own settings, plus the club's from `club.yaml` |
| `lib/rag.ts`                | How a river level and the weather become a status        |
| `lib/buildKayakData.ts`     | Raw data → current conditions and the hourly forecast    |
| `lib/hooks.ts`              | Fetching on the client, and the offline fallback         |
| `lib/conditions.ts`         | The server-side fetch of every upstream source           |
| `lib/river.ts`              | River readings and the upstream forecast                 |
| `lib/weather.ts`            | Open-Meteo requests                                      |
| `app/api/briefing/route.ts` | The AI summary prompt                                    |
| `types/index.ts`            | Every shared data type                                   |

[`AGENTS.md`](AGENTS.md) is a fuller technical reference to the codebase – it's written for AI coding assistants, but it reads fine for people too.

## Hosting

The app is a standard Next.js app, but it needs a server (the API routes fetch and cache the data), so a static host such as GitHub Pages won't work.

### Vercel (recommended)

[Vercel](https://vercel.com) is what this project uses, and needs no configuration:

1. Sign in to Vercel with GitHub and **Add New → Project**, then import your repository.
2. If you want the AI summary, add `GROQ_API_KEY` under **Environment Variables**.
3. Deploy. Every push to `main` redeploys, and pull requests get preview deployments.

You'll get a `<project>.vercel.app` address, and can add your own domain under the project's **Domains** settings. Vercel's free Hobby plan is meant for personal, non-commercial use; check [their terms](https://vercel.com/docs/limits/fair-use-guidelines) cover a club site, or use the Pro plan.

The app includes [Vercel Web Analytics](https://vercel.com/docs/analytics) and [Speed Insights](https://vercel.com/docs/speed-insights). They do nothing until you enable them in the Vercel dashboard. To remove them altogether, delete `<Analytics />` and `<SpeedInsights />` from `app/layout.tsx`.

### Elsewhere

Any host that runs Node 22 works – for example [Netlify](https://www.netlify.com/) (which supports Next.js directly), or your own server:

```bash
npm ci
npm run build
GROQ_API_KEY=your-key-here npm start   # serves on port 3000
```

Off Vercel, the analytics scripts simply fail to load; remove them as above if you'd rather they weren't requested at all. Make sure the site is served over HTTPS, or the service worker won't register and the app can't be installed.

## GitHub Actions in a Fork

GitHub turns Actions off in a new fork until you enable them on the **Actions** tab. Once on:

| Workflow         | What it does                                                                                                                               | In your fork                                                                                                                                                     |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ci.yml`         | Lint and build on every push and pull request                                                                                              | Keep it                                                                                                                                                          |
| `auto-tag.yml`   | On every push to `main`, bumps the version, updates `CHANGELOG.md` and pushes a tag                                                        | Optional. Delete it if you don't want release commits; it needs to be able to push to `main`                                                                     |
| `keep-alive.yml` | Every 5 minutes, loads the site and `/api/conditions`, and fails if any data source is down – a failed run sends you a GitHub notification | **Point it at your own site** by adding a repository variable `SITE_URL` (Settings → Secrets and variables → Actions → Variables). Until you do, it skips itself |

`.github/dependabot.yml` opens pull requests for dependency updates. Delete it if you'd rather not get them.

## Development Notes

- Commit messages must follow [Conventional Commits](https://www.conventionalcommits.org/) (`feat: ...`, `fix: ...`); a Git hook rejects anything else. The version bump and changelog are generated from them.
- UK English throughout ("colour", "licence").

## Data Sources and Licences

The About section of the Settings drawer carries the credits the licences below ask for – keep it if you change that screen. If you deploy your own copy, you're responsible for meeting each source's terms:

- **Environment Agency** data is under the [Open Government Licence v3.0](https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/), which requires an attribution statement: _"This uses Environment Agency flood and river level data from the real-time data API (Beta)."_
- **Open-Meteo**'s free API is for [non-commercial use](https://open-meteo.com/en/terms), with data under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) – credit Open-Meteo.
- **Met Office** warnings: see the [Met Office terms](https://www.metoffice.gov.uk/about-us/legal).
- **Groq**: see [Groq's terms](https://groq.com/terms-of-use/). The current conditions are sent to Groq to generate the summary; nothing about the user is.

## Licence

[MIT](LICENSE). You can use, change and redistribute this freely, including for your own club, as long as the licence notice stays with the code.
