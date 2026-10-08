"use client";

import { motion, useAnimationControls } from "motion/react";
import { useEffect, useState } from "react";
import { ArtAsset } from "@/components/art/ArtAsset";
import { useAudio } from "@/components/audio/AudioProvider";
import { useSiteUI } from "@/components/ui/SiteUIProvider";
import { EmailPopover } from "@/components/ui/EmailPopover";
import { ASSETS, type ArtAssetDef } from "@/data/assets";
import { SITE } from "@/data/site";
import { CABIN_INTERIOR_LAYOUT } from "@/lib/layout";
import { ExclamationMark, singleBouncePattern } from "./ExclamationMark";

// Total time the gramophone hint stays on screen before it auto-dismisses.
const GRAMOPHONE_HINT_DURATION_MS = 8000;

// Shift the hint slightly right/down from the gramophone's own anchor point.
const GRAMOPHONE_HINT_SHIFT = { x: 0.1, y: 0.05 };

const HOTSPOT_HOVER = { scale: 1.03 };
const HOTSPOT_TAP = { scale: 0.95 };

// Cabin-local positioning: 0,0 is the top-left of the cabin's own design box.
const {
  gramophone: grammyLayout,
  cat: catLayout,
  uciFlag: flagLayout,
  fireplace: fireplaceLayout,
  contactFrame: contactLayout,
} = CABIN_INTERIOR_LAYOUT;

const gramophone = ASSETS.gramophone;
const gramophoneHintX =
  grammyLayout.x + gramophone.designWidth / 2 - 14 + gramophone.designWidth * GRAMOPHONE_HINT_SHIFT.x;
const gramophoneHintY = grammyLayout.y - 34 + gramophone.designHeight * GRAMOPHONE_HINT_SHIFT.y;

interface InteriorHotspotProps {
  asset: ArtAssetDef;
  x: number;
  y: number;
  label: string;
  isOpen: boolean;
  onClick?: () => void;
}

// Simple hover/press feedback on an otherwise-static illustration piece.
function InteriorHotspot({ asset, x, y, label, isOpen, onClick }: InteriorHotspotProps) {
  return (
    <motion.button
      type="button"
      aria-label={label}
      onClick={onClick}
      disabled={!isOpen}
      whileHover={isOpen ? HOTSPOT_HOVER : undefined}
      whileTap={isOpen ? HOTSPOT_TAP : undefined}
      className={`absolute border-0 bg-transparent p-0 ${isOpen ? "pointer-events-auto" : "pointer-events-none"}`}
      style={{ left: x, top: y, width: asset.designWidth, height: asset.designHeight }}
    >
      <ArtAsset asset={asset} />
    </motion.button>
  );
}

interface GramophoneHotspotProps {
  isOpen: boolean;
  isPlaying: boolean;
  onClick: () => void;
}

// Enters a subtle looping wobble while music is active; otherwise static.
function GramophoneHotspot({ isOpen, isPlaying, onClick }: GramophoneHotspotProps) {
  return (
    <motion.button
      type="button"
      aria-label={isPlaying ? "Stop the gramophone" : "Play the gramophone"}
      aria-pressed={isPlaying}
      onClick={onClick}
      disabled={!isOpen}
      whileHover={isOpen ? HOTSPOT_HOVER : undefined}
      whileTap={isOpen ? HOTSPOT_TAP : undefined}
      className={`absolute border-0 bg-transparent p-0 ${isOpen ? "pointer-events-auto" : "pointer-events-none"}`}
      style={{
        left: grammyLayout.x,
        top: grammyLayout.y,
        width: gramophone.designWidth,
        height: gramophone.designHeight,
      }}
    >
      <motion.div
        animate={isPlaying ? { rotate: [0, -2, 2, 0] } : { rotate: 0 }}
        transition={isPlaying ? { duration: 1.4, repeat: Infinity, ease: "easeInOut" } : { duration: 0.2 }}
      >
        <ArtAsset asset={gramophone} />
      </motion.div>
    </motion.button>
  );
}

// Click always gives a quick squash/scale reaction; a meow only plays if
// foley is enabled (and only if at least one meow source is configured).
function CatHotspot({ isOpen }: { isOpen: boolean }) {
  const { playRandomMeow } = useAudio();
  const controls = useAnimationControls();

  function handleClick() {
    controls.start({
      scaleX: [1, 1.18, 0.92, 1],
      scaleY: [1, 0.85, 1.05, 1],
      transition: { duration: 0.35, ease: "easeOut" },
    });
    playRandomMeow();
  }

  return (
    <motion.button
      type="button"
      aria-label="Cat"
      onClick={handleClick}
      disabled={!isOpen}
      whileHover={isOpen ? HOTSPOT_HOVER : undefined}
      whileTap={isOpen ? HOTSPOT_TAP : undefined}
      className={`absolute border-0 bg-transparent p-0 ${isOpen ? "pointer-events-auto" : "pointer-events-none"}`}
      style={{ left: catLayout.x, top: catLayout.y, width: ASSETS.cat.designWidth, height: ASSETS.cat.designHeight }}
    >
      <motion.div animate={controls}>
        <ArtAsset asset={ASSETS.cat} />
      </motion.div>
    </motion.button>
  );
}

interface ContactButtonProps {
  label: string;
  glyph: string;
  disabled: boolean;
  onClick?: () => void;
}

function ContactButton({ label, glyph, disabled, onClick }: ContactButtonProps) {
  return (
    <motion.button
      type="button"
      aria-label={label}
      aria-disabled={disabled}
      disabled={disabled}
      onClick={onClick}
      whileHover={!disabled ? HOTSPOT_HOVER : undefined}
      whileTap={!disabled ? HOTSPOT_TAP : undefined}
      className="flex flex-col items-center gap-0.5 rounded px-2 py-1 text-[10px] font-medium text-paper transition-colors hover:bg-paper/10 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
    >
      <span aria-hidden="true" className="text-sm leading-none">
        {glyph}
      </span>
      <span>{label}</span>
    </motion.button>
  );
}

interface CabinInteriorProps {
  isOpen: boolean;
}

// The wireframe composition revealed once the front wall fades away. Layout
// is cabin-local (0,0 = top-left of the cabin's design box) and can be moved
// by updating CABIN_INTERIOR_LAYOUT in src/lib/layout.ts -- the same values
// apply in both desktop and portrait composition modes. Geometry will change
// once real art defines the actual room shape. A decorative picture frame
// will eventually sit on the left wall, baked directly into the cabin
// artwork rather than built as its own component.
export function CabinInterior({ isOpen }: CabinInteriorProps) {
  // Cleared immediately on gramophone click, or after the timer -- whichever
  // comes first. Never restored again during this mounted cabin session.
  const [dismissed, setDismissed] = useState(false);
  const { toggleMusic, musicPlaying, playSfx } = useAudio();
  const { openPanel, emailPopoverOpen, toggleEmailPopover, closeEmailPopover } = useSiteUI();

  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => setDismissed(true), GRAMOPHONE_HINT_DURATION_MS);
    return () => clearTimeout(timer);
  }, [isOpen]);

  const showGramophoneHint = isOpen && !dismissed;

  function handleGramophoneClick() {
    setDismissed(true);
    toggleMusic();
  }

  const emailAnchorX = contactLayout.x + ASSETS.contactFrame.designWidth / 2;
  const emailAnchorY = contactLayout.y - 10;

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
        <div className="absolute inset-0 flex items-center justify-center gap-8">
          <ContactButton
            label="Email"
            glyph="✉"
            disabled={!isOpen}
            onClick={() => {
              playSfx("click");
              toggleEmailPopover();
            }}
          />
          <ContactButton
            label="LinkedIn"
            glyph="in"
            // TODO(site.ts): enable once SITE.linkedinUrl is filled in.
            disabled={!isOpen || !SITE.linkedinUrl}
            onClick={() => {
              if (!SITE.linkedinUrl) return;
              playSfx("click");
              window.open(SITE.linkedinUrl, "_blank", "noopener,noreferrer");
            }}
          />
          <ContactButton
            label="About"
            glyph="i"
            disabled={!isOpen}
            onClick={() => {
              playSfx("click");
              openPanel("about");
            }}
          />
        </div>

        <EmailPopover
          x={emailAnchorX}
          y={emailAnchorY}
          open={isOpen && emailPopoverOpen}
          onClose={closeEmailPopover}
        />
      </div>

      <InteriorHotspot
        asset={ASSETS.uciFlag}
        x={flagLayout.x}
        y={flagLayout.y}
        label="UCI flag"
        isOpen={isOpen}
        onClick={() => {
          playSfx("click");
          openPanel("education");
        }}
      />

      <GramophoneHotspot isOpen={isOpen} isPlaying={musicPlaying} onClick={handleGramophoneClick} />

      <CatHotspot isOpen={isOpen} />

      {showGramophoneHint && (
        <ExclamationMark
          x={gramophoneHintX}
          y={gramophoneHintY}
          ariaLabel="Hint: try the gramophone"
          bouncePattern={singleBouncePattern}
        />
      )}
    </div>
  );
}
