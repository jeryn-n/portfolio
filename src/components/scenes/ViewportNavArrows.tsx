"use client";

import { LATE_REVEAL_DELAY } from "@/lib/reveal";
import { useDebugLayout } from "@/lib/useDebugLayout";
import { useSiteUI } from "@/components/ui/SiteUIProvider";
import { useCabinState } from "./CabinStateContext";
import { SceneArrow } from "./SceneArrow";
import { useSceneNavigation } from "./useSceneNavigation";

// Rendered as a sibling of the scaled logical stage (see SceneStage), so
// these arrows sit in real, untransformed viewport pixels and never shrink
// or grow with the stage/cabin on either composition mode. Which arrow(s)
// show, and what they do, depends entirely on the current scene.
export function ViewportNavArrows() {
  const { cabinState } = useCabinState();
  const { isBlockingOverlayOpen } = useSiteUI();
  const { scene, navAllowed, navigate } = useSceneNavigation();
  const debug = useDebugLayout();

  const hiddenForModal = isBlockingOverlayOpen;
  const revealDelay = cabinState === "opening" ? LATE_REVEAL_DELAY : 0;

  if (scene === "cabin") {
    const revealed = cabinState === "open" && !hiddenForModal;
    return (
      <>
        <SceneArrow
          direction="up"
          ariaLabel="Go to Experience"
          displayText="Experience"
          edge="top"
          revealed={revealed}
          interactive={navAllowed}
          revealDelay={revealDelay}
          onActivate={() => navigate("experience")}
          debug={debug}
        />
        <SceneArrow
          direction="down"
          ariaLabel="Go to Projects"
          displayText="Projects"
          edge="bottom"
          revealed={revealed}
          interactive={navAllowed}
          revealDelay={revealDelay}
          onActivate={() => navigate("projects")}
          debug={debug}
        />
      </>
    );
  }

  if (scene === "experience") {
    return (
      <SceneArrow
        direction="down"
        ariaLabel="Go Home"
        displayText="Go Home"
        edge="bottom"
        revealed={!hiddenForModal}
        interactive={navAllowed}
        revealDelay={0}
        onActivate={() => navigate("cabin")}
        debug={debug}
      />
    );
  }

  return (
    <SceneArrow
      direction="up"
      ariaLabel="Go Home"
      displayText="Go Home"
      edge="top"
      revealed={!hiddenForModal}
      interactive={navAllowed}
      revealDelay={0}
      onActivate={() => navigate("cabin")}
      debug={debug}
    />
  );
}
