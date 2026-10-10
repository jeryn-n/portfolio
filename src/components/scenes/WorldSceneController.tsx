"use client";

import { useState } from "react";
import { motion, useReducedMotion, type Transition } from "motion/react";
import { getSceneLayout, getSkyBridgeHeight } from "@/lib/layout";
import { REDUCED_REVEAL_DURATION, REVEAL_DURATION, REVEAL_EASE } from "@/lib/reveal";
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

// The single world darkness overlay: the dimmed outdoors around the OPEN
// cabin. It's 0 everywhere else -- closed cabin, Experience, Projects.
const OPEN_CABIN_DARKNESS = 0.2;

// Leaving the open cabin, the darkness clears in the first stretch of the
// travel (whose ease starts slowly), so it's gone before the boundary with
// the next scene is prominent. Arriving, the cabin comes in undimmed and the
// darkness settles back in as the travel lands.
const DARKNESS_CLEAR: Transition = { duration: SCENE_TRAVEL_DURATION * 0.3, ease: "easeOut" };
const DARKNESS_RETURN: Transition = {
  duration: SCENE_TRAVEL_DURATION * 0.45,
  delay: SCENE_TRAVEL_DURATION * 0.6,
  ease: "easeInOut",
};
// Opening the cabin in place: the outdoors dims along with the reveal.
const DARKNESS_REVEAL: Transition = { duration: REVEAL_DURATION * 0.7, ease: REVEAL_EASE };
// Reduced motion: scene travel is a cut, so the darkness just fades simply.
const DARKNESS_REDUCED: Transition = { duration: REDUCED_REVEAL_DURATION };

// Three permanently-mounted, full-stage scenes stacked in logical space
// (Experience parked above Cabin, Projects parked below). Scene travel only
// animates their shared Y offset -- Cabin's own React state (interior
// interactions, audio) is never torn down by leaving/returning to it, and
// Experience/Projects stay warm too. This is the fake-continuity "elevator"
// illusion described in CLAUDE.md, not a real scrollable world.
//
// Back to front: the cabin's environment, Experience, Projects, the world
// darkness overlay (one layer over the whole strip), then the cabin's
// foreground (sign, cabin, snow, title card), which CabinScene portals into
// its own layer so the overlay dims the outdoors but never the cabin.
export function WorldSceneController() {
  useHashEntrySync();
  useSceneGestures();

  const mode = useCompositionMode();
  const stageHeight = mode === "desktop" ? DESKTOP_STAGE_HEIGHT : PORTRAIT_STAGE_HEIGHT;
  const { scene, neighborInvolved, lastMoveInstant } = useWorldScene();
  const { cabinState } = useCabinState();
  const reducedMotion = useReducedMotion() ?? false;
  const debug = useDebugLayout();
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

  const darkness = scene === "cabin" && cabinState !== "closed" ? OPEN_CABIN_DARKNESS : 0;
  const darknessTransition = lastMoveInstant
    ? INSTANT_TRANSITION
    : reducedMotion
      ? DARKNESS_REDUCED
      : darkness === 0
        ? DARKNESS_CLEAR
        : cabinState === "opening"
          ? DARKNESS_REVEAL
          : DARKNESS_RETURN;

  return (
    <div
      className={`relative h-full w-full overflow-hidden ${
        neighborInvolved === "projects" ? "bg-stage-earth" : "bg-stage-sky"
      }`}
    >
      {/* Each scene clips to its own bounds. This matters because the cabin's
          environment layers zoom in (up to 1.08) once the cabin is open,
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
        animate={{ y: experienceY }}
        transition={transition}
      >
        <ExperienceScene />
      </motion.div>

      <motion.div
        className="absolute inset-0 overflow-hidden"
        style={{ pointerEvents: scene === "projects" ? "auto" : "none" }}
        aria-hidden={scene !== "projects"}
        animate={{ y: projectsY }}
        transition={transition}
      >
        <ProjectsScene />
      </motion.div>

      {/* One overlay for the whole world strip, so two scenes on screen
          mid-travel always share the same darkness. Below all viewport UI
          (that lives outside the stage), and never takes pointer events. */}
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-10 bg-black"
        initial={false}
        animate={{ opacity: darkness }}
        transition={darknessTransition}
      />

      <motion.div
        ref={setForegroundLayer}
        className="absolute inset-0 z-20 overflow-hidden"
        style={{ pointerEvents: scene === "cabin" ? "auto" : "none" }}
        aria-hidden={scene !== "cabin"}
        animate={{ y: cabinY }}
        transition={transition}
      />

      {debug && (
        <span className="pointer-events-none absolute bottom-2 left-2 z-30 rounded bg-black/60 px-1 text-[10px] uppercase tracking-wide text-yellow-300">
          World darkness: {darkness} target ({scene}, cabin {cabinState}) -- sky bridge {bridge}px
        </span>
      )}
    </div>
  );
}
