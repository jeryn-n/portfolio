import { ASSETS, type ArtAssetDef } from "@/data/assets";
import {
  CLOUD_ASSETS,
  CLOUD_FLIPPABLE,
  CLOUD_KIND_SCALE,
  CLOUD_MAX_TOP_OVERHANG,
  type CloudKind,
  type SceneLayout,
} from "@/lib/layout";

export interface CloudSpec {
  id: string;
  kind: CloudKind;
  asset: ArtAssetDef;
  // Stage position of the cloud's (unscaled) box; its scale is around the
  // box centre, so the centre is what placement picks.
  x: number;
  y: number;
  // Closed-cabin speed, stage pixels per second.
  speed: number;
  scale: number;
  flip: boolean;
}

type CloudAssetId = (typeof CLOUD_ASSETS)[CloudKind][number];

// Where each cloud's artwork actually sits inside its canvas, in art pixels
// (the small clouds are drawn well inside theirs). Spacing is measured
// between these, not between the canvases.
const CLOUD_CONTENT: Record<CloudAssetId, { left: number; top: number; right: number; bottom: number }> = {
  ambientCloud1Medium: { left: 0, top: 10, right: 360, bottom: 140 },
  ambientCloud2VeryLarge: { left: 0, top: 6, right: 450, bottom: 160 },
  ambientCloud3Medium: { left: 0, top: 0, right: 300, bottom: 90 },
  ambientCloud4Small: { left: 46, top: 50, right: 256, bottom: 90 },
  ambientCloud5Small: { left: 80, top: 46, right: 230, bottom: 70 },
  ambientCloud6Small: { left: 80, top: 40, right: 226, bottom: 76 },
};

// Minimum clear space between two clouds' artwork, stage pixels.
const CLOUD_GAP = 24;
// Candidate positions tried per cloud before settling for the roomiest.
const PLACEMENT_TRIES = 60;

const CLOUD_KINDS: readonly CloudKind[] = ["large", "medium", "small"];

interface Footprint {
  centerX: number;
  centerY: number;
  halfWidth: number;
  halfHeight: number;
}

function between(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

// A point in [top, bottom], landing in the lower half lowerHalfWeight times
// as often as in the upper half.
function bandY(top: number, bottom: number, lowerHalfWeight = 1): number {
  const middle = (top + bottom) / 2;
  return Math.random() < lowerHalfWeight / (1 + lowerHalfWeight) ? between(middle, bottom) : between(top, middle);
}

// The stage rectangle a cloud's artwork covers, centred on its box centre.
function footprint(id: CloudAssetId, centerX: number, centerY: number, scale: number, flip: boolean): Footprint {
  const { designWidth, designHeight } = ASSETS[id];
  const content = CLOUD_CONTENT[id];
  const offsetX = ((content.left + content.right) / 2 - designWidth / 2) * scale;
  return {
    centerX: centerX + (flip ? -offsetX : offsetX),
    centerY: centerY + ((content.top + content.bottom) / 2 - designHeight / 2) * scale,
    halfWidth: ((content.right - content.left) / 2) * scale,
    halfHeight: ((content.bottom - content.top) / 2) * scale,
  };
}

// Clear space between two footprints (negative when they overlap). Clouds
// wrap every stage width, so horizontal distance is measured around it.
function clearance(a: Footprint, b: Footprint, wrapWidth: number): number {
  const rawX = (((a.centerX - b.centerX) % wrapWidth) + wrapWidth) % wrapWidth;
  const dx = Math.min(rawX, wrapWidth - rawX);
  const gapX = dx - (a.halfWidth + b.halfWidth);
  const gapY = Math.abs(a.centerY - b.centerY) - (a.halfHeight + b.halfHeight);
  return Math.max(gapX, gapY);
}

// Everything random about a cloud is drawn here, once, and then left alone.
// Clouds all drift at the same speed, so they keep their spacing forever
// once it holds at the start: each one is scattered inside its category's
// band, at the first spot clear of every cloud already placed (or the
// roomiest spot tried, in the rare case none is). The field comes back
// ordered top to bottom, so higher clouds draw behind lower ones.
export function createCloudField(layout: SceneLayout): CloudSpec[] {
  const wrapWidth = layout.stageWidth;
  const placed: Footprint[] = [];

  const field = CLOUD_KINDS.flatMap((kind) => {
    const band = layout.clouds[kind];
    const assets = CLOUD_ASSETS[kind];
    // Assets rotate from a random start, so every shape in the category
    // shows up.
    const firstAsset = Math.floor(Math.random() * assets.length);

    return Array.from({ length: band.count }, (_, index) => {
      const id: CloudAssetId = assets[(firstAsset + index) % assets.length];
      const asset = ASSETS[id];
      const scale = layout.cloudScale * CLOUD_KIND_SCALE[kind] * between(0.9, 1.1);
      const flip = CLOUD_FLIPPABLE[kind] && Math.random() < 0.5;
      // Keep the artwork's top from sticking out far above the stage.
      const minCenterY = (asset.designHeight / 2 - CLOUD_CONTENT[id].top) * scale - CLOUD_MAX_TOP_OVERHANG;
      const top = Math.max(band.top, minCenterY);

      let best = { centerX: 0, centerY: 0, print: footprint(id, 0, 0, scale, flip), room: -Infinity };
      for (let attempt = 0; attempt < PLACEMENT_TRIES && best.room < CLOUD_GAP; attempt++) {
        const centerX = between(0, wrapWidth);
        const centerY = bandY(top, Math.max(top, band.bottom), band.lowerHalfWeight);
        const print = footprint(id, centerX, centerY, scale, flip);
        const room = Math.min(Infinity, ...placed.map((other) => clearance(print, other, wrapWidth)));
        if (room > best.room) best = { centerX, centerY, print, room };
      }
      placed.push(best.print);

      return {
        id: `${kind}-${index}`,
        kind,
        asset,
        x: best.centerX - asset.designWidth / 2,
        y: best.centerY - asset.designHeight / 2,
        speed: layout.cloudSpeed,
        scale,
        flip,
      };
    });
  });

  return field.sort((a, b) => a.y + a.asset.designHeight / 2 - (b.y + b.asset.designHeight / 2));
}
