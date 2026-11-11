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
  CABIN_ENTRY_REGION,
  CABIN_HEIGHT,
  CABIN_WIDTH,
  CHIMNEY_SMOKE_ORIGIN,
  DOOR_HINT,
  fitSceneLayout,
  getSceneLayout,
  getSmokeCorridorHeight,
  getZoomFocusY,
  type CloudKind,
  type ExteriorCrop,
  type SmokeFade,
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
import { LanternGlow, RegisteredCabinArt } from "./RegisteredCabinObject";
import { ChimneySmoke } from "./ChimneySmoke";
import { useCompositionMode } from "./CompositionModeContext";
import { LayoutGuide } from "./LayoutGuide";
import { useStageViewport } from "./SceneStage";
import { SnowLayer, useSnowFlakes } from "./SnowLayer";
import { useEnvironmentMotion } from "./useEnvironmentMotion";
import { useWorldScene } from "./WorldSceneContext";

// Clouds keep drifting once the cabin is open, but noticeably slower -- the
// outdoors is still alive while attention has moved indoors.
const OPEN_CLOUD_SPEED_FACTOR = 0.6;

// Opening parallax: the outdoors zooms in as the cabin opens, each terrain
// depth clearly more than the one behind it -- the sky not at all, the
// ground most. The cabin's own, much larger growth (x1.28 desktop, x1.3
// portrait) keeps it the closest layer of all. Every zoom, the cabin's
// included, grows from one point near the cabin's base (getZoomFocusY), so
// it reads as the camera moving into the scene.
const PARALLAX_ZOOM = { sky: 1, mountains: 1.025, foothills: 1.065, ground: 1.11 };
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

// Snow falls in front of the closed cabin. The moment it starts to open, the
// one snow layer drops BEHIND the cabin -- a change of stacking order only,
// so the very same flakes keep falling, never restarted or duplicated -- and
// from then on it shows around the roof and through the windows but never
// lands on the interior. All of the snow dims a little while the cabin is
// open.
//
// Deliberately no masks and no second copy: an earlier version cross-masked
// the snow with a copy of itself behind the cabin, and those stage-sized
// masks (repainted every frame of the handover) plus the doubled flake layers
// were enough compositor memory to crash phones as the cabin opened.
const SNOW_OPEN_OPACITY = 0.6;

const snowVariants: Variants = {
  closed: { opacity: 1 },
  opening: {
    opacity: SNOW_OPEN_OPACITY,
    transition: { duration: REVEAL_DURATION * 0.5, delay: REVEAL_DURATION * 0.25, ease: REVEAL_EASE },
  },
  open: { opacity: SNOW_OPEN_OPACITY },
};

// The smoke layer's mask: clear down to goneY, then easing (smoothstep) to
// solid at opaqueY. Stage px, shifted into the layer, which starts
// `corridor` px above the stage.
function smokeFadeMask({ opaqueY, goneY }: SmokeFade, corridor: number): string {
  const stops = [0, 0.2, 0.4, 0.6, 0.8, 1].map((t) => {
    const alpha = t * t * (3 - 2 * t);
    return `rgb(0 0 0 / ${alpha.toFixed(3)}) ${goneY + (opaqueY - goneY) * t + corridor}px`;
  });
  return `linear-gradient(to bottom, ${stops.join(", ")})`;
}

// The closed cabin's click target, as a clip-path and as SVG points.
const ENTRY_CLIP_PATH = `polygon(${CABIN_ENTRY_REGION.map(([x, y]) => `${x}px ${y}px`).join(", ")})`;
const ENTRY_POINTS = CABIN_ENTRY_REGION.map(([x, y]) => `${x},${y}`).join(" ");

const INSTANT = { duration: 0 };

const signVariants: Variants = {
  closed: { opacity: 1 },
  opening: { opacity: 0, transition: { duration: REVEAL_DURATION * 0.35, ease: REVEAL_EASE } },
  open: { opacity: 0 },
};

// The reveal is layered, never a cross-fade: the interior turns fully
// opaque first, hidden under the still-opaque exterior and front wall (its
// silhouette sits entirely inside theirs), and only then do those two
// dissolve over it -- so the cabin is solid at every frame and the outdoors
// can only ever show through the interior's own windows.
const INTERIOR_READY = REVEAL_DURATION * 0.1;

const exteriorShellVariants: Variants = {
  closed: { opacity: 1 },
  opening: {
    opacity: 0,
    transition: { duration: REVEAL_DURATION * 0.5, delay: INTERIOR_READY, ease: REVEAL_EASE },
  },
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
  opening: { opacity: 1, transition: { duration: INTERIOR_READY, ease: "linear" } },
  open: { opacity: 1 },
};

// Birds and the airplane are switched off for now. Both systems (timers,
// the airplane's 50% early flight, assets, config) stay in place; flip these
// back to bring them back.
const BIRDS_ENABLED = false;
const AIRPLANE_ENABLED = false;
// The house sign is hidden for now too; its art and placement stay put.
const HOUSE_SIGN_ENABLED = false;
// So is the separate roof title card: the name and title now sit on the
// sign drawn into the interior art (see CabinInterior).
const TITLE_CARD_ENABLED = false;

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
  const modeLayout = getSceneLayout(mode);
  // Fitted to the screen: on a phone, the open cabin's size depends on how
  // much of the stage the screen shows (see PORTRAIT_OPEN_FIT).
  const stageViewport = useStageViewport();
  const layout = useMemo(() => fitSceneLayout(modeLayout, stageViewport), [modeLayout, stageViewport]);
  const { scene } = useWorldScene();
  const { setAmbientMode, playSfx } = useAudio();
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

  // Ambient context: from the moment the interior starts to show until the
  // visitor travels off to another scene (and again on the way back), the
  // fireplace plays and the world's ambience is muffled behind it.
  const interiorAmbience = cabinState !== "closed" && scene === "cabin";
  useEffect(() => {
    setAmbientMode(interiorAmbience ? "interior" : "exterior");
  }, [interiorAmbience, setAmbientMode]);

  useEffect(() => {
    if (cabinState === "open") markCabinEntered();
  }, [cabinState, markCabinEntered]);

  // The door creaks only here, on the click that opens the closed cabin --
  // never for a cabin that loads or returns already open.
  function handleEnter() {
    if (cabinState !== "closed") return;
    playSfx("door");
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
  // Drawn once per composition mode (not per fit, so a resize never reshuffles
  // the sky). There is no hydration risk in the randomness: like SnowLayer,
  // this scene only ever first renders on the client, after SceneStage has
  // measured the viewport.
  const clouds = useMemo(() => createCloudField(modeLayout), [modeLayout]);

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

  // Parallax zoom origin: the opening zoom's shared focus point near the
  // cabin's base, as a fraction of the stage.
  const zoomFocusY = getZoomFocusY(layout);
  const parallaxOrigin = `50% ${(zoomFocusY / layout.stageHeight) * 100}%`;

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

  const flakes = useSnowFlakes(!reducedMotion);
  const snowInFront = cabinState === "closed";

  // Portrait keeps its prior architecture: the whole 640x720 group (shell +
  // art together) scales from its closed scale to its open one, from its
  // bottom-center so the base stays put -- apart from openOffsetY, which
  // settles the open cabin lower on short screens. The open values are
  // fitted to the screen, so they're animated as values rather than named
  // variants: a resize that refits the open cabin then applies at once.
  const portraitOpen = cabinState !== "closed";
  const portraitTarget =
    layout.mode === "portrait"
      ? {
          scale: portraitOpen ? layout.cabinScale.openScale : layout.cabinScale.closedScale,
          y: portraitOpen ? layout.openOffsetY : 0,
        }
      : undefined;
  const portraitTransition = cabinState === "opening" ? { duration: REVEAL_DURATION, ease: REVEAL_EASE } : INSTANT;

  // Desktop: the 640x720 logical shell is a stable reference box (scaled
  // once by shellScale, never animated between states). Only the art group
  // inside it resizes -- it renders at closedArtScale while closed and
  // scales up to exactly 100% of the shell as it opens, from a 50%/100%
  // (bottom-center) transform-origin, so it grows upward and outward from
  // its base. It also travels down by openOffsetY stage px (shell px here,
  // hence the divide) on the same timing, which leaves the closed cabin
  // where it was.
  const artGroupScaleVariants: Variants | undefined =
    layout.mode === "desktop"
      ? {
          closed: { scale: layout.cabinArt.closedArtScale, y: 0 },
          opening: {
            scale: 1,
            y: layout.cabinArt.openOffsetY / layout.cabinArt.shellScale,
            transition: { duration: REVEAL_DURATION, ease: REVEAL_EASE },
          },
          open: { scale: 1, y: layout.cabinArt.openOffsetY / layout.cabinArt.shellScale },
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

  // The cabin's own transform -- its stage position and scale, and the
  // opening zoom -- around `children`, which are in cabin-local px. The cabin
  // and its chimney smoke both render through this, so the smoke stays on the
  // chimney through every frame of the zoom.
  //
  // Desktop: the 640x720 logical shell is a stable reference box (scaled
  // once by shellScale, never animated between states). Only the art group
  // inside it resizes, from closedArtScale to exactly 100% of the shell,
  // from its bottom-center, so the base stays put and the growth goes up and
  // out (see artGroupScaleVariants). Portrait: the whole group scales, see
  // portraitTarget.
  function cabinFrame(children: ReactNode) {
    if (layout.mode === "portrait") {
      return (
        <motion.div
          className="absolute"
          style={{ left: layout.cabinX, top: layout.cabinY, width: CABIN_WIDTH, height: CABIN_HEIGHT, transformOrigin: "50% 100%" }}
          initial={false}
          animate={portraitTarget}
          transition={portraitTransition}
        >
          {children}
        </motion.div>
      );
    }
    return (
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
        <motion.div
          className="absolute inset-0"
          style={{ transformOrigin: "50% 100%" }}
          initial={initialCabinState}
          animate={cabinState}
          variants={artGroupScaleVariants as Variants}
        >
          {children}
        </motion.div>
      </div>
    );
  }

  // Chimney smoke, in its own layer behind the whole cabin, so the puffs
  // come out from behind the chimney cap (the interior's has one too). It
  // belongs to the cabin -- it rides cabinFrame, growing with the opening
  // zoom, and keeps rising once the cabin is open -- but the layer around it
  // is world space: the cabin scene's stage, reaching up past the stage's
  // top edge (getSmokeCorridorHeight), masked so the column thins out to
  // nothing by layout.smokeFade.goneY. So the layer's clipped top only ever
  // cuts through smoke that's already gone, and travelling to Experience
  // shows the smoke dissolving into the sky, never hitting a ceiling. None at
  // all for reduced motion.
  const smokeCorridor = getSmokeCorridorHeight(layout);
  const smokeMask = smokeFadeMask(layout.smokeFade, smokeCorridor);
  const chimneySmoke = !reducedMotion && (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0"
      style={{ top: -smokeCorridor, height: layout.stageHeight + smokeCorridor, maskImage: smokeMask, WebkitMaskImage: smokeMask }}
    >
      <div className="absolute inset-x-0" style={{ top: smokeCorridor, height: layout.stageHeight }}>
        {cabinFrame(<ChimneySmoke x={CHIMNEY_SMOKE_ORIGIN.x} y={CHIMNEY_SMOKE_ORIGIN.y} frozen={frozen} />)}
      </div>
    </div>
  );

  // The closed cabin's click target: the building itself (CABIN_ENTRY_REGION),
  // not its whole transparent canvas -- a clip-path clips hit-testing too.
  // The clip would also cut off an outline, so keyboard focus is shown by the
  // polygon traced in an SVG beside it instead.
  const entryButton = (
    <>
      <button
        type="button"
        aria-label="Enter the cabin"
        onClick={handleEnter}
        disabled={cabinState !== "closed"}
        className="peer absolute inset-0 cursor-hand border-0 bg-transparent focus-visible:outline-none disabled:pointer-events-none"
        style={{ clipPath: ENTRY_CLIP_PATH }}
      />
      <svg
        aria-hidden="true"
        viewBox={`0 0 ${CABIN_WIDTH} ${CABIN_HEIGHT}`}
        className="pointer-events-none absolute inset-0 hidden h-full w-full overflow-visible peer-focus-visible:block"
      >
        <polygon points={ENTRY_POINTS} fill="none" stroke="var(--paper)" strokeWidth={3} strokeLinejoin="round" />
      </svg>
    </>
  );

  // The closed exterior: its art, the lantern's pulsing glow, then the
  // lantern itself on top (it never moves). All three are the same 640x720
  // canvas, and the whole thing fades out as the cabin opens.
  const exteriorArt = (
    <>
      <ArtAsset asset={ASSETS.cabinExterior} />
      <LanternGlow asset={ASSETS.cabinLanternGlow} />
      <RegisteredCabinArt asset={ASSETS.cabinLantern} />
    </>
  );

  // Everything in front of the outdoors.
  const foreground = (
    <>
      {HOUSE_SIGN_ENABLED && (
        <motion.div
          className="absolute"
          style={{ left: houseSign.x, top: houseSign.y }}
          initial={initialCabinState}
          animate={cabinState}
          variants={signVariants}
        >
          <ArtAsset asset={ASSETS.houseSign} />
        </motion.div>
      )}

      {chimneySmoke}

      {/* Snow is the nearest layer of the outdoors. It sits just behind the
          cabin, in front of the smoke, and while the cabin is closed it's
          lifted in front of the cabin too (z-index only, so the flakes never
          restart). See snowVariants. */}
      <motion.div
        aria-hidden="true"
        className={`pointer-events-none absolute inset-0 ${snowInFront ? "z-[1]" : "z-0"}`}
        initial={initialCabinState}
        animate={cabinState}
        variants={snowVariants}
      >
        <SnowLayer flakes={flakes} frozen={frozen} />
      </motion.div>

      {/* The exterior, front wall and interior all sit in the one cabin
          frame, so they stay exactly registered while they cross-fade
          mid-zoom, and the open interior lands at exactly the open size.
          The click target and door hint live here too, so they track the
          visible closed art. */}
      {cabinFrame(
        <>
          <motion.div className="absolute inset-0" initial={initialCabinState} animate={cabinState} variants={interiorVariants}>
            <CabinInterior isOpen={cabinState === "open"} />
          </motion.div>

          {/* The two cover layers never take pointer events: once they've
              dissolved they'd otherwise still sit on top of the interior and
              swallow every click meant for it. */}
          <motion.div className="pointer-events-none absolute inset-0" initial={initialCabinState} animate={cabinState} variants={frontWallVariants}>
            <ArtAsset asset={ASSETS.cabinFrontWall} />
          </motion.div>

          <motion.div className="pointer-events-none absolute inset-0" initial={initialCabinState} animate={cabinState} variants={exteriorShellVariants}>
            {exteriorArt}
          </motion.div>

          {entryButton}

          {cabinState === "closed" && <CabinEntryHint x={DOOR_HINT.x} y={DOOR_HINT.y} scale={DOOR_HINT.scale} />}
        </>,
      )}

      {TITLE_CARD_ENABLED && (
        <CabinTitleCard
          x={titleCard.x}
          y={titleCard.y}
          revealed={chromeRevealed}
          revealDelay={reducedMotion ? REDUCED_LATE_REVEAL_DELAY : LATE_REVEAL_DELAY}
        />
      )}

      <LayoutGuide
        mode={mode}
        layout={layout}
        environment={{
          snow: reducedMotion
            ? "off (reduced motion)"
            : `${frozen ? "paused" : "active"} -- ${flakes.length} flakes, ${snowInFront ? "in front of the cabin" : "behind the open cabin"}`,
          clouds: `${cloudSummary(clouds)} --×${cloudSpeedFactor} speed (${cabinState === "closed" ? "closed" : "open"})${frozen ? " -- paused" : ""}`,
          parallax: `sky ×${PARALLAX_ZOOM.sky} / mountains ×${PARALLAX_ZOOM.mountains} / foothills ×${PARALLAX_ZOOM.foothills} / ground ×${PARALLAX_ZOOM.ground} from the zoom focus (y ${Math.round(zoomFocusY)})`,
          birds: !BIRDS_ENABLED ? "hidden (disabled for now)" : birdsSpawning ? "active" : "inactive",
          airplane: !AIRPLANE_ENABLED ? "hidden (disabled for now)" : airplaneSpawning ? "active" : "inactive",
          interiorAmbience,
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
