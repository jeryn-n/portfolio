"use client";

import { AnimatePresence, motion, type Variants } from "motion/react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type PointerEvent } from "react";
import { useAudio } from "@/components/audio/AudioProvider";
import { useWorldScene } from "@/components/scenes/WorldSceneContext";
import { useSiteUI } from "@/components/ui/SiteUIProvider";
import {
  externalHref,
  getCategorySceneHref,
  getEntryHref,
  getSiblingEntries,
  type ExternalLink,
  type MediaType,
  type PortfolioEntry,
} from "@/data/portfolio";
import { DetailMedia } from "./DetailMedia";
import { SkillTile } from "./SkillTile";

// Internal carousel: horizontal travel for the media, cross-fade for the
// text. Conservative swipe threshold so a vertical page scroll on mobile is
// never mistaken for a slide change.
const SLIDE_DURATION = 0.45;
const SLIDE_EASE: [number, number, number, number] = [0.4, 0, 0.2, 1];
const TEXT_FADE_DURATION = 0.22;
const SWIPE_THRESHOLD = 60;

// Slideshow autoplay: one slide every AUTOPLAY_INTERVAL_MS, from the moment
// the entry opens until the visitor does anything at all (see DetailContent).
const AUTOPLAY_INTERVAL_MS = 10000;

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
  links: ExternalLink[];
  comingSoon?: "card" | "overlay";
}

// Slide 0 is always the entry overview; slides 1..N are its features. An
// entry with no features therefore has exactly one carousel state. Entry
// links ride along on every slide; a feature's own links only on its slide.
// A coming-soon cover keeps its image under an overlay; a coming-soon
// feature swaps its photo for the flat card.
function buildSlides(entry: PortfolioEntry): Slide[] {
  const entryLinks = entry.externalLinks ?? [];
  return [
    {
      key: "overview",
      largeText: entry.tagline,
      description: entry.description,
      image: entry.displayImage,
      imagePosition: entry.displayImagePosition,
      altText: entry.title,
      links: entryLinks,
      comingSoon: entry.coverComingSoon ? "overlay" : undefined,
    },
    ...entry.features.map(
      (feature, index): Slide => ({
        key: `feature-${index}`,
        largeText: feature.tagline ?? feature.title,
        description: feature.description,
        image: feature.image,
        imagePosition: feature.imagePosition,
        mediaType: feature.mediaType,
        altText: `${entry.title} — ${feature.title}`,
        links: [...entryLinks, ...(feature.externalLinks ?? [])],
        comingSoon: feature.mediaComingSoon ? "card" : undefined,
      }),
    ),
  ];
}

const FOCUS_CLASS =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink-soft";

// Small uppercase label shared by the header's category ("Experience" /
// "Project") and the Skills heading, so the two always match.
const LABEL_CLASS = "text-[11px] font-bold uppercase leading-tight tracking-[0.25em] text-ink-soft/70 sm:text-[13px]";

// Rounded navy pill with white text: Exit and the external link buttons.
const PILL_CLASS = `inline-flex items-center gap-1.5 rounded-full bg-ink-soft px-5 py-2 text-sm font-bold tracking-wide text-white shadow-sm transition hover:bg-ink hover:shadow-md active:scale-95 sm:px-7 sm:py-2.5 sm:text-base ${FOCUS_CLASS}`;

// Internal carousel arrows: a bare navy chevron, no box. The button itself is
// larger than the mark so the hit area stays generous.
const CAROUSEL_ARROW_CLASS = `group inline-flex h-14 w-7 shrink-0 items-center justify-center rounded-md text-ink-soft transition-colors hover:text-ink active:scale-90 disabled:pointer-events-none disabled:opacity-0 sm:h-20 sm:w-12 ${FOCUS_CLASS}`;

// Entry-level Previous/Next: labelled text with a small chevron, deliberately
// lighter than (and distinct from) the large carousel arrows beside the media.
const ENTRY_NAV_CLASS = `group inline-flex items-center gap-1.5 rounded-sm py-1 text-xs font-bold uppercase tracking-wide text-ink-soft transition-colors hover:text-ink sm:text-sm ${FOCUS_CLASS}`;

// A plain stroked `<` / `>` -- the one directional mark, shared by the carousel
// arrows and the entry navigation at different sizes.
function Chevron({ direction, className }: { direction: "left" | "right"; className: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d={direction === "left" ? "M15 4 7 12l8 8" : "m9 4 8 8-8 8"} />
    </svg>
  );
}

// The one detail template behind all six entry routes -- Projects and
// Experience differ only in their data and their wording, never in layout.
//
// Every arrival starts on the overview (slide 0). The routes key this by
// slug, but that alone isn't enough: with cacheComponents, Next keeps recently
// visited routes alive in a hidden <Activity> instead of unmounting them, so
// coming back to an entry (browser Back, or Next then Previous) would restore
// whatever slide was showing. Effects are torn down when the route is hidden,
// so that's where the reset happens -- out of sight -- by remounting the
// content with a fresh key. It then reappears on the overview with no slide
// animation.
export function PortfolioDetailPage({ entry }: { entry: PortfolioEntry }) {
  const [visit, setVisit] = useState(0);
  useEffect(() => () => setVisit((current) => current + 1), []);
  return <DetailContent key={visit} entry={entry} />;
}

// Scrolling: the page is its own scroll container (the document body stays
// overflow-hidden for the viewport-locked world). Desktop is sized to fit
// 1440x900 and up in a single viewport, with the media capped by viewport
// height rather than width so the whole template stays above the fold;
// anything that doesn't fit simply scrolls rather than clipping.
//
// Below xl the column reaches under the fixed sound button (bottom-right,
// 44px at 1rem), so the larger bottom padding there lifts the entry nav clear
// of it; from xl up the centred column ends well left of the button.
function DetailContent({ entry }: { entry: PortfolioEntry }) {
  const slides = buildSlides(entry);
  const total = slides.length;

  // Slide 0 is the overview; there is one state per feature after it.
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const slide = slides[index];

  // True until the visitor first interacts with the page; then false for the
  // rest of this mounted entry session (a different entry, or coming back to
  // this one, mounts a fresh DetailContent and so starts a fresh session).
  const [autoplay, setAutoplay] = useState(true);
  const scrollerRef = useRef<HTMLDivElement>(null);

  const { setAmbientMode } = useAudio();
  const { goTo } = useWorldScene();
  const { isBlockingOverlayOpen, menuOpen } = useSiteUI();
  const { previous, next } = getSiblingEntries(entry);

  const isProject = entry.category === "project";
  const entryNoun = isProject ? "Project" : "Experience";
  // The link row keeps its height on every slide of an entry that has links
  // anywhere, so a feature-only link appearing doesn't shift the skills.
  const hasLinkRow = slides.some((candidate) => candidate.links.length > 0);

  const step = useCallback(
    (delta: 1 | -1) => {
      if (total <= 1) return;
      setDirection(delta);
      setIndex((current) => (current + delta + total) % total);
    },
    [total],
  );

  // Autoplay: a fresh timer per slide, so it restarts after every transition
  // (manual or automatic) and can never fire during one -- the slide animation
  // is 0.45s, the interval 10s. It goes through step(), the same path as the
  // arrows and the keyboard, so the slide and text animations are exactly the
  // manual ones. A hidden tab holds the slide (the timer just re-arms), and
  // reduced motion switches it off entirely. The effect's cleanup clears the
  // pending timer, so Strict Mode's double-run and unmounting leave none.
  useEffect(() => {
    if (!autoplay || total <= 1) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reducedMotion.matches) return;

    let timer: ReturnType<typeof setTimeout>;
    function arm() {
      timer = setTimeout(() => {
        if (document.visibilityState === "hidden" || reducedMotion.matches) arm();
        else step(1);
      }, AUTOPLAY_INTERVAL_MS);
    }
    arm();
    return () => clearTimeout(timer);
  }, [autoplay, index, total, step]);

  // Any real interaction ends autoplay for good: a press or touch anywhere
  // (this covers the arrows, links, buttons, swipes and drags), a click, a
  // key (ArrowLeft/Right included), the wheel, or scrolling the page.
  // Listeners only observe -- nothing here calls preventDefault -- and hover
  // alone doesn't count.
  useEffect(() => {
    if (!autoplay) return;
    const stop = () => setAutoplay(false);
    const events = ["pointerdown", "click", "keydown", "wheel"] as const;
    for (const type of events) window.addEventListener(type, stop, { capture: true, passive: true });
    return () => {
      for (const type of events) window.removeEventListener(type, stop, { capture: true });
    };
  }, [autoplay]);

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
    // The page owns every touch while it's up: it's its own scroll container
    // that keeps its overscroll to itself (nothing chains out to the
    // viewport-locked document behind it), and it only ever pans vertically.
    // Horizontal drags are therefore never claimed by the browser, which is
    // what lets the carousel's swipe (below) see them in full.
    <div
      ref={scrollerRef}
      onScroll={(event) => {
        if (event.target === scrollerRef.current) setAutoplay(false);
      }}
      className="h-dvh w-full overflow-x-hidden overflow-y-auto overscroll-contain bg-paper text-ink [touch-action:pan-y_pinch-zoom]"
    >
      <motion.main
        className="mx-auto flex min-h-dvh w-full max-w-[1120px] flex-col gap-4 px-4 pb-[calc(4.5rem+env(safe-area-inset-bottom))] pt-16 sm:gap-3 sm:px-8 xl:pb-4 xl:pt-8"
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.25, ease: SLIDE_EASE }}
      >
        {/* Overall entry title -- fixed for the whole route, never affected
            by carousel slide changes. Top padding keeps it clear of the
            global menu, which is fixed in the viewport's upper-left; from xl
            up the centred column sits well right of the menu, so the header
            can rise higher without meeting it. */}
        <header className="flex items-center justify-between gap-4">
          <div>
            <p className={LABEL_CLASS}>{entryNoun}</p>
            <h1 className="text-xl font-bold leading-tight sm:text-2xl">{entry.title}</h1>
          </div>
          <Link
            href={getCategorySceneHref(entry.category)}
            onClick={prepareSceneExit}
            className={`${PILL_CLASS} shrink-0`}
          >
            Exit
          </Link>
        </header>

        {/* Media + internal carousel arrows. The arrow columns always render
            so the media's width never shifts between entries with different
            feature counts; with a single slide they're simply disabled. */}
        <div className="flex w-full items-center justify-center gap-1 sm:gap-4">
          <button
            type="button"
            onClick={() => step(-1)}
            disabled={total <= 1}
            aria-label={`Show previous media (slide ${index + 1} of ${total})`}
            className={CAROUSEL_ARROW_CLASS}
          >
            <Chevron
              direction="left"
              className="h-7 w-7 transition-transform group-hover:-translate-x-0.5 sm:h-11 sm:w-11"
            />
          </button>

          {/* The media is sized against VIEWPORT HEIGHT rather than width:
              capping max-width at 78dvh puts its height at ~44dvh, which is
              what keeps the whole template (text, CTAs, skills, entry nav)
              inside one viewport at 1440x900 even for the tallest entry --
              six skills plus a CTA row and a three-line description. 16:9
              survives because only the width is constrained, so the height
              still derives from it. */}
          <div
            className="relative aspect-video w-full max-w-[78dvh] overflow-hidden rounded-lg border-4 border-ink-soft bg-wireframe-fill"
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
                  comingSoon={slide.comingSoon}
                />
              </motion.div>
            </AnimatePresence>
          </div>

          <button
            type="button"
            onClick={() => step(1)}
            disabled={total <= 1}
            aria-label={`Show next media (slide ${index + 1} of ${total})`}
            className={CAROUSEL_ARROW_CLASS}
          >
            <Chevron
              direction="right"
              className="h-7 w-7 transition-transform group-hover:translate-x-0.5 sm:h-11 sm:w-11"
            />
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

        {/* Optional external CTAs, between description and skills: the
            region is absent when no slide of the entry has links. Keyed by
            the slide's link set, so entry-level links that stay put from
            slide to slide don't flicker -- only a change in the set fades. */}
        {hasLinkRow && (
          <div className="min-h-9 sm:min-h-11">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={`links:${slide.links.map((link) => link.href).join(" ")}`}
                className="flex flex-wrap items-center justify-center gap-2 sm:gap-3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: TEXT_FADE_DURATION, ease: "easeOut" }}
              >
                {slide.links.map((link) => (
                  <a
                    key={`${link.label}-${link.href}`}
                    href={externalHref(link.href)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={PILL_CLASS}
                  >
                    {link.label}
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2.5}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-3.5 w-3.5 sm:h-4 sm:w-4"
                    >
                      <path d="M7 17 17 7M8 7h9v9" />
                    </svg>
                    <span className="sr-only">(opens in a new tab)</span>
                  </a>
                ))}
              </motion.div>
            </AnimatePresence>
          </div>
        )}

        <section aria-label="Skills" className="flex flex-col gap-1.5">
          <h2 className={`${LABEL_CLASS} text-center`}>Skills</h2>
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
            arrows above: small labelled text links pinned to the end of the
            page, no boxes. Loops within this category only. */}
        <nav aria-label={`${entryNoun} navigation`} className="mt-auto flex items-center justify-between gap-3">
          <Link
            href={getEntryHref(previous)}
            aria-label={`Previous ${entryNoun}: ${previous.title}`}
            className={ENTRY_NAV_CLASS}
          >
            <Chevron
              direction="left"
              className="h-4 w-4 transition-transform group-hover:-translate-x-0.5 sm:h-5 sm:w-5"
            />
            Previous {entryNoun}
          </Link>
          <Link href={getEntryHref(next)} aria-label={`Next ${entryNoun}: ${next.title}`} className={ENTRY_NAV_CLASS}>
            Next {entryNoun}
            <Chevron
              direction="right"
              className="h-4 w-4 transition-transform group-hover:translate-x-0.5 sm:h-5 sm:w-5"
            />
          </Link>
        </nav>
      </motion.main>
    </div>
  );
}
