"use client";

import { ArtAsset } from "@/components/art/ArtAsset";
import { ASSETS } from "@/data/assets";
import { PROJECT_ENTRIES } from "@/data/portfolio";
import { PROJECTS_UNDER_CONSTRUCTION } from "@/data/site";
import { DESKTOP_STAGE_HEIGHT, DESKTOP_STAGE_WIDTH, PORTRAIT_STAGE_HEIGHT, PORTRAIT_STAGE_WIDTH } from "@/lib/stage";
import { useDebugLayout } from "@/lib/useDebugLayout";
import { PROJECTS_DESKTOP_CROP, PROJECTS_DESKTOP_LAYOUT, PROJECTS_PORTRAIT_CROP, PROJECTS_PORTRAIT_LAYOUT } from "@/lib/worldLayout";
import { useCompositionMode } from "./CompositionModeContext";
import { EntryPreview } from "./EntryPreview";

// The only boulder drawn so far, reused for all three entries (the
// placements mirror it where needed).
const SHELL_ASSET = ASSETS.projectBoulder1;

// Mirrors ExperienceScene's structure: same stage-coordinate approach, no
// HTML heading, decorative boulder shells behind real HTML preview content.
export function ProjectsScene() {
  const mode = useCompositionMode();
  const debug = useDebugLayout();
  const stageWidth = mode === "desktop" ? DESKTOP_STAGE_WIDTH : PORTRAIT_STAGE_WIDTH;
  const stageHeight = mode === "desktop" ? DESKTOP_STAGE_HEIGHT : PORTRAIT_STAGE_HEIGHT;
  const placements = mode === "desktop" ? PROJECTS_DESKTOP_LAYOUT : PROJECTS_PORTRAIT_LAYOUT;
  const crop = mode === "desktop" ? PROJECTS_DESKTOP_CROP : PROJECTS_PORTRAIT_CROP;
  const background = ASSETS.projectsBackground;

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

      {/* Temporary cover (see PROJECTS_UNDER_CONSTRUCTION): the background
          stays, dimmed, and the entries below aren't rendered at all. */}
      {PROJECTS_UNDER_CONSTRUCTION && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 bg-ink/55 px-[8%] text-center text-paper">
          <span className="h-[3px] w-[120px] rounded-full bg-paper/50" />
          {/* Portrait is narrower in stage px, so the heading wraps onto two
              larger lines there. */}
          <p
            className={`font-bold uppercase tracking-[0.18em] ${
              mode === "desktop" ? "text-[56px] leading-none" : "text-[84px] leading-[1.1]"
            }`}
          >
            Under Construction
          </p>
          <p className={`text-paper/80 ${mode === "desktop" ? "text-[24px]" : "text-[38px]"}`}>
            Projects are on their way. Check back soon.
          </p>
          <span className="h-[3px] w-[120px] rounded-full bg-paper/50" />
        </div>
      )}

      {/* Entry 1 takes the top slot, 2 the middle, 3 the bottom. The box is
          sized directly (no transform), so the content's hitbox, text and
          3:2 preview are never scaled or skewed. */}
      {!PROJECTS_UNDER_CONSTRUCTION && PROJECT_ENTRIES.map((entry, index) => {
        const placement = placements[index];
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
              frameColor="#647291"
            />
            {debug && (
              <>
                <span className="absolute left-2 top-2 z-[2] whitespace-nowrap rounded bg-black/60 px-1 text-[12px] uppercase tracking-wide text-cyan-300">
                  #{index + 1} {entry.title} -- {placement.slot}, shell {placement.flipShell ? "flipped" : "normal"}, ×{placement.scale.toFixed(2)} ({Math.round(placement.x)}, {Math.round(placement.y)}) {Math.round(width)}×{Math.round(height)}
                </span>
                <span className="pointer-events-none absolute inset-0 border border-dashed border-cyan-300/70" />
              </>
            )}
          </div>
        );
      })}

      {debug && (
        <span className="absolute left-2 top-2 rounded bg-black/60 px-1 text-[10px] uppercase tracking-wide text-yellow-300">
          Scene: Projects -- stage {stageWidth}×{stageHeight}, bg {background.designWidth}×{background.designHeight} master ×
          {crop.scale.toFixed(3)} at ({Math.round(crop.x)}, {Math.round(crop.y)})
          {mode === "desktop" ? ` -- art rows ${-crop.y}-${stageHeight - crop.y}, centred` : " -- full height, centred"}
        </span>
      )}
    </div>
  );
}
