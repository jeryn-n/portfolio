"use client";

import { useEffect, useState } from "react";
import { motion, type Variants } from "motion/react";
import { AirplaneLayer } from "./AirplaneLayer";
import { AmbientCloud } from "./AmbientCloud";
import { ArtAsset } from "@/components/art/ArtAsset";
import { useAudio } from "@/components/audio/AudioProvider";
import { useSiteUI } from "@/components/ui/SiteUIProvider";
import { ASSETS, type ArtAssetDef } from "@/data/assets";
import {
  CABIN_HEIGHT,
  CABIN_WIDTH,
  DOOR_HINT_RATIO,
  getSceneLayout,
  type ExteriorCrop,
} from "@/lib/layout";
import {
  LATE_REVEAL_DELAY,
  REDUCED_LATE_REVEAL_DELAY,
  REDUCED_REVEAL_DURATION,
  REVEAL_DURATION,
  REVEAL_EASE,
} from "@/lib/reveal";
import { BirdLayer } from "./BirdLayer";
import { CabinEntryHint } from "./CabinEntryHint";
import { useCabinState } from "./CabinStateContext";
import { CabinInterior } from "./CabinInterior";
import { CabinTitleCard } from "./CabinTitleCard";
import { useCompositionMode } from "./CompositionModeContext";
import { LayoutGuide } from "./LayoutGuide";
import { SnowLayer } from "./SnowLayer";
import { useEnvironmentMotion } from "./useEnvironmentMotion";

// Clouds keep drifting once the cabin is open, but noticeably slower -- the
// outdoors is still alive while attention has moved indoors.
const OPEN_CLOUD_SPEED_FACTOR = 0.6;

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

// One layer of the 1920x1620 exterior master, placed by the mode's crop at a
// single uniform scale. Sky and mountains-ground both render through this
// with the same crop, so they can never drift out of registration.
// maxWidth: the portrait crop is wider than the stage, and Tailwind's
// preflight `img { max-width: 100% }` would otherwise squeeze it to fit.
function ExteriorLayer({ asset, crop }: { asset: ArtAssetDef; crop: ExteriorCrop }) {
  return (
    <ArtAsset
      asset={asset}
      style={{
        position: "absolute",
        left: crop.x,
        top: crop.y,
        width: asset.designWidth * crop.scale,
        height: asset.designHeight * crop.scale,
        maxWidth: "none",
      }}
    />
  );
}

// The clickable closed cabin, the opening reveal, the open-interior
// wireframe, and the scene's environment (sky, clouds, mountains, birds,
// airplane, snow) -- reused across two explicit composition modes (desktop
// and portrait) via mode-specific scene layouts.
export function CabinScene() {
  const { cabinState, setCabinState } = useCabinState();
  const mode = useCompositionMode();
  const layout = getSceneLayout(mode);
  const { setAmbientMode } = useAudio();
  const { markCabinEntered } = useSiteUI();
  const { reducedMotion, frozen } = useEnvironmentMotion();

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

  // Reduced motion shortens the dwell in "opening" to match the much faster
  // reveal it produces: Motion skips the scale/transform parts of the reveal
  // entirely (see the MotionConfig in AppProviders), leaving only the
  // cross-fade, so there is nothing left to wait 1.2s for.
  const revealDuration = reducedMotion ? REDUCED_REVEAL_DURATION : REVEAL_DURATION;

  useEffect(() => {
    if (cabinState !== "opening") return;
    const timer = setTimeout(() => setCabinState("open"), revealDuration * 1000);
    return () => clearTimeout(timer);
  }, [cabinState, setCabinState, revealDuration]);

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

  // Closed: full speed. Opening/open: slowed. Reduced motion: held still.
  const cloudSpeedFactor = reducedMotion ? 0 : cabinState === "closed" ? 1 : OPEN_CLOUD_SPEED_FACTOR;

  // Birds belong to the closed exterior only. New flights stop the instant
  // the cabin starts opening, and BirdLayer fades out whatever is still
  // airborne, so the OPEN state has none.
  const birdsSpawning = cabinState === "closed" && !frozen && !reducedMotion;
  // The airplane is part of the outdoors in either cabin state.
  const airplaneSpawning = !frozen && !reducedMotion;

  // One layer's clouds, keyed by their index in the full layout list.
  function renderClouds(layer: "rear" | "front") {
    return layout.clouds.map(
      (cloud, index) =>
        cloud.layer === layer && (
          <AmbientCloud
            key={index}
            asset={ASSETS[cloud.assetKey]}
            x={cloud.x}
            y={cloud.y}
            speed={cloud.speed * cloudSpeedFactor}
            wrapWidth={layout.stageWidth}
            scale={cloudScale * (cloud.scale ?? 1)}
            flip={cloud.flip}
            paused={frozen}
          />
        ),
    );
  }

  // Portrait keeps its prior architecture: the whole 640x720 group (shell +
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

  // Desktop: the 640x720 logical shell is a stable reference box (scaled
  // once by shellScale, never animated between states). Only the art group
  // inside it resizes -- it renders at closedArtScale while closed and
  // scales up to exactly 100% of the shell as it opens, centered via a
  // 50%/50% transform-origin so no manual offset math is needed.
  const artGroupScaleVariants: Variants | undefined =
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
        {/* Back to front: sky, rear clouds, mountains-ground (transparent
            above the peaks, so rear clouds pass behind them), front clouds,
            then the distant birds and airplane. */}
        <ExteriorLayer asset={ASSETS.cabinSky} crop={layout.exterior} />
        {renderClouds("rear")}
        <ExteriorLayer asset={ASSETS.cabinMountainsGround} crop={layout.exterior} />
        {renderClouds("front")}
        <BirdLayer spawning={birdsSpawning} clearing={cabinState !== "closed"} frozen={frozen} />
        <AirplaneLayer spawning={airplaneSpawning} frozen={frozen} />

        {/* Snow, birds and the airplane live INSIDE this environment group,
            which is why no mask is needed anywhere: the group sits beneath
            the house sign, the title card and the whole cabin, so an open
            cabin's interior is never snowed on and the snow simply reads as
            the weather outside. Being inside this group also means the snow
            is dimmed by the darkening layer below exactly as the rest of the
            outdoors is when the cabin opens. Snow is the nearest of them, so
            it falls in front of the distant flyers. */}
        <SnowLayer enabled={!reducedMotion} frozen={frozen} />
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
        revealDelay={reducedMotion ? REDUCED_LATE_REVEAL_DELAY : LATE_REVEAL_DELAY}
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
          {/* Art group: scales from closedArtScale to 100% of the shell,
              centered via a 50%/50% transform-origin. The interior sits in
              this same group, so the exterior, front wall and interior stay
              exactly registered while they cross-fade mid-scale, and the
              open interior lands at exactly 100% of the shell. Click target
              and door hint live here too, so they track the visible closed
              art bounds instead of the larger shell. */}
          <motion.div
            className="absolute inset-0"
            style={{ transformOrigin: "50% 50%" }}
            initial={initialCabinState}
            animate={cabinState}
            variants={artGroupScaleVariants as Variants}
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
        </div>
      )}

      <LayoutGuide
        mode={mode}
        environment={{
          snow: reducedMotion ? "off (reduced motion)" : frozen ? "paused" : "active",
          clouds: `×${cloudSpeedFactor} (${cabinState === "closed" ? "closed" : "open"})${frozen ? " -- paused" : ""}`,
          birds: birdsSpawning ? "active" : "inactive",
          airplane: airplaneSpawning ? "active" : "inactive",
        }}
      />
    </>
  );
}
