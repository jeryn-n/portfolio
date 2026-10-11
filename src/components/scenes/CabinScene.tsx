"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
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
  getCabinBaseY,
  getOpenCabinBox,
  getSceneLayout,
  type CloudKind,
  type ExteriorCrop,
} from "@/lib/layout";
import { createCloudField, type CloudSpec } from "./cloudField";
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

// Opening parallax: the outdoors zooms in a little as the cabin opens, each
// terrain depth by a little more than the one behind it. The cabin's own,
// much larger growth makes it the closest layer of all. Every zoom grows
// from the cabin's base, so the ground at its feet stays put.
const PARALLAX_ZOOM = { sky: 1.02, mountains: 1.04, foothills: 1.06, ground: 1.08 };
type ParallaxDepth = keyof typeof PARALLAX_ZOOM;

function parallaxVariants(scale: number): Variants {
  return {
    closed: { scale: 1 },
    opening: { scale, transition: { duration: REVEAL_DURATION, ease: REVEAL_EASE } },
    open: { scale },
  };
}

const PARALLAX_VARIANTS: Record<ParallaxDepth, Variants> = {
  sky: parallaxVariants(PARALLAX_ZOOM.sky),
  mountains: parallaxVariants(PARALLAX_ZOOM.mountains),
  foothills: parallaxVariants(PARALLAX_ZOOM.foothills),
  ground: parallaxVariants(PARALLAX_ZOOM.ground),
};

// Snow falls in front of the cabin. Once it opens, the snow fades out over
// the open cabin's box (so the interior is never snowed on) and dims a
// little elsewhere. The cutout
// fades in with the front wall.
const SNOW_OPEN_OPACITY = 0.6;
const SNOW_CUTOUT_FEATHER = 48;

const snowVariants: Variants = {
  closed: { opacity: 1, "--snow-cutout": 0 },
  opening: {
    opacity: SNOW_OPEN_OPACITY,
    "--snow-cutout": 1,
    transition: { duration: REVEAL_DURATION * 0.5, delay: REVEAL_DURATION * 0.25, ease: REVEAL_EASE },
  },
  open: { opacity: SNOW_OPEN_OPACITY, "--snow-cutout": 1 },
};

// A soft-edged rectangular hole over `box`, as two crossing gradient bands
// unioned by the default `add` mask composite: snow shows wherever it is
// outside the box horizontally OR vertically. --snow-cutout (0..1) is how
// strongly the inside is masked out.
function snowCutoutMask(box: { x: number; y: number; width: number; height: number }): string {
  const inside = "rgba(0, 0, 0, calc(1 - var(--snow-cutout)))";
  const band = (direction: string, start: number, end: number) =>
    `linear-gradient(${direction}, #000 ${start - SNOW_CUTOUT_FEATHER}px, ${inside} ${start}px, ${inside} ${end}px, #000 ${end + SNOW_CUTOUT_FEATHER}px)`;
  return `${band("to right", box.x, box.x + box.width)}, ${band("to bottom", box.y, box.y + box.height)}`;
}

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

// Birds and the airplane are switched off for now. Both systems (timers,
// the airplane's 50% early flight, assets, config) stay in place; flip these
// back to bring them back.
const BIRDS_ENABLED = false;
const AIRPLANE_ENABLED = false;

// Debug-only: each category's count, plus the shared drift speed.
function cloudSummary(clouds: CloudSpec[]): string {
  const names: Record<CloudKind, string> = { large: "very large", medium: "medium", small: "small" };
  const counts = (Object.keys(names) as CloudKind[])
    .map((kind) => `${clouds.filter((cloud) => cloud.kind === kind).length} ${names[kind]}`)
    .join(", ");
  return `${counts}, all behind the mountains at ${clouds[0]?.speed ?? 0} px/s`;
}

// One layer of the 1920x1620 exterior master, placed by the mode's crop at a
// single uniform scale. All four terrain layers render through this with the
// same crop, so they can never drift out of registration.
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

interface CabinSceneProps {
  // Where the foreground (sign, cabin, snow, title card) renders: a layer
  // WorldSceneController keeps above the other scenes, moving with this
  // scene. The environment renders here, below them.
  foregroundTarget: HTMLElement | null;
}

// The clickable closed cabin, the opening reveal, the open-interior
// wireframe, and the scene's environment (sky, mountains, foothills, ground,
// clouds, birds, airplane, snow) -- reused across two explicit composition modes (desktop
// and portrait) via mode-specific scene layouts.
export function CabinScene({ foregroundTarget }: CabinSceneProps) {
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
  // Drawn once per composition mode. There is no hydration risk in the
  // randomness: like SnowLayer, this scene only ever first renders on the
  // client, after SceneStage has measured the viewport.
  const clouds = useMemo(() => createCloudField(layout), [layout]);

  // Closed: full speed. Opening/open: slowed. Reduced motion: held still.
  const cloudSpeedFactor = reducedMotion ? 0 : cabinState === "closed" ? 1 : OPEN_CLOUD_SPEED_FACTOR;

  // Birds belong to the closed exterior only. New flights stop the instant
  // the cabin starts opening, and BirdLayer fades out whatever is still
  // airborne, so the OPEN state has none.
  const birdsSpawning = BIRDS_ENABLED && cabinState === "closed" && !frozen && !reducedMotion;
  // The airplane is part of the outdoors in either cabin state.
  const airplaneSpawning = AIRPLANE_ENABLED && !frozen && !reducedMotion;

  // The clouds of the given categories. They all share one speed, so the
  // spacing cloudField gave them holds.
  function renderClouds(kinds: readonly CloudKind[]) {
    return clouds.map(
      (cloud) =>
        kinds.includes(cloud.kind) && (
          <AmbientCloud
            key={cloud.id}
            asset={cloud.asset}
            x={cloud.x}
            y={cloud.y}
            speed={cloud.speed * cloudSpeedFactor}
            wrapWidth={layout.stageWidth}
            scale={cloud.scale}
            flip={cloud.flip}
            paused={frozen}
          />
        ),
    );
  }

  // Parallax zoom origin: the cabin's base, as a fraction of the stage.
  const parallaxOrigin = `50% ${(getCabinBaseY(layout) / layout.stageHeight) * 100}%`;

  function renderDepth(depth: ParallaxDepth, children: ReactNode) {
    return (
      <motion.div
        className="absolute inset-0"
        style={{ transformOrigin: parallaxOrigin }}
        initial={initialCabinState}
        animate={cabinState}
        variants={PARALLAX_VARIANTS[depth]}
      >
        {children}
      </motion.div>
    );
  }

  const snowMask = snowCutoutMask(getOpenCabinBox(layout));

  // Portrait keeps its prior architecture: the whole 640x720 group (shell +
  // art together) scales from an explicit closed end state to an explicit
  // open end state, from its bottom-center so the base stays put.
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
  // scales up to exactly 100% of the shell as it opens, from a 50%/100%
  // (bottom-center) transform-origin, so it grows upward and outward from a
  // fixed base with no manual offset math.
  const artGroupScaleVariants: Variants | undefined =
    layout.mode === "desktop"
      ? {
          closed: { scale: layout.cabinArt.closedArtScale },
          opening: { scale: 1, transition: { duration: REVEAL_DURATION, ease: REVEAL_EASE } },
          open: { scale: 1 },
        }
      : undefined;

  const environment = (
    <>
      {/* Back to front: sky, the distant airplane, every cloud (all behind
          the mountains), mountains + birds, foothills + back trees, ground +
          front trees. Each terrain layer is its own parallax depth. */}
      {renderDepth(
        "sky",
        <>
          <ExteriorLayer asset={ASSETS.cabinSky} crop={layout.exterior} />
          {AIRPLANE_ENABLED && <AirplaneLayer spawning={airplaneSpawning} frozen={frozen} />}
          {renderClouds(["large", "medium", "small"])}
        </>,
      )}
      {renderDepth(
        "mountains",
        <>
          <ExteriorLayer asset={ASSETS.cabinMountains} crop={layout.exterior} />
          {BIRDS_ENABLED && <BirdLayer spawning={birdsSpawning} clearing={cabinState !== "closed"} frozen={frozen} />}
        </>,
      )}
      {renderDepth("foothills", <ExteriorLayer asset={ASSETS.cabinFoothillsBackTrees} crop={layout.exterior} />)}
      {renderDepth("ground", <ExteriorLayer asset={ASSETS.cabinGroundFrontTrees} crop={layout.exterior} />)}
    </>
  );

  // Everything in front of the outdoors.
  const foreground = (
    <>
      <motion.div
        className="absolute"
        style={{ left: houseSign.x, top: houseSign.y }}
        initial={initialCabinState}
        animate={cabinState}
        variants={signVariants}
      >
        <ArtAsset asset={ASSETS.houseSign} />
      </motion.div>

      {layout.mode === "portrait" ? (
        <motion.div
          className="absolute"
          style={{ left: layout.cabinX, width: CABIN_WIDTH, height: CABIN_HEIGHT, transformOrigin: "50% 100%" }}
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
              from its bottom-center, so the base stays put and the growth
              goes up and out. The interior sits in this same group, so the
              exterior, front wall and interior stay exactly registered
              while they cross-fade mid-scale, and the open interior lands
              at exactly 100% of the shell. Click target and door hint live
              here too, so they track the visible closed art bounds instead
              of the larger shell. */}
          <motion.div
            className="absolute inset-0"
            style={{ transformOrigin: "50% 100%" }}
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

      {/* Snow is the nearest layer of the outdoors, falling in front of the
          closed cabin; see snowVariants for how it clears the open one. */}
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{ maskImage: snowMask, WebkitMaskImage: snowMask }}
        initial={initialCabinState}
        animate={cabinState}
        variants={snowVariants}
      >
        <SnowLayer enabled={!reducedMotion} frozen={frozen} />
      </motion.div>

      <CabinTitleCard
        x={titleCard.x}
        y={titleCard.y}
        revealed={chromeRevealed}
        revealDelay={reducedMotion ? REDUCED_LATE_REVEAL_DELAY : LATE_REVEAL_DELAY}
      />

      <LayoutGuide
        mode={mode}
        environment={{
          snow: reducedMotion ? "off (reduced motion)" : frozen ? "paused" : "active",
          clouds: `${cloudSummary(clouds)} --×${cloudSpeedFactor} speed (${cabinState === "closed" ? "closed" : "open"})${frozen ? " -- paused" : ""}`,
          parallax: `sky ×${PARALLAX_ZOOM.sky} / mountains ×${PARALLAX_ZOOM.mountains} / foothills ×${PARALLAX_ZOOM.foothills} / ground ×${PARALLAX_ZOOM.ground} from the cabin base (y ${getCabinBaseY(layout)})`,
          birds: !BIRDS_ENABLED ? "hidden (disabled for now)" : birdsSpawning ? "active" : "inactive",
          airplane: !AIRPLANE_ENABLED ? "hidden (disabled for now)" : airplaneSpawning ? "active" : "inactive",
        }}
      />
    </>
  );

  return (
    <>
      {environment}
      {foregroundTarget && createPortal(foreground, foregroundTarget)}
    </>
  );
}
