// Chart entrances in CSS rather than recharts' own animation.
//
// Recharts animates by re-rendering the chart through React every frame and
// recomputing each point - for the 5-day river graph, ~480 of them - which
// held it near 30 fps on a phone-speed CPU and stalled switching forecast
// days. Charts that use these turn recharts' animation off and get the same
// motion from CSS, which the browser runs without any script per frame:
//
// - bars grow up from the baseline, as a transform (composited, no layout or
//   repaint per frame) on the layer that holds them. Every bar stands on the
//   same baseline, so scaling the layer from its bottom edge grows each bar
//   from zero to its own height, as recharts did. The layer rather than each
//   bar because recharts rebuilds the bars' own elements on every render -
//   each hour stepped, a theme change - which would restart an animation on
//   them; the layer itself survives until the chart is keyed anew;
// - lines and areas are revealed left to right by an animated clip, which is
//   how recharts draws an area in anyway.
//
// Both replay whenever the element mounts, so a chart that should animate
// again (a new day, a new range) is keyed to remount; a re-render with the
// same key - the picked hour changing, a refetch - leaves it still. Durations
// collapse under prefers-reduced-motion through the theme's global override.

// Grows a recharts <Bar>'s bars from the baseline. Spread into the sx of a
// box around the chart; `barClass` is the className given to the <Bar>
// (recharts also copies it onto each bar, hence matching the layer by its
// own recharts-bar class too).
export const barGrowSx = (
  barClass: string,
  durationMs: number,
  easing: string
) => ({
  [`& .recharts-bar.${barClass}`]: {
    transformBox: "fill-box",
    transformOrigin: "50% 100%",
    animation: `chartBarGrow ${durationMs}ms ${easing} both`,
  },
  "@keyframes chartBarGrow": {
    from: { transform: "scaleY(0)" },
    to: { transform: "scaleY(1)" },
  },
});

// Reveals an element left to right by clipping it. The clip is over the
// element's own box, padded so a stroke's width and round caps aren't shaved
// off at the edges once it's fully shown.
export const revealSx = (
  selector: string,
  durationMs: number,
  easing: string,
  delayMs = 0
) => ({
  [`& ${selector}`]: {
    animation: `chartReveal ${durationMs}ms ${easing} ${delayMs}ms both`,
  },
  "@keyframes chartReveal": {
    from: { clipPath: "inset(-8px 100% -8px -8px)" },
    to: { clipPath: "inset(-8px -8px -8px -8px)" },
  },
});
