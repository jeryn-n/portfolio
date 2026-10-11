"use client";

import { motion, type Transition } from "motion/react";
import { NAV_ARROW_VIEWPORT_OFFSET } from "@/lib/viewportUi";

type ArrowDirection = "up" | "down";
type ArrowEdge = "top" | "bottom";

interface SceneArrowProps {
  direction: ArrowDirection;
  ariaLabel: string;
  displayText: string;
  edge: ArrowEdge;
  revealed: boolean;
  interactive: boolean;
  revealDelay: number;
  onActivate: () => void;
  // A soft navy shade behind the arrow and its label, so they stay legible
  // over the bright snow and clouds around the open cabin.
  shaded?: boolean;
  debug?: boolean;
}

const pulseTransition: Transition = {
  duration: 2.6,
  times: [0, 0.15, 0.3, 0.45, 0.6, 1],
  repeat: Infinity,
  ease: "easeInOut",
};

// The shade: a wide, flat ellipse of slate blue-grey centred on the screen edge
// itself, so only its inner half shows -- a soft vignette at the top or
// bottom of the screen rather than a badge. It holds its depth out past the
// arrow and label, then feathers out gradually to nothing.
const SHADE_WIDTH = 560;
const SHADE_HEIGHT = 280;
const SHADE_GRADIENT =
  "radial-gradient(closest-side, rgba(71, 85, 105, 0.39), rgba(71, 85, 105, 0.365) 40%, rgba(71, 85, 105, 0.3) 55%, rgba(71, 85, 105, 0.18) 70%, rgba(71, 85, 105, 0.07) 85%, rgba(71, 85, 105, 0))";

// Fade in gently (after any reveal delay), but get out of the way fast the
// moment travel starts.
const REVEAL_TRANSITION_EASE: [number, number, number, number] = [0.4, 0, 0.2, 1];
const HIDE_TRANSITION = { duration: 0.12, ease: "easeOut" } as const;

// A swept, pointed arrowhead: a "^" whose leading edges bow out slightly and
// whose tail is notched in, rather than a plain solid triangle. Drawn
// pointing up; the down arrow is the same shape turned over.
function Arrowhead({ direction }: { direction: ArrowDirection }) {
  return (
    <svg
      viewBox="0 0 32 22"
      fill="currentColor"
      stroke="currentColor"
      strokeWidth={1.25}
      strokeLinejoin="round"
      className={`block h-[22px] w-8 ${direction === "down" ? "rotate-180" : ""}`}
    >
      <path d="M16 1.5Q21.5 9 30.5 19.5Q22.5 14.5 16 13Q9.5 14.5 1.5 19.5Q10.5 9 16 1.5Z" />
    </svg>
  );
}

// Experience/Cabin/Projects scene-travel control. Lives in the
// viewport-fixed UI layer (see ViewportNavArrows / SceneStage), not the
// logical stage, so it never scales with the cabin/stage on desktop or
// mobile. `revealed` controls visibility (hidden during cabin closed/opening,
// scene travel, or a blocking modal); `interactive` separately controls whether a click
// actually does anything (false during an active transition or while the
// menu owns input), so the arrow can stay visually present without allowing
// double activation.
export function SceneArrow({
  direction,
  ariaLabel,
  displayText,
  edge,
  revealed,
  interactive,
  revealDelay,
  onActivate,
  shaded = false,
  debug = false,
}: SceneArrowProps) {
  const edgeStyle =
    edge === "top"
      ? { top: `calc(env(safe-area-inset-top, 0px) + ${NAV_ARROW_VIEWPORT_OFFSET}px)` }
      : { bottom: `calc(env(safe-area-inset-bottom, 0px) + ${NAV_ARROW_VIEWPORT_OFFSET}px)` };

  const hiddenY = direction === "up" ? 8 : -8;

  // The wrapper never takes pointer events itself (only the revealed button
  // does), so a hidden arrow can't block clicks on the scene beneath it.
  return (
    <motion.div
      className="pointer-events-none fixed left-1/2 z-10 flex w-[120px] -translate-x-1/2 flex-col items-center gap-1"
      style={edgeStyle}
      aria-hidden={!revealed}
      initial={{ opacity: 0, y: hiddenY }}
      animate={
        revealed
          ? { opacity: 1, y: 0, transition: { duration: 0.5, delay: revealDelay, ease: REVEAL_TRANSITION_EASE } }
          : { opacity: 0, y: hiddenY, transition: HIDE_TRANSITION }
      }
    >
      {/* Inside the arrow's own layer, so it fades in and out with it; offset
          back out to the screen edge the arrow is pinned near. */}
      {shaded && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 -z-10"
          style={{
            width: SHADE_WIDTH,
            height: SHADE_HEIGHT,
            background: SHADE_GRADIENT,
            [edge]: -NAV_ARROW_VIEWPORT_OFFSET - SHADE_HEIGHT / 2,
            translate: "-50% 0",
          }}
        />
      )}
      <button
        type="button"
        aria-label={ariaLabel}
        onClick={onActivate}
        disabled={!revealed || !interactive}
        // Label on the inside, arrowhead nearest the screen edge: below the
        // arrow at the top of the screen, above it at the bottom.
        className={`flex ${edge === "bottom" ? "flex-col-reverse" : "flex-col"} items-center gap-1 bg-transparent p-1 ${
          revealed && interactive ? "pointer-events-auto" : "pointer-events-none"
        }`}
      >
        <motion.span
          aria-hidden="true"
          className="block text-paper"
          animate={{ scale: [1, 1.13, 1, 1.13, 1, 1] }}
          transition={pulseTransition}
        >
          <Arrowhead direction={direction} />
        </motion.span>
        <span className="text-xs font-medium uppercase tracking-wide text-paper">{displayText}</span>
      </button>
      {debug && (
        <span className="rounded bg-black/60 px-1 text-[9px] uppercase tracking-wide text-cyan-300">
          Viewport UI
        </span>
      )}
    </motion.div>
  );
}
