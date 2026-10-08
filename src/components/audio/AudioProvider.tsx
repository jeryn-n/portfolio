"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { AUDIO, type SfxKey } from "@/data/audio";

export type AmbientMode = "exterior" | "interior";

interface AudioContextValue {
  foleyEnabled: boolean;
  musicPlaying: boolean;
  // Master bottom-right button: OFF -> foley only -> everything off.
  toggleMaster: () => void;
  // Gramophone: independent play/stop, can enable foley on its own.
  toggleMusic: () => void;
  setAmbientMode: (mode: AmbientMode) => void;
  playSfx: (key: SfxKey) => void;
  playRandomMeow: () => void;
}

const AudioCtx = createContext<AudioContextValue | null>(null);

function safePlay(audio: HTMLAudioElement) {
  audio.play().catch(() => {
    // Autoplay/permission rejections are expected and safe to ignore.
  });
}

// Plain HTMLAudioElement-based sound manager -- no Web Audio graph needed for
// v1. Every source is nullable (see src/data/audio.ts); every operation here
// safely no-ops when a source is missing so the UI never depends on real
// audio files existing yet.
export function AudioProvider({ children }: { children: ReactNode }) {
  const [foleyEnabled, setFoleyEnabled] = useState(false);
  const [musicPlaying, setMusicPlaying] = useState(false);
  const [ambientMode, setAmbientMode] = useState<AmbientMode>("exterior");

  const musicRef = useRef<HTMLAudioElement | null>(null);
  const ambienceRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (AUDIO.music.src) {
      const audio = new Audio(AUDIO.music.src);
      audio.loop = true;
      musicRef.current = audio;
    }
    const ambience = new Audio();
    ambience.loop = true;
    ambienceRef.current = ambience;

    return () => {
      musicRef.current?.pause();
      ambienceRef.current?.pause();
      musicRef.current = null;
      ambienceRef.current = null;
    };
  }, []);

  useEffect(() => {
    const music = musicRef.current;
    if (!music) return;
    if (musicPlaying) {
      music.currentTime = 0;
      safePlay(music);
    } else {
      music.pause();
      music.currentTime = 0;
    }
  }, [musicPlaying]);

  // Ambience follows foley-enabled state and the current exterior/interior
  // mode. Restarts from the beginning whenever either changes.
  useEffect(() => {
    const ambience = ambienceRef.current;
    if (!ambience) return;
    const src = AUDIO.ambience[ambientMode].src;
    ambience.pause();
    if (!foleyEnabled || !src) return;
    ambience.src = src;
    ambience.currentTime = 0;
    safePlay(ambience);
  }, [foleyEnabled, ambientMode]);

  const toggleMaster = useCallback(() => {
    setFoleyEnabled((prev) => {
      if (!prev) return true;
      setMusicPlaying(false);
      return false;
    });
  }, []);

  const toggleMusic = useCallback(() => {
    setMusicPlaying((prev) => {
      if (prev) return false;
      setFoleyEnabled(true);
      return true;
    });
  }, []);

  const playSfx = useCallback(
    (key: SfxKey) => {
      if (!foleyEnabled) return;
      const src = AUDIO.sfx[key].src;
      if (!src) return;
      safePlay(new Audio(src));
    },
    [foleyEnabled],
  );

  const playRandomMeow = useCallback(() => {
    if (!foleyEnabled) return;
    const meows = AUDIO.catMeows;
    if (meows.length === 0) return;
    const src = meows[Math.floor(Math.random() * meows.length)];
    safePlay(new Audio(src));
  }, [foleyEnabled]);

  const value: AudioContextValue = {
    foleyEnabled,
    musicPlaying,
    toggleMaster,
    toggleMusic,
    setAmbientMode,
    playSfx,
    playRandomMeow,
  };

  return <AudioCtx.Provider value={value}>{children}</AudioCtx.Provider>;
}

export function useAudio(): AudioContextValue {
  const ctx = useContext(AudioCtx);
  if (!ctx) {
    throw new Error("useAudio must be used within an AudioProvider");
  }
  return ctx;
}
