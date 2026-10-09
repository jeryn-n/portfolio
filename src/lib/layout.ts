import { ASSETS } from "@/data/assets";
import {
  DESKTOP_STAGE_HEIGHT,
  DESKTOP_STAGE_WIDTH,
  PORTRAIT_STAGE_HEIGHT,
  PORTRAIT_STAGE_WIDTH,
  type CompositionMode,
} from "./stage";

// Cabin-local coordinate surface: 0,0 is the top-left of the cabin's own
// fixed-size 640x720 logical shell. Every interior child -- and both scene
// layouts below -- shares this exact surface, so moving or scaling the cabin
// on the stage moves everything inside it consistently. This never changes
// between composition modes.
export const CABIN_WIDTH = ASSETS.cabinExterior.designWidth;
export const CABIN_HEIGHT = ASSETS.cabinExterior.designHeight;

// Approximate placements for the taller shell -- roughly the old
// arrangement (contact frame high and central, flag on the right wall,
// gramophone / fireplace / cat along the floor). To be re-tuned once the
// interior art is drawn to 640x720.
export const CABIN_INTERIOR_LAYOUT = {
  gramophone: { x: 50, y: 400 },
  cat: { x: 430, y: 460 },
  uciFlag: { x: 400, y: 285 },
  contactFrame: { x: 170, y: 150 },
  fireplace: { x: 200, y: 370, width: 200, height: 200 },
};

// The door-hint exclamation sits roughly where a door handle would be, as a
// fraction of the cabin box, so it moves/scales correctly in both modes.
export const DOOR_HINT_RATIO = { x: 0.6, y: 0.65 };

// The exterior environment (sky + mountains-ground) is one 1920x1620 master,
// taller than either stage's aspect ratio. It is never stretched: each mode
// shows a crop of it at a single uniform scale.
export const EXTERIOR_ART_WIDTH = ASSETS.cabinSky.designWidth;
export const EXTERIOR_ART_HEIGHT = ASSETS.cabinSky.designHeight;

// Where the exterior master sits on the stage. Both exterior layers render
// through this one value, which is what keeps them registered.
export interface ExteriorCrop {
  // Art pixels -> stage pixels, identical on both axes.
  scale: number;
  // Stage position of the art's top-left corner. Negative values are the
  // cropped-off overflow.
  x: number;
  y: number;
}

interface PointLayout {
  x: number;
  y: number;
}

// Ambient clouds drift right-to-left and loop seamlessly (see AmbientCloud).
// Each one varies in starting position, height, size and speed so the sky
// doesn't read as one repeated element.
interface CloudPlacement extends PointLayout {
  assetKey: "ambientCloud1" | "ambientCloud2";
  // "rear" clouds render beneath the mountains-ground layer, showing only
  // through its transparent sky; "front" clouds render over it.
  layer: "rear" | "front";
  // Stage pixels per second while the cabin is CLOSED. The cabin scene scales
  // this down once the cabin opens.
  speed: number;
  // Slight per-cloud size variation, multiplied by the mode's cloudScale.
  scale?: number;
  // Mirrors the art horizontally, so two cloud assets read as more shapes.
  flip?: boolean;
}

// Portrait keeps its prior architecture: the whole 640x720 group (shell +
// art together) scales from closedScale to openScale across the reveal.
interface CabinScaleLayout {
  closedScale: number;
  openScale: number;
}

// Desktop: the 640x720 logical shell is a STABLE reference box -- it never
// scales between closed/open. Only the art group inside it changes size:
// it renders at closedArtScale while closed (<1, centered in the shell) and
// at exactly 100% of the shell once open. The interior sits in that same art
// group, so all three art layers stay registered through the cross-fade.
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
  exterior: ExteriorCrop;
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
  exterior: ExteriorCrop;
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

// Desktop: landscape viewports, 1920x1080 reference stage. The exterior
// master keeps its full width at 1:1, and the stage is a 1080-tall window
// through it (art rows 320-1400): the top of the sky and the bottom of the
// foreground are cropped. The cabin shell is anchored by its top-center
// (CabinScene sets transform-origin "50% 0%"), so the horizontal center
// (x=960) stays put regardless of scale and cabinX only needs to account for
// CABIN_WIDTH -- no scale-compensation arithmetic. shellScale positions/sizes
// the stable 640x720 logical shell on stage (it does not change between
// closed/open); closedArtScale is how much smaller the closed art renders
// inside that stable shell.
export const DESKTOP_LAYOUT: DesktopLayout = {
  mode: "desktop",
  stageWidth: DESKTOP_STAGE_WIDTH,
  stageHeight: DESKTOP_STAGE_HEIGHT,
  exterior: { scale: DESKTOP_STAGE_WIDTH / EXTERIOR_ART_WIDTH, x: 0, y: -320 },
  cabinX: 960 - CABIN_WIDTH / 2,
  cabinY: 300,
  cabinArt: { shellScale: 0.92, closedArtScale: 0.8 },
  houseSign: { x: 1300, y: 760 },
  titleCard: { x: 960 - ASSETS.titleCard.designWidth / 2, y: 320 },
  clouds: [
    { assetKey: "ambientCloud2", layer: "rear", x: 1370, y: 210, speed: 11, scale: 1.1 },
    { assetKey: "ambientCloud1", layer: "rear", x: 160, y: 250, speed: 9, scale: 0.85, flip: true },
    { assetKey: "ambientCloud1", layer: "front", x: 330, y: 30, speed: 15 },
    { assetKey: "ambientCloud2", layer: "front", x: 880, y: 135, speed: 18, scale: 0.8, flip: true },
  ],
};

// Portrait/mobile: 1080x1920 reference stage. The exterior master keeps its
// full height (scaled up to fill the stage height), and the stage is a
// narrow, horizontally centred window through it -- the same art the desktop
// shows, at a much gentler zoom than the old stretched background.
const PORTRAIT_EXTERIOR_SCALE = PORTRAIT_STAGE_HEIGHT / EXTERIOR_ART_HEIGHT;

// Cabin openScale is ~22% over closedScale (up from ~10%), so the reveal now
// reads as a clear push in rather than a nudge.
export const PORTRAIT_LAYOUT: PortraitLayout = {
  mode: "portrait",
  stageWidth: PORTRAIT_STAGE_WIDTH,
  stageHeight: PORTRAIT_STAGE_HEIGHT,
  exterior: {
    scale: PORTRAIT_EXTERIOR_SCALE,
    x: (PORTRAIT_STAGE_WIDTH - EXTERIOR_ART_WIDTH * PORTRAIT_EXTERIOR_SCALE) / 2,
    y: 0,
  },
  cabinX: 540 - CABIN_WIDTH / 2,
  cabinY: 740,
  cabinScale: { closedScale: 0.95, openScale: 1.16 },
  titleCardX: 540 - ASSETS.titleCard.designWidth / 2,
  titleCardOffsetFromCabinY: -140,
  houseSignX: 840,
  houseSignOffsetFromCabinY: 460,
  cloudScale: 1.35,
  clouds: [
    { assetKey: "ambientCloud1", layer: "front", x: 40, y: 140, speed: 12 },
    { assetKey: "ambientCloud2", layer: "rear", x: 600, y: 540, speed: 9, scale: 1.05, flip: true },
    { assetKey: "ambientCloud1", layer: "front", x: 300, y: 330, speed: 15, scale: 0.8, flip: true },
  ],
};

export function getSceneLayout(mode: CompositionMode): SceneLayout {
  return mode === "desktop" ? DESKTOP_LAYOUT : PORTRAIT_LAYOUT;
}
