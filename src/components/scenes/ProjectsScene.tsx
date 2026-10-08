"use client";

import { ArtAsset } from "@/components/art/ArtAsset";
import { ASSETS } from "@/data/assets";
import { PROJECT_ENTRIES } from "@/data/portfolio";
import { DESKTOP_STAGE_HEIGHT, DESKTOP_STAGE_WIDTH, PORTRAIT_STAGE_HEIGHT, PORTRAIT_STAGE_WIDTH } from "@/lib/stage";
import { useDebugLayout } from "@/lib/useDebugLayout";
import { PROJECTS_DESKTOP_LAYOUT, PROJECTS_PORTRAIT_LAYOUT } from "@/lib/worldLayout";
import { useCompositionMode } from "./CompositionModeContext";
import { EntryPreview } from "./EntryPreview";

const SHELL_ASSETS = [ASSETS.projectBoulder1, ASSETS.projectBoulder2, ASSETS.projectBoulder3];

// Mirrors ExperienceScene's structure: same stage-coordinate approach, no
// HTML heading, decorative boulder shells behind real HTML preview content.
export function ProjectsScene() {
  const mode = useCompositionMode();
  const debug = useDebugLayout();
  const stageWidth = mode === "desktop" ? DESKTOP_STAGE_WIDTH : PORTRAIT_STAGE_WIDTH;
  const stageHeight = mode === "desktop" ? DESKTOP_STAGE_HEIGHT : PORTRAIT_STAGE_HEIGHT;
  const placements = mode === "desktop" ? PROJECTS_DESKTOP_LAYOUT : PROJECTS_PORTRAIT_LAYOUT;

  return (
    <div className="absolute inset-0">
      <ArtAsset
        asset={ASSETS.projectsBackground}
        style={{ position: "absolute", left: 0, top: 0, width: stageWidth, height: stageHeight }}
      />

      {PROJECT_ENTRIES.map((entry, index) => {
        const placement = placements[index];
        const shellAsset = SHELL_ASSETS[index];

        return (
          <div
            key={entry.slug}
            className="absolute"
            style={{
              left: placement.x,
              top: placement.y,
              width: shellAsset.designWidth,
              height: shellAsset.designHeight,
              transform: placement.scale ? `scale(${placement.scale})` : undefined,
              transformOrigin: "top left",
            }}
          >
            <EntryPreview entry={entry} shellAsset={shellAsset} align={placement.align} />
            {debug && (
              <span className="absolute -top-4 left-0 whitespace-nowrap rounded bg-black/60 px-1 text-[9px] uppercase tracking-wide text-cyan-300">
                #{index + 1} {entry.slug}
              </span>
            )}
          </div>
        );
      })}

      {debug && (
        <span className="absolute left-2 top-2 rounded bg-black/60 px-1 text-[10px] uppercase tracking-wide text-yellow-300">
          Scene: Projects -- bg {stageWidth}×{stageHeight}
        </span>
      )}
    </div>
  );
}
