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

// The label colour to put *on* each fill above.
//
// Because the hues are scheme-independent, so is their on-colour: a white
// glyph on the red reads the same in either theme. They are not all white,
// though - the amber and the light green are light enough that white text sits
// at 2.3:1 and 2.5:1 on them, so those two take a near-black drawn from the
// same hue instead. Ratios below are measured against the fill each pairs with.
export const ON_STATUS_COLORS = {
  red: "#FFFFFF", // 6.57:1
  amber: "#2B1700", // 7.49:1
  yellow: "#241A00", // 10.37:1
  darkGreen: "#FFFFFF", // 5.14:1
  lightGreen: "#0D2600", // 6.51:1
  grey: "#1F1F1F", // 6.15:1
} as const;
