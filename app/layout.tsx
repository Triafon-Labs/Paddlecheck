import type { Metadata } from "next";
import "./globals.css";
import localFont from "next/font/local";
import ThemeRegistry from "@/components/ThemeRegistry";
import TopNavBar from "@/components/TopNavBar";
import { Box } from "@mui/material";
import InitColorSchemeScript from "@mui/material/InitColorSchemeScript";
import { KayakDataProvider } from "@/lib/KayakDataContext";
import ServiceWorkerRegistration from "@/components/ServiceWorkerRegistration";
import { STORAGE_KEYS } from "@/lib/storageKeys";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

// Exposed as a CSS variable rather than a class, because the theme's type
// scale has to name the family (MUI writes font-family onto every Typography
// root, so it can't be inherited from <html>). next/font mangles the family
// name at build time - it is not "Roboto Flex" - so the theme has to reach it
// through this variable rather than by spelling the name out. See the
// fontFamily entry in lib/themes.ts.
const robotoFlex = localFont({
  src: "../node_modules/@fontsource-variable/roboto-flex/files/roboto-flex-latin-full-normal.woff2",
  weight: "100 900",
  style: "normal",
  variable: "--font-roboto-flex",
});

import { Viewport } from "next";

export const viewport: Viewport = {
  // Match the browser chrome to each scheme's page background (m3Light.surface
  // and the navy dark surface) instead of forcing dark chrome on light mode.
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F8F9FF" },
    { media: "(prefers-color-scheme: dark)", color: "#0A1929" },
  ],
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "Paddlecheck",
  description: "Kayaking conditions dashboard",
  appleWebApp: {
    statusBarStyle: "black-translucent",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // The init script below sets a colour-scheme class on <html> before React
    // hydrates, which would otherwise be reported as a hydration mismatch.
    <html lang="en" className={robotoFlex.variable} suppressHydrationWarning>
      <head>
        {/* Applies the saved colour scheme to <html> before the body is even
            parsed, so there's no window in which a flash of the wrong theme
            could paint. `attribute` and the storage key must match the
            ThemeProvider config in lib/ThemeContext.tsx. */}
        <InitColorSchemeScript
          attribute="class"
          defaultMode="system"
          modeStorageKey={STORAGE_KEYS.THEME_MODE}
        />
        <link rel="icon" href="/favicon.ico" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body>
        <ServiceWorkerRegistration />
        <ThemeRegistry>
          <KayakDataProvider>
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                minHeight: "100vh",
                bgcolor: "background.default",
              }}
            >
              <TopNavBar />
              <Box
                component="main"
                sx={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "flex-start",
                  pt: 4,
                  // Extra breathing room so the last card doesn't end flush
                  // with the bottom of the scroll, plus the home-indicator
                  // inset - viewportFit: "cover" lets content run underneath
                  // it on iOS, where the inset is 0 everywhere else. Spelled
                  // out rather than taken from theme.spacing because this is
                  // a server component, which can't pass an sx callback to
                  // the client-side Box.
                  pb: "calc(48px + env(safe-area-inset-bottom))",
                }}
              >
                {children}
              </Box>
            </Box>
          </KayakDataProvider>
        </ThemeRegistry>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
