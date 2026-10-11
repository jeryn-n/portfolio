"use client";

import { LATE_REVEAL_DELAY } from "@/lib/reveal";
import { useDebugLayout } from "@/lib/useDebugLayout";
import { useSiteUI } from "@/components/ui/SiteUIProvider";
import { useCabinState } from "./CabinStateContext";
import { SceneArrow } from "./SceneArrow";
import { useSceneNavigation } from "./useSceneNavigation";
import { useWorldScene } from "./WorldSceneContext";

// Rendered as a sibling of the scaled logical stage (see SceneStage), so
// these arrows sit in real, untransformed viewport pixels and never shrink
// or grow with the stage/cabin on either composition mode.
//
// Every scene's arrows stay mounted; each only shows once its scene has been
// landed on. They're hidden for the whole of a scene travel, so the arrows
// being left fade out quickly as travel starts, and the destination's fade
// in only after it arrives. Also hidden while a blocking modal is open.
export function ViewportNavArrows() {
  const { cabinState } = useCabinState();
  const { isBlockingOverlayOpen } = useSiteUI();
  const { scene, navAllowed, navigate } = useSceneNavigation();
  const { transitionLock } = useWorldScene();
  const debug = useDebugLayout();

  const settled = transitionLock === "idle" && !isBlockingOverlayOpen;
  const cabinRevealed = scene === "cabin" && cabinState === "open" && settled;
  const revealDelay = cabinState === "opening" ? LATE_REVEAL_DELAY : 0;

  return (
    <>
      <SceneArrow
        direction="up"
        ariaLabel="Go to Experience"
        displayText="Experience"
        edge="top"
        revealed={cabinRevealed}
        interactive={navAllowed}
        revealDelay={revealDelay}
        onActivate={() => navigate("experience")}
        shaded
        debug={debug}
      />
      <SceneArrow
        direction="down"
        ariaLabel="Go to Projects"
        displayText="Projects"
        edge="bottom"
        revealed={cabinRevealed}
        interactive={navAllowed}
        revealDelay={revealDelay}
        onActivate={() => navigate("projects")}
        shaded
        debug={debug}
      />
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
    </>
  );
}
