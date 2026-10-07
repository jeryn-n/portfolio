"use client";

import { motion, type Transition } from "motion/react";
import { NAV_ARROW_VIEWPORT_OFFSET } from "@/lib/viewportUi";

type ArrowDirection = "up" | "down";
type ArrowEdge = "top" | "bottom";

interface SceneArrowProps {
  direction: ArrowDirection;
  label: string;
  edge: ArrowEdge;
  revealed: boolean;
  revealDelay: number;
  debug?: boolean;
}

const pulseTransition: Transition = {
  duration: 2.6,
  times: [0, 0.15, 0.3, 0.45, 0.6, 1],
  repeat: Infinity,
  ease: "easeInOut",
};

// A future Experience/Projects scene-travel control. Lives in the
// viewport-fixed UI layer (see ViewportNavArrows / SceneStage), not the
// logical stage, so it never scales with the cabin/stage on desktop or
// mobile. For now it only fades in near the end of the cabin reveal, idles
// with a subtle pulse, and does not navigate anywhere -- wiring that up is a
// later iteration's job.
export function SceneArrow({ direction, label, edge, revealed, revealDelay, debug = false }: SceneArrowProps) {
  const triangleClassName =
    direction === "up"
      ? "h-0 w-0 border-x-[14px] border-x-transparent border-b-[22px] border-b-paper"
      : "h-0 w-0 border-x-[14px] border-x-transparent border-t-[22px] border-t-paper";

  const edgeStyle =
    edge === "top"
      ? { top: `calc(env(safe-area-inset-top, 0px) + ${NAV_ARROW_VIEWPORT_OFFSET}px)` }
      : { bottom: `calc(env(safe-area-inset-bottom, 0px) + ${NAV_ARROW_VIEWPORT_OFFSET}px)` };

  return (
    <motion.div
      className="fixed left-1/2 z-10 flex w-[120px] -translate-x-1/2 flex-col items-center gap-1"
      style={edgeStyle}
      initial={{ opacity: 0, y: direction === "up" ? 8 : -8 }}
      animate={revealed ? { opacity: 1, y: 0 } : { opacity: 0, y: direction === "up" ? 8 : -8 }}
      transition={{ duration: 0.5, delay: revealDelay, ease: [0.4, 0, 0.2, 1] }}
    >
      <button
        type="button"
        aria-label={label}
        className={`flex flex-col items-center gap-1 bg-transparent p-1 ${
          revealed ? "pointer-events-auto" : "pointer-events-none"
        }`}
      >
        <motion.span
          aria-hidden="true"
          className={triangleClassName}
          animate={{ scale: [1, 1.08, 1, 1.08, 1, 1] }}
          transition={pulseTransition}
        />
        <span className="text-xs font-medium uppercase tracking-wide text-paper">{label}</span>
      </button>
      {debug && (
        <span className="rounded bg-black/60 px-1 text-[9px] uppercase tracking-wide text-cyan-300">
          Viewport UI
        </span>
      )}
    </motion.div>
  );
}
