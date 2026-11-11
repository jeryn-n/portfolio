"use client";

import { usePathname } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  AUDIO,
  AUDIO_FADE,
  AUDIO_SCENE_LEVEL,
  AUDIO_VOLUME,
  CAT_MEOW_MAX_OVERLAP,
  CAT_MEOW_WEIGHTS,
  MASTER_VOLUME_DEFAULT,
  type SfxKey,
} from "@/data/audio";
import { VIDEO_PATH } from "@/data/site";
import { SoundEngine } from "./soundEngine";

// Which of the world's sounds the current route allows. "none" and "silent"
// are real modes, not the absence of one:
//   exterior -- world ambience
//   interior -- the fireplace, with the world ambience muffled behind it
//               (the open cabin is the scene)
//   none     -- no ambience; the gramophone carries on (portfolio detail pages)
//   silent   -- nothing at all, not even the gramophone (/video, which plays
//               its own media)
export type AmbientMode = "exterior" | "interior" | "none" | "silent";

interface AudioContextValue {
  // The master switch (the bottom-right sound button). Off silences
  // everything.
  masterSoundEnabled: boolean;
  // Whether the gramophone is meant to be playing. Kept through a mute, so
  // unmuting brings the music back only if it was on.
  musicEnabled: boolean;
  // On the video portfolio, where none of the site's sound plays (and its
  // sound control isn't shown).
  routeIsolated: boolean;
  toggleMaster: () => void;
  // From the slider: 0 mutes; anything above sets the volume and unmutes.
  // The slider always shows the volume -- 50% on a fresh, silent visit, 68%
  // after muting at 68% -- and the button's icon shows whether it's muted.
  setMasterVolume: (volume: number) => void;
  // Called as the visitor takes hold of the slider (pointerdown, focus,
  // keydown): creates the audio engine inside that gesture, before the first
  // change arrives, and notes the volume to come back to if they take it all
  // the way down to 0.
  beginVolumeGesture: () => void;
  pressGramophone: () => void;
  setAmbientMode: (mode: AmbientMode) => void;
  playSfx: (key: SfxKey) => void;
  playCatMeow: () => void;
}

const AudioCtx = createContext<AudioContextValue | null>(null);
// The master volume, 0-1, as the slider shows it: kept through a mute by the
// button, so unmuting returns to it. 0 only when the slider itself was taken
// down to 0. A context of its own, so dragging the slider re-renders only
// what shows the volume -- not every scene that plays a sound.
const MasterVolumeCtx = createContext(MASTER_VOLUME_DEFAULT);

// A weighted pick from `choices` (indices into CAT_MEOW_WEIGHTS).
function pickWeighted(choices: number[]): number {
  const weight = (index: number) => CAT_MEOW_WEIGHTS[index] ?? 1;
  let roll = Math.random() * choices.reduce((sum, index) => sum + weight(index), 0);
  for (const index of choices) {
    roll -= weight(index);
    if (roll < 0) return index;
  }
  return choices[choices.length - 1];
}

// The video portfolio is kept apart from the world's soundscape entirely:
// nothing of the site's own plays while it's open, whatever the switches say.
function isIsolatedRoute(pathname: string | null): boolean {
  return pathname === VIDEO_PATH || (pathname?.startsWith(`${VIDEO_PATH}/`) ?? false);
}

// The site's sound state, mounted once above the route tree so it survives
// every route and scene change: one engine, one of each loop, one gramophone.
//
// Two separate switches, never collapsed into one, plus a volume:
//   masterSoundEnabled -- everything on or off.
//   musicEnabled       -- the gramophone's own on/off, which a mute leaves
//                         alone.
//   masterVolume       -- how loud "on" is; a mute leaves it alone too.
// A fresh visit starts with both switches off -- silence -- and the volume at
// MASTER_VOLUME_DEFAULT. Nothing can make a sound until the visitor turns it
// on, with the sound button, its volume slider or the gramophone. That
// gesture is what creates the audio engine, so the first sound always starts
// inside one.
//
//   sound button, off -> on   ambience (+ the fire if the interior is the
//                             scene), one-shots allowed; music only if
//                             musicEnabled
//   sound button, on -> off   everything stops at once; musicEnabled kept
//   slider to 0 / above 0     as the button, off / on (at that volume)
//   gramophone, master off    master on + music on, track from the top
//   gramophone, master on     music only: on from the top / off and rewound
//
// On the video portfolio (VIDEO_PATH) all of it is held silent, and comes
// back as it was on leaving.
export function AudioProvider({ children }: { children: ReactNode }) {
  const [masterSoundEnabled, setMasterSoundEnabled] = useState(false);
  const [masterVolume, setMasterVolumeState] = useState(MASTER_VOLUME_DEFAULT);
  const [musicEnabled, setMusicEnabled] = useState(false);
  const pathname = usePathname();
  const routeIsolated = isIsolatedRoute(pathname);

  // What the engine plays from. Refs, not state, because the handlers that
  // change them must reach the engine synchronously, within the gesture.
  const current = useRef({
    master: false,
    volume: MASTER_VOLUME_DEFAULT,
    // What unmuting returns to if the slider has been taken down to 0: the
    // volume it had when the visitor took hold of it (gestureVolume), not
    // the 1% it passed on the way down.
    restoreVolume: MASTER_VOLUME_DEFAULT,
    gestureVolume: MASTER_VOLUME_DEFAULT,
    music: false,
    mode: "exterior" as AmbientMode,
    isolated: false,
  });
  const engineRef = useRef<SoundEngine | null>(null);

  useEffect(() => {
    return () => {
      engineRef.current?.dispose();
      engineRef.current = null;
    };
  }, []);

  // Brings the engine in line with `current`, creating it the first time
  // sound is switched on.
  const apply = useCallback((musicFromStart = false) => {
    if (current.current.master && current.current.volume === 0) {
      // Switched on with the slider at 0: back up to where it was.
      current.current.volume = current.current.restoreVolume;
      setMasterVolumeState(current.current.volume);
    }
    const { master, volume, music, mode, isolated } = current.current;
    let engine = engineRef.current;
    if (!engine) {
      if (!master) return;
      engine = SoundEngine.create();
      if (!engine) return;
      engineRef.current = engine;
    }
    engine.setMasterVolume(volume);
    if (!master) engine.setOn(false);
    const silent = isolated || mode === "silent";
    const interior = !silent && mode === "interior";
    const outdoors = !silent && (interior || mode === "exterior");
    engine.setLoop(
      "worldAmbience",
      outdoors ? (interior ? AUDIO_SCENE_LEVEL.outdoorInCabin : 1) : 0,
      AUDIO_FADE.soundOn,
      AUDIO_FADE.sceneLevel,
    );
    engine.setLoop("fireplace", interior ? 1 : 0, interior ? AUDIO_FADE.fireplaceIn : AUDIO_FADE.fireplaceOut);
    engine.setMusic(music && !silent, musicFromStart);
    if (master) engine.setOn(true);
  }, []);

  useEffect(() => {
    current.current.isolated = routeIsolated;
    apply();
  }, [routeIsolated, apply]);

  const toggleMaster = useCallback(() => {
    const next = !current.current.master;
    current.current.master = next;
    apply();
    setMasterSoundEnabled(next);
  }, [apply]);

  const setMasterVolume = useCallback(
    (volume: number) => {
      const state = current.current;
      const next = Math.min(1, Math.max(0, volume));
      state.volume = next;
      state.master = next > 0;
      state.restoreVolume = next > 0 ? next : state.gestureVolume > 0 ? state.gestureVolume : MASTER_VOLUME_DEFAULT;
      apply();
      setMasterSoundEnabled(state.master);
      setMasterVolumeState(next);
    },
    [apply],
  );

  const beginVolumeGesture = useCallback(() => {
    if (!engineRef.current) engineRef.current = SoundEngine.create();
    current.current.gestureVolume = current.current.volume;
  }, []);

  const pressGramophone = useCallback(() => {
    const state = current.current;
    if (!state.master) {
      // Silence -> the whole soundscape, music included.
      state.master = true;
      state.music = true;
      setMasterSoundEnabled(true);
    } else {
      state.music = !state.music;
    }
    apply(true);
    setMusicEnabled(state.music);
  }, [apply]);

  const setAmbientMode = useCallback(
    (mode: AmbientMode) => {
      current.current.mode = mode;
      apply();
    },
    [apply],
  );

  // Whether a one-shot may sound right now.
  const oneShotsAllowed = useCallback(() => {
    const { master, mode, isolated } = current.current;
    return master && mode !== "silent" && !isolated;
  }, []);

  const playSfx = useCallback(
    (key: SfxKey) => {
      if (!oneShotsAllowed()) return;
      engineRef.current?.playOneShot(key, AUDIO.sfx[key], AUDIO_VOLUME[key]);
    },
    [oneShotsAllowed],
  );

  // Every click meows: a fresh weighted pick (CAT_MEOW_WEIGHTS, repeats
  // allowed) from the clips that loaded, layered over any still playing, up
  // to CAT_MEOW_MAX_OVERLAP at once.
  const playCatMeow = useCallback(() => {
    const engine = engineRef.current;
    if (!engine || !oneShotsAllowed()) return;
    const ready = AUDIO.catMeows.flatMap((src, index) => (engine.isReady(src) ? [index] : []));
    if (ready.length === 0) return;
    engine.playOneShot("cat", AUDIO.catMeows[pickWeighted(ready)], AUDIO_VOLUME.cat, CAT_MEOW_MAX_OVERLAP);
  }, [oneShotsAllowed]);

  const value = useMemo<AudioContextValue>(
    () => ({
      masterSoundEnabled,
      musicEnabled,
      routeIsolated,
      toggleMaster,
      setMasterVolume,
      beginVolumeGesture,
      pressGramophone,
      setAmbientMode,
      playSfx,
      playCatMeow,
    }),
    [
      masterSoundEnabled,
      musicEnabled,
      routeIsolated,
      toggleMaster,
      setMasterVolume,
      beginVolumeGesture,
      pressGramophone,
      setAmbientMode,
      playSfx,
      playCatMeow,
    ],
  );

  return (
    <AudioCtx.Provider value={value}>
      <MasterVolumeCtx.Provider value={masterVolume}>{children}</MasterVolumeCtx.Provider>
    </AudioCtx.Provider>
  );
}

export function useMasterVolume(): number {
  return useContext(MasterVolumeCtx);
}

export function useAudio(): AudioContextValue {
  const ctx = useContext(AudioCtx);
  if (!ctx) {
    throw new Error("useAudio must be used within an AudioProvider");
  }
  return ctx;
}
