import { ASSETS } from "@/data/assets";
import {
  DESKTOP_STAGE_HEIGHT,
  DESKTOP_STAGE_WIDTH,
  PORTRAIT_STAGE_HEIGHT,
  PORTRAIT_STAGE_WIDTH,
  type CompositionMode,
} from "./stage";

// Cabin-local coordinate surface: 0,0 is the top-left of the cabin's own
// fixed-size design box. Every interior child -- and both scene layouts
// below -- shares this exact surface, so moving or scaling the cabin on the
// stage moves everything inside it consistently. This never changes between
// composition modes.
export const CABIN_WIDTH = ASSETS.cabinExterior.designWidth;
export const CABIN_HEIGHT = ASSETS.cabinExterior.designHeight;

export const CABIN_INTERIOR_LAYOUT = {
  gramophone: { x: 85, y: 250 },
  cat: { x: 535, y: 300 },
  uciFlag: { x: 435, y: 65 },
  contactFrame: { x: 230, y: 135 },
  fireplace: { x: 275, y: 238, width: 200, height: 200 },
};

// The door-hint exclamation sits roughly where a door handle would be, as a
// fraction of the cabin box, so it moves/scales correctly in both modes.
export const DOOR_HINT_RATIO = { x: 0.6, y: 0.65 };

interface PointLayout {
  x: number;
  y: number;
}

interface CloudPlacement extends PointLayout {
  assetKey: "ambientCloud1" | "ambientCloud2";
  flip?: boolean;
  driftDelay?: number;
}

export interface SceneLayout {
  stageWidth: number;
  stageHeight: number;
  // Position on the stage; width/height always stay CABIN_WIDTH/CABIN_HEIGHT.
  // Only x, y, and displayScale vary per composition mode.
  cabin: { x: number; y: number; displayScale: number };
  houseSign: PointLayout;
  titleCard: PointLayout;
  experienceArrow: PointLayout;
  projectsArrow: PointLayout;
  clouds: CloudPlacement[];
}

// Desktop: landscape viewports, 1920x1080 reference stage. Cabin display
// scale starts at 0.85 (art stays 760x570; only the on-stage visual size
// shrinks) and is anchored by its top-center so placement math stays simple:
// x is the stage's horizontal center minus half the cabin width, y is just
// the desired visual top -- no scale-compensation arithmetic needed because
// CabinScene applies transform-origin "50% 0%" to the cabin group.
export const DESKTOP_LAYOUT: SceneLayout = {
  stageWidth: DESKTOP_STAGE_WIDTH,
  stageHeight: DESKTOP_STAGE_HEIGHT,
  cabin: { x: 960 - CABIN_WIDTH / 2, y: 330, displayScale: 0.85 },
  houseSign: { x: 1350, y: 720 },
  titleCard: { x: 960 - ASSETS.titleCard.designWidth / 2, y: 310 },
  experienceArrow: { x: 960, y: 145 },
  projectsArrow: { x: 960, y: 910 },
  clouds: [
    { assetKey: "ambientCloud1", x: 230, y: 190 },
    { assetKey: "ambientCloud2", x: 1370, y: 250 },
    { assetKey: "ambientCloud1", x: 820, y: 110, flip: true, driftDelay: 6 },
    { assetKey: "ambientCloud2", x: 120, y: 480, flip: true, driftDelay: 12 },
  ],
};

// Portrait/mobile: square-or-narrower viewports, a genuinely separate
// 1080x1920 reference stage (not desktop coordinates plus a zoom multiplier).
// Same top-center anchoring trick as desktop, just centered on this stage's
// own width and sized larger so the cabin reads as the dominant object.
//
// displayScale of 1.05 is chosen so the OPEN-state visual width (760 * 1.05 *
// the 1.1 opening zoom factor applied in CabinScene ~= 878 units) lands at
// the ~880-930 unit target for the primary/open view while staying under the
// visible width on the narrowest required test viewport (390x844 covers
// ~887 stage units) -- so the cabin never clips horizontally even mid-zoom.
export const PORTRAIT_LAYOUT: SceneLayout = {
  stageWidth: PORTRAIT_STAGE_WIDTH,
  stageHeight: PORTRAIT_STAGE_HEIGHT,
  cabin: { x: 540 - CABIN_WIDTH / 2, y: 560, displayScale: 1.05 },
  houseSign: { x: 850, y: 520 },
  titleCard: { x: 540 - ASSETS.titleCard.designWidth / 2, y: 420 },
  experienceArrow: { x: 540, y: 320 },
  projectsArrow: { x: 540, y: 1360 },
  clouds: [
    { assetKey: "ambientCloud1", x: 40, y: 50 },
    { assetKey: "ambientCloud2", x: 600, y: 30, flip: true },
    { assetKey: "ambientCloud1", x: 340, y: 190, flip: true, driftDelay: 6 },
    { assetKey: "ambientCloud2", x: 90, y: 220, driftDelay: 12 },
  ],
};

export function getSceneLayout(mode: CompositionMode): SceneLayout {
  return mode === "desktop" ? DESKTOP_LAYOUT : PORTRAIT_LAYOUT;
}
