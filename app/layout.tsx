import type { Metadata } from "next";
import "./globals.css";
import localFont from "next/font/local";
import ThemeRegistry from "@/components/ThemeRegistry";
import TopNavBar from "@/components/TopNavBar";
import DisclaimerBanner from "@/components/DisclaimerBanner";
import { Box } from "@mui/material";
import InitColorSchemeScript from "@mui/material/InitColorSchemeScript";
import { KayakDataProvider } from "@/lib/KayakDataContext";
import ServiceWorkerRegistration from "@/components/ServiceWorkerRegistration";
import { STORAGE_KEYS } from "@/lib/storageKeys";
import { APP_NAME, CLUB_NAME } from "@/lib/config";
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
  title: `${APP_NAME} – ${CLUB_NAME}`,
  description: "Kayaking conditions dashboard",
  appleWebApp: {
    // iOS names a home-screen app after the page title unless told
    // otherwise, and the title carries the club name too.
    title: APP_NAME,
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
        {/* Browsers that support SVG favicons prefer it and stay sharp at any
            density; the .ico and PNG cover the rest. */}
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link
          rel="icon"
          type="image/png"
          sizes="96x96"
          href="/favicon-96x96.png"
        />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body>
        <ServiceWorkerRegistration />
        <ThemeRegistry>
          <KayakDataProvider>
            {/* viewportFit: "cover" above, plus the black-translucent status
                bar and display: standalone in the manifest, hand the installed
                iOS app the whole screen - including the strips behind the
                status bar, the home indicator and (in landscape) the rounded
                corners. Inset the frame by those strips so the nav bar and the
                cards don't sit underneath them. Every inset resolves to 0 off
                a notched device, so this is inert everywhere else. It sits on
                the frame rather than on the bar or the content because either
                one can be topmost: the offline/stale banners render above the
                AppBar. The exposed strips take this Box's background, which is
                both what the AppBar inherits and what themeColor declares, so
                they read as part of the page. */}
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                // dvh rather than vh: in a mobile browser tab vh measures the
                // viewport with the URL bar retracted, so 100vh leaves the
                // page permanently taller than what is actually on screen.
                minHeight: "100dvh",
                bgcolor: "background.default",
                pt: "env(safe-area-inset-top)",
                pb: "env(safe-area-inset-bottom)",
                pl: "env(safe-area-inset-left)",
                pr: "env(safe-area-inset-right)",
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
                  // Matches the gap between the cards below, so the first one
                  // sits the same distance from the app bar as the next does
                  // from it - 32px here would have been the last odd value in
                  // an otherwise single-step page.
                  pt: 2,
                  pb: 2,
                }}
              >
                {children}
              </Box>
              <DisclaimerBanner />
            </Box>
          </KayakDataProvider>
        </ThemeRegistry>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
