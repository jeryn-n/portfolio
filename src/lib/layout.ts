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

// The closed cabin's click target: a polygon, cabin-local px, drawn a little
// inside the exterior art's silhouette so the transparent canvas around it --
// the sky beside the roof, the snow banks -- doesn't open the cabin. Clockwise
// from the roof's peak: down the right slope (~16px in from its snowy edge)
// to the eave, in to the wall, down to the stone base, around the front
// steps (so the whole door and its steps count), and back up the left side.
// The chimney stays outside. Same coordinates in both composition modes;
// ?debug=layout draws it on the closed cabin.
export const CABIN_ENTRY_REGION: ReadonlyArray<readonly [number, number]> = [
  [290, 32],
  [350, 32],
  [616, 298],
  [616, 366],
  [580, 386],
  [580, 648],
  [412, 648],
  [412, 702],
  [228, 702],
  [228, 648],
  [60, 648],
  [60, 386],
  [24, 366],
  [24, 298],
];

// The interior's registered objects. Each one's art is a full 640x720
// overlay (see the cabin* overlays in src/data/assets.ts) that already sits
// in place; its box here -- cabin-local px, the same surface -- is the one
// rectangle the object is handled through:
//   - the window its overlay is revealed through. Anything the file draws
//     outside the box is clipped away, so the box must take in the whole
//     object.
//   - its hitbox.
//   - what grows on hover/focus: by hoverScale, about transformOrigin (any
//     CSS transform-origin, within the box) -- the edge or corner that
//     stays put. "bottom left" grows up and right, "center" evenly. 1 = no
//     growth; such an object can brighten instead (hoverBrightness).
// Measured off the overlay files themselves: the edge an object grows from
// sits flush with its art (the gramophone's base on the dresser, the cat's
// underside on the seat, the banner's right edge), so it stays put to the
// pixel, and the free edges get ~4px to spare. ?debug=layout outlines and
// labels each box.
//   gramophone -- on the dresser, left (art x 125-190, y 410-485). Plays and
//                 stops the music (and can switch all sound on).
//   sign       -- the board on its chains under the top beam (art x
//                 220-420, y 155-265), opens About. The HTML name + title
//                 sit on textBox, the board's face, and scale with it.
//   banner     -- the navy-and-gold banner on the right wall (art x
//                 500-545, y 355-460), opens Education.
//   cat        -- asleep on the armchair (art x 420-523, y 496-535). Click
//                 (or tap) bounces it. Its box reaches 12px above the art so
//                 the bounce has headroom inside the window; the bottom edge
//                 it grows from is unchanged.
//   lamp       -- the floor lamp by the left window (lamp-on.png: shade art
//                 x 85-142, y 340-412; pole down to y 535; a faint glow
//                 x 85-184, y 305-465). The box is the shade and the top of
//                 the pole, the part anyone clicks. Unclipped (clip: false),
//                 so the rest of the pole and the glow still show. Hover
//                 changes nothing about how it looks (the hand cursor is the
//                 cue); a press still gives a little, about the foot of its
//                 pole (LAMP_FOOT).
//   linkedin / about -- the two icons in the picture frame over the
//                 fireplace (linkedin.png x 275-315, about-icon.png x 315-364,
//                 both y 335-374). Neither moves at all: hover/focus only
//                 brightens it, and a press doesn't give.
export interface CabinObjectBounds {
  x: number;
  y: number;
  width: number;
  height: number;
  hoverScale: number;
  transformOrigin: string;
  textBox?: { x: number; y: number; width: number; height: number };
  // false: the overlay isn't clipped to the box, which is then only the
  // hitbox and the hover pivot. For art that reaches past what should be
  // clickable (the lamp's pole and glow).
  clip?: boolean;
  // A CSS brightness() the art eases to on hover/focus (and back), e.g.
  // 1.1. Unset: no change in brightness.
  hoverBrightness?: number;
  // false: a press doesn't shrink it (PRESS_SCALE) -- for objects that must
  // never move.
  press?: boolean;
}

const LAMP = { x: 83, y: 338, width: 62, height: 86 };
const LAMP_FOOT = { x: 105, y: 535 };

export const CABIN_OBJECTS = {
  lamp: {
    ...LAMP,
    hoverScale: 1,
    transformOrigin: `${LAMP_FOOT.x - LAMP.x}px ${LAMP_FOOT.y - LAMP.y}px`,
    clip: false,
  },
  gramophone: { x: 125, y: 405, width: 70, height: 80, hoverScale: 1.05, transformOrigin: "bottom left" },
  sign: {
    x: 216,
    y: 151,
    width: 208,
    height: 118,
    hoverScale: 1.035,
    transformOrigin: "center",
    textBox: { x: 220, y: 212, width: 200, height: 50 },
  },
  linkedin: { x: 273, y: 333, width: 44, height: 44, hoverScale: 1, hoverBrightness: 1.1, press: false, transformOrigin: "center" },
  about: { x: 315, y: 333, width: 52, height: 44, hoverScale: 1, hoverBrightness: 1.1, press: false, transformOrigin: "center" },
  banner: { x: 496, y: 351, width: 49, height: 113, hoverScale: 1.04, transformOrigin: "right center" },
  cat: { x: 416, y: 484, width: 111, height: 51, hoverScale: 1.05, transformOrigin: "bottom center" },
} satisfies Record<string, CabinObjectBounds>;

// The fire's glow (fire-glow.png) pulses about this point, the middle of the
// fire (art x 290-359, y 460-524).
export const FIRE_GLOW_ORIGIN = { x: 324, y: 492 };

// The exterior lantern's glow pulses about this point, the middle of its art
// (x 95-194, y 430-524).
export const LANTERN_GLOW_ORIGIN = { x: 145, y: 477 };

// The separate prop sprites below are switched off now that the props are
// drawn into the interior art (see SPRITE_PROPS_ENABLED in CabinInterior);
// their placements stay for when their interactions are revisited.
//
// Interior props (gramophone, cat, flag, contact frame) render at this
// fraction of their design size, so the room reads less crowded. Positions
// below are top-left corners of those already-scaled boxes.
export const CABIN_INTERIOR_PROP_SCALE = 0.85;

// Approximate placements for the taller shell -- roughly the old
// arrangement (contact frame high and central, flag on the right wall,
// gramophone / fireplace / cat along the floor), pulled in toward the
// middle of the room.
export const CABIN_INTERIOR_LAYOUT = {
  gramophone: { x: 95, y: 420 },
  cat: { x: 418, y: 456 },
  uciFlag: { x: 378, y: 300 },
  contactFrame: { x: 320 - (ASSETS.contactFrame.designWidth * CABIN_INTERIOR_PROP_SCALE) / 2, y: 190 },
  fireplace: { x: 235, y: 390, width: 170, height: 170 },
};

// The two exclamation hints. Each position is the top-left of the mark's
// 48x64 design box in cabin-local px, so both stay put in both composition
// modes; the mark then renders at its scale, shrunk around its own centre.
// ?debug=layout outlines each one -- edit the numbers to nudge them.
//   door       -- over the door handle, on the closed exterior (was 340,449;
//                 moved 12 left, 8 down, then 4 back right and 3 up).
//   gramophone -- above the gramophone's horn, on the open interior.
export const DOOR_HINT = { x: 332, y: 454, scale: 0.855 };
export const GRAMOPHONE_HINT = { x: 160, y: 365, scale: 0.5 };

// The mouth of the exterior art's chimney (cap spans x 125-204, top at
// y 75), in cabin-local px. Smoke starts just behind the cap, so each puff
// emerges from the chimney rather than appearing in front of it.
export const CHIMNEY_SMOKE_ORIGIN = { x: 165, y: 88 };

// Where the chimney smoke thins out, in the cabin scene's own stage px --
// world space: it travels with the scene but not with the cabin's zoom.
// Smoke is fully opaque at and below opaqueY and fully gone at and above
// goneY, fading smoothly between; negative is above the cabin's stage, toward
// Experience. The foreground layer the smoke draws in reaches up past goneY
// (getSmokeCorridorHeight), so its clipped edge only ever cuts through
// smoke that has already faded to nothing -- during Cabin <-> Experience
// travel the column dissolves into the sky instead of hitting a ceiling.
export interface SmokeFade {
  opaqueY: number;
  goneY: number;
}

// Extra room above goneY in the smoke's layer, so the very last of the fade
// is never trimmed.
const SMOKE_CORRIDOR_MARGIN = 8;


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
// anchored at its bottom-center so the cabin's base stays put. openScale
// here is only the floor: fitSceneLayout raises it to fit the real screen.
interface CabinScaleLayout {
  closedScale: number;
  openScale: number;
}

// How the OPEN cabin is fitted to a phone, since phones crop the portrait
// stage differently (a tall Chrome window shows ~887 of its 1080px width,
// Safari with its toolbars all 1080). fitSceneLayout scales it so the cabin's
// body -- its walls and stone base, art x bodyLeft-bodyRight -- spans `fill`
// of the visible width (the snowy eaves reach a little past the screen's
// edges), never smaller than V1's cabinScale.openScale. Then, if the roof
// (art row roofTop) would crowd the top of the screen, it settles lower
// (openOffsetY), as far as the bottom allows, and only if that can't make
// room is it scaled back down. Clearances are CSS px from the screen edge,
// for the menu and the Experience / Projects arrows.
const PORTRAIT_OPEN_FIT = {
  bodyLeft: 40,
  bodyRight: 595,
  fill: 1,
  roofTop: 20,
  topClearance: 96,
  bottomClearance: 56,
};

// The part of the stage the viewport actually shows (stage px), and how many
// CSS px one stage px is -- see SceneStage.
export interface StageViewport {
  x: number;
  y: number;
  width: number;
  height: number;
  scale: number;
}

// Desktop: the 640x720 logical shell is a STABLE reference box -- it never
// scales between closed/open. Only the art group inside it changes size:
// it renders at closedArtScale while closed (<1, anchored at the shell's
// bottom-center) and at exactly 100% of the shell once open, so the cabin
// grows upward and outward from its base. The interior sits in that same
// art group, so all three art layers stay registered through the reveal.
// openOffsetY moves the OPEN art down by that many stage px (the closed art
// doesn't move), travelling with the zoom.
interface DesktopCabinArt {
  shellScale: number;
  closedArtScale: number;
  openOffsetY: number;
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
  smokeFade: SmokeFade;
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
  // How far the OPEN cabin settles below its closed base, stage px (moving
  // with the zoom). Zero until fitSceneLayout needs it.
  openOffsetY: number;
  titleCardX: number;
  titleCardOffsetFromCabinY: number;
  houseSignX: number;
  houseSignOffsetFromCabinY: number;
  // Clouds are environment/background objects, not cabin-local -- this scale
  // is independent of the cabin's own displayScale.
  cloudScale: number;
  cloudSpeed: number;
  clouds: CloudBands;
  smokeFade: SmokeFade;
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
// The shell is 822x925 (shellScale 1.284: the old 1.2, +7%). The cabin is
// placed for the OPEN state, the one the Experience / Projects edge tabs
// frame: the open art's visible rows (20-719 of the shell, so its middle is
// shell row 370) are centred on the stage's vertical middle, then raised
// DESKTOP_OPEN_CENTER_LIFT px because the cabin reads bottom-heavy. The
// closed art (78% of the shell) keeps the same base. In a short, wide window
// the open roof is allowed to crop slightly. The title card would sit on
// the open roof and the house sign at the closed cabin's right edge (both
// currently hidden -- see TITLE_CARD_ENABLED / HOUSE_SIGN_ENABLED in
// CabinScene).
const DESKTOP_CABIN_SHELL_SCALE = 1.284;
const DESKTOP_CABIN_OPEN_OFFSET_Y = 45;
const DESKTOP_CABIN_ART_MID_ROW = 370;
const DESKTOP_OPEN_CENTER_LIFT = 15;

export const DESKTOP_LAYOUT: DesktopLayout = {
  mode: "desktop",
  stageWidth: DESKTOP_STAGE_WIDTH,
  stageHeight: DESKTOP_STAGE_HEIGHT,
  exterior: { scale: DESKTOP_STAGE_WIDTH / EXTERIOR_ART_WIDTH, x: 0, y: -320 },
  cabinX: 960 - CABIN_WIDTH / 2,
  cabinY:
    DESKTOP_STAGE_HEIGHT / 2 -
    DESKTOP_OPEN_CENTER_LIFT -
    DESKTOP_CABIN_OPEN_OFFSET_Y -
    DESKTOP_CABIN_ART_MID_ROW * DESKTOP_CABIN_SHELL_SCALE,
  cabinArt: {
    shellScale: DESKTOP_CABIN_SHELL_SCALE,
    closedArtScale: 0.78,
    openOffsetY: DESKTOP_CABIN_OPEN_OFFSET_Y,
  },
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
  // Gone just short of Experience (which starts 320px up, past the sky
  // bridge), and still almost opaque at the top of the cabin's own screen, so
  // the cabin view looks as it always has.
  smokeFade: { opaqueY: 40, goneY: -300 },
};

// Portrait/mobile: 1080x1920 reference stage. The exterior master keeps its
// full height (scaled up to fill the stage height), and the stage is a
// narrow, horizontally centred window through it -- the same art the desktop
// shows, at a much gentler zoom than the old stretched background.
const PORTRAIT_EXTERIOR_SCALE = PORTRAIT_STAGE_HEIGHT / EXTERIOR_ART_HEIGHT;

// The cabin group is anchored at its bottom-center, so cabinY is the top of
// the UNSCALED 640x720 box and the closed base sits at cabinY + 720 (stage
// y 1440). The open scale and how far the open cabin settles below that are
// fitted to the screen (PORTRAIT_OPEN_FIT, fitSceneLayout); 1.43 is the
// floor. The title card offset is measured from cabinY to clear the OPEN
// roof (cabinY + 720 - 720 * openScale).
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
  cabinY: 720,
  cabinScale: { closedScale: 1, openScale: 1.43 },
  openOffsetY: 0,
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
  // Experience sits directly on top of this stage (no sky bridge), so the
  // smoke is gone by the stage's own top edge and thins over the top of the
  // screen on the way there.
  smokeFade: { opaqueY: 260, goneY: 0 },
};

export function getSceneLayout(mode: CompositionMode): SceneLayout {
  return mode === "desktop" ? DESKTOP_LAYOUT : PORTRAIT_LAYOUT;
}

// The mode's layout fitted to what the viewport actually shows of the stage.
// Desktop is fixed; portrait fits its OPEN cabin to the phone (see
// PORTRAIT_OPEN_FIT). The closed cabin is never touched.
export function fitSceneLayout(layout: SceneLayout, viewport: StageViewport | null): SceneLayout {
  if (layout.mode === "desktop" || !viewport) return layout;
  const fit = PORTRAIT_OPEN_FIT;
  const base = getCabinBaseY(layout);
  const top = viewport.y + fit.topClearance / viewport.scale;
  const bottom = viewport.y + viewport.height - fit.bottomClearance / viewport.scale;
  const artHeight = CABIN_HEIGHT - fit.roofTop;
  const byWidth = (viewport.width * fit.fill) / (fit.bodyRight - fit.bodyLeft);
  const byHeight = (bottom - top) / artHeight;
  const openScale = Math.max(layout.cabinScale.openScale, Math.min(byWidth, byHeight));
  const roofY = base - artHeight * openScale;
  const openOffsetY = Math.max(0, Math.min(top - roofY, bottom - base));
  return { ...layout, cabinScale: { ...layout.cabinScale, openScale }, openOffsetY };
}

// Stage Y of the CLOSED cabin's base. Both modes' open cabins can settle
// lower than this as they open (openOffsetY).
export function getCabinBaseY(layout: SceneLayout): number {
  return layout.mode === "desktop"
    ? layout.cabinY + CABIN_HEIGHT * layout.cabinArt.shellScale
    : layout.cabinY + CABIN_HEIGHT;
}

// Stage Y of the one point the whole opening zoom grows from -- the cabin's
// and every terrain layer's -- so the reveal reads as a single camera moving
// into the scene rather than layers swelling from the screen centre.
//
// Growing from its base while also moving down by openOffsetY is, for the
// cabin, exactly a zoom about a fixed point openOffsetY / (zoom - 1) above
// its base (the move and the scale share one easing). With no offset the
// point is the base itself. The terrain zooms from the same point, so the
// ground near the cabin's feet moves with it, less far.
export function getZoomFocusY(layout: SceneLayout): number {
  const cabinZoom =
    layout.mode === "desktop"
      ? 1 / layout.cabinArt.closedArtScale
      : layout.cabinScale.openScale / layout.cabinScale.closedScale;
  const offset = layout.mode === "desktop" ? layout.cabinArt.openOffsetY : layout.openOffsetY;
  if (offset === 0 || cabinZoom === 1) return getCabinBaseY(layout);
  return getCabinBaseY(layout) - offset / (cabinZoom - 1);
}

// How far above the cabin's stage the cabin's foreground layer reaches, so
// the chimney smoke can rise past the stage's top edge and finish fading
// before anything clips it (see SmokeFade).
export function getSmokeCorridorHeight(layout: SceneLayout): number {
  return Math.max(0, -layout.smokeFade.goneY) + SMOKE_CORRIDOR_MARGIN;
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
// shellScale from its top-center), moved down by openOffsetY. Portrait: the
// group at openScale, from its bottom-center, moved down by openOffsetY.
export function getOpenCabinBox(layout: SceneLayout): { x: number; y: number; width: number; height: number } {
  const scale = layout.mode === "desktop" ? layout.cabinArt.shellScale : layout.cabinScale.openScale;
  const width = CABIN_WIDTH * scale;
  const height = CABIN_HEIGHT * scale;
  return {
    x: layout.cabinX + (CABIN_WIDTH - width) / 2,
    y:
      layout.mode === "desktop"
        ? layout.cabinY + layout.cabinArt.openOffsetY
        : getCabinBaseY(layout) + layout.openOffsetY - height,
    width,
    height,
  };
}
