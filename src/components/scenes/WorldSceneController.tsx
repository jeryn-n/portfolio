"use client";

import { motion } from "motion/react";
import { SCENE_TRAVEL_DURATION, SCENE_TRAVEL_EASE } from "@/lib/sceneTravel";
import { DESKTOP_STAGE_HEIGHT, PORTRAIT_STAGE_HEIGHT } from "@/lib/stage";
import { CabinScene } from "./CabinScene";
import { useCompositionMode } from "./CompositionModeContext";
import { ExperienceScene } from "./ExperienceScene";
import { ProjectsScene } from "./ProjectsScene";
import { useHashEntrySync } from "./useHashEntrySync";
import { useSceneGestures } from "./useSceneNavigation";
import { useWorldScene } from "./WorldSceneContext";

const INSTANT_TRANSITION = { duration: 0 };

// Three permanently-mounted, full-stage scenes stacked in logical space
// (Experience parked above Cabin, Projects parked below). Scene travel only
// animates their shared Y offset -- Cabin's own React state (interior
// interactions, audio) is never torn down by leaving/returning to it, and
// Experience/Projects stay warm too. This is the fake-continuity "elevator"
// illusion described in CLAUDE.md, not a real scrollable world.
export function WorldSceneController() {
  useHashEntrySync();
  useSceneGestures();

  const mode = useCompositionMode();
  const stageHeight = mode === "desktop" ? DESKTOP_STAGE_HEIGHT : PORTRAIT_STAGE_HEIGHT;
  const { scene, neighborInvolved, lastMoveInstant } = useWorldScene();

  const cabinY = scene === "cabin" ? 0 : scene === "experience" ? stageHeight : -stageHeight;
  const experienceY = scene === "experience" ? 0 : -stageHeight;
  const projectsY = scene === "projects" ? 0 : stageHeight;

  const transition = lastMoveInstant
    ? INSTANT_TRANSITION
    : { duration: SCENE_TRAVEL_DURATION, ease: SCENE_TRAVEL_EASE };

  return (
    <div
      className={`relative h-full w-full overflow-hidden ${
        neighborInvolved === "projects" ? "bg-stage-earth" : "bg-stage-sky"
      }`}
    >
      {/* Each scene clips to its own bounds. This matters because the cabin's
          environment group scales to 1.02 once the cabin is open, which
          overflows the scene by ~1% on every side -- enough for the
          exterior's background and its snowfall to bleed a few pixels into
          whichever neighbouring scene is parked next to it. Clipping here
          changes nothing for the scene actually on screen, since its own
          bounds are the stage bounds. */}
      <motion.div
        className="absolute inset-0 overflow-hidden"
        style={{ pointerEvents: scene === "cabin" ? "auto" : "none" }}
        aria-hidden={scene !== "cabin"}
        animate={{ y: cabinY }}
        transition={transition}
      >
        <CabinScene />
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
    </div>
  );
}
