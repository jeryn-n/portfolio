"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { Fragment, useEffect, useRef, useState } from "react";
import { useAudio } from "@/components/audio/AudioProvider";
import { useWorldScene } from "@/components/scenes/WorldSceneContext";
import {
  FIRST_VIDEO,
  youTubeWatchUrl,
  type ResolvedVideoPortfolioEntry,
  type ResolvedVideoPortfolioSection,
} from "@/data/videoPortfolio";
import { ArrowOut, ContentNoteCard, MediaComingSoon, MediaShowcase, PixelFrame } from "./MediaShowcase";
import {
  applyToEmbed,
  applyToVideo,
  pauseEmbed,
  sharedVolume,
  updateSharedVolume,
  YOUTUBE_ORIGIN,
} from "./sharedVolume";
import { YouTubeEmbed } from "./YouTubeEmbed";

const EASE: [number, number, number, number] = [0.4, 0, 0.2, 1];

// Desktop wheel "gravity" (see VideoPortfolioPage): the gap above an entry
// taller than the screen, the wheel pause that starts a new gesture, and the
// longest a glide can hold the wheel before letting go.
const STOP_MARGIN = 24;
const GESTURE_GAP_MS = 200;
const MAX_MOVE_MS = 1000;

// The same focus ring, small label and navy pill as the detail pages.
const FOCUS_CLASS =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink-soft";
const LABEL_CLASS = "text-[11px] font-bold uppercase leading-tight tracking-[0.25em] text-ink-soft/70 sm:text-[13px]";
const PILL_CLASS = `inline-flex items-center gap-1.5 rounded-full bg-ink-soft px-5 py-2 text-sm font-bold tracking-wide text-white shadow-sm transition hover:bg-ink hover:shadow-md active:scale-95 sm:px-7 sm:py-2.5 sm:text-base ${FOCUS_CLASS}`;
// A quieter text link (e.g. "Watch on YouTube") under a card's description.
const SUBTLE_LINK_CLASS = `inline-flex items-center gap-1 self-start rounded-sm text-sm font-bold text-ink-soft underline decoration-ink-soft/30 underline-offset-4 transition hover:text-ink hover:decoration-ink ${FOCUS_CLASS}`;

const CARD_CLASS =
  "rounded-lg border border-ink-soft/10 bg-white shadow-[0_1px_2px_rgb(11_29_51/6%),0_12px_32px_-16px_rgb(11_29_51/22%)]";

// Fade up once on entering the viewport.
const REVEAL = {
  initial: { opacity: 0, y: 16 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.15 },
  transition: { duration: 0.4, ease: EASE },
};

// Primary cards are numbered (and alternate sides) across the whole page; a
// secondary card has no number and shares the wheel stop of the card before
// it.
function planCards(sections: ResolvedVideoPortfolioSection[]) {
  const plan = new Map<string, { index?: number; stop: string }>();
  let count = 0;
  let previous: string | undefined;
  for (const entry of sections.flatMap((section) => section.entries)) {
    if (entry.emphasis === "secondary") {
      plan.set(entry.slug, { stop: previous ?? entry.slug });
    } else {
      plan.set(entry.slug, { index: count++, stop: entry.slug });
      previous = entry.slug;
    }
  }
  return plan;
}

// A small gold pixel trophy that sits in a line of text.
function PixelTrophy() {
  return (
    <svg
      role="img"
      aria-label="trophy"
      viewBox="0 0 10 9"
      shapeRendering="crispEdges"
      className="mb-[0.2em] inline-block h-[1em] w-[1.1em] align-middle text-[#d9a521]"
    >
      <path
        fill="currentColor"
        d="M1 0h8v4H1zM0 1h1v2H0zM9 1h1v2H9zM2 4h6v1H2zM3 5h4v1H3zM4 6h2v1H4zM3 7h4v1H3zM2 8h6v1H2z"
      />
    </svg>
  );
}

function ExternalLink({ href, label, title, className }: { href: string; label: string; title: string; className: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
      {label}
      <ArrowOut />
      <span className="sr-only">(opens {title} in a new tab)</span>
    </a>
  );
}

// /video: a standalone, recruiter-facing screening page. It's outside the
// Cabin/Experience/Projects world entirely -- nothing in the world links here
// (only the menu does), and the world's wheel/swipe/key travel only listens
// on `/` -- so this is just a plain scrolling page.
//
// Like the detail pages, it is its own scroll container: the document body
// stays overflow-hidden for the viewport-locked world.
export function VideoPortfolioPage({
  firstVideoId,
  sections,
}: {
  firstVideoId: string | null;
  sections: ResolvedVideoPortfolioSection[];
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const { setAmbientMode } = useAudio();
  const { goTo } = useWorldScene();
  const [activeSection, setActiveSection] = useState(sections[0]?.slug);

  // No environmental ambience here, as on the detail pages.
  useEffect(() => {
    setAmbientMode("none");
  }, [setAmbientMode]);

  // One video at a time, local or YouTube.
  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    function pauseAllExcept(playing: Element | null) {
      for (const video of scroller!.querySelectorAll("video")) {
        if (video !== playing && !video.paused) video.pause();
      }
      for (const iframe of scroller!.querySelectorAll<HTMLIFrameElement>("iframe[data-youtube-embed]")) {
        if (iframe !== playing) pauseEmbed(iframe);
      }
    }
    // A local video starting. `play` doesn't bubble, so listen in the
    // capture phase.
    function handlePlay(event: Event) {
      pauseAllExcept(event.target as Element);
    }
    // Clicking into a YouTube player moves focus into its iframe, which blurs
    // this window -- the closest signal to "a YouTube video is starting"
    // without loading YouTube's API script.
    function handleBlur() {
      setTimeout(() => {
        const focused = document.activeElement;
        if (focused instanceof HTMLIFrameElement && focused.matches("[data-youtube-embed]") && scroller!.contains(focused)) {
          pauseAllExcept(focused);
        }
      });
    }
    scroller.addEventListener("play", handlePlay, true);
    window.addEventListener("blur", handleBlur);
    return () => {
      scroller.removeEventListener("play", handlePlay, true);
      window.removeEventListener("blur", handleBlur);
    };
  }, []);

  // One volume for every player, muted by default: a change on any local
  // video, or in the YouTube player the viewer is using, carries to the rest.
  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const embeds = () => scroller.querySelectorAll<HTMLIFrameElement>("iframe[data-youtube-embed]");
    function syncAllExcept(source: Element) {
      for (const video of scroller!.querySelectorAll("video")) if (video !== source) applyToVideo(video);
      for (const iframe of embeds()) if (iframe !== source) applyToEmbed(iframe);
    }
    // `volumechange` doesn't bubble, so listen in the capture phase.
    function handleVolumeChange(event: Event) {
      const video = event.target as HTMLVideoElement;
      if (updateSharedVolume(video.muted, video.volume)) syncAllExcept(video);
    }
    // YouTube players report their state back over postMessage. Only the one
    // the viewer is actually using (it has focus) counts, so a player still
    // catching up on a change can't undo it.
    function handleMessage(event: MessageEvent) {
      if (event.origin !== YOUTUBE_ORIGIN || typeof event.data !== "string") return;
      let data: { event?: string; info?: { muted?: unknown; volume?: unknown } };
      try {
        data = JSON.parse(event.data);
      } catch {
        return;
      }
      if (data.event !== "infoDelivery" || !data.info) return;
      const iframe = [...embeds()].find((embed) => embed.contentWindow === event.source);
      if (!iframe || document.activeElement !== iframe) return;
      const current = sharedVolume();
      const muted = typeof data.info.muted === "boolean" ? data.info.muted : current.muted;
      const volume = typeof data.info.volume === "number" ? data.info.volume / 100 : current.volume;
      if (updateSharedVolume(muted, volume)) syncAllExcept(iframe);
    }
    scroller.addEventListener("volumechange", handleVolumeChange, true);
    window.addEventListener("message", handleMessage);
    return () => {
      scroller.removeEventListener("volumechange", handleVolumeChange, true);
      window.removeEventListener("message", handleMessage);
    };
  }, []);

  // Desktop "gravity": each wheel gesture glides the page to the next entry
  // in that direction -- top of the page, Academic 01, 02 (with the extra
  // academic piece), Madison Art, Short-Form, Comedy Brand, bottom -- and the
  // reverse. Only the mouse wheel / trackpad is redirected: the scrollbar,
  // keyboard and side index still go wherever they're sent, and the next
  // gesture carries on from there. An entry taller than the screen is
  // scrolled through normally before moving on, and over a YouTube player
  // the wheel scrolls normally too. Touch screens keep plain scrolling.
  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const desktop = window.matchMedia("(min-width: 1024px) and (pointer: fine)");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    let moving = false;
    let unlockTimer: number | undefined;
    let lastWheelAt = -Infinity;
    let lastMagnitude = 0;

    // Each stop's extent on the page; cards sharing a data-stop count as one.
    function stops() {
      const extents = new Map<string, { top: number; bottom: number }>();
      for (const element of scroller!.querySelectorAll<HTMLElement>("[data-stop]")) {
        const rect = element.getBoundingClientRect();
        // Where it rests, not where its fade-up has got to.
        const lift = new DOMMatrixReadOnly(getComputedStyle(element).transform).m42;
        const top = scroller!.scrollTop + rect.top - lift;
        const bottom = top + rect.height;
        const known = extents.get(element.dataset.stop!);
        extents.set(
          element.dataset.stop!,
          known ? { top: Math.min(known.top, top), bottom: Math.max(known.bottom, bottom) } : { top, bottom },
        );
      }
      return [...extents.values()];
    }

    function finishMove() {
      moving = false;
      window.clearTimeout(unlockTimer);
    }

    function handleWheel(event: WheelEvent) {
      if (!desktop.matches || event.ctrlKey || event.deltaY === 0) return;
      if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
      // A new gesture: a pause in the wheel stream, or a fresh push harder
      // than the trackpad's dying momentum.
      const magnitude = Math.abs(event.deltaY);
      const fresh = event.timeStamp - lastWheelAt > GESTURE_GAP_MS || magnitude > lastMagnitude * 1.5 + 4;
      lastWheelAt = event.timeStamp;
      lastMagnitude = magnitude;

      // Over a YouTube player (its frame included) the wheel is left alone:
      // the player itself never passes the wheel to the page, so the page just
      // scrolls normally until the pointer leaves it, and gravity picks up
      // again from wherever that is.
      const frame = event.target instanceof Element ? event.target.closest("[data-media-frame]") : null;
      if (frame?.querySelector("iframe[data-youtube-embed]")) return;

      const direction = Math.sign(event.deltaY);
      const view = scroller!.clientHeight;
      const max = scroller!.scrollHeight - view;
      const current = scroller!.scrollTop;
      const extents = stops();

      // Inside an entry taller than the screen: scroll through it first.
      for (const { top, bottom } of extents) {
        if (bottom - top <= view - 2 * STOP_MARGIN) continue;
        if (current < top - STOP_MARGIN - 2 || current + view > bottom + STOP_MARGIN + 2) continue;
        if (direction > 0 ? current + view < bottom + STOP_MARGIN - 2 : current > top - STOP_MARGIN + 2) return;
      }

      event.preventDefault();
      if (moving || !fresh) return;
      // An entry rests centred on screen, or top-aligned if it's taller.
      const positions = [0, max, ...extents.map(({ top, bottom }) =>
        bottom - top <= view - 2 * STOP_MARGIN ? (top + bottom) / 2 - view / 2 : top - STOP_MARGIN,
      )]
        .map((position) => Math.round(Math.min(max, Math.max(0, position))))
        .sort((a, b) => a - b);
      const target =
        direction > 0
          ? positions.find((position) => position > current + 2)
          : positions.findLast((position) => position < current - 2);
      if (target === undefined) return;
      moving = true;
      window.clearTimeout(unlockTimer);
      unlockTimer = window.setTimeout(finishMove, MAX_MOVE_MS);
      scroller!.scrollTo({ top: target, behavior: reduced.matches ? "auto" : "smooth" });
    }

    scroller.addEventListener("wheel", handleWheel, { passive: false });
    scroller.addEventListener("scrollend", finishMove);
    return () => {
      window.clearTimeout(unlockTimer);
      scroller.removeEventListener("wheel", handleWheel);
      scroller.removeEventListener("scrollend", finishMove);
    };
  }, []);

  // The side index highlights whichever section crosses the middle band of
  // the viewport.
  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const observer = new IntersectionObserver(
      (records) => {
        for (const record of records) {
          const slug = (record.target as HTMLElement).dataset.indexSection;
          if (record.isIntersecting && slug) setActiveSection(slug);
        }
      },
      { root: scroller, rootMargin: "-40% 0px -55% 0px" },
    );
    for (const section of scroller.querySelectorAll("[data-index-section]")) observer.observe(section);
    return () => observer.disconnect();
  }, []);

  function scrollToSection(slug: string) {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    scrollerRef.current
      ?.querySelector(`[data-index-section="${slug}"]`)
      ?.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
  }

  // Back to the portfolio lands in the cabin, whichever scene was last shown.
  function prepareExit() {
    goTo("cabin", { instant: true });
  }

  const plan = planCards(sections);

  return (
    <div
      ref={scrollerRef}
      data-video-portfolio=""
      className="h-dvh w-full overflow-x-hidden overflow-y-auto overscroll-contain bg-paper text-ink [touch-action:pan-y_pinch-zoom]"
    >
      {/* Desktop-only side index, in the left gutter beside the column. */}
      <nav
        aria-label="Portfolio sections"
        className="fixed left-6 top-1/2 z-10 hidden -translate-y-1/2 min-[1400px]:block"
      >
        <ul className="flex flex-col gap-1">
          {sections.map((section) => {
            const active = section.slug === activeSection;
            return (
              <li key={section.slug}>
                <button
                  type="button"
                  onClick={() => scrollToSection(section.slug)}
                  aria-current={active ? "true" : undefined}
                  className={`group flex items-center gap-2.5 rounded-sm py-1 pr-2 text-left text-[11px] font-bold uppercase tracking-[0.18em] transition-colors ${
                    active ? "text-ink" : "text-ink-soft/50 hover:text-ink-soft"
                  } ${FOCUS_CLASS}`}
                >
                  <span
                    aria-hidden="true"
                    className={`h-2 w-2 shrink-0 transition-colors ${
                      active ? "bg-ink-soft" : "bg-ink-soft/20 group-hover:bg-ink-soft/50"
                    }`}
                  />
                  {section.navLabel}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Top padding keeps the header clear of the fixed menu button in the
          upper left until the centred column is narrow enough to clear it. */}
      <main className="mx-auto flex w-full max-w-[1120px] flex-col gap-6 px-3 pb-[calc(5rem+env(safe-area-inset-bottom))] pt-16 sm:gap-10 sm:px-8 xl:pt-12 min-[1800px]:max-w-[1320px]">
        <motion.header
          className="@container flex flex-col-reverse items-start justify-between gap-4 sm:flex-row sm:items-end"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.35, ease: EASE }}
        >
          <div className="flex flex-col gap-2">
            <p className={LABEL_CLASS}>Video Editing Portfolio</p>
            <h1 className="font-pixel-label text-[32px] leading-none text-ink sm:text-5xl">Jeryn Nyberg</h1>
            {/* A navy rule from the left edge to a little past the middle of
                the screen (60% of the header, which is centred), then a small
                pixel dot just after it. */}
            <div aria-hidden="true" className="my-2.5 flex items-center gap-2.5 sm:my-3">
              <span className="h-[3px] w-[60cqw] bg-ink-soft" />
              <span className="h-1 w-1 shrink-0 bg-ink-soft" />
            </div>
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-ink-soft/60 sm:text-sm">
              Editing • Storytelling • Motion • Short-Form Content
            </p>
          </div>
          <Link href="/" onClick={prepareExit} className={`${PILL_CLASS} shrink-0 self-end sm:self-auto`}>
            Back to Portfolio
          </Link>
        </motion.header>

        <FirstVideo youtubeId={firstVideoId} />

        {sections.map((section) => {
          const cards = section.entries.map((entry) => {
            const { index, stop } = plan.get(entry.slug)!;
            if (index === undefined) {
              return <SecondaryCard key={entry.slug} entry={entry} grouped={Boolean(section.heading)} stop={stop} />;
            }
            return (
              <EntryCard
                key={entry.slug}
                entry={entry}
                index={index}
                grouped={Boolean(section.heading)}
                indexSection={section.heading ? undefined : section.slug}
              />
            );
          });
          if (!section.heading) return cards;
          return (
            <section
              key={section.slug}
              id={section.slug}
              data-index-section={section.slug}
              aria-labelledby={`${section.slug}-heading`}
              className="flex scroll-mt-6 flex-col gap-4 sm:gap-6"
            >
              <motion.div className="flex items-center gap-3 sm:gap-4" {...REVEAL}>
                <h2
                  id={`${section.slug}-heading`}
                  className="font-pixel-label text-lg uppercase leading-none tracking-wider text-ink sm:text-2xl"
                >
                  {section.heading}
                </h2>
                <span aria-hidden="true" className="h-0.5 flex-1 bg-ink-soft/15" />
                <span className={LABEL_CLASS}>
                  {section.entries.length} {section.entries.length === 1 ? "project" : "projects"}
                </span>
              </motion.div>
              {/* A rail down the left ties the group's cards together. */}
              <div className="flex flex-col gap-6 sm:gap-8 sm:border-l-2 sm:border-ink-soft/15 sm:pl-5 lg:pl-6">
                {cards}
              </div>
            </section>
          );
        })}

        <footer className="flex flex-wrap items-center justify-between gap-4 border-t-2 border-ink-soft/10 pt-6">
          <p className="font-pixel-label text-sm text-ink-soft/70">imjeryn.dev</p>
          <Link href="/" onClick={prepareExit} className={PILL_CLASS}>
            Back to Portfolio
          </Link>
        </footer>
      </main>
    </div>
  );
}

// The light-hearted opener: a small player and a line about where it all
// started. Deliberately lighter than the cards below (dashed outline, no
// number), and not in the side index.
function FirstVideo({ youtubeId }: { youtubeId: string | null }) {
  return (
    <motion.aside
      aria-labelledby="first-video-title"
      className="flex flex-col gap-4 rounded-lg border-2 border-dashed border-ink-soft/20 p-3 sm:flex-row sm:items-center sm:gap-6 sm:p-5"
      {...REVEAL}
    >
      <div className="w-full shrink-0 sm:w-[300px] lg:w-[340px]">
        <PixelFrame aspect={16 / 9}>
          {youtubeId ? (
            <YouTubeEmbed id={youtubeId} title={FIRST_VIDEO.title} coverTitle={FIRST_VIDEO.coverTitle} />
          ) : (
            <MediaComingSoon hint="Set FIRST_VIDEO.youtubeId in src/data/videoPortfolio.ts" />
          )}
        </PixelFrame>
      </div>
      <div className="flex flex-col gap-2">
        <p className={`${LABEL_CLASS} flex items-center gap-2.5`}>
          <span className="bg-ink-soft px-1.5 py-1 font-pixel-label text-[10px] leading-none tracking-wider text-white">
            LVL 1
          </span>
          {FIRST_VIDEO.label}
        </p>
        <h2 id="first-video-title" className="text-xl font-bold leading-tight sm:text-2xl">
          {FIRST_VIDEO.title}
        </h2>
        <p className="max-w-[52ch] text-sm leading-relaxed text-ink-soft sm:text-base">{FIRST_VIDEO.description}</p>
      </div>
    </motion.aside>
  );
}

// A primary card: the media (or, for sensitive work, its content note) on
// one side and the text on the other, alternating sides from card to card on
// desktop (the first card's text is on the left). Below lg the media always
// comes first.
function EntryCard({
  entry,
  index,
  grouped,
  indexSection,
}: {
  entry: ResolvedVideoPortfolioEntry;
  index: number;
  grouped: boolean;
  indexSection?: string;
}) {
  const textFirst = index % 2 === 0;
  const Card = grouped ? motion.article : motion.section;
  const Title = grouped ? "h3" : "h2";
  const youtubeId = entry.media.find((item) => item.type === "youtube")?.youtubeId ?? null;
  return (
    <Card
      id={entry.slug}
      data-index-section={indexSection}
      aria-labelledby={`${entry.slug}-title`}
      data-stop={entry.slug}
      className={`grid scroll-mt-6 grid-cols-1 items-center gap-5 p-3 sm:gap-8 sm:p-6 lg:gap-10 lg:p-8 ${CARD_CLASS} ${
        textFirst ? "lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)]" : "lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]"
      }`}
      {...REVEAL}
    >
      <div className={textFirst ? "lg:order-2" : undefined}>
        {entry.contentNote ? (
          <ContentNoteCard
            note={entry.contentNote}
            warnings={entry.contentWarnings}
            url={entry.externalUrl}
            linkLabel={entry.externalLabel ?? "Watch on YouTube"}
            title={entry.title}
          />
        ) : (
          <MediaShowcase
            media={entry.media}
            title={entry.title}
            frameAspect={entry.frameAspect}
            thumbnails={entry.thumbnails}
            fitFrameToItem={entry.fitFrameToItem}
          />
        )}
      </div>

      <div className={`flex flex-col gap-3 ${textFirst ? "lg:order-1" : ""}`}>
        <p className={`${LABEL_CLASS} flex items-center gap-3`}>
          <span className="tabular-nums tracking-normal text-ink-soft">{String(index + 1).padStart(2, "0")}</span>
          <span aria-hidden="true" className="h-0.5 w-5 bg-ink-soft/25" />
          {entry.category}
        </p>
        <div className="flex flex-col gap-1">
          <Title id={`${entry.slug}-title`} className="text-2xl font-bold leading-tight sm:text-3xl">
            {entry.title}
          </Title>
          {entry.subtitle && (
            <p className="text-sm font-semibold text-ink-soft sm:text-base">
              {entry.subtitle.split("🏆").map((part, i) => (
                <Fragment key={i}>
                  {i > 0 && <PixelTrophy />}
                  {part}
                </Fragment>
              ))}
            </p>
          )}
        </div>
        <p className="text-sm leading-relaxed text-ink-soft sm:text-base">{entry.description}</p>
        {entry.role && (
          <p className="text-sm text-ink-soft">
            <span className="font-bold uppercase tracking-wider text-ink-soft/70">Role </span>
            {entry.role}
          </p>
        )}
        {entry.highlight && (
          <p className="mt-1 flex flex-col gap-1.5 border-l-4 border-ink-soft py-1 pl-4">
            <span className="text-5xl leading-none tracking-tight text-ink [font-family:var(--font-stat),ui-sans-serif,sans-serif] sm:text-6xl">
              {entry.highlight.value}
            </span>
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-ink-soft sm:text-sm">
              {entry.highlight.label}
            </span>
          </p>
        )}
        {youtubeId && (
          <ExternalLink
            href={youTubeWatchUrl(youtubeId)}
            label="Watch on YouTube"
            title={entry.title}
            className={SUBTLE_LINK_CLASS}
          />
        )}
        {/* Sensitive work links out from its content note instead. */}
        {entry.externalUrl && !entry.contentNote && (
          <ExternalLink
            href={entry.externalUrl}
            label={entry.externalLabel ?? "Watch full video"}
            title={entry.title}
            className={`${PILL_CLASS} mt-1 self-start`}
          />
        )}
        {entry.disclaimer && (
          <p className="mt-1 text-xs leading-relaxed text-ink-soft/70">
            <span className="font-bold uppercase tracking-wider">Note: </span>
            {entry.disclaimer}
          </p>
        )}
      </div>
    </Card>
  );
}

// A smaller card for supporting work: an optional still, the text and a link
// out -- no player.
function SecondaryCard({
  entry,
  grouped,
  stop,
}: {
  entry: ResolvedVideoPortfolioEntry;
  grouped: boolean;
  stop: string;
}) {
  const Card = grouped ? motion.article : motion.section;
  const Title = grouped ? "h3" : "h2";
  return (
    <Card
      id={entry.slug}
      data-stop={stop}
      aria-labelledby={`${entry.slug}-title`}
      className={`flex scroll-mt-6 flex-col gap-4 p-3 sm:flex-row sm:items-center sm:gap-6 sm:p-5 ${CARD_CLASS}`}
      {...REVEAL}
    >
      {entry.thumbnail && (
        <div className="w-full shrink-0 sm:w-[220px]">
          <PixelFrame aspect={16 / 9}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={entry.thumbnail}
              alt=""
              loading="lazy"
              decoding="async"
              className="absolute inset-0 h-full w-full object-cover"
            />
          </PixelFrame>
        </div>
      )}
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <p className={LABEL_CLASS}>{entry.category}</p>
        <Title id={`${entry.slug}-title`} className="text-lg font-bold leading-tight sm:text-xl">
          {entry.title}
        </Title>
        <p className="text-sm leading-relaxed text-ink-soft">{entry.description}</p>
      </div>
      {entry.externalUrl && (
        <ExternalLink
          href={entry.externalUrl}
          label={entry.externalLabel ?? "Watch on YouTube"}
          title={entry.title}
          className={`${PILL_CLASS} shrink-0 self-start sm:self-center`}
        />
      )}
    </Card>
  );
}
