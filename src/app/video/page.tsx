import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import type { Metadata } from "next";
import { Archivo_Black } from "next/font/google";
import { VideoPortfolioPage } from "@/components/videos/VideoPortfolioPage";
import {
  configuredUrl,
  FIRST_VIDEO,
  parseYouTubeId,
  VIDEO_PORTFOLIO,
  type ResolvedVideoPortfolioEntry,
  type ResolvedVideoPortfolioMedia,
  type ResolvedVideoPortfolioSection,
  type VideoPortfolioEntry,
  type VideoPortfolioMedia,
} from "@/data/videoPortfolio";

// A heavy display face for the big audience figures (the pixel face's M reads
// as an H at that size). Loaded here so only /video pulls it in.
const statFont = Archivo_Black({ subsets: ["latin"], weight: "400", variable: "--font-stat" });

const DESCRIPTION = "Selected editing work across narrative film, branded content, video essays, and social media.";

export const metadata: Metadata = {
  title: "Video Editing Portfolio - Jeryn Nyberg",
  description: DESCRIPTION,
  alternates: { canonical: "https://imjeryn.dev/video" },
  openGraph: {
    title: "Video Editing Portfolio - Jeryn Nyberg",
    description: DESCRIPTION,
    url: "https://imjeryn.dev/video",
    siteName: "Jeryn's House",
    type: "website",
  },
};

// Whether a site path ("/videos/...") exists in public/. Checked while the
// page renders -- at build time for the static production page, on every
// request in `next dev` -- so a file dropped in shows up on the next build or
// refresh. Anything that isn't a local path is assumed to exist.
function inPublic(src: string): boolean {
  if (!src.startsWith("/")) return true;
  return existsSync(path.join(process.cwd(), "public", decodeURIComponent(src)));
}

// Standalone video editing portfolio. Content comes from
// src/data/videoPortfolio.ts; the only way in from the site is the menu.
export default function VideosRoute() {
  const sections: ResolvedVideoPortfolioSection[] = VIDEO_PORTFOLIO.map((section) => ({
    ...section,
    entries: section.entries.map(resolveEntry),
  }));
  return (
    <div className={statFont.variable}>
      <VideoPortfolioPage firstVideoId={parseYouTubeId(FIRST_VIDEO.youtubeId)} sections={sections} />
    </div>
  );
}

function resolveEntry(entry: VideoPortfolioEntry): ResolvedVideoPortfolioEntry {
  return {
    ...entry,
    // Sensitive work never carries media to the page, whatever the data says.
    media: entry.contentNote ? [] : (entry.media ?? []).map(resolveMedia),
    externalUrl: configuredUrl(entry.externalUrl),
    thumbnail: entry.thumbnail && inPublic(entry.thumbnail) ? entry.thumbnail : undefined,
  };
}

function resolveMedia(item: VideoPortfolioMedia): ResolvedVideoPortfolioMedia {
  if (item.type === "youtube") {
    const youtubeId = parseYouTubeId(item.youtubeId);
    return { ...item, youtubeId, available: youtubeId !== null };
  }
  if (item.type === "video") {
    return {
      ...item,
      poster: item.poster && inPublic(item.poster) ? item.poster : undefined,
      available: inPublic(item.src),
    };
  }
  const available = inPublic(item.src);
  return { ...item, available, aspect: available ? imageAspect(item.src) : undefined };
}

// Width / height of a PNG or JPEG in public/, read from its header (by its
// bytes, not its name -- some ".png" screenshots are really JPEGs); undefined
// for anything else.
function imageAspect(src: string): number | undefined {
  const bytes = readFileSync(path.join(process.cwd(), "public", decodeURIComponent(src)));
  // PNG: the IHDR chunk, straight after the signature.
  if (bytes.length > 24 && bytes.readUInt32BE(0) === 0x89504e47) {
    return bytes.readUInt32BE(16) / bytes.readUInt32BE(20);
  }
  // JPEG: walk the segments to the first start-of-frame marker.
  if (bytes.length > 4 && bytes.readUInt16BE(0) === 0xffd8) {
    let offset = 2;
    while (offset + 9 < bytes.length) {
      const marker = bytes.readUInt16BE(offset);
      if (marker >= 0xffc0 && marker <= 0xffcf && ![0xffc4, 0xffc8, 0xffcc].includes(marker)) {
        return bytes.readUInt16BE(offset + 7) / bytes.readUInt16BE(offset + 5);
      }
      offset += 2 + bytes.readUInt16BE(offset + 2);
    }
  }
  return undefined;
}
