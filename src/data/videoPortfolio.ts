// Content for the /video page (the recruiter-facing video editing
// portfolio). Everything on that page is rendered from the data below, in
// order -- nothing is hardcoded in the components.
//
// Three ways to present a piece:
//   1. Local media -- short edits and screenshots in public/videos/<folder>/,
//      referenced by public path (no "public" prefix): { type: "video" | "image" }.
//      Until a file exists its slot shows a quiet "Media coming soon" panel
//      (in `npm run dev` it also names the path it expects).
//   2. YouTube embed -- { type: "youtube", youtubeId }. Long-form work that's
//      already on YouTube is embedded (privacy-enhanced, never autoplayed), not
//      copied into public/. `youtubeId` takes the 11-character id or any
//      YouTube URL; a "REPLACE_..." placeholder is never sent to YouTube.
//   3. External link only -- `externalUrl` with no embed: the sensitive
//      content card (`contentNote`) and the smaller secondary cards.
//
// Local videos: MP4 (H.264 video + AAC audio) plays everywhere, Safari
// included. Keep each file under 100 MB -- GitHub rejects anything larger.
// They load only their metadata until played.

export type VideoPortfolioMedia =
  | {
      type: "video";
      src: string;
      // An accessible name for the player.
      alt?: string;
      // Optional still shown before the video plays (e.g. a .jpg next to it).
      poster?: string;
      // Short caption shown beside the counter when an entry has several items.
      label?: string;
    }
  | { type: "image"; src: string; alt?: string; label?: string }
  | {
      type: "youtube";
      // The video id ("0OsN4vvA2rA") or any YouTube URL.
      youtubeId: string;
      // The embed's accessible title.
      alt?: string;
      label?: string;
      // Set to start the player under the page's "press play" cover, with
      // this title on it.
      coverTitle?: string;
    };

export type VideoPortfolioEntry = {
  // Also the card's anchor id (/video#dantes-disaster).
  slug: string;
  category: string;
  title: string;
  // A short line under the title. A 🏆 in it is drawn as a small pixel
  // trophy.
  subtitle?: string;
  description: string;
  role?: string;
  // "secondary" is a smaller card: a thumbnail (optional), the text and a
  // link -- no player.
  emphasis?: "primary" | "secondary";
  // Shown in the media frame, as a carousel when there are several.
  media?: VideoPortfolioMedia[];
  // Width / height of the media frame. Every item letterboxes inside it on a
  // navy background; 16/9 when omitted.
  frameAspect?: number;
  // Sensitive work: no media is shown at all. The frame becomes a content
  // warning card -- the warnings as tags, then the note -- that links out to
  // `externalUrl` instead.
  contentNote?: string;
  contentWarnings?: string[];
  // Show a row of small thumbnails under the media frame to pick items by.
  thumbnails?: boolean;
  // Reshape the frame to each item as it's shown (images by their own
  // width / height, embeds 16:9) instead of fitting everything in one shape.
  fitFrameToItem?: boolean;
  // A small note under the description.
  disclaimer?: string;
  // Secondary cards only: an optional still (public path).
  thumbnail?: string;
  // A large audience-results figure beside the text.
  highlight?: { value: string; label: string };
  // Full URL; links render only once one is filled in (null = not yet).
  externalUrl?: string | null;
  externalLabel?: string;
};

export type VideoPortfolioSection = {
  // The anchor id of the section (or of its only card's wrapper).
  slug: string;
  // Name in the desktop side index.
  navLabel: string;
  // Set for sections that group several cards under one heading.
  heading?: string;
  entries: VideoPortfolioEntry[];
};

// The light-hearted opener above the portfolio proper. It isn't in the side
// index.
export const FIRST_VIDEO = {
  label: "It had to start somewhere",
  title: "My First Video! - 3rd Grade",
  description: "Long before short films, client work, and editing timelines, there was this.",
  youtubeId: "0OsN4vvA2rA",
  coverTitle: "DONT LET THE PIGEON BE AN ENGINEER!",
};

export const VIDEO_PORTFOLIO: VideoPortfolioSection[] = [
  {
    slug: "academic-work",
    navLabel: "Academic Work",
    heading: "Academic Work",
    entries: [
      {
        slug: "dantes-disaster",
        category: "Narrative Film",
        title: "Dante's Disaster",
        subtitle: "Sound Design Award Winner 🏆 · College 48",
        description:
          "A short film completed in under 48 hours that went on to win a sound design award. Alongside the edit, I handled the sound design, capture, and music. The piece highlights my approach to narrative continuity, comedic timing, performance selection, pacing, and the relationship between picture and sound.",
        role: "Editing, sound design, capture, and music",
        media: [
          {
            type: "youtube",
            youtubeId: "https://youtu.be/SVLzVKxWzvg?si=D5g50LrUAZ_zPbX0",
            coverTitle: "DANTES DISASTER",
            alt: "Dante's Disaster (short film)",
          },
        ],
      },
      {
        slug: "rewriting-revenge",
        category: "Video Essay",
        title: "Rewriting Revenge",
        subtitle: "Academic Video Essay · Grade: A",
        description:
          "One of my strongest academic editing projects. The writing and the choice of topic weren't mine; I was responsible for the editing, content, flow, and narration, combining voice, visual evidence, pacing, and argument-driven structure into a cohesive video essay.",
        role: "Editing, content, flow, and narration (not the writing or topic)",
        contentWarnings: ["Blood and violence", "Sexual violence", "Mature themes"],
        contentNote:
          "This video essay depicts and discusses graphic material. Viewer discretion is strongly advised. Nothing from the essay is shown on this page.",
        externalUrl: "https://youtu.be/rfAaOZqA1Q4",
        externalLabel: "View Full Video Essay on YouTube",
      },
      {
        slug: "sticky-situation",
        category: "Additional Academic Editing",
        emphasis: "secondary",
        title: "Sticky Situation",
        description: "A small academic short I directed and edited. The sound was handled by others.",
        externalUrl: "https://youtu.be/2WHlPSu2_00",
        // Optional: a still, e.g. "/videos/academic/sticky-situation.jpg".
        thumbnail: undefined,
        externalLabel: "Watch on YouTube",
      },
    ],
  },
  {
    slug: "madison-art",
    navLabel: "Madison Art",
    entries: [
      {
        slug: "madison-art",
        category: "Branded / Client Work",
        title: "Madison Art",
        description:
          "Two selected videos produced for Madison Art Consulting, focused on presenting visual material clearly while maintaining a deliberate pace and polished tone. These pieces gave me experience shaping branded content around an existing visual identity.",
        frameAspect: 9 / 16,
        media: [
          { type: "video", src: "/videos/madison/madison-vertical-01.mp4", alt: "Madison Art, video 1" },
          { type: "video", src: "/videos/madison/madison-vertical-02.mp4", alt: "Madison Art, video 2" },
        ],
      },
    ],
  },
  {
    slug: "short-form",
    navLabel: "Short-Form",
    entries: [
      {
        slug: "short-form",
        category: "Social Media",
        title: "Short-Form Editing",
        description:
          "A limited selection of polished vertical edits created for other people and projects. These pieces demonstrate how I approach pacing, visual rhythm, emphasis, and clarity within the constraints of short-form content.",
        frameAspect: 9 / 16,
        media: [1, 2, 3, 4, 5].map((n) => ({
          type: "video" as const,
          src: `/videos/short-form/short-form-0${n}.mp4`,
          alt: `Short-form edit ${n}`,
        })),
      },
    ],
  },
  {
    slug: "audience-growth",
    navLabel: "Audience Growth",
    entries: [
      {
        slug: "audience-growth",
        category: "Comedy Brand",
        title: "Independent Content & Audience Growth",
        subtitle: "Millions of views across short-form content",
        description:
          "Editing has also been central to building my own comedy brand and experimenting directly with online audiences. Through short-form editing, visual pacing, and repeated iteration, the work has reached millions of views, including more than 5 million views on a single video.",
        highlight: { value: "5M+", label: "views on a single video" },
        disclaimer:
          "I no longer own or operate these accounts. Any content currently on them does not reflect my abilities or beliefs.",
        // The trailer, then the analytics, picked from thumbnails under it.
        thumbnails: true,
        // The analytics are tall phone screenshots; don't letterbox them.
        fitFrameToItem: true,
        media: [
          { type: "youtube", youtubeId: "https://www.youtube.com/watch?v=gv0j_HFGGJA", alt: "Comedy brand trailer" },
          ...[1, 2, 3, 4].map((n) => ({
            type: "image" as const,
            src: `/videos/comedy-brand/metrics-0${n}.png`,
            alt: `Audience analytics ${n}`,
          })),
        ],
        // Optional: a link to more social work.
        externalUrl: null,
        externalLabel: "See more social work",
      },
    ],
  },
];

// ---------------------------------------------------------------------------

// A YouTube video id from an id or a URL (watch, youtu.be, shorts, embed), or
// null for anything else -- including the "REPLACE_..." placeholders, so an
// unconfigured embed never makes a request.
export function parseYouTubeId(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (/^[\w-]{11}$/.test(trimmed)) return trimmed;
  const match = trimmed.match(
    /^https?:\/\/(?:www\.|m\.)?(?:youtube(?:-nocookie)?\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/|live\/)|youtu\.be\/)([\w-]{11})(?:[?&#/].*)?$/,
  );
  return match ? match[1] : null;
}

export const youTubeWatchUrl = (id: string) => `https://www.youtube.com/watch?v=${id}`;

// A configured external link, or null for a missing/placeholder one.
export function configuredUrl(value: string | null | undefined): string | null {
  return value && /^https?:\/\//.test(value.trim()) ? value.trim() : null;
}

// What the page receives: local files marked with whether they're actually in
// public/ (checked by the route on the server), and YouTube ids parsed, so
// anything missing shows its placeholder without ever being requested.
export type ResolvedVideoPortfolioMedia =
  | (Extract<VideoPortfolioMedia, { type: "video" }> & { available: boolean })
  // Images also carry their width / height, read from the file.
  | (Extract<VideoPortfolioMedia, { type: "image" }> & { available: boolean; aspect?: number })
  | (Omit<Extract<VideoPortfolioMedia, { type: "youtube" }>, "youtubeId"> & {
      youtubeId: string | null;
      available: boolean;
    });

export type ResolvedVideoPortfolioEntry = Omit<VideoPortfolioEntry, "media" | "externalUrl" | "thumbnail"> & {
  media: ResolvedVideoPortfolioMedia[];
  externalUrl: string | null;
  thumbnail?: string;
};

export type ResolvedVideoPortfolioSection = Omit<VideoPortfolioSection, "entries"> & {
  entries: ResolvedVideoPortfolioEntry[];
};
