import type { Metadata } from "next";
import "./globals.css";
import localFont from "next/font/local";
import ThemeRegistry from "@/components/ThemeRegistry";
import TopNavBar from "@/components/TopNavBar";
import { Box } from "@mui/material";
import { KayakDataProvider } from "@/lib/KayakDataContext";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

const robotoFlex = localFont({
  src: "../node_modules/@fontsource-variable/roboto-flex/files/roboto-flex-latin-full-normal.woff2",
  weight: "100 900",
  style: "normal",
});

import { Viewport } from "next";

export const viewport: Viewport = {
  themeColor: "#0A1929",
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
    <html lang="en" className={robotoFlex.className}>
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body style={{ fontFamily: "inherit" }}>
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
                  pb: 4,
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
