"use client";

import { AnimatePresence, motion, type Variants } from "motion/react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type PointerEvent } from "react";
import { useAudio } from "@/components/audio/AudioProvider";
import { useWorldScene } from "@/components/scenes/WorldSceneContext";
import { useSiteUI } from "@/components/ui/SiteUIProvider";
import {
  getCategorySceneHref,
  getEntryHref,
  getSiblingEntries,
  type MediaType,
  type PortfolioEntry,
} from "@/data/portfolio";
import { DetailMedia } from "./DetailMedia";
import { SkillTile } from "./SkillTile";

// Internal carousel: horizontal travel for the media, cross-fade for the
// text. Conservative swipe threshold so a vertical page scroll on mobile is
// never mistaken for a slide change.
const SLIDE_DURATION = 0.3;
const SLIDE_EASE: [number, number, number, number] = [0.4, 0, 0.2, 1];
const TEXT_FADE_DURATION = 0.15;
const SWIPE_THRESHOLD = 60;

// Custom is the travel direction: +1 advancing (old exits left, new enters
// from the right), -1 going back. No overshoot anywhere.
const mediaVariants: Variants = {
  enter: (direction: number) => ({ x: direction > 0 ? "100%" : "-100%" }),
  center: { x: "0%" },
  exit: (direction: number) => ({ x: direction > 0 ? "-100%" : "100%" }),
};

interface Slide {
  key: string;
  largeText: string;
  description: string;
  image: string;
  imagePosition?: string;
  mediaType?: MediaType;
  altText: string;
}

// Slide 0 is always the entry overview; slides 1..N are its features. An
// entry with no features therefore has exactly one carousel state.
function buildSlides(entry: PortfolioEntry): Slide[] {
  return [
    {
      key: "overview",
      largeText: entry.tagline,
      description: entry.description,
      image: entry.displayImage,
      imagePosition: entry.displayImagePosition,
      altText: entry.title,
    },
    ...entry.features.map((feature, index) => ({
      key: `feature-${index}`,
      largeText: feature.tagline ?? feature.title,
      description: feature.description,
      image: feature.image,
      imagePosition: feature.imagePosition,
      mediaType: feature.mediaType,
      altText: `${entry.title} — ${feature.title}`,
    })),
  ];
}

const CONTROL_CLASS =
  "inline-flex items-center justify-center border-2 border-ink-soft bg-paper font-bold uppercase tracking-wide text-ink-soft transition-colors hover:bg-ink-soft hover:text-paper focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink-soft disabled:pointer-events-none disabled:opacity-0";

// The one detail template behind all six entry routes -- Projects and
// Experience differ only in their data and their wording, never in layout.
//
// Scrolling: the page is its own scroll container (the document body stays
// overflow-hidden for the viewport-locked world). Desktop is sized to fit
// 1440x900 and up in a single viewport, with the media capped by viewport
// height rather than width so the whole template stays above the fold;
// anything that doesn't fit simply scrolls rather than clipping.
export function PortfolioDetailPage({ entry }: { entry: PortfolioEntry }) {
  const slides = buildSlides(entry);
  const total = slides.length;

  // Always starts on the overview. Each route renders this component with a
  // slug-based key, so arriving at a new entry remounts it and no previous
  // slide position is remembered.
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const slide = slides[index];

  const { setAmbientMode } = useAudio();
  const { goTo } = useWorldScene();
  const { isBlockingOverlayOpen, menuOpen } = useSiteUI();
  const { previous, next } = getSiblingEntries(entry);

  const isProject = entry.category === "project";
  const entryNoun = isProject ? "Project" : "Experience";
  const links = entry.externalLinks ?? [];

  const step = useCallback(
    (delta: 1 | -1) => {
      if (total <= 1) return;
      setDirection(delta);
      setIndex((current) => (current + delta + total) % total);
    },
    [total],
  );

  // Detail routes contribute no environmental ambience. Music and the
  // foley-enabled flag are untouched -- AudioProvider lives above the route
  // tree, so anything already playing keeps playing. Returning to the
  // homepage lets CabinScene restore exterior/interior on its own.
  useEffect(() => {
    setAmbientMode("none");
  }, [setAmbientMode]);

  // ArrowLeft/ArrowRight drive the carousel only. Skipped while a modal
  // panel or the menu owns input, and never hijacked from a form field.
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (isBlockingOverlayOpen || menuOpen) return;
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;

      const target = event.target as HTMLElement | null;
      const tag = target?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target?.isContentEditable) return;

      event.preventDefault();
      step(event.key === "ArrowRight" ? 1 : -1);
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [step, isBlockingOverlayOpen, menuOpen]);

  // Horizontal swipe on the media region. Manual only, horizontal-dominant,
  // and it never calls preventDefault, so native vertical scrolling through
  // the media is completely unaffected.
  const swipeOrigin = useRef<{ x: number; y: number } | null>(null);

  function handleMediaPointerDown(event: PointerEvent<HTMLDivElement>) {
    swipeOrigin.current = { x: event.clientX, y: event.clientY };
  }

  function handleMediaPointerUp(event: PointerEvent<HTMLDivElement>) {
    const origin = swipeOrigin.current;
    swipeOrigin.current = null;
    if (!origin) return;

    const dx = event.clientX - origin.x;
    const dy = event.clientY - origin.y;
    if (Math.abs(dx) < SWIPE_THRESHOLD) return;
    if (Math.abs(dx) <= Math.abs(dy)) return;

    step(dx < 0 ? 1 : -1);
  }

  function handleMediaPointerCancel() {
    swipeOrigin.current = null;
  }

  // Leaving for the homepage: name the destination scene outright so the
  // world mounts already on it. No fake travel animation is replayed just to
  // exit, and arrival doesn't depend on the hash being read back in time.
  function prepareSceneExit() {
    goTo(isProject ? "projects" : "experience", { instant: true });
  }

  return (
    <div className="h-dvh w-full overflow-x-hidden overflow-y-auto bg-paper text-ink">
      <motion.main
        className="mx-auto flex min-h-dvh w-full max-w-[1120px] flex-col gap-4 px-4 pb-8 pt-16 sm:gap-5 sm:px-8"
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.25, ease: SLIDE_EASE }}
      >
        {/* Overall entry title -- fixed for the whole route, never affected
            by carousel slide changes. Top padding keeps it clear of the
            global menu, which is fixed in the viewport's upper-left. */}
        <header className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-ink-soft/70">{entryNoun}</p>
            <h1 className="text-xl font-bold leading-tight sm:text-2xl">{entry.title}</h1>
          </div>
          <Link
            href={getCategorySceneHref(entry.category)}
            onClick={prepareSceneExit}
            className={`${CONTROL_CLASS} shrink-0 px-3 py-1.5 text-[11px] sm:text-xs`}
          >
            Exit ✕
          </Link>
        </header>

        {/* Media + internal carousel arrows. The arrow columns always render
            so the media's width never shifts between entries with different
            feature counts; with a single slide they're simply disabled. */}
        <div className="flex w-full items-center justify-center gap-2 sm:gap-4">
          <button
            type="button"
            onClick={() => step(-1)}
            disabled={total <= 1}
            aria-label={`Show previous media (slide ${index + 1} of ${total})`}
            className={`${CONTROL_CLASS} h-12 w-8 shrink-0 text-xl sm:h-16 sm:w-12 sm:text-2xl`}
          >
            <span aria-hidden="true">‹</span>
          </button>

          {/* The media is sized against VIEWPORT HEIGHT rather than width:
              capping max-width at 70dvh puts its height at ~39dvh, which is
              what keeps the whole template (text, CTAs, skills, entry nav)
              inside one viewport at 1440x900 even for the tallest entry --
              six skills plus a CTA row. 16:9 survives because only the width
              is constrained, so the height still derives from it. */}
          <div
            className="relative aspect-video w-full max-w-[70dvh] overflow-hidden rounded-lg border-4 border-ink-soft bg-wireframe-fill"
            onPointerDown={handleMediaPointerDown}
            onPointerUp={handleMediaPointerUp}
            onPointerCancel={handleMediaPointerCancel}
          >
            <AnimatePresence initial={false} custom={direction}>
              <motion.div
                key={slide.key}
                className="absolute inset-0"
                custom={direction}
                variants={mediaVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: SLIDE_DURATION, ease: SLIDE_EASE }}
              >
                <DetailMedia
                  src={slide.image}
                  alt={slide.altText}
                  objectPosition={slide.imagePosition}
                  mediaType={slide.mediaType}
                />
              </motion.div>
            </AnimatePresence>
          </div>

          <button
            type="button"
            onClick={() => step(1)}
            disabled={total <= 1}
            aria-label={`Show next media (slide ${index + 1} of ${total})`}
            className={`${CONTROL_CLASS} h-12 w-8 shrink-0 text-xl sm:h-16 sm:w-12 sm:text-2xl`}
          >
            <span aria-hidden="true">›</span>
          </button>
        </div>

        {/* Slide text: cross-fades in place and never slides horizontally.
            The min-heights keep the page from twitching as values swap. */}
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={slide.key}
            className="flex flex-col gap-2 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: TEXT_FADE_DURATION, ease: "easeOut" }}
          >
            <h2 className="min-h-[2rem] text-lg font-bold leading-snug sm:min-h-[2.25rem] sm:text-2xl">
              {slide.largeText}
            </h2>
            <p className="mx-auto min-h-[3.5rem] max-w-[72ch] text-sm leading-relaxed text-ink-soft sm:text-base">
              {slide.description}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* Optional external CTAs: between description and skills, and the
            whole region is absent when an entry has no links. */}
        {links.length > 0 && (
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
            {links.map((link) => (
              <a
                key={`${link.label}-${link.href}`}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className={`${CONTROL_CLASS} px-4 py-2 text-[11px] sm:text-xs`}
              >
                {link.label} ↗
              </a>
            ))}
          </div>
        )}

        <section aria-label="Skills" className="flex flex-col gap-2">
          <h2 className="text-center text-[10px] font-bold uppercase tracking-[0.2em] text-ink-soft/70">Skills</h2>
          {/* No horizontal gap by design: the fixed one-third basis is what
              caps mobile at 3 columns and centers any remainder (5 -> 3 + 2,
              4 -> 3 + 1). Desktop switches to intrinsic widths so 1-6 skills
              all sit in a single centered row. */}
          <ul className="flex list-none flex-wrap justify-center gap-y-4 p-0">
            {entry.skills.map((skill) => (
              <SkillTile key={skill.name} skill={skill} />
            ))}
          </ul>
        </section>

        {/* Entry-level navigation, deliberately distinct from the carousel
            arrows above: labelled text controls in a separate bordered row at
            the end of the page. Loops within this category only. */}
        <nav
          aria-label={`${entryNoun} navigation`}
          className="mt-auto flex items-center justify-between gap-3 border-t-2 border-ink-soft/25 pt-4"
        >
          <Link
            href={getEntryHref(previous)}
            aria-label={`Previous ${entryNoun}: ${previous.title}`}
            className={`${CONTROL_CLASS} px-3 py-2 text-[11px] sm:text-xs`}
          >
            ◀ Previous {entryNoun}
          </Link>
          <Link
            href={getEntryHref(next)}
            aria-label={`Next ${entryNoun}: ${next.title}`}
            className={`${CONTROL_CLASS} px-3 py-2 text-[11px] sm:text-xs`}
          >
            Next {entryNoun} ▶
          </Link>
        </nav>
      </motion.main>
    </div>
  );
}
