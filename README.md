# Paddlecheck

Paddlecheck is a kayaking conditions dashboard that provides real-time information about river levels, weather, and other relevant data for kayakers.

## ✨ Features

- **Real-time Conditions**: Get up-to-date information on river status.
- **PWA Support**: Installable as a mobile app for easy access.
- **Themeable**: Switch between light, dark, and system themes.
- **Notifications**: Get notified about important changes in conditions.

## 📊 Data Sources

This application uses the following open data sources:

- **River Level Data**: Real-time river level information is sourced from the [Environment Agency's flood-monitoring API](https://environment.data.gov.uk/flood-monitoring/doc/api-reference.html).
- **Weather Data**: Weather forecasts are provided by the [Open-Meteo API](https://open-meteo.com/).

Both of these APIs are free to use for non-commercial purposes and do not require an API key.

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or later)
- npm

### Installation

1.  Clone the repository:
    ```bash
    git clone <repository-url>
    ```
2.  Navigate to the project directory:
    ```bash
    cd paddlecheck
    ```
3.  Install the dependencies:
    ```bash
    npm install
    ```

### Running the Development Server

To start the development server, run:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Environment Variables

Create a `.env.local` file for local development.

## 🛠️ Built With

- [Next.js](https://nextjs.org/) - React Framework
- [Material-UI (MUI)](https://mui.com/) - UI Component Library
- [TypeScript](https://www.typescriptlang.org/) - Typed JavaScript
