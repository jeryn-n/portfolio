// The logical reference canvas every desktop scene is authored against.
export const STAGE_WIDTH = 1920;
export const STAGE_HEIGHT = 1080;

// Below this viewport width the stage switches to a zoomed-in mobile framing.
export const MOBILE_BREAKPOINT = 768;

// Multiplies the cover scale on mobile so the cabin reads larger relative to the viewport.
// Kept modest (rather than the earlier 1.35) because P2 added chrome above/below the cabin
// (title card, nav arrows) that a more aggressive zoom would push outside a portrait phone's
// visible window; 1.1 keeps that chrome on-screen on common phone aspect ratios.
export const MOBILE_ZOOM = 1.1;
