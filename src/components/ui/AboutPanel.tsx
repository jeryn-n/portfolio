"use client";

import { ArtAsset } from "@/components/art/ArtAsset";
import { ASSETS } from "@/data/assets";
import { SITE } from "@/data/site";
import { Panel } from "./Panel";
import { useSiteUI } from "./SiteUIProvider";

export function AboutPanel() {
  const { activePanel, closePanel } = useSiteUI();

  return (
    <Panel open={activePanel === "about"} onClose={closePanel} title="About">
      <div className="flex flex-col gap-4">
        <div className="mx-auto w-40 overflow-hidden border-2 border-ink-soft">
          <ArtAsset asset={ASSETS.aboutPhoto} className="h-auto w-full" />
        </div>
        <p>{SITE.about.bio}</p>
        <a
          href={SITE.resumeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex w-fit items-center gap-1 border-2 border-ink-soft px-3 py-1.5 text-xs font-bold uppercase tracking-wide hover:bg-ink-soft hover:text-paper"
        >
          Resume ↗
        </a>
      </div>
    </Panel>
  );
}
