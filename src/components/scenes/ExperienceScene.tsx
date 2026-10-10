"use client";

import { ArtAsset } from "@/components/art/ArtAsset";
import { ASSETS } from "@/data/assets";
import { EXPERIENCE_ENTRIES } from "@/data/portfolio";
import { DESKTOP_STAGE_HEIGHT, DESKTOP_STAGE_WIDTH, PORTRAIT_STAGE_HEIGHT, PORTRAIT_STAGE_WIDTH } from "@/lib/stage";
import { useDebugLayout } from "@/lib/useDebugLayout";
import {
  CABIN_DESKTOP_TOP_ART_ROW,
  EXPERIENCE_DESKTOP_CROP,
  EXPERIENCE_DESKTOP_LAYOUT,
  EXPERIENCE_PORTRAIT_CROP,
  EXPERIENCE_PORTRAIT_LAYOUT,
} from "@/lib/worldLayout";
import { useCompositionMode } from "./CompositionModeContext";
import { EntryPreview } from "./EntryPreview";

// The only Experience shell drawn so far, reused for all three entries (the
// placements mirror it where needed).
const SHELL_ASSET = ASSETS.experienceCloud1;

// Full-screen scene using the same stage-coordinate approach as the cabin
// (1920x1080 desktop / 1080x1920 portrait reference canvas), so it composes
// consistently inside WorldSceneController. No HTML heading -- any eventual
// title is baked directly into the background artwork.
export function ExperienceScene() {
  const mode = useCompositionMode();
  const debug = useDebugLayout();
  const stageWidth = mode === "desktop" ? DESKTOP_STAGE_WIDTH : PORTRAIT_STAGE_WIDTH;
  const stageHeight = mode === "desktop" ? DESKTOP_STAGE_HEIGHT : PORTRAIT_STAGE_HEIGHT;
  const placements = mode === "desktop" ? EXPERIENCE_DESKTOP_LAYOUT : EXPERIENCE_PORTRAIT_LAYOUT;
  const crop = mode === "desktop" ? EXPERIENCE_DESKTOP_CROP : EXPERIENCE_PORTRAIT_CROP;
  const background = ASSETS.experienceBackground;

  return (
    <div className="absolute inset-0">
      {/* The 1920x1620 master at one uniform scale, cropped by the stage --
          see worldLayout. maxWidth: the portrait crop is wider than the
          stage, and Tailwind's preflight img cap would squeeze it. */}
      <ArtAsset
        asset={background}
        style={{
          position: "absolute",
          left: crop.x,
          top: crop.y,
          width: background.designWidth * crop.scale,
          height: background.designHeight * crop.scale,
          maxWidth: "none",
        }}
      />

      {/* Each entry's slot comes from its slug, not its position in the
          data. The box is sized directly (no transform), so the content's
          hitbox, text and 3:2 preview are never scaled or skewed. */}
      {EXPERIENCE_ENTRIES.map((entry) => {
        const placement = placements[entry.slug];
        if (!placement) return null;
        const width = SHELL_ASSET.designWidth * placement.scale;
        const height = SHELL_ASSET.designHeight * placement.scale;

        return (
          <div key={entry.slug} className="absolute" style={{ left: placement.x, top: placement.y, width, height }}>
            <EntryPreview
              entry={entry}
              shellAsset={SHELL_ASSET}
              align={placement.align}
              flipShell={placement.flipShell}
              contentScale={placement.scale}
              textScale={placement.textScale}
              mediaWidth={placement.mediaWidth}
              contentInset={placement.contentInset}
              textWidth={placement.textWidth}
              mediaOffsetY={placement.mediaOffsetY}
              textOffsetY={placement.textOffsetY}
              taglineOffsetY={placement.taglineOffsetY}
              tone="dark"
            />
            {debug && (
              <>
                <span className="absolute left-2 top-2 z-[2] whitespace-nowrap rounded bg-black/60 px-1 text-[12px] uppercase tracking-wide text-cyan-300">
                  {entry.title} -- {placement.slot}, shell {placement.flipShell ? "flipped" : "normal"}, ×{placement.scale.toFixed(2)} ({Math.round(placement.x)}, {Math.round(placement.y)}) {Math.round(width)}×{Math.round(height)}
                </span>
                <span className="pointer-events-none absolute inset-0 border border-dashed border-cyan-300/70" />
              </>
            )}
          </div>
        );
      })}

      {debug && (
        <span className="absolute left-2 top-2 rounded bg-black/60 px-1 text-[10px] uppercase tracking-wide text-yellow-300">
          Scene: Experience -- stage {stageWidth}×{stageHeight}, bg {background.designWidth}×{background.designHeight} master ×
          {crop.scale.toFixed(3)} at ({Math.round(crop.x)}, {Math.round(crop.y)})
          {mode === "desktop"
            ? ` -- art rows ${-crop.y}-${background.designHeight}; bottom edge meets cabin sky row 0, bridged to the cabin window (row ${CABIN_DESKTOP_TOP_ART_ROW}) by cabin sky rows 0-${CABIN_DESKTOP_TOP_ART_ROW} in travel`
            : " -- same crop as the cabin; bottom edge meets cabin art row 0"}
        </span>
      )}
    </div>
  );
}
