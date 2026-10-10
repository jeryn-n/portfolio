import { ASSETS } from "@/data/assets";
import { DESKTOP_LAYOUT, PORTRAIT_LAYOUT, type ExteriorCrop } from "./layout";
import { DESKTOP_STAGE_HEIGHT, DESKTOP_STAGE_WIDTH } from "./stage";

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
  // Mirrors the shell artwork only -- never the entry's content.
  flipShell?: boolean;
}

// The Experience background is a 1920x1620 master, like the cabin exterior,
// and is painted as the sky directly ABOVE the cabin's sky: its bottom row
// continues the cabin sky's top row. So it is cropped the same way, never
// stretched:
//   desktop  -- full width at 1:1, and the window is the master's BOTTOM
//               1080 rows (art 540-1620), the part closest to the cabin
//               world, so its bottom edge runs on into the cabin scene
//               below. (The cabin's own desktop window starts at its art
//               row 320; see DESKTOP_LAYOUT.)
//   portrait -- exactly the cabin's portrait crop: full height, centred
//               narrow width. The cabin's portrait window shows its master
//               from row 0, so the two edges meet exactly.
export const EXPERIENCE_ART_HEIGHT = ASSETS.experienceBackground.designHeight;

export const EXPERIENCE_DESKTOP_CROP: ExteriorCrop = {
  scale: DESKTOP_STAGE_WIDTH / ASSETS.experienceBackground.designWidth,
  x: 0,
  y: DESKTOP_STAGE_HEIGHT - EXPERIENCE_ART_HEIGHT,
};

export const EXPERIENCE_PORTRAIT_CROP: ExteriorCrop = PORTRAIT_LAYOUT.exterior;

// Experience entries are placed by slug, never by array order. Unlike the
// Projects shells they are sized directly (`scale` x the 620x350 design
// size, applied to the box, art and text -- see EntryPreview's
// contentScale), not with a CSS transform.
export interface ExperiencePlacement extends EntryPlacement {
  // Debug label for the slot this entry fills.
  slot: string;
  scale: number;
  textScale: number;
  // Preview width, its inset from the shell's aligned edge, and the text
  // column width -- px, see EntryPreview.
  mediaWidth: number;
  contentInset: number;
  textWidth: number;
  // Downward nudges of the preview, the title and the tagline, px.
  mediaOffsetY: number;
  textOffsetY: number;
  taglineOffsetY: number;
}

// The one Experience shell (620x350) is reused for all three entries. Its
// tall cloud mass sits right of centre (~27-96% of its width, a low tail to
// the left) and, flipped, left of centre (~4-73%): flipped shells carry
// left-aligned content, the normal one right-aligned. The preview is inset
// 16% from the aligned edge so it sits on the tall mass, and the text column
// is a little wider, running on over the low tail.
const CONTENT_INSET = 0.16;

// The shell art is drawn on a 5-design-px pixel grid. The preview sits 3 of
// those cloud pixels lower than the vertically centred content, the title 2,
// and the tagline 1 -- tucked a little closer under the title.
const CLOUD_PIXEL = 5;
const MEDIA_OFFSET_CLOUD_PX = 3;
const TEXT_OFFSET_CLOUD_PX = 2;
const TAGLINE_OFFSET_CLOUD_PX = 1;

function experiencePlacement(
  slot: string,
  x: number,
  y: number,
  align: "left" | "right",
  scale: number,
  textScale: number,
  mediaWidth: number,
  textWidthRatio: number,
): ExperiencePlacement {
  return {
    slot,
    x,
    y,
    align,
    flipShell: align === "left",
    scale,
    textScale,
    mediaWidth,
    contentInset: ASSETS.experienceCloud1.designWidth * scale * CONTENT_INSET,
    textWidth: mediaWidth * textWidthRatio,
    mediaOffsetY: CLOUD_PIXEL * scale * MEDIA_OFFSET_CLOUD_PX,
    textOffsetY: CLOUD_PIXEL * scale * TEXT_OFFSET_CLOUD_PX,
    taglineOffsetY: CLOUD_PIXEL * scale * TAGLINE_OFFSET_CLOUD_PX,
  };
}

// Desktop: 751x424 shells with 380x253 previews; text stays at 1.5x.
// Turnbull sits top-left, Madison on the right just above the vertical
// middle (its mass ending ~144px from the right edge), Creative Net lower
// and nearer the centre, clear of the Go Home arrow. Y leaves ~90 stage px
// top and bottom, which a real ~1920x900 browser viewport crops away.
const EXPERIENCE_DESKTOP_SCALE = 1.275 * 0.95;
const EXPERIENCE_DESKTOP_TEXT_SCALE = 1.5;
const EXPERIENCE_DESKTOP_MEDIA = 380;

export const EXPERIENCE_DESKTOP_LAYOUT: Record<string, ExperiencePlacement> = {
  // Turnbull Equine Productions
  "experience-3": experiencePlacement("top-left", 66, 100, "left", EXPERIENCE_DESKTOP_SCALE, EXPERIENCE_DESKTOP_TEXT_SCALE, EXPERIENCE_DESKTOP_MEDIA, 1.2),
  // Madison Art Consulting
  "experience-2": experiencePlacement("middle-right", 1057, 225, "right", EXPERIENCE_DESKTOP_SCALE, EXPERIENCE_DESKTOP_TEXT_SCALE, EXPERIENCE_DESKTOP_MEDIA, 1.2),
  // Creative Net
  "experience-1": experiencePlacement("bottom-centre", 393, 530, "left", EXPERIENCE_DESKTOP_SCALE, EXPERIENCE_DESKTOP_TEXT_SCALE, EXPERIENCE_DESKTOP_MEDIA, 1.2),
};

export const PROJECTS_DESKTOP_LAYOUT: EntryPlacement[] = [
  { x: 1220, y: 80, align: "right" }, // upper-right
  { x: 100, y: 365, align: "left" }, // center-left
  { x: 1220, y: 650, align: "right" }, // lower-right
];

const PORTRAIT_ENTRY_SCALE = 0.75;

// Projects portrait: a mostly vertical sequence with a subtle left/right
// stagger -- all three fit comfortably within the tall 1080x1920 portrait
// stage without scrolling.
export const PROJECTS_PORTRAIT_LAYOUT: EntryPlacement[] = [
  { x: 267, y: 140, align: "left", scale: PORTRAIT_ENTRY_SCALE },
  { x: 347, y: 492, align: "left", scale: PORTRAIT_ENTRY_SCALE },
  { x: 267, y: 844, align: "left", scale: PORTRAIT_ENTRY_SCALE },
];

// Portrait Experience: 808x456 shells with 392x261 previews, against a
// visible stage of ~x 97-983 on phones. Left clouds start at x 40 so their
// mass runs just off the LEFT edge; Madison mirrors that off the RIGHT edge
// (shell right edge at 1040). Previews and text keep ~80 stage px clear of
// either edge. The three keep their upper / middle / lower centres, clear of
// the menu at the top and the Go Home arrow at the bottom. Text gets an
// extra boost so it stays readable at phone size.
const EXPERIENCE_PORTRAIT_SCALE = (850 / ASSETS.experienceCloud1.designWidth) * 0.95;
const EXPERIENCE_PORTRAIT_TEXT_SCALE = (1000 / ASSETS.experienceCloud1.designWidth) * 1.35 * 0.9;
const EXPERIENCE_PORTRAIT_MEDIA = 392;

export const EXPERIENCE_PORTRAIT_LAYOUT: Record<string, ExperiencePlacement> = {
  // Turnbull Equine Productions
  "experience-3": experiencePlacement("upper", 40, 140, "left", EXPERIENCE_PORTRAIT_SCALE, EXPERIENCE_PORTRAIT_TEXT_SCALE, EXPERIENCE_PORTRAIT_MEDIA, 1.45),
  // Madison Art Consulting
  "experience-2": experiencePlacement("middle", 190, 680, "right", EXPERIENCE_PORTRAIT_SCALE, EXPERIENCE_PORTRAIT_TEXT_SCALE, EXPERIENCE_PORTRAIT_MEDIA, 1.45),
  // Creative Net
  "experience-1": experiencePlacement("lower", 40, 1220, "left", EXPERIENCE_PORTRAIT_SCALE, EXPERIENCE_PORTRAIT_TEXT_SCALE, EXPERIENCE_PORTRAIT_MEDIA, 1.45),
};

// The cabin's desktop crop, for the debug overlay's continuity note.
export const CABIN_DESKTOP_TOP_ART_ROW = -DESKTOP_LAYOUT.exterior.y;
