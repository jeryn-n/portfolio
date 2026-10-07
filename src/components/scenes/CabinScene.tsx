"use client";

import { useEffect, useState } from "react";
import { motion, type Variants } from "motion/react";
import { ArtAsset } from "@/components/art/ArtAsset";
import { ASSETS } from "@/data/assets";
import {
  CABIN_LAYOUT,
  CLOUD_1_LAYOUT,
  CLOUD_2_LAYOUT,
  EXPERIENCE_ARROW_LAYOUT,
  HOUSE_SIGN_LAYOUT,
  PROJECTS_ARROW_LAYOUT,
  TITLE_CARD_LAYOUT,
} from "@/lib/layout";
import { CabinEntryHint } from "./CabinEntryHint";
import { CabinInterior } from "./CabinInterior";
import { CabinTitleCard } from "./CabinTitleCard";
import { LayoutGuide } from "./LayoutGuide";
import { SceneArrow } from "./SceneArrow";
import { StageSprite } from "./StageSprite";

type CabinState = "closed" | "opening" | "open";

// Door hint is positioned in cabin-local coordinates.
const doorHintX = 380;
const doorHintY = 285;

// Target ~1.2s total (spec range 1.1-1.4s), smooth ease-in-out, no bounce.
const REVEAL_DURATION = 1.2;
const REVEAL_EASE: [number, number, number, number] = [0.4, 0, 0.2, 1];
// Title card + nav arrows fade in during the final ~20% of the reveal.
const LATE_REVEAL_DELAY = REVEAL_DURATION * 0.8;

const backgroundVariants: Variants = {
  closed: { scale: 1 },
  opening: { scale: 1.02, transition: { duration: REVEAL_DURATION, ease: REVEAL_EASE } },
  open: { scale: 1.02 },
};

const darkenVariants: Variants = {
  closed: { opacity: 0 },
  opening: { opacity: 0.4, transition: { duration: REVEAL_DURATION * 0.7, ease: REVEAL_EASE } },
  open: { opacity: 0.4 },
};

const cabinGroupVariants: Variants = {
  closed: { scale: 1 },
  opening: { scale: 1.1, transition: { duration: REVEAL_DURATION, ease: REVEAL_EASE } },
  open: { scale: 1.1 },
};

const signVariants: Variants = {
  closed: { opacity: 1 },
  opening: { opacity: 0, transition: { duration: REVEAL_DURATION * 0.35, ease: REVEAL_EASE } },
  open: { opacity: 0 },
};

const exteriorShellVariants: Variants = {
  closed: { opacity: 1 },
  opening: { opacity: 0, transition: { duration: REVEAL_DURATION * 0.5, ease: REVEAL_EASE } },
  open: { opacity: 0 },
};

const frontWallVariants: Variants = {
  closed: { opacity: 1 },
  opening: {
    opacity: 0,
    transition: { duration: REVEAL_DURATION * 0.5, delay: REVEAL_DURATION * 0.35, ease: REVEAL_EASE },
  },
  open: { opacity: 0 },
};

const interiorVariants: Variants = {
  closed: { opacity: 0 },
  opening: {
    opacity: 1,
    transition: { duration: REVEAL_DURATION * 0.5, delay: REVEAL_DURATION * 0.4, ease: REVEAL_EASE },
  },
  open: { opacity: 1 },
};

// P2: clickable closed cabin, the opening reveal, and the open-interior
// wireframe. Experience/Projects travel, snow, birds, audio, and detail
// panels are still future work.
export function CabinScene() {
  const [cabinState, setCabinState] = useState<CabinState>("closed");

  useEffect(() => {
    if (cabinState !== "opening") return;
    const timer = setTimeout(() => setCabinState("open"), REVEAL_DURATION * 1000);
    return () => clearTimeout(timer);
  }, [cabinState]);

  function handleEnter() {
    setCabinState((prev) => (prev === "closed" ? "opening" : prev));
  }

  const chromeRevealed = cabinState !== "closed";

  return (
    <>
      <motion.div
        className="absolute inset-0"
        initial="closed"
        animate={cabinState}
        variants={backgroundVariants}
      >
        <StageSprite asset={ASSETS.cabinExteriorBackground} x={0} y={0} />
        <StageSprite asset={ASSETS.ambientCloud1} x={CLOUD_1_LAYOUT.x} y={CLOUD_1_LAYOUT.y} />
        <StageSprite asset={ASSETS.ambientCloud2} x={CLOUD_2_LAYOUT.x} y={CLOUD_2_LAYOUT.y} />
      </motion.div>

      <motion.div
        aria-hidden="true"
        className="absolute inset-0 bg-black"
        initial="closed"
        animate={cabinState}
        variants={darkenVariants}
      />

      <motion.div
        className="absolute"
        style={{
          left: HOUSE_SIGN_LAYOUT.x,
          top: HOUSE_SIGN_LAYOUT.y,
          width: HOUSE_SIGN_LAYOUT.width,
          height: HOUSE_SIGN_LAYOUT.height,
        }}
        initial="closed"
        animate={cabinState}
        variants={signVariants}
      >
        <ArtAsset asset={ASSETS.houseSign} />
      </motion.div>

      <CabinTitleCard
        x={TITLE_CARD_LAYOUT.x}
        y={TITLE_CARD_LAYOUT.y}
        revealed={chromeRevealed}
        revealDelay={LATE_REVEAL_DELAY}
      />

      <SceneArrow
        direction="up"
        label="Experience"
        x={EXPERIENCE_ARROW_LAYOUT.x}
        y={EXPERIENCE_ARROW_LAYOUT.y}
        revealed={chromeRevealed}
        revealDelay={LATE_REVEAL_DELAY}
      />
      <SceneArrow
        direction="down"
        label="Projects"
        x={PROJECTS_ARROW_LAYOUT.x}
        y={PROJECTS_ARROW_LAYOUT.y}
        revealed={chromeRevealed}
        revealDelay={LATE_REVEAL_DELAY}
      />

      <motion.div
        className="absolute"
        style={{
          left: CABIN_LAYOUT.x,
          top: CABIN_LAYOUT.y,
          width: CABIN_LAYOUT.width,
          height: CABIN_LAYOUT.height,
        }}
        initial="closed"
        animate={cabinState}
        variants={cabinGroupVariants}
      >
        <motion.div
          className="absolute inset-0"
          initial="closed"
          animate={cabinState}
          variants={interiorVariants}
        >
          <CabinInterior isOpen={cabinState === "open"} />
        </motion.div>

        <motion.div
          className="absolute inset-0"
          initial="closed"
          animate={cabinState}
          variants={frontWallVariants}
        >
          <ArtAsset asset={ASSETS.cabinFrontWall} />
        </motion.div>

        <motion.div
          className="absolute inset-0"
          initial="closed"
          animate={cabinState}
          variants={exteriorShellVariants}
        >
          <ArtAsset asset={ASSETS.cabinExterior} />
        </motion.div>

        <button
          type="button"
          aria-label="Enter the cabin"
          onClick={handleEnter}
          disabled={cabinState !== "closed"}
          className="absolute inset-0 cursor-pointer border-0 bg-white/0 transition-colors duration-300 hover:bg-white/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-paper disabled:pointer-events-none disabled:cursor-default"
        />

        {cabinState === "closed" && <CabinEntryHint x={doorHintX} y={doorHintY} />}
      </motion.div>

      <LayoutGuide />
    </>
  );
}
