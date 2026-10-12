import { ASSETS, type AssetId } from "@/data/assets";
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

// Interior props (gramophone, cat, flag, contact frame) render at this
// fraction of their design size, so the room reads less crowded. Positions
// below are top-left corners of those already-scaled boxes.
export const CABIN_INTERIOR_PROP_SCALE = 0.85;

// Approximate placements for the taller shell -- roughly the old
// arrangement (contact frame high and central, flag on the right wall,
// gramophone / fireplace / cat along the floor), pulled in toward the
// middle of the room. To be re-tuned once the interior art is drawn to
// 640x720.
export const CABIN_INTERIOR_LAYOUT = {
  gramophone: { x: 95, y: 420 },
  cat: { x: 418, y: 456 },
  uciFlag: { x: 378, y: 300 },
  contactFrame: { x: 320 - (ASSETS.contactFrame.designWidth * CABIN_INTERIOR_PROP_SCALE) / 2, y: 190 },
  fireplace: { x: 235, y: 390, width: 170, height: 170 },
};

// The door-hint exclamation sits beside the door, as a fraction of the cabin
// box, so it moves/scales correctly in both modes. Written as cabin-local px
// over the box size. It renders at DOOR_HINT_SCALE of its design size,
// shrunk around its own centre.
export const DOOR_HINT_RATIO = { x: 340 / CABIN_WIDTH, y: 449 / CABIN_HEIGHT };
export const DOOR_HINT_SCALE = 0.855;

// The mouth of the exterior art's chimney (cap spans x 125-204, top at
// y 75), in cabin-local px. Smoke starts just behind the cap, so each puff
// emerges from the chimney rather than appearing in front of it.
export const CHIMNEY_SMOKE_ORIGIN = { x: 165, y: 88 };

// The exterior environment (sky, mountains, foothills + back trees, ground +
// front trees) is one 1920x1620 master, taller than either stage's aspect
// ratio. It is never stretched: each mode shows a crop of it at a single
// uniform scale.
export const EXTERIOR_ART_WIDTH = ASSETS.cabinSky.designWidth;
export const EXTERIOR_ART_HEIGHT = ASSETS.cabinSky.designHeight;

// Where the exterior master sits on the stage. All four exterior layers
// render through this one value, which is what keeps them registered.
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

// Ambient clouds drift right-to-left and loop seamlessly (see AmbientCloud),
// all behind the mountains, in three categories:
//   large  -- the single very large cloud, just above the peaks. Never
//             flipped.
//   medium -- higher up, above the peaks.
//   small  -- the lowest group, around the peak line (partly hidden behind
//             the ridges).
//
// Every cloud drifts at the same speed (the mode's cloudSpeed), so clouds
// never catch up with each other: spacing only has to hold at the start.
// cloudField scatters each category's clouds inside its band and keeps
// their artwork apart, wrap included. Asset, flip, size and position are
// drawn once per load, so the sky isn't the same every visit. Higher clouds
// draw behind lower ones, whatever their category.
//
// The mountain ridge in the 1920x1620 master runs between art y ~600 and
// ~780, with the tallest peak at ~520 (far right) and the next at ~600
// (left of centre). Each mode's bands are that line mapped through its
// exterior crop.
export type CloudKind = "large" | "medium" | "small";

export const CLOUD_ASSETS = {
  large: ["ambientCloud2VeryLarge"],
  medium: ["ambientCloud1Medium", "ambientCloud3Medium"],
  small: ["ambientCloud4Small", "ambientCloud5Small", "ambientCloud6Small"],
} as const satisfies Record<CloudKind, readonly AssetId[]>;

// Only the very large cloud must keep its drawn orientation.
export const CLOUD_FLIPPABLE: Record<CloudKind, boolean> = { large: false, medium: true, small: true };

// Extra render scale per category, on top of the mode's cloudScale: the very
// large cloud (Cloud 2) reads as the sky's one big cloud, and the medium
// clouds (Clouds 1 and 3) are bumped 15%.
export const CLOUD_KIND_SCALE: Record<CloudKind, number> = { large: 1.25, medium: 1.15, small: 1 };

// No cloud's top may stick out more than this far above the stage.
export const CLOUD_MAX_TOP_OVERHANG = 50;

interface CloudBand {
  // How many of this category are on screen at once.
  count: number;
  // Stage Y range for the clouds' centres.
  top: number;
  bottom: number;
  // How much likelier a centre is to land in the lower half of the range
  // than the upper half (1, the default, is even).
  lowerHalfWeight?: number;
}

type CloudBands = Record<CloudKind, CloudBand>;

// Portrait keeps its prior architecture: the whole 640x720 group (shell +
// art together) scales from closedScale to openScale across the reveal,
// anchored at its bottom-center so the cabin's base stays put.
interface CabinScaleLayout {
  closedScale: number;
  openScale: number;
}

// Desktop: the 640x720 logical shell is a STABLE reference box -- it never
// scales between closed/open. Only the art group inside it changes size:
// it renders at closedArtScale while closed (<1, anchored at the shell's
// bottom-center) and at exactly 100% of the shell once open, so the cabin
// grows upward and outward from a fixed base. The interior sits in that
// same art group, so all three art layers stay registered through the
// cross-fade.
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
  // Render scale for every cloud (the source art sizes don't change).
  cloudScale: number;
  // Shared drift speed, stage pixels per second while the cabin is CLOSED
  // (the cabin scene slows every cloud once it opens).
  cloudSpeed: number;
  clouds: CloudBands;
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
  cloudSpeed: number;
  clouds: CloudBands;
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
//
// The shell is 768x864 (shellScale 1.2) and spans stage y 51-915; in a
// short, wide window the open roof is allowed to crop slightly. The cabin's
// base sits at 915 in both states; the closed art (69% of the shell,
// 530x596) spans y 319-915. The title card sits on the open roof and the
// house sign at the closed cabin's right edge (currently hidden -- see
// HOUSE_SIGN_ENABLED in CabinScene).
const DESKTOP_CABIN_SHELL_SCALE = 1.2;
const DESKTOP_CABIN_BASE_Y = 900;

export const DESKTOP_LAYOUT: DesktopLayout = {
  mode: "desktop",
  stageWidth: DESKTOP_STAGE_WIDTH,
  stageHeight: DESKTOP_STAGE_HEIGHT,
  exterior: { scale: DESKTOP_STAGE_WIDTH / EXTERIOR_ART_WIDTH, x: 0, y: -320 },
  cabinX: 960 - CABIN_WIDTH / 2,
  cabinY: DESKTOP_CABIN_BASE_Y - CABIN_HEIGHT * DESKTOP_CABIN_SHELL_SCALE,
  cabinArt: { shellScale: DESKTOP_CABIN_SHELL_SCALE, closedArtScale: 0.8 },
  houseSign: { x: 1200, y: 745 },
  titleCard: { x: 960 - ASSETS.titleCard.designWidth / 2, y: 75 },
  cloudScale: 0.86,
  cloudSpeed: 8,
  // The desktop crop starts at art y 320, so the ridge lands around stage y
  // ~280-460, the tallest peak at ~200, and the bands are compressed above.
  clouds: {
    large: { count: 1, top: 175, bottom: 230 },
    medium: { count: 4, top: 70, bottom: 245, lowerHalfWeight: 1.5 },
    small: { count: 6, top: 200, bottom: 370 },
  },
};

// Portrait/mobile: 1080x1920 reference stage. The exterior master keeps its
// full height (scaled up to fill the stage height), and the stage is a
// narrow, horizontally centred window through it -- the same art the desktop
// shows, at a much gentler zoom than the old stretched background.
const PORTRAIT_EXTERIOR_SCALE = PORTRAIT_STAGE_HEIGHT / EXTERIOR_ART_HEIGHT;

// The cabin group is anchored at its bottom-center, so cabinY is the top of
// the UNSCALED 640x720 box and the base always sits at cabinY + 720
// (stage y 1400), closed or open. openScale is ~30% over closedScale -- as
// large as the open cabin can go while still fitting a narrow phone width.
// The title card offset is measured from cabinY to clear the OPEN roof
// (cabinY + 720 - 720 * openScale).
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
  cabinY: 700,
  cabinScale: { closedScale: 1, openScale: 1.3 },
  titleCardX: 540 - ASSETS.titleCard.designWidth / 2,
  titleCardOffsetFromCabinY: -356,
  houseSignX: 812,
  houseSignOffsetFromCabinY: 487,
  cloudScale: 1.15,
  cloudSpeed: 6.5,
  // The portrait crop shows the art's full height (x1.185), so the visible
  // ridge lands at stage y ~710-920 with the whole sky above it.
  clouds: {
    large: { count: 1, top: 560, bottom: 640 },
    medium: { count: 4, top: 200, bottom: 580, lowerHalfWeight: 1.5 },
    small: { count: 5, top: 600, bottom: 790 },
  },
};

export function getSceneLayout(mode: CompositionMode): SceneLayout {
  return mode === "desktop" ? DESKTOP_LAYOUT : PORTRAIT_LAYOUT;
}

// Stage Y of the cabin's base. It stays put through the opening zoom in
// both modes, and it is the point the environment's parallax zoom grows
// from, so the ground at the cabin's feet never drifts away from it.
export function getCabinBaseY(layout: SceneLayout): number {
  return layout.mode === "desktop"
    ? layout.cabinY + CABIN_HEIGHT * layout.cabinArt.shellScale
    : layout.cabinY + CABIN_HEIGHT;
}

// Stage height of the cabin sky that sits ABOVE the cabin's stage window --
// the art rows its crop cuts off the top (desktop: rows 0-320; portrait:
// none). The Experience background continues from art row 0, so during
// Experience <-> Cabin travel these rows are the real-art bridge between the
// two windows (see WorldSceneController).
export function getSkyBridgeHeight(layout: SceneLayout): number {
  return Math.max(0, -layout.exterior.y);
}

// Stage box of the fully OPEN cabin. Desktop: the shell itself (scaled by
// shellScale from its top-center). Portrait: the group at openScale, from
// its bottom-center.
export function getOpenCabinBox(layout: SceneLayout): { x: number; y: number; width: number; height: number } {
  const scale = layout.mode === "desktop" ? layout.cabinArt.shellScale : layout.cabinScale.openScale;
  const width = CABIN_WIDTH * scale;
  const height = CABIN_HEIGHT * scale;
  return {
    x: layout.cabinX + (CABIN_WIDTH - width) / 2,
    y: layout.mode === "desktop" ? layout.cabinY : getCabinBaseY(layout) - height,
    width,
    height,
  };
}
