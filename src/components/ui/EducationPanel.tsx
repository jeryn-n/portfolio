"use client";

import { SITE } from "@/data/site";
import { Panel } from "./Panel";
import { useSiteUI } from "./SiteUIProvider";

export function EducationPanel() {
  const { activePanel, closePanel } = useSiteUI();

  return (
    <Panel open={activePanel === "education"} onClose={closePanel} title="Education">
      <div className="flex flex-col gap-2">
        <p className="font-bold">{SITE.education.school}</p>
        <p>{SITE.education.program}</p>
        <p className="text-ink-soft">{SITE.education.details}</p>
      </div>
    </Panel>
  );
}
