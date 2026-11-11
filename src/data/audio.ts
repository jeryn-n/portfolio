// Centralized audio configuration: every sound file the site plays, its
// volume, and the fades and cat-meow weights. The files may not exist yet --
// the sound engine (src/components/audio/soundEngine.ts) fetches each one at
// most once per visit, only after sound has been switched on, and a missing
// or undecodable file simply stays silent: no retries, no rejected promises,
// and the visual interaction it belongs to works either way. Dropping a file
// in at its path is all it takes for it to start playing (on the next load).
//
//   /public/audio/ambience/ -- the two seamless loops
//   /public/audio/music/    -- the gramophone's track (loops)
//   /public/audio/sfx/      -- one-shots
//
// What reaches the speakers is always three numbers multiplied, never folded
// into one another:
//
//   AUDIO_VOLUME (the mix) x AUDIO_SCENE_LEVEL (where you are) x master volume
//
// The master volume is the visitor's slider (MASTER_VOLUME_DEFAULT on every
// fresh visit); moving it never changes the mix.

export const AUDIO = {
  // Wind + birds, one mixed loop. Plays whenever sound is on, across the
  // whole Cabin / Experience / Projects world -- muffled while you're inside
  // the cabin (AUDIO_SCENE_LEVEL).
  worldAmbience: "/audio/ambience/world-ambient.mp3",
  // Only while the cabin's interior is the scene on screen.
  fireplace: "/audio/ambience/fireplace-crackle.mp3",
  music: "/audio/music/gramophone.mp3",
  sfx: {
    lamp: "/audio/sfx/lamp-click.mp3",
    door: "/audio/sfx/door-open.mp3",
    transitionWind: "/audio/sfx/transition-wind.mp3",
  },
  catMeows: [
    "/audio/sfx/cat-meow-01.mp3",
    "/audio/sfx/cat-meow-02.mp3",
    "/audio/sfx/cat-meow-03.mp3",
    "/audio/sfx/cat-meow-04.mp3",
    "/audio/sfx/cat-meow-05.mp3",
  ],
} as const;

export type SfxKey = keyof typeof AUDIO.sfx;

// How likely each meow is, in AUDIO.catMeows order: out of 33 clicks, 10 are
// meow 01 and 1 is meow 05. Repeats are allowed. A clip that hasn't loaded
// (or is missing) drops out and the rest share its odds.
export const CAT_MEOW_WEIGHTS = [10, 8, 8, 6, 1];

// At most this many meows sound at once. Clicking faster than they finish
// stacks them up to here; past it, the oldest is cut off for the newest.
export const CAT_MEOW_MAX_OVERLAP = 6;

// The mix: each channel's base volume, 0-1, before the scene level and the
// master volume. Tune these by ear; the derivations note the last pass's
// values they were adjusted from.
export const AUDIO_VOLUME = {
  worldAmbience: 0.3675, // 0.35 x 1.05
  fireplace: 0.385, // 0.35 x 1.10
  music: 0.65,
  lamp: 0.6,
  door: 0.6,
  transitionWind: 0.5,
  cat: 0.45, // 0.6 x 0.75
};

// Where you are, as a multiplier on a loop's base volume. Outdoors
// (the closed cabin, Experience, Projects) everything plays at 1.
export const AUDIO_SCENE_LEVEL = {
  // The outdoor ambience while the open cabin is the scene: still there,
  // but muffled by the walls.
  outdoorInCabin: 0.5,
};

// The master volume slider's starting point on every fresh visit, 0-1.
export const MASTER_VOLUME_DEFAULT = 0.5;

// Fade lengths, seconds. Muting is never faded beyond a click-free instant.
export const AUDIO_FADE = {
  // The ambience loops easing in when sound is switched on.
  soundOn: 0.4,
  // The fire as the cabin's interior comes into view, and as it's left.
  fireplaceIn: 0.8,
  fireplaceOut: 0.6,
  // The outdoor ambience dipping as the cabin opens, and back up as you
  // leave it.
  sceneLevel: 0.7,
  // The master volume following the slider: just enough to stay click-free.
  masterVolume: 0.05,
};
