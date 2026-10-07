// Shared reveal timing. Both the cabin scene's own animation variants and
// the viewport-fixed nav arrows (which live outside the scaled stage, see
// ViewportNavArrows) fade in on this same schedule, so the constants live
// here instead of inside CabinScene.
export const REVEAL_DURATION = 1.2;
export const REVEAL_EASE: [number, number, number, number] = [0.4, 0, 0.2, 1];
// Title card + nav arrows fade in during the final ~20% of the reveal.
export const LATE_REVEAL_DELAY = REVEAL_DURATION * 0.8;
