"use client";

import { useSearchParams } from "next/navigation";
import { LATE_REVEAL_DELAY } from "@/lib/reveal";
import { useCabinState } from "./CabinStateContext";
import { SceneArrow } from "./SceneArrow";

// Rendered as a sibling of the scaled logical stage (see SceneStage), so
// these arrows sit in real, untransformed viewport pixels and never shrink
// or grow with the stage/cabin on either composition mode.
export function ViewportNavArrows() {
  const { cabinState } = useCabinState();
  const searchParams = useSearchParams();
  const debug = searchParams.get("debug") === "layout";
  const chromeRevealed = cabinState !== "closed";

  return (
    <>
      <SceneArrow
        direction="up"
        label="Experience"
        edge="top"
        revealed={chromeRevealed}
        revealDelay={LATE_REVEAL_DELAY}
        debug={debug}
      />
      <SceneArrow
        direction="down"
        label="Projects"
        edge="bottom"
        revealed={chromeRevealed}
        revealDelay={LATE_REVEAL_DELAY}
        debug={debug}
      />
    </>
  );
}
