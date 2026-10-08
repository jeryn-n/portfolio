"use client";

import { useEffect, useState } from "react";
import { motion, type Variants } from "motion/react";
import { AmbientCloud } from "./AmbientCloud";
import { ArtAsset } from "@/components/art/ArtAsset";
import { useAudio } from "@/components/audio/AudioProvider";
import { useSiteUI } from "@/components/ui/SiteUIProvider";
import { ASSETS } from "@/data/assets";
import { CABIN_HEIGHT, CABIN_WIDTH, DOOR_HINT_RATIO, getSceneLayout } from "@/lib/layout";
import { LATE_REVEAL_DELAY, REVEAL_DURATION, REVEAL_EASE } from "@/lib/reveal";
import { CabinEntryHint } from "./CabinEntryHint";
import { useCabinState } from "./CabinStateContext";
import { CabinInterior } from "./CabinInterior";
import { CabinTitleCard } from "./CabinTitleCard";
import { useCompositionMode } from "./CompositionModeContext";
import { LayoutGuide } from "./LayoutGuide";

// Door hint position, in cabin-local coordinates -- moves/scales correctly
// with the cabin in both composition modes since it's a fraction of the box.
const doorHintX = CABIN_WIDTH * DOOR_HINT_RATIO.x;
const doorHintY = CABIN_HEIGHT * DOOR_HINT_RATIO.y;

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
// wireframe -- reused across two explicit composition modes (desktop and
// portrait) via mode-specific scene layouts. Experience/Projects travel,
// snow, birds, audio, and detail panels are still future work.
export function CabinScene() {
  const { cabinState, setCabinState } = useCabinState();
  const mode = useCompositionMode();
  const layout = getSceneLayout(mode);
  const { setAmbientMode } = useAudio();
  const { markCabinEntered } = useSiteUI();

  // Every variant group below starts from whatever state the cabin was
  // already in when this component mounted, not unconditionally "closed". On
  // the normal `/` flow that is "closed", so the approved opening reveal is
  // untouched. It matters when the cabin mounts already open -- returning to
  // `/` from a detail route, or a direct #experience/#projects load -- where
  // an unconditional "closed" initial would replay the entire opening
  // animation on arrival.
  // A never-updated piece of state is the mount-time snapshot: it is read
  // during render (so it can feed `initial`) and is intentionally frozen.
  const [initialCabinState] = useState(cabinState);

  useEffect(() => {
    if (cabinState !== "opening") return;
    const timer = setTimeout(() => setCabinState("open"), REVEAL_DURATION * 1000);
    return () => clearTimeout(timer);
  }, [cabinState, setCabinState]);

  // Ambient context: exterior while closed/opening, interior once fully
  // open (switching at the end of the reveal is a sensible, simple choice).
  useEffect(() => {
    setAmbientMode(cabinState === "open" ? "interior" : "exterior");
  }, [cabinState, setAmbientMode]);

  useEffect(() => {
    if (cabinState === "open") markCabinEntered();
  }, [cabinState, markCabinEntered]);

  function handleEnter() {
    setCabinState((prev) => (prev === "closed" ? "opening" : prev));
  }

  const chromeRevealed = cabinState !== "closed";

  // Desktop keeps the title card and house sign stage-relative and
  // independent of the cabin. Portrait instead derives both from the
  // cabin's own Y plus a fixed offset, so moving the cabin moves them with
  // it instead of needing separate stage-absolute values.
  const titleCard =
    layout.mode === "desktop"
      ? layout.titleCard
      : { x: layout.titleCardX, y: layout.cabinY + layout.titleCardOffsetFromCabinY };
  const houseSign =
    layout.mode === "desktop"
      ? layout.houseSign
      : { x: layout.houseSignX, y: layout.cabinY + layout.houseSignOffsetFromCabinY };
  // Clouds are environment objects, not cabin-local -- only portrait scales them up.
  const cloudScale = layout.mode === "portrait" ? layout.cloudScale : 1;

  // Portrait keeps its prior architecture: the whole 760x570 group (shell +
  // art together) scales from an explicit closed end state to an explicit
  // open end state.
  const cabinGroupVariants: Variants | undefined =
    layout.mode === "portrait"
      ? {
          closed: { scale: layout.cabinScale.closedScale, top: layout.cabinY },
          opening: {
            scale: layout.cabinScale.openScale,
            top: layout.cabinY,
            transition: { duration: REVEAL_DURATION, ease: REVEAL_EASE },
          },
          open: { scale: layout.cabinScale.openScale, top: layout.cabinY },
        }
      : undefined;

  // Desktop: the 760x570 logical shell is a stable reference box (scaled
  // once by shellScale, never animated between states). Only the art inside
  // it resizes -- closed exterior art renders at closedArtScale and scales
  // up to exactly 100% of the shell as it opens, centered via a 50%/50%
  // transform-origin so no manual offset math is needed.
  const exteriorArtScaleVariants: Variants | undefined =
    layout.mode === "desktop"
      ? {
          closed: { scale: layout.cabinArt.closedArtScale },
          opening: { scale: 1, transition: { duration: REVEAL_DURATION, ease: REVEAL_EASE } },
          open: { scale: 1 },
        }
      : undefined;

  return (
    <>
      <motion.div
        className="absolute inset-0"
        initial={initialCabinState}
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
            scale={cloudScale}
          />
        ))}
      </motion.div>

      <motion.div
        aria-hidden="true"
        className="absolute inset-0 bg-black"
        initial={initialCabinState}
        animate={cabinState}
        variants={darkenVariants}
      />

      <motion.div
        className="absolute"
        style={{ left: houseSign.x, top: houseSign.y }}
        initial={initialCabinState}
        animate={cabinState}
        variants={signVariants}
      >
        <ArtAsset asset={ASSETS.houseSign} />
      </motion.div>

      <CabinTitleCard
        x={titleCard.x}
        y={titleCard.y}
        revealed={chromeRevealed}
        revealDelay={LATE_REVEAL_DELAY}
      />

      {layout.mode === "portrait" ? (
        <motion.div
          className="absolute"
          style={{ left: layout.cabinX, width: CABIN_WIDTH, height: CABIN_HEIGHT, transformOrigin: "50% 0%" }}
          initial={initialCabinState}
          animate={cabinState}
          variants={cabinGroupVariants as Variants}
        >
          <motion.div className="absolute inset-0" initial={initialCabinState} animate={cabinState} variants={interiorVariants}>
            <CabinInterior isOpen={cabinState === "open"} />
          </motion.div>

          <motion.div className="absolute inset-0" initial={initialCabinState} animate={cabinState} variants={frontWallVariants}>
            <ArtAsset asset={ASSETS.cabinFrontWall} />
          </motion.div>

          <motion.div className="absolute inset-0" initial={initialCabinState} animate={cabinState} variants={exteriorShellVariants}>
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
      ) : (
        <div
          className="absolute"
          style={{
            left: layout.cabinX,
            top: layout.cabinY,
            width: CABIN_WIDTH,
            height: CABIN_HEIGHT,
            transform: `scale(${layout.cabinArt.shellScale})`,
            transformOrigin: "50% 0%",
          }}
        >
          {/* Interior always renders at exactly 100% of the stable logical
              shell -- it never participates in the closed/open art scale. */}
          <motion.div className="absolute inset-0" initial={initialCabinState} animate={cabinState} variants={interiorVariants}>
            <CabinInterior isOpen={cabinState === "open"} />
          </motion.div>

          {/* Exterior art group: scales from closedArtScale to 100% of the
              shell, centered via a 50%/50% transform-origin. Click target
              and door hint live inside this same group so they track the
              visible exterior art bounds instead of the larger shell. */}
          <motion.div
            className="absolute inset-0"
            style={{ transformOrigin: "50% 50%" }}
            initial={initialCabinState}
            animate={cabinState}
            variants={exteriorArtScaleVariants as Variants}
          >
            <motion.div className="absolute inset-0" initial={initialCabinState} animate={cabinState} variants={frontWallVariants}>
              <ArtAsset asset={ASSETS.cabinFrontWall} />
            </motion.div>

            <motion.div className="absolute inset-0" initial={initialCabinState} animate={cabinState} variants={exteriorShellVariants}>
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
        </div>
      )}

      <LayoutGuide mode={mode} />
    </>
  );
}
