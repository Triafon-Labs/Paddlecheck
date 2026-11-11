"use client";

import React from "react";
import { SvgIcon } from "@mui/material";
import { PaddlingStatusValue } from "@/types";
// Fixed verdict colours - green, amber, red - whatever a club calls its
// status steps, so a verdict reads the same on any scale.
import { STATUS_COLORS, ON_STATUS_COLORS } from "@/lib/statusColors";

// Each paddler's status is a face on a solid disc of its RAG colour, with the
// features in that colour's paired on-colour. The faces are the features of
// MUI's outlined sentiment icons (EmojiEmotions, SentimentSatisfied,
// SentimentNeutral, SentimentDissatisfied) and the "?" of Help, drawn without
// their outer ring. As outlines, the green and amber faces sat at about 2:1
// on the light rows and the red one at about 1.5:1 on the dark navy; filling
// the disc puts the status colour over the whole face and the features at
// the on-colour's 6.5:1 or better.
const FACE_EYES = (
  <>
    <circle cx="15.5" cy="9.5" r="1.5" />
    <circle cx="8.5" cy="9.5" r="1.5" />
  </>
);
const FACE_FEATURES = {
  grin: (
    <>
      {FACE_EYES}
      <path d="M12 18c2.28 0 4.22-1.66 5-4H7c.78 2.34 2.72 4 5 4" />
    </>
  ),
  smile: (
    <>
      {FACE_EYES}
      <path d="M12 16c-1.48 0-2.75-.81-3.45-2H6.88c.8 2.05 2.79 3.5 5.12 3.5s4.32-1.45 5.12-3.5h-1.67c-.7 1.19-1.97 2-3.45 2z" />
    </>
  ),
  neutral: (
    <>
      {FACE_EYES}
      <path d="M9 14h6v1.5H9z" />
    </>
  ),
  frown: (
    <>
      {FACE_EYES}
      <path d="M12 14c-2.33 0-4.32 1.45-5.12 3.5h1.67c.69-1.19 1.97-2 3.45-2s2.75.81 3.45 2h1.67c-.8-2.05-2.79-3.5-5.12-3.5z" />
    </>
  ),
  unknown: (
    <path d="M13 19h-2v-2h2zm2.07-7.75-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25" />
  ),
};

export type FaceKind = keyof typeof FACE_FEATURES;

// `className` is passed through so a Chip that takes this as its `icon` can
// give it the chip's own icon spacing, which it applies by class.
export const StatusFace: React.FC<{
  face: FaceKind;
  color: string;
  onColor: string;
  size: number;
  className?: string;
}> = ({ face, color, onColor, size, className }) => (
  <SvgIcon className={className} sx={{ fontSize: size, flexShrink: 0 }}>
    <circle cx="12" cy="12" r="10" fill={color} />
    <g fill={onColor}>{FACE_FEATURES[face]}</g>
  </SvgIcon>
);

// The faces are meant to read like someone telling you how it is, rather
// than as bare status markers. `headline` and `short` exist because
// Discretion and Warning share the amber - "only at a coach's discretion" and
// "yes, but the river is high" can't rest on two similar faces alone, so the
// words say which it is.
export const PADDLING_STATUS_UI: Record<
  PaddlingStatusValue,
  {
    color: string;
    onColor: string;
    face: FaceKind;
    headline: string;
    short: string;
  }
> = {
  Yes: {
    color: STATUS_COLORS.lightGreen,
    onColor: ON_STATUS_COLORS.lightGreen,
    face: "grin",
    headline: "You can paddle",
    short: "Can paddle",
  },
  Warning: {
    color: STATUS_COLORS.amber,
    onColor: ON_STATUS_COLORS.amber,
    face: "smile",
    headline: "You can paddle, with conditions",
    short: "With conditions",
  },
  Discretion: {
    color: STATUS_COLORS.amber,
    onColor: ON_STATUS_COLORS.amber,
    face: "neutral",
    headline: "Coach's discretion",
    short: "Coach's discretion",
  },
  No: {
    color: STATUS_COLORS.red,
    onColor: ON_STATUS_COLORS.red,
    face: "frown",
    // Not "today": conditions change by the hour, and the same line is
    // used for forecast hours that may be days away.
    headline: "You can't paddle",
    short: "Cannot paddle",
  },
};

export const UNKNOWN_PADDLING_UI = {
  color: STATUS_COLORS.grey,
  onColor: ON_STATUS_COLORS.grey,
  face: "unknown" as const,
  headline: "Conditions unavailable",
  short: "Unknown",
};
