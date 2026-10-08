"use client";

import type { CSSProperties } from "react";
import { ArtAsset } from "@/components/art/ArtAsset";
import { ASSETS } from "@/data/assets";

export interface BirdSpec {
  id: number;
  // Stage coordinates: where this bird enters, and how far left it travels.
  startX: number;
  y: number;
  travel: number;
  rise: number;
  duration: number;
  scale: number;
}

interface BirdProps {
  spec: BirdSpec;
  // Fades this bird out quickly -- used when the cabin starts opening.
  fading: boolean;
  onFinished: () => void;
}

// One bird is its own component rather than a sprite painted into a shared
// particle layer. That is a structural choice for later: the planned
// click-to-fall gag needs a real element with its own state and hit target,
// and retrofitting that onto a pooled background system would mean
// dismantling it. For now the layer above is pointer-events: none and the
// bird is decorative, so it announces nothing.
//
// Wing animation is deliberately absent -- a single travelling sprite is
// enough until real multi-frame art exists.
export function Bird({ spec, fading, onFinished }: BirdProps) {
  return (
    <div
      className="bird-sprite"
      // The element's own transform belongs to the `bird-fly` keyframes, so
      // the per-bird scale goes on the sprite inside it.
      style={
        {
          left: spec.startX,
          top: spec.y,
          opacity: fading ? 0 : 1,
          animationDuration: `${spec.duration}s`,
          "--bird-travel": `${spec.travel}px`,
          "--bird-rise": `${spec.rise}px`,
        } as CSSProperties
      }
      onAnimationEnd={onFinished}
    >
      <ArtAsset
        asset={ASSETS.ambientBird}
        style={{ transform: `scale(${spec.scale})`, transformOrigin: "50% 50%" }}
      />
    </div>
  );
}
