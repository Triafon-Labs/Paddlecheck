"use client";

import React from "react";
import { Box, Typography } from "@mui/material";
import { Status } from "@/types";
import { ragStatus, statusLabel } from "@/lib/rag";
import { RAG_STATUS_MAP } from "@/lib/config";
import { m3Spring, spring } from "@/lib/m3-palette";

interface PaddlingStatusHeroProps {
  status: Status;
}

// The RAG scale in order of severity. Read out of RAG_STATUS_MAP by index
// rather than Object.values so the order is the calculation's own 0-3 ramp,
// not whatever order the keys happen to be declared in, with the stop state
// pinned on the end.
const SCALE: Status[] = [
  ...[0, 1, 2, 3].map((n) => RAG_STATUS_MAP[n]),
  "No Paddling",
];

// The single answer the page exists to give, at the size that answer deserves.
//
// It replaces the four-lamp traffic light, which spent its largest elements on
// the three statuses that don't apply and set the one that does in h6 - a step
// *below* the h5 card title above it. Here the status label is Display Small,
// the panel carries the status colour as a saturated fill rather than a pale
// Material 2 tint, and the scale survives as the strip underneath, so "which
// of the five are we on" is still legible without it outweighing "which one".
//
// All six statuses get the identical panel - same shape, same icon
// treatment, same type. No Paddling shares the RAG red with the Red status
// and is told apart by its icon and its label, which is the one pairing in
// the app where the hue alone doesn't carry the difference. Every darker red
// that would has to sit on the dark scheme's navy card, where it drops to
// 1.0-1.2:1 against it and the panel stops reading as a shape at all.
const PaddlingStatusHero: React.FC<PaddlingStatusHeroProps> = ({ status }) => {
  const { icon: Icon, color, onColor } = ragStatus[status];

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: { xs: 1.75, sm: 2.5 },
          p: { xs: 2, sm: 3 },
          borderRadius: "28px",
          backgroundColor: color,
          color: onColor,
          transition: spring("background-color", m3Spring.effectsDefault),
        }}
      >
        <Icon sx={{ fontSize: { xs: 40, sm: 56 }, flexShrink: 0 }} />

        <Typography
          variant="h3"
          component="p"
          sx={{
            minWidth: 0,
            // The label is the only text on the page that has to survive being
            // read at arm's length in the rain, so it takes M3's emphasised
            // weight rather than the scale's default 400.
            fontWeight: 500,
            lineHeight: 1.1,
            // Display Small on a phone would break "No Paddling" - the longest
            // label - onto two lines inside a 360px card, so the step down
            // below the sm breakpoint is what keeps every status on one line.
            //
            // Both steps sit a size above the h5 card title, which is the
            // floor here: the traffic light this replaced set the status
            // *below* its own card title, and that inversion is the thing the
            // panel exists to correct.
            fontSize: { xs: "1.625rem", sm: "2rem" },
          }}
        >
          {statusLabel(status)}
        </Typography>
      </Box>

      <Box
        role="img"
        aria-label={`Paddling scale: ${statusLabel(status)}, step ${
          SCALE.indexOf(status) + 1
        } of ${SCALE.length}`}
        sx={{ display: "flex", alignItems: "center", gap: 0.75, mt: 1.5 }}
      >
        {SCALE.map((s) => {
          const isActive = s === status;
          return (
            <Box
              key={s}
              title={statusLabel(s)}
              sx={{
                flex: isActive ? 2.2 : 1,
                height: isActive ? 10 : 6,
                borderRadius: 9999,
                backgroundColor: ragStatus[s].color,
                opacity: isActive ? 1 : 0.32,
                // Size is spatial, so it gets the overshooting spring; the
                // opacity change is an effect and stays critically damped.
                transition: [
                  spring("flex-grow, height", m3Spring.spatialDefault),
                  spring("opacity", m3Spring.effectsDefault),
                ].join(", "),
              }}
            />
          );
        })}
      </Box>
    </Box>
  );
};

export default PaddlingStatusHero;
