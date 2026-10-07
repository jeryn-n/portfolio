"use client";

import { useEffect, useState } from "react";
import { motion, type Variants } from "motion/react";
import { AmbientCloud } from "./AmbientCloud";
import { ArtAsset } from "@/components/art/ArtAsset";
import { ASSETS } from "@/data/assets";
import { CABIN_HEIGHT, CABIN_WIDTH, DOOR_HINT_RATIO, getSceneLayout } from "@/lib/layout";
import { CabinEntryHint } from "./CabinEntryHint";
import { CabinInterior } from "./CabinInterior";
import { CabinTitleCard } from "./CabinTitleCard";
import { useCompositionMode } from "./CompositionModeContext";
import { LayoutGuide } from "./LayoutGuide";
import { SceneArrow } from "./SceneArrow";

type CabinState = "closed" | "opening" | "open";

// Door hint position, in cabin-local coordinates -- moves/scales correctly
// with the cabin in both composition modes since it's a fraction of the box.
const doorHintX = CABIN_WIDTH * DOOR_HINT_RATIO.x;
const doorHintY = CABIN_HEIGHT * DOOR_HINT_RATIO.y;

// Target ~1.2s total (spec range 1.1-1.4s), smooth ease-in-out, no bounce.
const REVEAL_DURATION = 1.2;
const REVEAL_EASE: [number, number, number, number] = [0.4, 0, 0.2, 1];
// Title card + nav arrows fade in during the final ~20% of the reveal.
const LATE_REVEAL_DELAY = REVEAL_DURATION * 0.8;
// The cabin's existing "small zoom" during opening, now relative to each
// mode's base display scale rather than an absolute 1.0 starting point.
const OPEN_SCALE_FACTOR = 1.1;

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
// wireframe -- now reused across two explicit composition modes (desktop and
// portrait) via mode-specific scene layouts. Experience/Projects travel,
// snow, birds, audio, and detail panels are still future work.
export function CabinScene() {
  const [cabinState, setCabinState] = useState<CabinState>("closed");
  const mode = useCompositionMode();
  const layout = getSceneLayout(mode);

  useEffect(() => {
    if (cabinState !== "opening") return;
    const timer = setTimeout(() => setCabinState("open"), REVEAL_DURATION * 1000);
    return () => clearTimeout(timer);
  }, [cabinState]);

  function handleEnter() {
    setCabinState((prev) => (prev === "closed" ? "opening" : prev));
  }

  const chromeRevealed = cabinState !== "closed";

  // The cabin's base display scale varies by mode; the opening "zoom" is a
  // small increase relative to that base rather than an absolute value, so
  // it composes cleanly with either mode's starting size.
  const baseScale = layout.cabin.displayScale;
  const openScale = baseScale * OPEN_SCALE_FACTOR;
  const cabinGroupVariants: Variants = {
    closed: { scale: baseScale },
    opening: { scale: openScale, transition: { duration: REVEAL_DURATION, ease: REVEAL_EASE } },
    open: { scale: openScale },
  };

  return (
    <>
      <motion.div
        className="absolute inset-0"
        initial="closed"
        animate={cabinState}
        variants={backgroundVariants}
      >
        <ArtAsset
          asset={ASSETS.cabinExteriorBackground}
          style={{ position: "absolute", left: 0, top: 0, width: layout.stageWidth, height: layout.stageHeight }}
        />
        {layout.clouds.map((cloud, index) => (
          <AmbientCloud
            key={index}
            asset={ASSETS[cloud.assetKey]}
            x={cloud.x}
            y={cloud.y}
            flip={cloud.flip}
            driftDelay={cloud.driftDelay ?? 0}
          />
        ))}
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
        style={{ left: layout.houseSign.x, top: layout.houseSign.y }}
        initial="closed"
        animate={cabinState}
        variants={signVariants}
      >
        <ArtAsset asset={ASSETS.houseSign} />
      </motion.div>

      <CabinTitleCard
        x={layout.titleCard.x}
        y={layout.titleCard.y}
        revealed={chromeRevealed}
        revealDelay={LATE_REVEAL_DELAY}
      />

      <SceneArrow
        direction="up"
        label="Experience"
        x={layout.experienceArrow.x}
        y={layout.experienceArrow.y}
        revealed={chromeRevealed}
        revealDelay={LATE_REVEAL_DELAY}
      />
      <SceneArrow
        direction="down"
        label="Projects"
        x={layout.projectsArrow.x}
        y={layout.projectsArrow.y}
        revealed={chromeRevealed}
        revealDelay={LATE_REVEAL_DELAY}
      />

      <motion.div
        className="absolute"
        style={{
          left: layout.cabin.x,
          top: layout.cabin.y,
          width: CABIN_WIDTH,
          height: CABIN_HEIGHT,
          transformOrigin: "50% 0%",
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

      <LayoutGuide mode={mode} />
    </>
  );
}
