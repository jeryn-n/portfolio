"use client";

import { motion, type Transition } from "motion/react";

type ArrowDirection = "up" | "down";

interface SceneArrowProps {
  direction: ArrowDirection;
  label: string;
  x: number;
  y: number;
  revealed: boolean;
  revealDelay: number;
}

const pulseTransition: Transition = {
  duration: 2.6,
  times: [0, 0.15, 0.3, 0.45, 0.6, 1],
  repeat: Infinity,
  ease: "easeInOut",
};

// A future Experience/Projects scene-travel control. For now it only fades in
// near the end of the cabin reveal, idles with a subtle pulse, and does not
// navigate anywhere -- wiring that up is a later iteration's job.
export function SceneArrow({ direction, label, x, y, revealed, revealDelay }: SceneArrowProps) {
  const triangleClassName =
    direction === "up"
      ? "h-0 w-0 border-x-[14px] border-x-transparent border-b-[22px] border-b-paper"
      : "h-0 w-0 border-x-[14px] border-x-transparent border-t-[22px] border-t-paper";

  return (
    <motion.div
      className="absolute flex w-[120px] -translate-x-1/2 flex-col items-center gap-1"
      style={{ left: x, top: y }}
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
    </motion.div>
  );
}
