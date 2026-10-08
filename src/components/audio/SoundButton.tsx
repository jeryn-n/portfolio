"use client";

import { motion } from "motion/react";
import { useAudio } from "./AudioProvider";

// Fixed bottom-right master sound control, visible from the initial exterior
// scene onward through panels and (eventually) future routes. Temporary
// white/blue pixel-UI treatment -- no final iconography yet.
export function SoundButton() {
  const { foleyEnabled, musicPlaying, toggleMaster } = useAudio();

  const label = !foleyEnabled
    ? "Sound is off -- turn sound on"
    : musicPlaying
      ? "Sound and music are on -- turn everything off"
      : "Sound is on -- turn everything off";

  return (
    <motion.button
      type="button"
      aria-label={label}
      aria-pressed={foleyEnabled}
      onClick={toggleMaster}
      whileTap={{ scale: 0.92 }}
      className="fixed z-40 flex h-11 w-11 items-center justify-center border-2 border-ink-soft bg-paper text-ink shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink-soft"
      style={{
        bottom: "calc(1rem + env(safe-area-inset-bottom))",
        right: "calc(1rem + env(safe-area-inset-right))",
      }}
    >
      <span aria-hidden="true" className="text-xs font-bold uppercase">
        {!foleyEnabled ? "Mute" : musicPlaying ? "♪" : "Snd"}
      </span>
    </motion.button>
  );
}
