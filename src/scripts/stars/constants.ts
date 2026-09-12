// Viewport occupies the center quarter of the 200vw×200vh canvas (25–75% on each axis).
// These percentages map the "center" region to canvas-% coordinates:
//   46% → (0.46 × 200vw) − 50vw = 42vw,  70% → 90vw
//   30% → (0.30 × 200vh) − 50vh = 10vh,  70% → 90vh
export const STAR_ZONE = {
    xMin: 46,
    xMax: 70,
    yMin: 30,
    yMax: 70,
} as const;

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
