"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ASSETS } from "@/data/assets";
import { getStageSize } from "@/lib/stage";
import { Bird, type BirdSpec } from "./Bird";
import { useCompositionMode } from "./CompositionModeContext";

// Randomised gap between flights, so the sky never feels metronomic.
const MIN_GAP_MS = 5000;
const MAX_GAP_MS = 10000;

// A hard ceiling on concurrent birds. The gap above makes crowding unlikely;
// this makes it impossible, including after a long idle session.
const MAX_LIVE_BIRDS = 6;

// Matches the opacity transition on .bird-sprite, with a little slack.
const FADE_OUT_MS = 350;

const FLIGHT = {
  desktop: { minDuration: 9, maxDuration: 16 },
  portrait: { minDuration: 8, maxDuration: 14 },
};

// Upper/mid sky, as a fraction of stage height -- never down at ground level.
const Y_BAND = { top: 0.04, bottom: 0.42 };

function between(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

// One bird, or a loose group of two or three with staggered entries so they
// read as a flock rather than a rigid formation.
function createFlock(mode: "desktop" | "portrait", firstId: number): BirdSpec[] {
  const { width, height } = getStageSize(mode);
  const { minDuration, maxDuration } = FLIGHT[mode];
  const size = ASSETS.ambientBird.designWidth;

  // Usually a lone bird; sometimes a pair or a trio.
  const groupSize = Math.random() < 0.45 ? 2 + Math.round(Math.random()) : 1;
  const baseY = between(Y_BAND.top, Y_BAND.bottom) * height;
  const baseDuration = between(minDuration, maxDuration);

  return Array.from({ length: groupSize }, (_, offset) => ({
    id: firstId + offset,
    // Enters just off the right edge; the stagger trails the group members
    // further right so they arrive one after another.
    startX: width + size + offset * between(60, 160),
    y: baseY + offset * between(-45, 45),
    // Far enough past the left edge to be fully gone before removal.
    travel: -(width + size * 3),
    rise: between(-60, 60),
    duration: baseDuration,
    scale: between(0.7, 1.3),
  }));
}

interface BirdLayerProps {
  // Whether new flights should be scheduled at all.
  spawning: boolean;
  // The cabin has started opening: fade out what's airborne and stop.
  clearing: boolean;
}

// Ambient birds for the CLOSED exterior only. They are scheduled on a plain
// randomised timer rather than modelled, and each flight is a single CSS
// transform animation (see the `bird-fly` keyframes in globals.css).
//
// Randomness only ever runs inside timer callbacks, never during render, so
// there is nothing for the server and client to disagree about.
export function BirdLayer({ spawning, clearing }: BirdLayerProps) {
  const mode = useCompositionMode();
  const [birds, setBirds] = useState<BirdSpec[]>([]);
  const nextId = useRef(0);

  // Self-rescheduling timeout rather than an interval: each gap is drawn
  // independently, so the rhythm doesn't repeat.
  useEffect(() => {
    if (!spawning) return;

    let timer: ReturnType<typeof setTimeout>;

    function schedule() {
      timer = setTimeout(() => {
        setBirds((live) => {
          if (live.length >= MAX_LIVE_BIRDS) return live;
          const flock = createFlock(mode, nextId.current);
          nextId.current += flock.length;
          return [...live, ...flock];
        });
        schedule();
      }, between(MIN_GAP_MS, MAX_GAP_MS));
    }

    schedule();
    return () => clearTimeout(timer);
  }, [spawning, mode]);

  // The cabin is opening: birds fade (the opacity transition lives on
  // .bird-sprite) and are then dropped, so the OPEN state has none at all.
  useEffect(() => {
    if (!clearing) return;
    const timer = setTimeout(() => setBirds([]), FADE_OUT_MS);
    return () => clearTimeout(timer);
  }, [clearing]);

  const removeBird = useCallback((id: number) => {
    setBirds((live) => live.filter((bird) => bird.id !== id));
  }, []);

  if (birds.length === 0) return null;

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      {birds.map((spec) => (
        <Bird key={spec.id} spec={spec} fading={clearing} onFinished={() => removeBird(spec.id)} />
      ))}
    </div>
  );
}
