"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { getSceneLayout, getSkyBridgeHeight } from "@/lib/layout";
import { REDUCED_REVEAL_DURATION, REVEAL_DURATION } from "@/lib/reveal";
import { SCENE_TRAVEL_DURATION, SCENE_TRAVEL_EASE } from "@/lib/sceneTravel";
import { DESKTOP_STAGE_HEIGHT, PORTRAIT_STAGE_HEIGHT } from "@/lib/stage";
import { useDebugLayout } from "@/lib/useDebugLayout";
import { CabinScene } from "./CabinScene";
import { useCabinState } from "./CabinStateContext";
import { useCompositionMode } from "./CompositionModeContext";
import { ExperienceScene } from "./ExperienceScene";
import { ProjectsScene } from "./ProjectsScene";
import { useHashEntrySync } from "./useHashEntrySync";
import { useSceneGestures } from "./useSceneNavigation";
import { useWorldScene } from "./WorldSceneContext";

const INSTANT_TRANSITION = { duration: 0 };

// The world darkness: ONE black layer over the whole Experience/Cabin/
// Projects strip -- not a tint per terrain layer, and fixed to the stage
// rather than riding the travelling scenes, so it can never show a seam.
// The cabin's foreground is portalled into a layer above it, so only the
// outdoors is dimmed. It darkens the open cabin's surroundings by
// WORLD_DIM_OPACITY, fading in right after the opening zoom; leaving for another
// scene clears it early (the travel takes 0.9s), and returning restores it as
// the travel lands.
const WORLD_DIM_OPACITY = 0.2;
// On desktop it's a rounded vignette instead: a tenth of WORLD_DIM_OPACITY at
// the centre of the screen, rising to 2.5x at the edges (an ellipse that
// reaches the middle of each edge, so it follows the screen's own
// proportions). The rise is eased (t^2.2), not linear: it stays gentle through
// the middle and picks up toward the edge. Its stops are absolute alphas, so
// the layer itself fades 0 -> 1.
const DESKTOP_DIM_CENTER = WORLD_DIM_OPACITY * 0.1;
const DESKTOP_DIM_EDGE = WORLD_DIM_OPACITY * 2.5;
const DESKTOP_DIM_GRADIENT = `radial-gradient(ellipse closest-side at 50% 50%, ${Array.from({ length: 11 }, (_, i) => {
  const t = i / 10;
  const alpha = DESKTOP_DIM_CENTER + (DESKTOP_DIM_EDGE - DESKTOP_DIM_CENTER) * t ** 2.2;
  return `rgb(0 0 0 / ${alpha.toFixed(3)}) ${i * 10}%`;
}).join(", ")})`;
// On a phone the dim isn't uniform: it's WORLD_DIM_OPACITY at the top, eases
// right down to a tenth of that about two thirds of the way down (where the
// cabin sits), then comes back to the full amount at the bottom. The stops are
// multipliers of the layer's opacity, so the same fade in/out drives it.
const PORTRAIT_DIM_GRADIENT = `linear-gradient(to bottom, ${[
  [0, 1],
  [15, 0.97],
  [30, 0.85],
  [45, 0.55],
  [58, 0.25],
  [67, 0.1],
  [75, 0.18],
  [85, 0.45],
  [93, 0.78],
  [100, 1],
]
  .map(([stop, alpha]) => `rgb(0 0 0 / ${alpha}) ${stop}%`)
  .join(", ")})`;
// The darkness waits for the opening zoom to finish, then fades in on its own.
const DIM_REVEAL_FADE = 0.9;
const dimReveal = (zoomDuration: number) => ({ duration: DIM_REVEAL_FADE, delay: zoomDuration, ease: "easeOut" }) as const;
const DIM_CLEAR = { duration: 0.3, ease: "easeOut" } as const;
const DIM_RESTORE = { duration: 0.4, delay: SCENE_TRAVEL_DURATION * 0.5, ease: "easeOut" } as const;

// Three permanently-mounted, full-stage scenes stacked in logical space
// (Experience parked above Cabin, Projects parked below). Scene travel only
// animates their shared Y offset -- Cabin's own React state (interior
// interactions, audio) is never torn down by leaving/returning to it, and
// Experience/Projects stay warm too. This is the fake-continuity "elevator"
// illusion described in CLAUDE.md, not a real scrollable world.
//
// Back to front: the cabin's environment, Experience, Projects, then the
// cabin's foreground (sign, cabin, snow, title card), which CabinScene
// portals into its own layer above the other scenes.
//
// Every layer mounts already parked where it belongs (`initial={false}`).
// Without that, Motion animates each layer's y from 0 on mount, so all three
// scenes start stacked on top of each other and visibly slide apart.
export function WorldSceneController() {
  useHashEntrySync();
  useSceneGestures();

  const mode = useCompositionMode();
  const stageHeight = mode === "desktop" ? DESKTOP_STAGE_HEIGHT : PORTRAIT_STAGE_HEIGHT;
  const { scene, neighborInvolved, lastMoveInstant } = useWorldScene();
  const { cabinState } = useCabinState();
  const debug = useDebugLayout();
  const reducedMotion = useReducedMotion();
  const [foregroundLayer, setForegroundLayer] = useState<HTMLDivElement | null>(null);

  // Experience's background continues from the cabin sky's art row 0, but
  // the cabin's own window starts lower down (desktop: row 320). Those rows
  // are the bridge: Experience parks that much further up, and the cabin's
  // environment shows its real sky through the gap while travelling. Zero
  // on portrait, whose cabin window starts at row 0.
  const bridge = getSkyBridgeHeight(getSceneLayout(mode));

  const cabinY = scene === "cabin" ? 0 : scene === "experience" ? stageHeight + bridge : -stageHeight;
  const experienceY = scene === "experience" ? 0 : -(stageHeight + bridge);
  const projectsY = scene === "projects" ? 0 : stageHeight;

  const transition = lastMoveInstant
    ? INSTANT_TRANSITION
    : { duration: SCENE_TRAVEL_DURATION, ease: SCENE_TRAVEL_EASE };

  const dimmed = scene === "cabin" && cabinState !== "closed";
  const dimTransition =
    dimmed && cabinState === "opening"
      ? dimReveal(reducedMotion ? REDUCED_REVEAL_DURATION : REVEAL_DURATION)
      : lastMoveInstant
        ? INSTANT_TRANSITION
        : dimmed
          ? DIM_RESTORE
          : DIM_CLEAR;

  return (
    <div
      className={`relative h-full w-full overflow-hidden ${
        neighborInvolved === "projects" ? "bg-stage-earth" : "bg-stage-sky"
      }`}
    >
      {/* Each scene clips to its own bounds. This matters because the cabin's
          environment layers zoom in (up to 1.11) once the cabin is open,
          which overflows the scene -- enough for the exterior's background
          and its snowfall to bleed into whichever neighbouring scene is
          parked next to it. Clipping here
          changes nothing for the scene actually on screen, since its own
          bounds are the stage bounds. The cabin's environment clip reaches
          `bridge` above its stage, for the sky bridge. */}
      <motion.div
        className="absolute inset-x-0 overflow-hidden"
        style={{ top: -bridge, height: stageHeight + bridge, pointerEvents: scene === "cabin" ? "auto" : "none" }}
        aria-hidden={scene !== "cabin"}
        initial={false}
        animate={{ y: cabinY }}
        transition={transition}
      >
        <div className="absolute inset-x-0" style={{ top: bridge, height: stageHeight }}>
          <CabinScene foregroundTarget={foregroundLayer} />
        </div>
      </motion.div>

      <motion.div
        className="absolute inset-0 overflow-hidden"
        style={{ pointerEvents: scene === "experience" ? "auto" : "none" }}
        aria-hidden={scene !== "experience"}
        initial={false}
        animate={{ y: experienceY }}
        transition={transition}
      >
        <ExperienceScene />
      </motion.div>

      <motion.div
        className="absolute inset-0 overflow-hidden"
        style={{ pointerEvents: scene === "projects" ? "auto" : "none" }}
        aria-hidden={scene !== "projects"}
        initial={false}
        animate={{ y: projectsY }}
        transition={transition}
      >
        <ProjectsScene />
      </motion.div>

      {/* Above every scene, below the cabin's foreground (z-20). */}
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-10"
        style={{ background: mode === "portrait" ? PORTRAIT_DIM_GRADIENT : DESKTOP_DIM_GRADIENT }}
        initial={false}
        animate={{ opacity: dimmed ? (mode === "portrait" ? WORLD_DIM_OPACITY : 1) : 0 }}
        transition={dimTransition}
      />

      <motion.div
        ref={setForegroundLayer}
        className="absolute inset-0 z-20 overflow-hidden"
        style={{ pointerEvents: scene === "cabin" ? "auto" : "none" }}
        aria-hidden={scene !== "cabin"}
        initial={false}
        animate={{ y: cabinY }}
        transition={transition}
      />

      {debug && (
        <span className="pointer-events-none absolute bottom-2 left-2 z-30 rounded bg-black/60 px-1 text-[10px] uppercase tracking-wide text-yellow-300">
          Scene: {scene} -- sky bridge {bridge}px
        </span>
      )}
    </div>
  );
}
