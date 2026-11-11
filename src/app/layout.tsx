import { existsSync } from "node:fs";
import path from "node:path";
import type { CSSProperties } from "react";
import type { Metadata } from "next";
import { Silkscreen } from "next/font/google";
import { AppProviders } from "@/components/providers/AppProviders";
import { CURSOR_SPRITES } from "@/data/assets";
import "./globals.css";

// The cabin sign's face (see CabinInterior), for both the name and the title:
// Silkscreen Bold, a squared pixel face. next/font self-hosts it (a few KB,
// latin only) and exposes it as a CSS variable, which globals.css turns into
// the font-pixel-label utility.
const pixelLabel = Silkscreen({ subsets: ["latin"], weight: "700", variable: "--next-font-pixel-label" });

// imjeryn.dev is the canonical domain (imjeryn.com redirects to it), and the
// base every relative metadata URL resolves against.
export const metadata: Metadata = {
  metadataBase: new URL("https://imjeryn.dev"),
  title: "Jeryn's House",
  description:
    "An interactive portfolio.",
  openGraph: {
    title: "Jeryn's House",
    description:
      "An interactive portfolio.",
    url: "https://imjeryn.dev",
    siteName: "Jeryn's House'",
    type: "website",
  },
};

// The site's cursor sprites that are actually in public/, as the CSS
// variables globals.css reads. Checked while the page renders -- at build
// time for the static pages, on every request in `next dev`, as /video does
// for its media -- so a sprite that isn't there yet is never requested, and
// the browser's own cursors stand in.
function cursorVariables(): CSSProperties {
  const variables: Record<string, string> = {};
  for (const [name, sprite] of Object.entries(CURSOR_SPRITES)) {
    if (existsSync(path.join(process.cwd(), "public", sprite.src))) {
      variables[`--cursor-${name}`] = `url(${sprite.src}) ${sprite.hotspot.x} ${sprite.hotspot.y}, ${sprite.fallback}`;
    }
  }
  return variables;
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`h-full ${pixelLabel.variable}`} style={cursorVariables()}>
      <body className="h-full antialiased">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
