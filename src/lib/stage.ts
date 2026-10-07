export type CompositionMode = "desktop" | "portrait";

// Desktop composition: landscape-ish viewports (aspect ratio > 1:1).
export const DESKTOP_STAGE_WIDTH = 1920;
export const DESKTOP_STAGE_HEIGHT = 1080;

// Portrait/mobile composition: square-ish or taller viewports (aspect ratio <= 1:1).
// This is a genuinely separate reference canvas, not the desktop stage with an
// extra zoom multiplier stacked on top.
export const PORTRAIT_STAGE_WIDTH = 1080;
export const PORTRAIT_STAGE_HEIGHT = 1920;

// Picks the composition mode from viewport aspect ratio (not a single hardcoded
// pixel breakpoint), so a roughly-square window still lands on a sensible mode.
export function getCompositionMode(viewportWidth: number, viewportHeight: number): CompositionMode {
  return viewportWidth / viewportHeight > 1 ? "desktop" : "portrait";
}

export function getStageSize(mode: CompositionMode): { width: number; height: number } {
  return mode === "desktop"
    ? { width: DESKTOP_STAGE_WIDTH, height: DESKTOP_STAGE_HEIGHT }
    : { width: PORTRAIT_STAGE_WIDTH, height: PORTRAIT_STAGE_HEIGHT };
}
