import type { Metadata } from "next";
import { Silkscreen } from "next/font/google";
import { AppProviders } from "@/components/providers/AppProviders";
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

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`h-full ${pixelLabel.variable}`}>
      <body className="h-full antialiased">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
