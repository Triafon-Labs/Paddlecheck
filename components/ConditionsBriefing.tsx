"use client";

import { useEffect, useState } from "react";
import { Box, Typography, Fade } from "@mui/material";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import { KayakConditions } from "@/types";
import InfoPanel from "./InfoPanel";
import { useKayakContext } from "@/lib/KayakDataContext";
import { useBriefing } from "@/lib/useBriefing";
import { DEFAULT_AI_MODEL } from "@/lib/config";
import { STORAGE_KEYS } from "@/lib/storageKeys";
import { m3Spring, springTransition } from "@/lib/m3-palette";

export const SETTINGS_CHANGED_EVENT = "paddlecheck:settings-changed";

interface Props {
  conditions: KayakConditions;
  model?: string;
}

export default function ConditionsBriefing({
  conditions,
  model = DEFAULT_AI_MODEL,
}: Props) {
  const { forecastDays } = useKayakContext();
  const [auto, setAuto] = useState(
    () =>
      typeof window !== "undefined" &&
      localStorage.getItem(STORAGE_KEYS.AUTO_SUMMARISE) === "true"
  );

  useEffect(() => {
    const handler = () =>
      setAuto(localStorage.getItem(STORAGE_KEYS.AUTO_SUMMARISE) === "true");
    window.addEventListener(SETTINGS_CHANGED_EVENT, handler);
    return () => window.removeEventListener(SETTINGS_CHANGED_EVENT, handler);
  }, []);

  const { text, loading, failed, triggered, trigger } = useBriefing(
    conditions,
    forecastDays,
    auto,
    model
  );

  // Untriggered, the whole panel is the button. It used to be a dotted-underline
  // link inside a static panel: a text-height tap target, well under the 48dp
  // M3 asks of a touch control, on the one genuinely interactive thing in the
  // status card. The panel was already the right size and shape - it just
  // wasn't the control.
  if (!triggered) {
    return (
      <InfoPanel onClick={trigger} ariaLabel="Generate AI summary">
        <AutoAwesomeIcon fontSize="small" sx={{ color: "primary.main" }} />
        <Typography variant="body2" color="text.secondary">
          Generate AI Summary
        </Typography>
      </InfoPanel>
    );
  }

  // A failed summary is a retry control, so it takes the same whole-panel
  // button as the untriggered state rather than hanging a "Try again?" link
  // off the end of a sentence.
  if (failed) {
    return (
      <InfoPanel onClick={trigger} ariaLabel="Retry AI summary">
        <AutoAwesomeIcon fontSize="small" sx={{ color: "primary.main" }} />
        <Typography variant="body2" color="text.secondary">
          Summary unavailable. Try again?
        </Typography>
      </InfoPanel>
    );
  }

  return (
    <InfoPanel align="flex-start">
      <AutoAwesomeIcon
        fontSize="small"
        sx={{ color: "primary.main", mt: "2px" }}
      />
      <Fade in appear {...springTransition(m3Spring.effectsDefault)}>
        <Typography variant="body2" sx={{ lineHeight: 1.65 }}>
          {loading && !text.trim() ? (
            <Box
              component="span"
              sx={{
                fontStyle: "italic",
                animation: "thinking 2s ease-in-out infinite",
                "@keyframes thinking": {
                  "0%, 100%": { opacity: 0.15 },
                  "50%": { opacity: 0.65 },
                },
              }}
            >
              Thinking…
            </Box>
          ) : (
            text
          )}
          {loading && text.trim() && (
            <Box component="span" sx={{ opacity: 0.35 }}>
              ▋
            </Box>
          )}
        </Typography>
      </Fade>
    </InfoPanel>
  );
}
