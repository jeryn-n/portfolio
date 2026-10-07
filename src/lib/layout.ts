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
  uciFlag: { x: 500, y: 65 },
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

// Portrait keeps its prior architecture: the whole 760x570 group (shell +
// art together) scales from closedScale to openScale across the reveal.
interface CabinScaleLayout {
  closedScale: number;
  openScale: number;
}

// Desktop: the 760x570 logical shell is a STABLE reference box -- it never
// scales between closed/open. Only the visible art inside it changes size:
// the closed exterior renders at cabinClosedArtScale (<1, centered in the
// shell), and the open interior always renders at exactly 100% of the shell.
// This keeps the yellow debug shell as a fixed positioning surface while the
// blue artwork layers are the only thing that visually resizes.
interface DesktopCabinArt {
  shellScale: number;
  closedArtScale: number;
}

// Desktop: nav arrows, title card, and house sign are each positioned
// independently of the cabin (stage-relative), matching the existing
// desktop composition.
interface DesktopLayout {
  mode: "desktop";
  stageWidth: number;
  stageHeight: number;
  cabinX: number;
  cabinY: number;
  cabinArt: DesktopCabinArt;
  houseSign: PointLayout;
  titleCard: PointLayout;
  clouds: CloudPlacement[];
}

// Portrait: the title card and house sign instead derive their Y position
// from the cabin's own Y plus a fixed offset, so moving the cabin moves them
// with it instead of needing their own independent stage-absolute values.
interface PortraitLayout {
  mode: "portrait";
  stageWidth: number;
  stageHeight: number;
  cabinX: number;
  cabinY: number;
  cabinScale: CabinScaleLayout;
  titleCardX: number;
  titleCardOffsetFromCabinY: number;
  houseSignX: number;
  houseSignOffsetFromCabinY: number;
  // Clouds are environment/background objects, not cabin-local -- this scale
  // is independent of the cabin's own displayScale.
  cloudScale: number;
  clouds: CloudPlacement[];
}

export type SceneLayout = DesktopLayout | PortraitLayout;

// Desktop: landscape viewports, 1920x1080 reference stage. The cabin group
// is anchored by its top-center (CabinScene sets transform-origin "50% 0%"),
// so the horizontal center (x=960) stays put regardless of scale and cabinX
// only needs to account for CABIN_WIDTH -- no scale-compensation arithmetic.
// shellScale positions/sizes the stable 760x570 logical shell on stage (it
// does not change between closed/open); closedArtScale is how much smaller
// the closed exterior art renders inside that stable shell (open interior
// art is always 100% of the shell).
export const DESKTOP_LAYOUT: DesktopLayout = {
  mode: "desktop",
  stageWidth: DESKTOP_STAGE_WIDTH,
  stageHeight: DESKTOP_STAGE_HEIGHT,
  cabinX: 960 - CABIN_WIDTH / 2,
  cabinY: 275,
  cabinArt: { shellScale: 0.89, closedArtScale: 0.95 },
  houseSign: { x: 1350, y: 720 },
  titleCard: { x: 960 - ASSETS.titleCard.designWidth / 2, y: 310 },
  clouds: [
    { assetKey: "ambientCloud1", x: 230, y: 80 },
    { assetKey: "ambientCloud2", x: 1370, y: 120 },
  ],
};

// Portrait/mobile: 1080x1920 reference stage. Cabin size/position is kept
// close to its prior, already-good values -- openScale is still ~10% over
// closedScale, matching the old reveal zoom factor, just expressed as an
// explicit end state instead of a multiplier applied at render time.
export const PORTRAIT_LAYOUT: PortraitLayout = {
  mode: "portrait",
  stageWidth: PORTRAIT_STAGE_WIDTH,
  stageHeight: PORTRAIT_STAGE_HEIGHT,
  cabinX: 540 - CABIN_WIDTH / 2,
  cabinY: 560,
  cabinScale: { closedScale: 1.05, openScale: 1.155 },
  titleCardX: 540 - ASSETS.titleCard.designWidth / 2,
  titleCardOffsetFromCabinY: -140,
  houseSignX: 850,
  houseSignOffsetFromCabinY: -40,
  cloudScale: 1.35,
  clouds: [
    { assetKey: "ambientCloud1", x: 40, y: 50 },
    { assetKey: "ambientCloud2", x: 600, y: 30 },
  ],
};

export function getSceneLayout(mode: CompositionMode): SceneLayout {
  return mode === "desktop" ? DESKTOP_LAYOUT : PORTRAIT_LAYOUT;
}
