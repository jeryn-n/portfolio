"use client";

import { useEffect, useState } from "react";
import { ArtAsset } from "@/components/art/ArtAsset";
import { ASSETS, type ArtAssetDef } from "@/data/assets";
import { CABIN_INTERIOR_LAYOUT } from "@/lib/layout";
import { ExclamationMark } from "./ExclamationMark";

const GRAMOPHONE_HINT_DURATION_MS = 5000;

// Cabin-local positioning: 0,0 is the top-left of the 760×570 cabin box.
const { gramophone: grammyLayout, cat: catLayout, uciFlag: flagLayout, fireplace: fireplaceLayout, contactFrame: contactLayout } = CABIN_INTERIOR_LAYOUT;

const gramophoneHintX = grammyLayout.x + ASSETS.gramophone.designWidth / 2 - 14;
const gramophoneHintY = grammyLayout.y - 34;

const CONTACT_ITEMS = [
  { label: "Email", glyph: "✉" },
  { label: "LinkedIn", glyph: "in" },
  { label: "About", glyph: "i" },
];

interface InteriorHotspotProps {
  asset: ArtAssetDef;
  x: number;
  y: number;
  label: string;
  isOpen: boolean;
}

// Cat, gramophone, and the UCI flag will each get a real action in a future
// iteration; for now they're just wired up as inert, labeled, hoverable targets.
function InteriorHotspot({ asset, x, y, label, isOpen }: InteriorHotspotProps) {
  return (
    <button
      type="button"
      aria-label={label}
      className={`absolute border-0 bg-transparent p-0 ${
        isOpen ? "pointer-events-auto transition-transform duration-200 hover:scale-105" : "pointer-events-none"
      }`}
      style={{ left: x, top: y, width: asset.designWidth, height: asset.designHeight }}
    >
      <ArtAsset asset={asset} />
    </button>
  );
}

interface CabinInteriorProps {
  isOpen: boolean;
}

// The wireframe composition revealed once the front wall fades away. Layout
// is cabin-local (0,0 = top-left of 760×570 box) and can be easily moved by
// updating CABIN_INTERIOR_LAYOUT in src/lib/layout.ts. Geometry will change
// once real art defines the actual room shape.
export function CabinInterior({ isOpen }: CabinInteriorProps) {
  // A future gramophone click can call setDismissed(true) directly to clear
  // the hint early instead of waiting out the timer.
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => setDismissed(true), GRAMOPHONE_HINT_DURATION_MS);
    return () => clearTimeout(timer);
  }, [isOpen]);

  const showGramophoneHint = isOpen && !dismissed;

  return (
    <div className="absolute inset-0">
      <ArtAsset asset={ASSETS.cabinInterior} />

      <div
        aria-hidden="true"
        className="absolute flex items-center justify-center border border-dashed border-wireframe-border bg-wireframe-fill text-[10px] font-semibold uppercase tracking-wide text-paper"
        style={{
          left: fireplaceLayout.x,
          top: fireplaceLayout.y,
          width: fireplaceLayout.width,
          height: fireplaceLayout.height,
        }}
      >
        Fireplace
      </div>

      <div
        className="absolute"
        style={{
          left: contactLayout.x,
          top: contactLayout.y,
          width: ASSETS.contactFrame.designWidth,
          height: ASSETS.contactFrame.designHeight,
        }}
      >
        <ArtAsset asset={ASSETS.contactFrame} />
        <div className="absolute inset-0 flex items-center justify-center gap-4">
          {CONTACT_ITEMS.map((item) => (
            <button
              key={item.label}
              type="button"
              aria-label={item.label}
              className={`flex flex-col items-center gap-0.5 rounded px-2 py-1 text-[10px] font-medium text-paper ${
                isOpen ? "pointer-events-auto transition-colors hover:bg-paper/10" : "pointer-events-none"
              }`}
            >
              <span aria-hidden="true" className="text-sm leading-none">
                {item.glyph}
              </span>
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      <InteriorHotspot
        asset={ASSETS.uciFlag}
        x={flagLayout.x}
        y={flagLayout.y}
        label="UCI flag"
        isOpen={isOpen}
      />
      <InteriorHotspot
        asset={ASSETS.gramophone}
        x={grammyLayout.x}
        y={grammyLayout.y}
        label="Gramophone"
        isOpen={isOpen}
      />
      <InteriorHotspot asset={ASSETS.cat} x={catLayout.x} y={catLayout.y} label="Cat" isOpen={isOpen} />

      {showGramophoneHint && (
        <ExclamationMark
          x={gramophoneHintX}
          y={gramophoneHintY}
          ariaLabel="Hint: try the gramophone"
        />
      )}
    </div>
  );
}
