import type { Metadata } from "next";
import "./globals.css";
import ThemeRegistry from "@/components/ThemeRegistry";
import BottomNavBar from "@/components/BottomNavBar";
import { Box } from "@mui/material";

export const metadata: Metadata = {
  title: "Paddlecheck",
  description: "Kayaking conditions dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <ThemeRegistry>
          <Box component="main" sx={{ pb: 7 }}>
            {children}
          </Box>
          <BottomNavBar />
        </ThemeRegistry>
      </body>
    </html>
  );
}
