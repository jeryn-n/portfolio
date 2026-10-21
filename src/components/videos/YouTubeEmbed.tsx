"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { hasPlayed, markPlayed, PlayCover } from "./PlayCover";
import {
  applyToEmbed,
  listenToEmbed,
  markEmbedLoaded,
  pauseEmbed,
  playEmbed,
  sharedVolume,
  YOUTUBE_ORIGIN,
} from "./sharedVolume";

// A privacy-enhanced YouTube player filling its (positioned) parent. Lazy, never
// autoplayed, and following the page's shared volume (muted by default).
// Callers only render it with a real, parsed video id.
//
// With a `coverTitle`, it starts under the page's light-blue "press play"
// cover with that title on it. One click lifts the cover for good (until a
// reload) and starts the video; after that YouTube's own controls work as
// normal.
export function YouTubeEmbed({ id, title, coverTitle }: { id: string; title: string; coverTitle?: string }) {
  const ref = useRef<HTMLIFrameElement>(null);
  // Fixed at mount so the src never changes (which would reload the player);
  // later volume changes go over postMessage instead.
  const [mutedAtMount] = useState(() => sharedVolume().muted);
  const [covered, setCovered] = useState(() => Boolean(coverTitle) && !hasPlayed(id));
  const loaded = useRef(false);
  const playWhenLoaded = useRef(false);

  // Pause on the way out: leaving the route keeps the page alive but hidden,
  // and a hidden iframe would otherwise keep playing.
  useLayoutEffect(() => {
    const iframe = ref.current;
    return () => pauseEmbed(iframe);
  }, []);

  function play() {
    markPlayed(id);
    setCovered(false);
    const iframe = ref.current;
    if (!iframe) return;
    // Focus moves into the player, which also pauses any other video (the
    // page's one-at-a-time rule).
    iframe.focus();
    if (loaded.current) playEmbed(iframe);
    else playWhenLoaded.current = true;
  }

  return (
    <>
      <iframe
        ref={ref}
        data-youtube-embed=""
        src={`${YOUTUBE_ORIGIN}/embed/${id}?rel=0&enablejsapi=1&mute=${mutedAtMount ? 1 : 0}`}
        title={title}
        loading="lazy"
        // `autoplay` only lets the cover's click start the video (nothing
        // plays by itself -- there's no autoplay parameter).
        allow="autoplay; accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
        className="absolute inset-0 h-full w-full border-0"
        onLoad={(event) => {
          const iframe = event.currentTarget;
          loaded.current = true;
          markEmbedLoaded(iframe);
          // Catch up on any change since mount, and hear about the viewer's.
          applyToEmbed(iframe);
          listenToEmbed(iframe);
          if (playWhenLoaded.current) playEmbed(iframe);
        }}
      />
      {covered && <PlayCover label={`Play ${title}`} title={coverTitle} onPlay={play} soundToggle={false} />}
    </>
  );
}
