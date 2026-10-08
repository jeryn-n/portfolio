// Entry shell placements for the Experience/Projects scenes. These reuse the
// same stage-coordinate approach as the cabin (fixed positions against the
// 1920x1080 desktop / 1080x1920 portrait reference canvases), so all three
// world scenes compose consistently inside WorldSceneController.
export interface EntryPlacement {
  x: number;
  y: number;
  align: "left" | "right";
  // Portrait shells render smaller via a plain CSS transform scale (applied
  // with transformOrigin "top left" so x/y stay simple top-left coordinates).
  scale?: number;
}

// Desktop shell design size (see experienceCloud*/projectBoulder* in
// src/data/assets.ts) is 620x350 for all six shells.
export const EXPERIENCE_DESKTOP_LAYOUT: EntryPlacement[] = [
  { x: 80, y: 80, align: "left" }, // upper-left
  { x: 1200, y: 365, align: "right" }, // center-right
  { x: 80, y: 650, align: "left" }, // lower-left
];

export const PROJECTS_DESKTOP_LAYOUT: EntryPlacement[] = [
  { x: 1220, y: 80, align: "right" }, // upper-right
  { x: 100, y: 365, align: "left" }, // center-left
  { x: 1220, y: 650, align: "right" }, // lower-right
];

const PORTRAIT_ENTRY_SCALE = 0.75;

// Mostly vertical sequence with a subtle left/right stagger -- all three fit
// comfortably within the tall 1080x1920 portrait stage without scrolling.
export const EXPERIENCE_PORTRAIT_LAYOUT: EntryPlacement[] = [
  { x: 267, y: 140, align: "left", scale: PORTRAIT_ENTRY_SCALE },
  { x: 347, y: 492, align: "left", scale: PORTRAIT_ENTRY_SCALE },
  { x: 267, y: 844, align: "left", scale: PORTRAIT_ENTRY_SCALE },
];

export const PROJECTS_PORTRAIT_LAYOUT: EntryPlacement[] = EXPERIENCE_PORTRAIT_LAYOUT;
