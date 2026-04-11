# Paddlecheck

Paddlecheck is a kayaking conditions dashboard that provides real-time information about river levels, weather, and other relevant data for kayakers.

> **Note:** This is primarily a hobby project, vibe coded for fun. Expect rough edges, and feel free to use it as inspiration for your own projects.

## Features

- **Real-time Conditions**: Up-to-date river status pulled from live gauge data.
- **PWA Support**: Installable as a mobile app for quick access on the water.
- **Themeable**: Switch between light, dark, and system themes.
- **Notifications**: Get notified about important changes in conditions.

## Data Sources

This app uses the following open, free-to-use data sources:

- **River Level Data**: [Environment Agency flood-monitoring API](https://environment.data.gov.uk/flood-monitoring/doc/api-reference.html)
- **Weather Data**: [Open-Meteo API](https://open-meteo.com/)

Neither API requires a key or account for non-commercial use.

## Getting Started

### Prerequisites

- Node.js (v18 or later)
- npm

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   ```
2. Navigate to the project directory:
   ```bash
   cd paddlecheck
   ```
3. Install dependencies:
   ```bash
   npm install
   ```

### Running the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Environment Variables

Create a `.env.local` file for any local configuration needed.

## Built With

- [Next.js](https://nextjs.org/) - React framework
- [Material-UI (MUI)](https://mui.com/) - UI component library
- [TypeScript](https://www.typescriptlang.org/) - Typed JavaScript
