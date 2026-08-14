// The app's status colour language, in one place.
//
// These five hues are the whole vocabulary for "how risky is this?" - the RAG
// statuses in lib/config.ts, the Met Office warning severities, and the
// theme's error/success/warning roles in lib/m3-palette.ts all draw from
// here. Previously the RAG palette and the theme kept their own copies, which
// drifted: the dark scheme lifted its accents a step up each hue, so a "Cold"
// chip rendered in one red while the "Red" status chip beside it in the
// Conditions Key rendered in another.
//
// They are deliberately scheme-independent. A status colour is the signal, so
// the same reading has to look the same whichever theme you're in, and every
// place that carries one - RAG dots, traffic-light lamps, chips, warning
// icons - has to agree on it.
export const STATUS_COLORS = {
  red: "#B71C1C",
  amber: "#FF8F00",
  yellow: "#FBC02D",
  darkGreen: "#008000",
  lightGreen: "#4CBB17",
  grey: "#9E9E9E",
} as const;
