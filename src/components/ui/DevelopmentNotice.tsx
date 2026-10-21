"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useState } from "react";

const EASE: [number, number, number, number] = [0.4, 0, 0.2, 1];

// Once dismissed it stays gone for the rest of the visit, so a trip to a
// detail page or /video and back doesn't bring it back; a reload does.
let dismissedThisVisit = false;

// A small "still under development" card in the bottom-right corner of the
// homepage, in the /video page's card style (white card, small tracked
// label, pixel heading). It fades in once the first-load cover has gone
// (`visible`) and fades out again when clicked. On phones it sits higher, clear
// of the centred bottom scene arrow.
export function DevelopmentNotice({ visible }: { visible: boolean }) {
  const [dismissed, setDismissed] = useState(dismissedThisVisit);
  const reducedMotion = useReducedMotion() ?? false;
  const offsetY = reducedMotion ? 0 : 12;

  function dismiss() {
    dismissedThisVisit = true;
    setDismissed(true);
  }

  return (
    <AnimatePresence>
      {visible && !dismissed && (
        <motion.button
          type="button"
          onClick={dismiss}
          aria-label="This site is still under development. Check back soon for more! Click to dismiss."
          className="group fixed right-[calc(1rem+env(safe-area-inset-right))] bottom-[calc(7rem+env(safe-area-inset-bottom))] z-30 flex w-[min(17rem,calc(100vw-2rem))] flex-col gap-1.5 rounded-lg border border-ink-soft/10 bg-white p-4 text-left text-ink shadow-[0_1px_2px_rgb(11_29_51/6%),0_12px_32px_-16px_rgb(11_29_51/22%)] transition-shadow hover:shadow-[0_1px_2px_rgb(11_29_51/8%),0_16px_36px_-14px_rgb(11_29_51/30%)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-paper sm:bottom-[calc(1rem+env(safe-area-inset-bottom))]"
          initial={{ opacity: 0, y: offsetY }}
          animate={{ opacity: 1, y: 0, transition: { duration: 0.5, delay: 0.6, ease: EASE } }}
          exit={{ opacity: 0, y: offsetY, transition: { duration: 0.25, ease: EASE } }}
        >
          <span aria-hidden="true" className="flex w-full items-center gap-2.5">
            <span className="bg-ink-soft px-1.5 py-1 font-pixel-label text-[10px] leading-none tracking-wider text-white">
              WIP
            </span>
            <span className="text-[11px] font-bold uppercase leading-tight tracking-[0.25em] text-ink-soft/70">
              Heads up!
            </span>
            <span className="ml-auto text-sm font-bold leading-none text-ink-soft/40 transition-colors group-hover:text-ink-soft">
              ✕
            </span>
          </span>
          <span aria-hidden="true" className="font-pixel-label text-[15px] leading-snug text-ink">
            This site is still under development.
          </span>
          <span aria-hidden="true" className="text-sm leading-relaxed text-ink-soft">
            Check back soon for more!
          </span>
        </motion.button>
      )}
    </AnimatePresence>
  );
}
