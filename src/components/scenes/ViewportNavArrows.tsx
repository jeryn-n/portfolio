"use client";

import { useSyncExternalStore } from "react";
import { PROJECTS_ENABLED } from "@/data/site";
import { LATE_REVEAL_DELAY } from "@/lib/reveal";
import { getCompositionMode } from "@/lib/stage";
import { useDebugLayout } from "@/lib/useDebugLayout";
import { useSiteUI } from "@/components/ui/SiteUIProvider";
import { useCabinState } from "./CabinStateContext";
import { EdgeTab } from "./EdgeTab";
import { SceneArrow } from "./SceneArrow";
import { useSceneNavigation } from "./useSceneNavigation";
import { useWorldScene } from "./WorldSceneContext";

// Whether the viewport gets the desktop composition (the same aspect-ratio
// rule SceneStage uses). This UI sits outside the stage, so it can't read the
// stage's mode context; it asks the window itself. The server and the first
// client render both say "desktop" -- the tabs aren't visible then anyway.
function subscribeToResize(onChange: () => void) {
  window.addEventListener("resize", onChange);
  return () => window.removeEventListener("resize", onChange);
}

function useIsDesktopViewport(): boolean {
  return useSyncExternalStore(
    subscribeToResize,
    () => getCompositionMode(window.innerWidth, window.innerHeight) === "desktop",
    () => true,
  );
}

// Rendered as a sibling of the scaled logical stage (see SceneStage), so
// these arrows sit in real, untransformed viewport pixels and never shrink
// or grow with the stage/cabin on either composition mode.
//
// Every scene's arrows stay mounted; each only shows once its scene has been
// landed on. They're hidden for the whole of a scene travel, so the arrows
// being left fade out quickly as travel starts, and the destination's fade
// in only after it arrives. Also hidden while a blocking modal is open. The
// cabin's Projects arrow isn't rendered at all while Projects is hidden
// (PROJECTS_ENABLED).
export function ViewportNavArrows() {
  const { cabinState } = useCabinState();
  const { isBlockingOverlayOpen } = useSiteUI();
  const { scene, navAllowed, navigate } = useSceneNavigation();
  const { transitionLock } = useWorldScene();
  const debug = useDebugLayout();
  const desktop = useIsDesktopViewport();

  const settled = transitionLock === "idle" && !isBlockingOverlayOpen;
  const cabinRevealed = scene === "cabin" && cabinState === "open" && settled;
  const revealDelay = cabinState === "opening" ? LATE_REVEAL_DELAY : 0;

  return (
    <>
      {/* Every scene's world control is an edge tab on desktop and an arrow
          everywhere else. */}
      {desktop ? (
        <EdgeTab
          edge="top"
          ariaLabel="Go to Experience"
          label="Experience"
          revealed={cabinRevealed}
          interactive={navAllowed}
          revealDelay={revealDelay}
          onActivate={() => navigate("experience")}
        />
      ) : (
        <SceneArrow
          direction="up"
          ariaLabel="Go to Experience"
          displayText="Experience"
          edge="top"
          revealed={cabinRevealed}
          interactive={navAllowed}
          revealDelay={revealDelay}
          onActivate={() => navigate("experience")}
          debug={debug}
        />
      )}
      {PROJECTS_ENABLED &&
        (desktop ? (
          <EdgeTab
            edge="bottom"
            ariaLabel="Go to Projects"
            label="Projects"
            revealed={cabinRevealed}
            interactive={navAllowed}
            revealDelay={revealDelay}
            onActivate={() => navigate("projects")}
          />
        ) : (
          <SceneArrow
            direction="down"
            ariaLabel="Go to Projects"
            displayText="Projects"
            edge="bottom"
            revealed={cabinRevealed}
            interactive={navAllowed}
            revealDelay={revealDelay}
            onActivate={() => navigate("projects")}
            debug={debug}
          />
        ))}
      {desktop ? (
        <EdgeTab
          edge="bottom"
          ariaLabel="Go Home"
          label="Go Home"
          revealed={scene === "experience" && settled}
          interactive={navAllowed}
          revealDelay={0}
          onActivate={() => navigate("cabin")}
        />
      ) : (
        <SceneArrow
          direction="down"
          ariaLabel="Go Home"
          displayText="Go Home"
          edge="bottom"
          revealed={scene === "experience" && settled}
          interactive={navAllowed}
          revealDelay={0}
          onActivate={() => navigate("cabin")}
          debug={debug}
        />
      )}
      {desktop ? (
        <EdgeTab
          edge="top"
          ariaLabel="Go Home"
          label="Go Home"
          revealed={scene === "projects" && settled}
          interactive={navAllowed}
          revealDelay={0}
          onActivate={() => navigate("cabin")}
        />
      ) : (
        <SceneArrow
          direction="up"
          ariaLabel="Go Home"
          displayText="Go Home"
          edge="top"
          revealed={scene === "projects" && settled}
          interactive={navAllowed}
          revealDelay={0}
          onActivate={() => navigate("cabin")}
          debug={debug}
        />
      )}
    </>
  );
}
