"use client";

import { motion, useReducedMotion, type Transition } from "motion/react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useCabinState } from "@/components/scenes/CabinStateContext";
import { useStageReady } from "@/components/scenes/SceneStage";
import { sceneFromHash } from "@/components/scenes/WorldSceneContext";
import { assetSources, ESSENTIAL_EXTERIOR_ASSETS, PROJECTS_SECONDARY_ASSETS, SECONDARY_ASSETS } from "@/data/assets";
import { PROJECTS_ENABLED } from "@/data/site";
import { preloadImages } from "@/lib/preload";

// Purely a safety net for a stalled network: the cover opens after this even
// if the first-frame images haven't all settled. It is not a minimum and not
// the normal exit path -- preloadImages settles a missing file immediately.
const MAX_WAIT_MS = 6000;

// Once the world is rendered and its images are decoded, it sits -- settled,
// under the cover -- for this long before the cover opens, so the first
// thing anyone sees is a still scene, never one finishing its setup.
const SETTLE_MS = 500;

// The cover is two halves that part from the centre, like doors: the top
// half lifts up and the bottom half drops down.
const OPEN_TRANSITION: Transition = { duration: 0.9, ease: [0.76, 0, 0.24, 1] };
// Reduced motion swaps the doors for a short fade.
const REDUCED_TRANSITION: Transition = { duration: 0.35, ease: "easeOut" };

type Phase = "covering" | "opening" | "done";

function secondarySources(): string[] {
  return assetSources(PROJECTS_ENABLED ? [...SECONDARY_ASSETS, ...PROJECTS_SECONDARY_ASSETS] : SECONDARY_ASSETS);
}

// The first-load cover for the normal `/` cabin entry: an opaque, pointer-
// blocking, viewport-fixed screen at the very top of the page (SceneStage
// renders it outside the stage's transform). The world mounts and lays
// itself out underneath, invisibly. The cover opens only once:
//
//   1. the stage has rendered the world (useStageReady),
//   2. every first-frame image is loaded and decoded, or known missing
//      (ESSENTIAL_EXTERIOR_ASSETS -- notably not the other two scenes),
//   3. and a further SETTLE_MS has passed.
//
// Mounted from the homepage only, so portfolio detail routes never render it
// at all. A load that doesn't open on the closed exterior -- direct scene
// entry (`/#experience`, `/#projects`), or returning to `/` with the cabin
// already open -- skips it in a layout effect, before the first paint.
// `onDone` is told once the cover is gone (or was never needed).
export function ExteriorLoadingScreen({ onDone }: { onDone?: () => void }) {
  // Starts covering on both server and client, so there is no hydration
  // mismatch and no gap between first paint and the cover.
  const [phase, setPhase] = useState<Phase>("covering");
  const stageReady = useStageReady();
  const { cabinState } = useCabinState();
  const reducedMotion = useReducedMotion() ?? false;
  const firstFrameReady = useRef<Promise<void> | null>(null);

  useLayoutEffect(() => {
    if (sceneFromHash(window.location.hash) !== null || cabinState !== "closed") {
      // Has to land before the first paint (hence a layout effect), or the
      // cover would flash up on a load that never needed it.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPhase("done");
      // Nothing waited for the exterior, so it joins the warm-up.
      void preloadImages([...assetSources(ESSENTIAL_EXTERIOR_ASSETS), ...secondarySources()], "low");
      return;
    }

    // Started now, at hydration, rather than once the stage is ready, so the
    // downloads get going as early as possible.
    firstFrameReady.current = preloadImages(assetSources(ESSENTIAL_EXTERIOR_ASSETS), "high");
    const cap = setTimeout(() => setPhase((current) => (current === "covering" ? "opening" : current)), MAX_WAIT_MS);
    return () => clearTimeout(cap);
    // Decided once, from the state the page mounted in.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const assets = firstFrameReady.current;
    if (phase !== "covering" || !stageReady || !assets) return;

    let cancelled = false;
    let settleTimer: ReturnType<typeof setTimeout> | undefined;
    void assets.then(() => {
      if (cancelled) return;
      settleTimer = setTimeout(() => setPhase("opening"), SETTLE_MS);
    });
    return () => {
      cancelled = true;
      clearTimeout(settleTimer);
    };
  }, [phase, stageReady]);

  // The background warm-up starts only once the world is being revealed.
  useEffect(() => {
    if (phase === "opening") void preloadImages(secondarySources(), "low");
  }, [phase]);

  useEffect(() => {
    if (phase === "done") onDone?.();
  }, [phase, onDone]);

  if (phase === "done") return null;

  const opening = phase === "opening";

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed inset-0 z-[1000] ${opening ? "pointer-events-none" : ""}`}
    >
      <span className="sr-only">{opening ? "Welcome to Jeryn’s House" : "Loading Jeryn’s House"}</span>
      {/* Each half is a full-screen copy of the cover clipped to its own half
          (overlapping by a pixel, so no seam can show at the centre), which
          is what lets the mark split cleanly through the middle as they
          part. */}
      {(["top", "bottom"] as const).map((half) => (
        <motion.div
          key={half}
          aria-hidden="true"
          className="absolute inset-0 flex items-center justify-center bg-loader-navy"
          style={{ clipPath: half === "top" ? "inset(0 0 calc(50% - 1px) 0)" : "inset(calc(50% - 1px) 0 0 0)" }}
          initial={false}
          // Every state names both values: dropping one from `animate` makes
          // Motion run a separate (instant) animation back to its default,
          // whose completion would end the cover before the doors move.
          animate={
            !opening
              ? { y: "0%", opacity: 1 }
              : reducedMotion
                ? { y: "0%", opacity: 0 }
                : { y: half === "top" ? "-51%" : "51%", opacity: 1 }
          }
          transition={reducedMotion ? REDUCED_TRANSITION : OPEN_TRANSITION}
          onAnimationComplete={opening && half === "top" ? () => setPhase("done") : undefined}
        >
          {/* Restrained mark -- no progress bar, no percentage. The left
              padding balances the tracking after the last letter, so the
              word sits on the screen's visual centre. */}
          <span className="pl-[0.35em] text-[1.0625rem] font-semibold uppercase tracking-[0.35em] text-loader-ink">
            Jeryn&rsquo;s House
          </span>
        </motion.div>
      ))}
    </div>
  );
}
