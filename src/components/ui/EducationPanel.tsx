"use client";

import { ASSETS } from "@/data/assets";
import { SITE } from "@/data/site";
import { Panel } from "./Panel";
import { PanelPhoto } from "./PanelPhoto";
import { useSiteUI } from "./SiteUIProvider";

// Square photo, the school, then each of its programs -- all centred, in a
// panel that's square on desktop.
export function EducationPanel() {
  const { activePanel, closePanel } = useSiteUI();
  const { school, entries } = SITE.education;

  return (
    <Panel open={activePanel === "education"} onClose={closePanel} title="Education" size="square">
      <div className="flex min-h-full flex-col items-center justify-center gap-5 text-center sm:gap-6">
        <PanelPhoto asset={ASSETS.educationPhoto} alt={school} className="aspect-square w-36 sm:w-44 md:w-52" />
        <h3 className="text-2xl font-bold leading-tight text-ink sm:text-3xl md:text-[2.125rem]">{school}</h3>
        <ul className="flex list-none flex-col gap-4 p-0 sm:gap-5">
          {entries.map((entry) => (
            <li key={entry.program}>
              <p className="text-base font-bold leading-snug text-ink sm:text-lg md:text-xl">{entry.program}</p>
              <p className="text-base leading-snug text-ink-soft sm:text-lg md:text-xl">{entry.details}</p>
            </li>
          ))}
        </ul>
      </div>
    </Panel>
  );
}
