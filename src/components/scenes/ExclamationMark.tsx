"use client";

import { motion, type Transition, type Variants } from "motion/react";

interface ExclamationMarkProps {
  x: number;
  y: number;
  ariaLabel: string;
}

const bounceTransition: Transition = {
  duration: 1.6,
  times: [0, 0.15, 0.3, 0.45, 0.6, 1],
  repeat: Infinity,
  ease: "easeOut",
};

const fadeInVariants: Variants = {
  hidden: { opacity: 0 },
  shown: { opacity: 1, transition: { duration: 0.4 } },
};

// A temporary HTML/CSS stand-in for a future art asset: fades in once, then
// loops a two-bounce / brief-pause pattern until its parent stops rendering it.
export function ExclamationMark({ x, y, ariaLabel }: ExclamationMarkProps) {
  return (
    <motion.div
      role="status"
      aria-label={ariaLabel}
      className="pointer-events-none absolute"
      style={{ left: x, top: y, width: 28, height: 28 }}
      initial="hidden"
      animate="shown"
      variants={fadeInVariants}
    >
      <motion.span
        className="flex h-7 w-7 items-center justify-center rounded-full bg-alert text-base font-bold leading-none text-alert-ink shadow-[0_0_0_2px_rgba(255,138,31,0.35)]"
        animate={{ y: [0, -10, 0, -10, 0, 0] }}
        transition={bounceTransition}
      >
        !
      </motion.span>
    </motion.div>
  );
}
