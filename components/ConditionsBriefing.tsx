"use client";

import { useEffect, useState } from "react";
import { Box, Typography, Fade, Skeleton } from "@mui/material";
import NotesIcon from "@mui/icons-material/Notes";
import { KayakConditions } from "@/types";
import InfoPanel from "./InfoPanel";
import { useKayakContext } from "@/lib/KayakDataContext";
import { useBriefing } from "@/lib/useBriefing";
import { buildBestConditionsLine } from "@/lib/forecast";
import { DEFAULT_AI_MODEL } from "@/lib/config";
import { STORAGE_KEYS, SETTINGS_CHANGED_EVENT } from "@/lib/storageKeys";
import { m3Spring, springTransition } from "@/lib/m3-palette";

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
      <InfoPanel onClick={trigger} ariaLabel="Show conditions report">
        <NotesIcon fontSize="small" sx={{ color: "primary.main" }} />
        <Typography variant="body2" color="text.secondary">
          Show Conditions Report
        </Typography>
      </InfoPanel>
    );
  }

  // A failed summary is a retry control, so it takes the same whole-panel
  // button as the untriggered state rather than hanging a "Try again?" link
  // off the end of a sentence. A stream that finished empty is a failure
  // too, or the skeleton below would hold forever.
  if (failed || (!loading && !text.trim())) {
    return (
      <InfoPanel onClick={trigger} ariaLabel="Retry conditions report">
        <NotesIcon fontSize="small" sx={{ color: "primary.main" }} />
        <Typography variant="body2" color="text.secondary">
          Conditions report unavailable. Try again?
        </Typography>
      </InfoPanel>
    );
  }

  // The best-window line is worked out here from the forecast, the same one
  // the share text carries, rather than asked of the model: it's a fact the
  // app already knows exactly, and leaving statuses out of the prompt keeps
  // the model describing conditions instead of grading them.
  const bestConditions = buildBestConditionsLine(
    forecastDays,
    conditions.overallStatus
  );

  // The reply streams in, but it is held back until it is complete and then
  // faded in whole: a "Thinking…" label and words typing themselves out behind
  // a cursor read as a chatbot, where a skeleton reads as any other content
  // loading. The skeleton matches the two or three lines the report runs to.
  return (
    <InfoPanel align="flex-start">
      <NotesIcon fontSize="small" sx={{ color: "primary.main", mt: "2px" }} />
      {!loading ? (
        <Fade in appear {...springTransition(m3Spring.effectsDefault)}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="body2" sx={{ lineHeight: 1.65 }}>
              {text}
            </Typography>
            {bestConditions && (
              <Typography
                variant="body2"
                sx={{ lineHeight: 1.65, mt: 1, fontWeight: 500 }}
              >
                {bestConditions}
              </Typography>
            )}
          </Box>
        </Fade>
      ) : (
        <Box
          role="status"
          aria-label="Loading conditions report"
          sx={{ flex: 1, minWidth: 0 }}
        >
          {["100%", "100%", "60%"].map((width, i) => (
            <Typography key={i} variant="body2" sx={{ lineHeight: 1.65 }}>
              <Skeleton variant="text" width={width} animation="wave" />
            </Typography>
          ))}
        </Box>
      )}
    </InfoPanel>
  );
}
