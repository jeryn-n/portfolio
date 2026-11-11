"use client";

import { AnimatePresence, motion, useAnimationControls } from "motion/react";
import { useEffect, useState } from "react";
import { ArtAsset } from "@/components/art/ArtAsset";
import { useAudio } from "@/components/audio/AudioProvider";
import { useSiteUI } from "@/components/ui/SiteUIProvider";
import { EmailPopover } from "@/components/ui/EmailPopover";
import { ASSETS, type ArtAssetDef } from "@/data/assets";
import { SITE } from "@/data/site";
import { CABIN_INTERIOR_LAYOUT, CABIN_INTERIOR_PROP_SCALE, CABIN_OBJECTS, GRAMOPHONE_HINT } from "@/lib/layout";
import { ExclamationMark, singleBouncePattern } from "./ExclamationMark";
import { FireGlow, RegisteredCabinArt, RegisteredCabinObject } from "./RegisteredCabinObject";

// The props are now the registered overlays below (or drawn into the
// interior art), so the old separate prop sprites -- fireplace placeholder,
// contact frame (+ email popover), UCI flag, gramophone (+ its music) and cat
// (+ meows) -- and all of their interactions are switched off. Their code,
// assets and placements stay; flip this back to bring them back (alongside
// the overlays, they'd be drawn twice).
const SPRITE_PROPS_ENABLED = false;

// The sign's name is this many times taller than the face draws it.
const NAME_STRETCH = 1.39;
// Sign name: its size, and how far it sits below the middle of the text box
// (cabin px). The title beneath it stays put.
const NAME_FONT_SIZE = 17;
const NAME_DROP = 7;

// Whether the gramophone's exclamation shows at all. Off for now (undecided);
// the mark, its placement (GRAMOPHONE_HINT) and its timing all stay.
const GRAMOPHONE_HINT_ENABLED = false;

// How long the gramophone's exclamation stays up once the cabin is open,
// unless the gramophone is clicked first.
const GRAMOPHONE_HINT_DURATION_MS = 19000;

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

const signText = CABIN_OBJECTS.sign.textBox;

// Props render a little under their design size (an explicit width/height,
// not a transform, so the hover/tap scale animations stay untouched).
function propSize(asset: ArtAssetDef) {
  return {
    width: asset.designWidth * CABIN_INTERIOR_PROP_SCALE,
    height: asset.designHeight * CABIN_INTERIOR_PROP_SCALE,
  };
}

const gramophone = ASSETS.gramophone;
const gramophoneSize = propSize(gramophone);
const contactSize = propSize(ASSETS.contactFrame);

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
      style={{ left: x, top: y, ...propSize(asset) }}
    >
      <ArtAsset asset={asset} style={propSize(asset)} />
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
      style={{ left: grammyLayout.x, top: grammyLayout.y, ...gramophoneSize }}
    >
      <motion.div
        animate={isPlaying ? { rotate: [0, -2, 2, 0] } : { rotate: 0 }}
        transition={isPlaying ? { duration: 1.4, repeat: Infinity, ease: "easeInOut" } : { duration: 0.2 }}
      >
        <ArtAsset asset={gramophone} style={gramophoneSize} />
      </motion.div>
    </motion.button>
  );
}

// Click always gives a quick squash/scale reaction; a meow only plays if
// sound is on.
function CatHotspot({ isOpen }: { isOpen: boolean }) {
  const { playCatMeow } = useAudio();
  const controls = useAnimationControls();

  function handleClick() {
    controls.start({
      scaleX: [1, 1.18, 0.92, 1],
      scaleY: [1, 0.85, 1.05, 1],
      transition: { duration: 0.35, ease: "easeOut" },
    });
    playCatMeow();
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
      style={{ left: catLayout.x, top: catLayout.y, ...propSize(ASSETS.cat) }}
    >
      <motion.div animate={controls}>
        <ArtAsset asset={ASSETS.cat} style={propSize(ASSETS.cat)} />
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

// The open cabin: the base interior artwork, its registered object overlays
// (fire, lamp, gramophone, sign, picture-frame icons, banner, cat), and real
// UI laid over the parts that are interactive. Layout is cabin-local (0,0 =
// top-left of the cabin's design box) -- the same values apply in both
// desktop and portrait composition modes -- and comes from CABIN_OBJECTS in
// src/lib/layout.ts.
//
// Everything is inert until the cabin is fully open: during the reveal the
// interior is already visible under the dissolving exterior, but nothing
// here takes a click, a hover or keyboard focus yet.
export function CabinInterior({ isOpen }: CabinInteriorProps) {
  // Cleared immediately on gramophone click, or after the timer -- whichever
  // comes first. Never restored again during this mounted cabin session.
  const [dismissed, setDismissed] = useState(false);
  // The lamp starts lit. Its look never depends on sound; only the click
  // does.
  const [lampOn, setLampOn] = useState(true);
  const { pressGramophone, masterSoundEnabled, musicEnabled, playSfx, playCatMeow } = useAudio();
  const { openPanel, emailPopoverOpen, toggleEmailPopover, closeEmailPopover } = useSiteUI();
  const musicPlaying = masterSoundEnabled && musicEnabled;

  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => setDismissed(true), GRAMOPHONE_HINT_DURATION_MS);
    return () => clearTimeout(timer);
  }, [isOpen]);

  const showGramophoneHint = GRAMOPHONE_HINT_ENABLED && isOpen && !dismissed;

  // Puts the hint away and plays or stops the music -- or, with sound off,
  // switches all of it on (see AudioProvider).
  function handleGramophoneClick() {
    setDismissed(true);
    pressGramophone();
  }

  function toggleLamp() {
    setLampOn((on) => !on);
    playSfx("lamp");
  }

  function openAbout() {
    openPanel("about");
  }

  function openEducation() {
    openPanel("education");
  }

  const emailAnchorX = contactLayout.x + contactSize.width / 2;
  const emailAnchorY = contactLayout.y - 10;

  return (
    <div className="absolute inset-0">
      <ArtAsset asset={ASSETS.cabinInterior} />

      {/* Back to front -- which is also the Tab order of the focusable ones.
          Objects that don't overlap can go in any order, so the sign
          (About), the picture frame and the banner (Education) are in
          reading order; the gramophone is in front of the lamp's box where
          they meet, and the cat in front of the banner beside it. */}
      <FireGlow asset={ASSETS.cabinFireGlow} />
      <RegisteredCabinArt asset={ASSETS.cabinFire} />

      {/* The floor lamp switches on and off whether or not sound is on; the
          click sound is extra. */}
      <RegisteredCabinObject
        asset={ASSETS.cabinLampOn}
        alternateAsset={ASSETS.cabinLampOff}
        showAlternate={!lampOn}
        bounds={CABIN_OBJECTS.lamp}
        active={isOpen}
        label={lampOn ? "Turn lamp off" : "Turn lamp on"}
        onClick={toggleLamp}
      />

      <RegisteredCabinObject
        asset={ASSETS.cabinGramophone}
        bounds={CABIN_OBJECTS.gramophone}
        active={isOpen}
        label={musicPlaying ? "Stop the gramophone" : "Play the gramophone"}
        onClick={handleGramophoneClick}
      />

      {/* The sign hanging from the top beam opens About. The name and title
          are real text on its board, inside the sign's own window, so they
          grow with it as one object. */}
      <RegisteredCabinObject asset={ASSETS.cabinSign} bounds={CABIN_OBJECTS.sign} active={isOpen} onClick={openAbout}>
        <span
          className="absolute flex select-none flex-col items-center justify-center text-white"
          style={{ left: signText.x, top: signText.y, width: signText.width, height: signText.height }}
        >
          {/* A hard drop shadow, like the art's own shading -- no glow. The
              name is stretched taller (NAME_STRETCH) rather than wider, since
              it already spans the board; a transform doesn't move layout, so
              the margin below makes room for the extra height. */}
          <span
            className="inline-block whitespace-nowrap font-pixel-label uppercase leading-none [text-shadow:0_2px_0_rgb(52_24_8/0.9)]"
            style={{
              fontSize: NAME_FONT_SIZE,
              letterSpacing: "0.03em",
              paddingLeft: "0.03em",
              transform: `translateY(${NAME_DROP}px) scaleY(${NAME_STRETCH})`,
              marginBottom: NAME_FONT_SIZE * (NAME_STRETCH - 1),
            }}
          >
            {SITE.name}
          </span>
          <span
            className="mt-[6px] whitespace-nowrap font-pixel-label uppercase leading-none [text-shadow:0_1px_0_rgb(52_24_8/0.85)]"
            style={{ fontSize: 10, letterSpacing: "0.08em", paddingLeft: "0.08em" }}
          >
            {SITE.title}
          </span>
        </span>
        <span className="sr-only"> — About me</span>
      </RegisteredCabinObject>

      {/* The picture frame above the fireplace: LinkedIn on the left, About
          Me on the right, each its own overlay, hover and click. Either
          falls back to its half of the old combined icons.png if its own
          file is missing. */}
      <RegisteredCabinObject
        asset={ASSETS.cabinLinkedIn}
        fallbackAsset={ASSETS.cabinIcons}
        bounds={CABIN_OBJECTS.linkedin}
        active={isOpen}
        href={SITE.linkedinUrl}
        label="Open LinkedIn profile (opens in a new tab)"
      />
      <RegisteredCabinObject
        asset={ASSETS.cabinAboutIcon}
        fallbackAsset={ASSETS.cabinIcons}
        bounds={CABIN_OBJECTS.about}
        active={isOpen}
        label="Open About Me"
        onClick={openAbout}
      />

      {/* The UC Irvine banner on the right wall opens Education. */}
      <RegisteredCabinObject
        asset={ASSETS.cabinBanner}
        bounds={CABIN_OBJECTS.banner}
        active={isOpen}
        label="UC Irvine banner — Education"
        onClick={openEducation}
      />

      {/* A click or tap makes the cat hop once, and meow if sound is on. */}
      <RegisteredCabinObject
        asset={ASSETS.cabinCat}
        bounds={CABIN_OBJECTS.cat}
        active={isOpen}
        label="Pet the cat"
        onClick={playCatMeow}
        bounce
      />

      {SPRITE_PROPS_ENABLED && (
        <>
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

          <div className="absolute" style={{ left: contactLayout.x, top: contactLayout.y, ...contactSize }}>
            <ArtAsset asset={ASSETS.contactFrame} style={contactSize} />
            <div className="absolute inset-0 flex items-center justify-center gap-8">
              <ContactButton
                label="Email"
                glyph="✉"
                disabled={!isOpen}
                onClick={toggleEmailPopover}
              />
              <ContactButton
                label="LinkedIn"
                glyph="in"
                disabled={!isOpen}
                onClick={() => window.open(SITE.linkedinUrl, "_blank", "noopener,noreferrer")}
              />
              <ContactButton label="About" glyph="i" disabled={!isOpen} onClick={openAbout} />
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
            onClick={openEducation}
          />

          <GramophoneHotspot isOpen={isOpen} isPlaying={musicPlaying} onClick={handleGramophoneClick} />

          <CatHotspot isOpen={isOpen} />
        </>
      )}

      {/* Fades out when its time is up or the gramophone is clicked. */}
      <AnimatePresence>
        {showGramophoneHint && (
          <ExclamationMark
            x={GRAMOPHONE_HINT.x}
            y={GRAMOPHONE_HINT.y}
            ariaLabel="Hint: try the gramophone"
            bouncePattern={singleBouncePattern}
            scale={GRAMOPHONE_HINT.scale}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
