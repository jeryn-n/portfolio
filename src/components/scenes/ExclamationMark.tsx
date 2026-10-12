"use client";

import { motion, type Transition, type Variants } from "motion/react";
import { ArtAsset } from "@/components/art/ArtAsset";
import { ASSETS } from "@/data/assets";

export interface BouncePattern {
  keyframes: number[];
  transition: Transition;
}

interface ExclamationMarkProps {
  x: number;
  y: number;
  ariaLabel: string;
  bouncePattern?: BouncePattern;
  // Render size as a fraction of the design size, shrunk/grown around the
  // mark's centre so (x, y) keeps the same visual spot.
  scale?: number;
}

const exclamationAsset = ASSETS.uiExclamation;

const fadeInVariants: Variants = {
  hidden: { opacity: 0 },
  shown: { opacity: 1, transition: { duration: 0.4 } },
};

// Continuous two-bounce / brief-pause loop, used by the exterior door hint.
export const twoBouncePattern: BouncePattern = {
  keyframes: [0, -10, 0, -10, 0, 0],
  transition: {
    duration: 1.6,
    times: [0, 0.15, 0.3, 0.45, 0.6, 1],
    repeat: Infinity,
    ease: "easeOut",
  },
};

// A single small bounce, then a ~2s pause, repeating -- much less insistent
// than the door hint. Used by the gramophone hint.
export const singleBouncePattern: BouncePattern = {
  keyframes: [0, -8, 0, 0],
  transition: {
    duration: 2.4,
    times: [0, 0.08, 0.17, 1],
    repeat: Infinity,
    ease: "easeOut",
  },
};

// Renders through the normal ArtAsset fallback system, so until the real PNG
// exists this appears as a labeled wireframe placeholder in production too.
// Only the wrapper animates (fade + bounce) -- never the image itself -- so
// dropping in the real art later needs no animation changes.
export function ExclamationMark({ x, y, ariaLabel, bouncePattern = twoBouncePattern, scale = 1 }: ExclamationMarkProps) {
  return (
    <motion.div
      role="status"
      aria-label={ariaLabel}
      className="pointer-events-none absolute"
      style={{ left: x, top: y, width: exclamationAsset.designWidth, height: exclamationAsset.designHeight, scale }}
      initial="hidden"
      animate="shown"
      variants={fadeInVariants}
    >
      <motion.div animate={{ y: bouncePattern.keyframes }} transition={bouncePattern.transition}>
        <ArtAsset asset={exclamationAsset} />
      </motion.div>
    </motion.div>
  );
}
