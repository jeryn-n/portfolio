// Centralized audio configuration. Real audio files may not exist yet, so
// every source is nullable -- the audio manager (see
// src/components/audio/AudioProvider.tsx) safely no-ops whenever a source is
// missing, and never issues a network request for a file that doesn't exist.
// Once real files are dropped in, only this file needs to change; no
// component architecture should need to change.
//
// Expected locations once real assets exist:
//   /public/audio/music/      -- the single gramophone track
//   /public/audio/ambience/   -- exterior.mp3, interior.mp3 (looping)
//   /public/audio/sfx/        -- click.mp3, panel-open.mp3, panel-close.mp3, meow-*.mp3

export type SfxKey = "click" | "panelOpen" | "panelClose" | "swipe";

// Temporary, for the first deployment: no sound at all. While false the
// fixed Sound/Mute button isn't rendered, and the two calls that can switch
// sound on (the master toggle and the gramophone's toggleMusic) do nothing,
// so no interaction can start audio. Everything else -- AudioProvider, the
// config below, every playSfx call -- is untouched. Set to true to restore.
export const SOUND_ENABLED = false;

export const AUDIO = {
  music: {
    src: null as string | null,
  },
  ambience: {
    exterior: { src: null as string | null },
    interior: { src: null as string | null },
    // Deliberately silent: used by non-world routes (portfolio detail pages)
    // so they contribute no environmental ambience. Keeping it in the same
    // lookup table means AudioProvider needs no special-casing, and it stays
    // null permanently -- there is no "detail page ambience" asset.
    none: { src: null as string | null },
  },
  sfx: {
    click: { src: null as string | null },
    panelOpen: { src: null as string | null },
    panelClose: { src: null as string | null },
    // Played once whenever Experience/Cabin/Projects scene travel begins.
    swipe: { src: null as string | null },
  },
  // Randomly chosen from on each cat click. Empty is a valid, safe state.
  catMeows: [] as string[],
};
