# Paddlecheck

Paddlecheck is a kayaking conditions dashboard that provides real-time information about river levels, weather, and other relevant data for kayakers.

## ✨ Features

*   **Real-time Conditions**: Get up-to-date information on river status.
*   **PWA Support**: Installable as a mobile app for easy access.
*   **Themeable**: Switch between light, dark, and system themes.
*   **Notifications**: Get notified about important changes in conditions.

## 🚀 Getting Started

### Prerequisites

*   Node.js (v18 or later)
*   npm

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

## 🚀 Deployment on Render

This application is ready to be deployed on [Render](https://render.com/).

You can deploy it as a "Web Service". Use the following settings during creation:

-   **Build Command**: `npm install && npm run build`
-   **Start Command**: `npm start`

### Environment Variables

Create a `.env.local` file for local development. For production on Render, add environment variables in the Render dashboard.

## 🛠️ Built With

*   [Next.js](https://nextjs.org/) - React Framework
*   [Material-UI (MUI)](https://mui.com/) - UI Component Library
*   [TypeScript](https://www.typescriptlang.org/) - Typed JavaScript
