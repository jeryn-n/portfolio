"use client";

import { useSyncExternalStore } from "react";
import { setSharedMuted, sharedVolume, subscribeVolume } from "./sharedVolume";

// Media played since the page loaded (local video src or YouTube id). Once
// played, a player stays uncovered until the page is reloaded -- even after
// switching carousel items or leaving and coming back. Only ever added to
// from a click or play in the browser.
const played = new Set<string>();

export const hasPlayed = (key: string) => played.has(key);
export const markPlayed = (key: string) => void played.add(key);

const FOCUS_CLASS =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink-soft";

// Over a player until it's first played: a light-blue panel, like the "coming
// soon" one but in the light colour, with a play mark and a prompt (and an
// optional title in white on a navy band), so every player starts out looking
// the same rather than on whatever its first frame or thumbnail happens to
// be. The frame still shows faintly through.
//
// The whole panel is the play button; the optional sound toggle under the
// prompt sits above it as its own button (a button can't contain another).
export function PlayCover({
  label,
  title,
  onPlay,
  soundToggle = true,
}: {
  label: string;
  title?: string;
  onPlay: () => void;
  soundToggle?: boolean;
}) {
  return (
    <div
      className="group @container absolute inset-0 bg-loader-ink/80 text-ink-soft"
      style={{
        backgroundImage:
          "linear-gradient(rgb(28 58 94 / 6%) 1px, transparent 1px), linear-gradient(90deg, rgb(28 58 94 / 6%) 1px, transparent 1px)",
        backgroundSize: "16px 16px",
      }}
    >
      <button
        type="button"
        aria-label={label}
        onClick={onPlay}
        className="absolute inset-0 h-full w-full focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-ink-soft"
      />
      {/* Three rows, the outer two always equal, so the play mark sits at the
          exact centre of the frame: the title above it, the prompt and sound
          toggle below. */}
      <div className="pointer-events-none relative grid h-full grid-rows-[minmax(0,1fr)_auto_minmax(0,1fr)] justify-items-center px-3">
        <div className="flex items-end pb-2.5 sm:pb-3">
          {title && (
            // Sized by the frame, not the screen: a small frame (the first
            // video's) keeps the smaller title so it fits above the centre.
            <span className="pixel-frame-sm max-w-full bg-ink-soft px-3 py-1.5 text-center font-pixel-label text-sm leading-tight tracking-wider text-white @md:text-lg">
              {title}
            </span>
          )}
        </div>
        {/* A wide, smooth white play triangle with softened corners on a
            navy, slightly rounded plate (like YouTube's button), both centred
            in the box. */}
        <span className="flex h-[2.55rem] w-[3.72rem] items-center justify-center rounded-xl bg-ink-soft/80 transition-transform group-hover:scale-110 sm:h-[3.1875rem] sm:w-[4.675rem]">
          <svg aria-hidden="true" viewBox="0 0 12 9" className="h-[1.4rem] w-[1.9rem] text-white sm:h-[1.8rem] sm:w-[2.4rem]">
            <path
              d="M1.5 1 L10.5 4.5 L1.5 8 Z"
              fill="currentColor"
              stroke="currentColor"
              strokeWidth={1.5}
              strokeLinejoin="round"
            />
          </svg>
        </span>
        <div className="flex flex-col items-center gap-1.5 pt-2.5 sm:gap-2 sm:pt-3">
          <span className="font-pixel-label text-xs uppercase tracking-[0.2em] sm:text-sm">Press play</span>
          {soundToggle && <SoundToggle />}
        </div>
      </div>
    </div>
  );
}

// Mutes / unmutes every player on the page (the shared volume), and follows
// changes made in any player.
function SoundToggle() {
  const muted = useSyncExternalStore(subscribeVolume, () => sharedVolume().muted, () => true);
  return (
    <button
      type="button"
      onClick={() => setSharedMuted(!muted)}
      aria-pressed={!muted}
      aria-label={muted ? "Sound off: turn sound on for all videos" : "Sound on: mute all videos"}
      title={muted ? "Sound off" : "Sound on"}
      // At least 44px square: phones steer taps toward the big play button
      // underneath, so a small target would lose the tap to it. The visible
      // navy ring sits inside that.
      className={`group/sound pointer-events-auto relative flex min-h-11 min-w-11 items-center justify-center rounded-full text-ink-soft ${FOCUS_CLASS}`}
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-ink-soft transition-colors group-hover/sound:bg-ink-soft/15 sm:h-10 sm:w-10">
        <SpeakerIcon muted={muted} />
      </span>
    </button>
  );
}

function SpeakerIcon({ muted }: { muted: boolean }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 11 9" shapeRendering="crispEdges" className="h-3.5 w-4 sm:h-4 sm:w-5">
      {/* A pixel speaker... */}
      <path fill="currentColor" d="M0 3h2v3H0zM2 2h1v5H2zM3 1h1v7H3zM4 0h1v9H4z" />
      {muted ? (
        // ...crossed out,
        <path fill="currentColor" d="M6 2h1v1H6zM7 3h1v1H7zM8 4h1v1H8zM9 5h1v1H9zM10 6h1v1h-1zM10 2h1v1h-1zM9 3h1v1H9zM7 5h1v1H7zM6 6h1v1H6z" />
      ) : (
        // ...or with two sound waves.
        <path fill="currentColor" d="M6 3h1v3H6zM8 1h1v1H8zM9 2h1v5H9zM8 7h1v1H8z" />
      )}
    </svg>
  );
}
