"use client";

import { useCallback, useSyncExternalStore } from "react";
import { Box, Button, Paper, Typography } from "@mui/material";
import { DISCLAIMER, DISCLAIMER_VERSION } from "@/lib/config";
import { STORAGE_KEYS } from "@/lib/storageKeys";

const listeners = new Set<() => void>();
// Held in memory too, so accepting still hides the banner when storage is
// unavailable (private mode, blocked site data) - it just comes back next visit.
let acceptedThisSession = false;

const isAccepted = () => {
  if (acceptedThisSession) return true;
  try {
    return (
      localStorage.getItem(STORAGE_KEYS.DISCLAIMER_ACCEPTED) ===
      DISCLAIMER_VERSION
    );
  } catch {
    return false;
  }
};

const subscribe = (onChange: () => void) => {
  listeners.add(onChange);
  // Accepting in one tab clears the banner in the others.
  window.addEventListener("storage", onChange);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onChange);
  };
};

// The server can't see localStorage, so it renders as accepted (nothing) and
// the banner appears after hydration for anyone who hasn't accepted yet -
// rather than flashing it at everyone who has.
const getServerSnapshot = () => true;

// The first-run disclaimer. It sits at the foot of the screen until accepted
// rather than blocking the page, so the conditions stay readable behind it.
// Accepting stores DISCLAIMER_VERSION; bumping that asks everyone again.
export default function DisclaimerBanner() {
  const accepted = useSyncExternalStore(
    subscribe,
    isAccepted,
    getServerSnapshot
  );

  const accept = useCallback(() => {
    acceptedThisSession = true;
    try {
      localStorage.setItem(
        STORAGE_KEYS.DISCLAIMER_ACCEPTED,
        DISCLAIMER_VERSION
      );
    } catch {
      // Storage unavailable - acceptedThisSession covers this visit.
    }
    listeners.forEach((l) => l());
  }, []);

  if (accepted) return null;

  return (
    // Sticky rather than fixed: it rides the bottom of the screen while you
    // scroll, but at the end of the page it settles below the last card
    // instead of covering it.
    <Box
      sx={{
        position: "sticky",
        bottom: 0,
        zIndex: (theme) => theme.zIndex.appBar,
        px: 2,
        pb: 2,
        display: "flex",
        justifyContent: "center",
      }}
    >
      <Paper
        role="region"
        aria-label="Disclaimer"
        elevation={3}
        sx={{
          width: "100%",
          maxWidth: (theme) => theme.breakpoints.values.md - 32,
          p: 2,
          bgcolor: "surfaces.containerHigh",
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          alignItems: { xs: "stretch", sm: "center" },
          gap: 2,
        }}
      >
        <Typography variant="body2" sx={{ flex: 1 }}>
          {DISCLAIMER}
        </Typography>
        <Button
          variant="contained"
          onClick={accept}
          sx={{ flexShrink: 0, alignSelf: { xs: "flex-end", sm: "center" } }}
        >
          I understand
        </Button>
      </Paper>
    </Box>
  );
}
