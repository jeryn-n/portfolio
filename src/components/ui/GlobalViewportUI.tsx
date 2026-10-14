"use client";

import { SoundButton } from "@/components/audio/SoundButton";
import { SOUND_ENABLED } from "@/data/audio";
import { AboutPanel } from "./AboutPanel";
import { EducationPanel } from "./EducationPanel";
import { MasterMenu } from "./MasterMenu";

// Site-wide viewport UI, mounted once from AppProviders (above the route
// tree) rather than from any individual page. Two reasons it lives here:
//
//  1. Persistence -- it survives client-side route changes, so opening a
//     portfolio detail page never unmounts the menu, the master sound
//     control, or an open About/Education panel.
//  2. Untransformed coordinates -- it is a sibling of the routed content,
//     never a descendant of SceneStage's scaled stage div, so `position:
//     fixed` here means real viewport pixels instead of scaled logical
//     stage pixels.
//
// Deliberately NOT included: ViewportNavArrows (homepage scene travel only,
// so it stays in page.tsx) and EmailPopover (spatially anchored to the cabin,
// so it would stay cabin-local).
//
// The sound control is hidden while SOUND_ENABLED is off (see
// src/data/audio.ts).
export function GlobalViewportUI() {
  return (
    <>
      <MasterMenu />
      {SOUND_ENABLED && <SoundButton />}
      <AboutPanel />
      <EducationPanel />
    </>
  );
}
