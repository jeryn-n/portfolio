// All coordinates in the 1920×1080 reference stage units.

// Cabin composition: the primary centralized object.
export const CABIN_LAYOUT = {
  x: 580,
  y: 390,
  width: 760,
  height: 570,
};

// House sign to the right of the cabin.
export const HOUSE_SIGN_LAYOUT = {
  x: 1350,
  y: 720,
  width: 210,
  height: 140,
};

// Ambient clouds.
export const CLOUD_1_LAYOUT = {
  x: 230,
  y: 190,
  width: 360,
  height: 150,
};

export const CLOUD_2_LAYOUT = {
  x: 1370,
  y: 250,
  width: 450,
  height: 175,
};

// Roof title card: horizontally centered over cabin, positioned above it.
export const TITLE_CARD_LAYOUT = {
  x: CABIN_LAYOUT.x + (CABIN_LAYOUT.width - 380) / 2,
  y: 310,
  width: 380,
  height: 105,
};

// Navigation arrows: horizontally centered on cabin, positioned above and below.
export const EXPERIENCE_ARROW_LAYOUT = {
  x: CABIN_LAYOUT.x + CABIN_LAYOUT.width / 2,
  y: 220,
};

export const PROJECTS_ARROW_LAYOUT = {
  x: CABIN_LAYOUT.x + CABIN_LAYOUT.width / 2,
  y: 1000,
};

// Interior positions are cabin-local (0–760 × 0–570), not stage-relative.
// The parent CabinInterior container sits at CABIN_LAYOUT.x/y and handles the transform.
export const CABIN_INTERIOR_LAYOUT = {
  gramophone: { x: 85, y: 250 },
  cat: { x: 535, y: 330 },
  uciFlag: { x: 270, y: 65 },
  contactFrame: { x: 230, y: 180 },
  fireplace: { x: 275, y: 295, width: 200, height: 200 },
};
