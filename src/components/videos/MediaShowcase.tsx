"use client";

import { motion } from "motion/react";
import {
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  type HTMLAttributes,
  type PointerEvent,
  type ReactNode,
} from "react";
import { mediaFileHint } from "@/data/portfolio";
import type { ResolvedVideoPortfolioMedia } from "@/data/videoPortfolio";
import { useImageFallback } from "@/lib/useImageFallback";
import { hasPlayed, markPlayed, PlayCover } from "./PlayCover";
import { applyToVideo } from "./sharedVolume";
import { YouTubeEmbed } from "./YouTubeEmbed";

const FOCUS_CLASS =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink-soft";
const FOCUS_CLASS_ON_NAVY =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white";

// Bare navy chevron buttons, like the detail page's carousel arrows but sized
// for a control row under the media rather than columns beside it.
const ARROW_CLASS = `group inline-flex h-10 w-10 items-center justify-center rounded-md text-ink-soft transition-colors hover:bg-ink-soft/10 hover:text-ink active:scale-90 ${FOCUS_CLASS}`;

// Touch only, horizontal-dominant, never preventDefault -- vertical page
// scrolling through the media is untouched. Mouse drags are ignored so
// scrubbing a video's timeline can never change the item. (Touches on a
// YouTube embed stay inside its iframe; the arrows cover those.)
const SWIPE_THRESHOLD = 50;
// A touch that starts this close to a video's bottom edge is on its native
// controls (the seek bar), not a swipe.
const VIDEO_CONTROLS_HEIGHT = 64;

// The frame never grows past this much of the viewport's height, so a tall
// (9:16) frame still fits on a laptop screen.
const MAX_FRAME_VH = 72;

// The faint 16px grid on the navy panels.
const GRID_BACKGROUND = {
  backgroundImage:
    "linear-gradient(rgb(214 230 255 / 5%) 1px, transparent 1px), linear-gradient(90deg, rgb(214 230 255 / 5%) 1px, transparent 1px)",
  backgroundSize: "16px 16px",
};

const YOUTUBE_HINT = "Set its youtubeId in src/data/videoPortfolio.ts";

function fileHint(src: string) {
  const { file, folder } = mediaFileHint(src);
  return `${folder}${file}`;
}

function Chevron({ direction }: { direction: "left" | "right" }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`h-6 w-6 transition-transform ${
        direction === "left" ? "group-hover:-translate-x-0.5" : "group-hover:translate-x-0.5"
      }`}
    >
      <path d={direction === "left" ? "M15 4 7 12l8 8" : "m9 4 8 8-8 8"} />
    </svg>
  );
}

export function ArrowOut() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4"
    >
      <path d="M7 17 17 7M8 7h9v9" />
    </svg>
  );
}

// Stand-in for media that isn't there (yet): a quiet navy panel rather than a
// broken image or a dead player. In development it also says what to fill in
// (the exact file, or the data field); the live site only says "Media coming
// soon".
export function MediaComingSoon({ hint }: { hint: string }) {
  return (
    <div
      role="img"
      aria-label="Media coming soon"
      className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-4 text-center text-loader-ink"
      style={GRID_BACKGROUND}
    >
      {/* A pixel play mark. */}
      <svg aria-hidden="true" viewBox="-0.5 0 8 8" shapeRendering="crispEdges" className="h-8 w-8 opacity-60">
        <path fill="currentColor" d="M2 1h1v6H2zM3 2h1v4H3zM4 3h1v2H4z" />
      </svg>
      <span className="font-pixel-label text-xs uppercase tracking-[0.2em] opacity-80 sm:text-sm">
        Media coming soon
      </span>
      {process.env.NODE_ENV === "development" && <span className="break-all text-[11px] opacity-50">{hint}</span>}
    </div>
  );
}

// The navy pixel-cornered frame every piece of media sits in, with a hard,
// offset pixel shadow behind it (a CSS filter shadow would have to be
// recomputed under every video frame). Fixed to `aspect` and never taller than
// MAX_FRAME_VH of the viewport; its content fills it absolutely.
export function PixelFrame({
  aspect,
  children,
  innerProps,
}: {
  aspect: number;
  children: ReactNode;
  innerProps?: HTMLAttributes<HTMLDivElement>;
}) {
  return (
    <div
      data-media-frame=""
      className="relative mx-auto"
      style={{ width: `min(100%, calc(${MAX_FRAME_VH}svh * ${aspect}))`, aspectRatio: aspect }}
    >
      <div aria-hidden="true" className="pixel-frame absolute inset-0 translate-x-1.5 translate-y-1.5 bg-ink-soft/15" />
      <div className="pixel-frame absolute inset-0 bg-ink-soft p-1.5">
        <div
          {...innerProps}
          className={`pixel-frame-sm relative h-full w-full overflow-hidden bg-ink ${innerProps?.className ?? ""}`}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

// In place of media for sensitive work: a deliberate navy card with the
// content warnings and a link out, so nothing graphic -- not even a
// thumbnail -- is shown just by opening the page. Same frame as the media,
// but it grows past 16:9 when its text needs the room (narrow phones).
export function ContentNoteCard({
  note,
  warnings = [],
  url,
  linkLabel,
  title,
}: {
  note: string;
  warnings?: string[];
  url: string | null;
  linkLabel: string;
  title: string;
}) {
  return (
    <div className="grid w-full">
      <div aria-hidden="true" className="pixel-frame translate-x-1.5 translate-y-1.5 bg-ink-soft/15 [grid-area:1/1]" />
      <div className="pixel-frame bg-ink-soft p-1.5 [grid-area:1/1]">
        <div
          role="note"
          aria-label="Content warning"
          // Nothing inside may shrink, so when the text needs more room than
          // 16:9 the panel grows instead of squashing the warning mark.
          className="pixel-frame-sm flex flex-col items-center justify-center gap-4 bg-ink px-5 py-9 text-center text-loader-ink *:shrink-0 sm:aspect-video sm:gap-5 sm:px-10"
          style={GRID_BACKGROUND}
        >
          {/* A pixel warning mark. */}
          <svg
            aria-hidden="true"
            viewBox="0 0 11 10"
            shapeRendering="crispEdges"
            className="h-[1.875rem] w-[2.0625rem] sm:h-10 sm:w-11"
          >
            <path
              fill="currentColor"
              fillRule="evenodd"
              d="M5 0h1v1h1v2h1v2h1v2h1v2h1v1H0V9h1V7h1V5h1V3h1V1h1zM5 3v4h1V3zm0 5v1h1V8z"
            />
          </svg>
          <p className="font-pixel-label text-lg uppercase leading-none tracking-[0.2em] text-white sm:text-2xl">
            Content warning
          </p>
          {warnings.length > 0 && (
            <ul className="flex max-w-[40rem] flex-wrap justify-center gap-2">
              {warnings.map((warning) => (
                <li
                  key={warning}
                  className="border-2 border-loader-ink/60 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-white sm:text-sm"
                >
                  {warning}
                </li>
              ))}
            </ul>
          )}
          <p className="max-w-[46ch] text-sm leading-relaxed text-loader-ink/85 sm:text-base">{note}</p>
          {url ? (
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className={`mt-1 inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-[13px] font-bold text-ink shadow-sm transition hover:bg-loader-ink active:scale-95 sm:px-6 sm:py-2.5 sm:text-base sm:tracking-wide ${FOCUS_CLASS_ON_NAVY}`}
            >
              {linkLabel}
              <ArrowOut />
              <span className="sr-only">(opens {title} in a new tab)</span>
            </a>
          ) : (
            process.env.NODE_ENV === "development" && (
              <span className="text-[11px] opacity-50">Set its externalUrl in src/data/videoPortfolio.ts</span>
            )
          )}
        </div>
      </div>
    </div>
  );
}

type LocalMedia = Extract<ResolvedVideoPortfolioMedia, { type: "video" | "image" }>;

function ShowcaseImage({ item }: { item: LocalMedia }) {
  const { failed, ref, onError } = useImageFallback();
  if (failed) return <MediaComingSoon hint={fileHint(item.src)} />;
  return (
    // Plain <img> keeps us in control of the onError fallback, matching ArtAsset.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      ref={ref}
      src={item.src}
      alt={item.alt ?? ""}
      draggable={false}
      loading="lazy"
      decoding="async"
      className="absolute inset-0 h-full w-full object-contain"
      onError={onError}
    />
  );
}

function ShowcaseVideo({ item }: { item: Extract<LocalMedia, { type: "video" }> }) {
  const [failed, setFailed] = useState(false);
  // Until it's first played, the video sits under a uniform cover -- and once
  // played it stays uncovered until the page is reloaded, even after
  // switching carousel items or leaving and coming back.
  const [started, setStarted] = useState(() => hasPlayed(item.src));
  function markStarted() {
    markPlayed(item.src);
    setStarted(true);
  }
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // A file that 404s before hydration has already fired its error event, so
  // check the element's state as it mounts too (as useImageFallback does).
  const ref = useCallback((video: HTMLVideoElement | null) => {
    videoRef.current = video;
    if (!video) return;
    if (video.error) setFailed(true);
    // Start at the page's shared volume (muted until the viewer unmutes).
    applyToVideo(video);
  }, []);

  // Pause when this item goes away: switching carousel items, and leaving the
  // route -- Next keeps the page alive but hidden, and a hidden <video> would
  // otherwise keep playing (layout-effect cleanup runs as it's hidden).
  useLayoutEffect(() => {
    const video = videoRef.current;
    return () => video?.pause();
  }, []);

  if (failed) return <MediaComingSoon hint={fileHint(item.src)} />;
  return (
    <>
      <video
        ref={ref}
        // Without a poster, the #t fragment makes iOS Safari paint the first
        // frame instead of a black box (only metadata is preloaded).
        src={item.poster ? item.src : `${item.src}#t=0.001`}
        poster={item.poster}
        aria-label={item.alt}
        controls
        playsInline
        preload="metadata"
        className="absolute inset-0 h-full w-full object-contain"
        onError={() => setFailed(true)}
        onPlay={markStarted}
      />
      {!started && (
        <PlayCover
          label={`Play ${item.alt ?? "video"}`}
          onPlay={() => {
            markStarted();
            // Straight from the click, so the browser lets it play.
            void videoRef.current?.play().catch(() => {});
          }}
        />
      )}
    </>
  );
}

function ShowcaseItem({ item, title }: { item: ResolvedVideoPortfolioMedia; title: string }) {
  if (item.type === "youtube") {
    return item.youtubeId ? (
      <YouTubeEmbed id={item.youtubeId} title={item.alt ?? title} coverTitle={item.coverTitle} />
    ) : (
      <MediaComingSoon hint={YOUTUBE_HINT} />
    );
  }
  if (!item.available) return <MediaComingSoon hint={fileHint(item.src)} />;
  return item.type === "video" ? <ShowcaseVideo item={item} /> : <ShowcaseImage item={item} />;
}

const mediaKey = (item: ResolvedVideoPortfolioMedia) => (item.type === "youtube" ? item.youtubeId : item.src);

const PLAY_MARK = (
  <svg
    aria-hidden="true"
    viewBox="-0.5 0 8 8"
    shapeRendering="crispEdges"
    className="absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 text-white drop-shadow"
  >
    <path fill="currentColor" d="M2 1h1v6H2zM3 2h1v4H3zM4 3h1v2H4z" />
  </svg>
);

// What a thumbnail shows: the image itself, YouTube's own still for an
// embed, or a play mark for a local video (so no video loads just for this).
function ThumbnailContent({ item }: { item: ResolvedVideoPortfolioMedia }) {
  if (!item.available) return null;
  if (item.type === "image") {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={item.src} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />;
  }
  if (item.type === "youtube") {
    return (
      <>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`https://i.ytimg.com/vi/${item.youtubeId}/mqdefault.jpg`}
          alt=""
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover"
        />
        {PLAY_MARK}
      </>
    );
  }
  return PLAY_MARK;
}

// One media frame for an entry, with prev/next arrows, a count and touch
// swipe when the entry has more than one item -- plus, optionally, a row of
// thumbnails to jump straight to one. Only the current item is ever mounted,
// so nothing off-screen loads and changing items stops the one left.
export function MediaShowcase({
  media,
  title,
  frameAspect = 16 / 9,
  thumbnails = false,
  fitFrameToItem = false,
}: {
  media: ResolvedVideoPortfolioMedia[];
  title: string;
  frameAspect?: number;
  thumbnails?: boolean;
  fitFrameToItem?: boolean;
}) {
  const [index, setIndex] = useState(0);
  const total = media.length;
  const item = media[index];
  // Optionally the frame takes each item's own shape as it's shown: an image
  // its width / height, an embed 16:9 (anything unknown keeps frameAspect).
  const itemAspect = item.type === "image" ? item.aspect : item.type === "youtube" ? 16 / 9 : undefined;
  const aspect = fitFrameToItem ? (itemAspect ?? frameAspect) : frameAspect;

  const step = useCallback(
    (delta: 1 | -1) => setIndex((current) => (current + delta + total) % total),
    [total],
  );

  const swipeOrigin = useRef<{ x: number; y: number } | null>(null);

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    swipeOrigin.current = null;
    if (total <= 1 || event.pointerType !== "touch") return;
    if (event.target instanceof HTMLVideoElement) {
      const rect = event.target.getBoundingClientRect();
      if (event.clientY > rect.bottom - VIDEO_CONTROLS_HEIGHT) return;
    }
    swipeOrigin.current = { x: event.clientX, y: event.clientY };
  }

  function handlePointerUp(event: PointerEvent<HTMLDivElement>) {
    const origin = swipeOrigin.current;
    swipeOrigin.current = null;
    if (!origin) return;
    const dx = event.clientX - origin.x;
    const dy = event.clientY - origin.y;
    if (Math.abs(dx) < SWIPE_THRESHOLD || Math.abs(dx) <= Math.abs(dy)) return;
    step(dx < 0 ? 1 : -1);
  }

  return (
    <div className="flex w-full flex-col items-center gap-3">
      <PixelFrame
        aspect={aspect}
        innerProps={{
          className: "[touch-action:pan-y_pinch-zoom]",
          onPointerDown: handlePointerDown,
          onPointerUp: handlePointerUp,
          onPointerCancel: () => (swipeOrigin.current = null),
        }}
      >
        <motion.div
          key={`${index}:${mediaKey(item)}`}
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          <ShowcaseItem item={item} title={title} />
        </motion.div>
      </PixelFrame>

      {thumbnails && total > 1 && (
        <ul aria-label={`${title}: all items`} className="mt-1.5 flex flex-wrap justify-center gap-1.5 sm:gap-2">
          {media.map((entry, i) => {
            const current = i === index;
            return (
              <li key={`${i}:${mediaKey(entry)}`}>
                <button
                  type="button"
                  onClick={() => setIndex(i)}
                  aria-label={`Show ${entry.alt ?? `item ${i + 1}`}`}
                  aria-current={current ? "true" : undefined}
                  className={`group block rounded-sm transition-opacity ${current ? "" : "opacity-55 hover:opacity-100"} ${FOCUS_CLASS}`}
                >
                  {/* A border the thumbnail's colour when it's the one shown. */}
                  <span
                    className={`pixel-frame-sm block p-[3px] transition-colors ${
                      current ? "bg-ink-soft" : "bg-ink-soft/25 group-hover:bg-ink-soft/50"
                    }`}
                  >
                    <span className="pixel-frame-sm relative block h-9 w-14 overflow-hidden bg-ink sm:h-11 sm:w-[4.5rem]">
                      <ThumbnailContent item={entry} />
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {total > 1 && (
        <div className="flex items-center gap-2 sm:gap-4">
          <button
            type="button"
            onClick={() => step(-1)}
            aria-label={`Previous item in ${title}`}
            className={ARROW_CLASS}
          >
            <Chevron direction="left" />
          </button>
          <p aria-live="polite" className="min-w-[7.5rem] text-center text-sm text-ink-soft">
            <span className="font-pixel-label tracking-wider text-ink">
              {index + 1} / {total}
            </span>
            {item.label && <span className="block text-xs text-ink-soft/70">{item.label}</span>}
          </p>
          <button type="button" onClick={() => step(1)} aria-label={`Next item in ${title}`} className={ARROW_CLASS}>
            <Chevron direction="right" />
          </button>
        </div>
      )}
    </div>
  );
}
