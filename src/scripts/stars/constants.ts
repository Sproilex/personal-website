// Viewport occupies the center quarter of the 200vw×200vh canvas (25–75% on each axis).
// canvas_pct = 25 + (viewport_pct × 0.5)
//
// Desktop: right side of viewport (x: 42–90%, y: 10–90%)
//   xMin 46 → 42vw, xMax 70 → 90vw, yMin 30 → 10vh, yMax 70 → 90vh
//
// Mobile: bottom third of viewport (x: 2–98%, y: 66–100%)
//   xMin 26 → 2vw, xMax 74 → 98vw, yMin 58 → 66vh, yMax 75 → 100vh
const STAR_ZONE_DESKTOP = { xMin: 46, xMax: 70, yMin: 30, yMax: 70 } as const;
const STAR_ZONE_MOBILE  = { xMin: 26, xMax: 74, yMin: 60, yMax: 73 } as const;

export const getStarZone = () =>
    window.innerWidth < 768 ? STAR_ZONE_MOBILE : STAR_ZONE_DESKTOP;

export const MIN_SPACING_PCT = 12;

export const PROJECT_STAR_SIZE = 18;

export const PROJECT_HIT_RADIUS = 35;

export const COMET_PALETTE = [
    "#ffffff",
    "#c4b5fd",
    "#93c5fd",
    "#a78bfa",
    "#818cf8",
] as const;
