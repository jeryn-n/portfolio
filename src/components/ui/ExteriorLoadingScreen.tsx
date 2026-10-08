"use client";

import { AnimatePresence, motion } from "motion/react";
import { useLayoutEffect, useState } from "react";
import { sceneFromHash } from "@/components/scenes/WorldSceneContext";
import { assetSources, ESSENTIAL_EXTERIOR_ASSETS, SECONDARY_ASSETS } from "@/data/assets";
import { preloadImages } from "@/lib/preload";

// Purely a safety net for a stalled network. It is NOT a minimum duration --
// there is no artificial floor anywhere in this component -- and it is not
// the normal exit path, since preloadImages already settles a missing file
// immediately.
const MAX_WAIT_MS = 6000;

const FADE_DURATION = 0.3;

// The discreet first-load state for the normal `/` cabin entry.
//
// What it waits for is deliberately narrow: the handful of assets the CLOSED
// exterior is made of (see ESSENTIAL_EXTERIOR_ASSETS). The interior, the
// Experience/Projects scenes, and the portfolio media are all warmed
// afterwards, in the background, with the world already interactive.
//
// Mounted from the homepage only, so portfolio detail routes never render it
// at all. Direct scene entry (`/#experience`, `/#projects`) skips straight
// past it in a layout effect -- before the first paint -- because those loads
// never show the cabin exterior and so have nothing to wait for.
export function ExteriorLoadingScreen() {
  // Starts visible on both server and client, so there is no hydration
  // mismatch and no gap between first paint and the loading mark.
  const [visible, setVisible] = useState(true);

  useLayoutEffect(() => {
    let cancelled = false;

    // Direct scene entry (`/#experience`, `/#projects`) never shows the
    // cabin exterior, so it has nothing to wait for and resolves at once.
    // Because this runs in a layout effect, the overlay is dismissed within
    // the same frame -- there is no sequence to sit through.
    const directEntry = sceneFromHash(window.location.hash) !== null;

    const ready = directEntry
      ? Promise.resolve()
      : Promise.race([
          preloadImages(assetSources(ESSENTIAL_EXTERIOR_ASSETS)),
          new Promise<void>((resolve) => {
            setTimeout(resolve, MAX_WAIT_MS);
          }),
        ]);

    void ready.then(() => {
      if (cancelled) return;
      setVisible(false);
      // The background warm-up starts only once the world is on screen and
      // interactive. On direct entry the exterior set joins it, since
      // nothing waited for it.
      void preloadImages(
        directEntry
          ? [...assetSources(SECONDARY_ASSETS), ...assetSources(ESSENTIAL_EXTERIOR_ASSETS)]
          : assetSources(SECONDARY_ASSETS),
      );
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    // initial={false} so the overlay never fades IN -- it is already there on
    // first paint and only ever animates away.
    <AnimatePresence initial={false}>
      {visible && (
        <motion.div
          key="exterior-loading"
          role="status"
          aria-live="polite"
          className="fixed inset-0 z-[60] flex items-center justify-center bg-stage-sky"
          exit={{ opacity: 0 }}
          transition={{ duration: FADE_DURATION, ease: "easeOut" }}
        >
          {/* Restrained placeholder mark -- no progress bar, no percentage,
              and no final typography (see CLAUDE.md). */}
          <span className="text-sm font-semibold uppercase tracking-[0.35em] text-paper/80">
            Jeryn&rsquo;s House
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
