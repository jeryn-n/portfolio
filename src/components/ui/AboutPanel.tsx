"use client";

import type { ReactNode } from "react";
import { ASSETS } from "@/data/assets";
import { SITE } from "@/data/site";
import { Panel } from "./Panel";
import { PanelPhoto } from "./PanelPhoto";
import { useSiteUI } from "./SiteUIProvider";

const FOCUS_CLASS =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink-soft";

function EmailIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinejoin="round" strokeLinecap="round" className="h-4 w-4 shrink-0">
      <rect x="2.75" y="5" width="18.5" height="14" rx="1.75" />
      <path d="m3.5 6.25 8.5 6.5 8.5-6.5" />
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 shrink-0">
      <path d="M4.98 3.5a2.48 2.48 0 1 1 0 4.96 2.48 2.48 0 0 1 0-4.96zM3 9.75h3.96V21H3zM9.25 9.75h3.8v1.54h.05c.53-1 1.82-2.05 3.75-2.05 4.01 0 4.75 2.64 4.75 6.07V21h-3.96v-5.1c0-1.22-.02-2.78-1.7-2.78-1.7 0-1.96 1.33-1.96 2.7V21H9.25z" />
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 shrink-0">
      <path d="M12 .5a11.5 11.5 0 0 0-3.64 22.41c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.37-3.88-1.37-.53-1.33-1.28-1.69-1.28-1.69-1.05-.71.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.84 1.19 3.1 0 4.42-2.7 5.39-5.26 5.68.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .5z" />
    </svg>
  );
}

function ResumeIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinejoin="round" strokeLinecap="round" className="h-4 w-4 shrink-0">
      <path d="M14 2.75H6.5a1.75 1.75 0 0 0-1.75 1.75v15a1.75 1.75 0 0 0 1.75 1.75h11a1.75 1.75 0 0 0 1.75-1.75V8z" />
      <path d="M14 2.75V8h5.25M8.5 13h7M8.5 17h5" />
    </svg>
  );
}

// Every "UC Irvine" in the copy is a link to the Education panel. It's a
// button, since it opens a panel rather than going to a URL, styled as an
// inline link. The copy itself stays in src/data/site.ts.
const SCHOOL_NAME = "UC Irvine";

function linkSchool(text: string, onOpen: () => void): ReactNode[] {
  return text.split(SCHOOL_NAME).flatMap((part, index) =>
    index === 0
      ? [part]
      : [
          <button
            key={index}
            type="button"
            onClick={onOpen}
            className={`inline cursor-pointer border-0 bg-transparent p-0 text-inherit underline underline-offset-2 hover:text-ink ${FOCUS_CLASS}`}
          >
            {SCHOOL_NAME}
          </button>,
          part,
        ],
  );
}

interface AboutLink {
  label: string;
  href: string;
  icon: ReactNode;
  // Opens in a new tab (everything except mailto).
  external: boolean;
  ariaLabel?: string;
}

const LINKS: AboutLink[] = [
  { label: "Email", href: `mailto:${SITE.email}`, icon: <EmailIcon />, external: false, ariaLabel: `Email ${SITE.email}` },
  { label: "LinkedIn", href: SITE.linkedinUrl, icon: <LinkedInIcon />, external: true },
  { label: "GitHub", href: SITE.githubUrl, icon: <GitHubIcon />, external: true },
  { label: "Resume", href: SITE.resumeUrl, icon: <ResumeIcon />, external: true },
];

// One set of markup, arranged two ways with grid areas:
//   mobile  -- the photo top-left with the links stacked beside it, top-right
//              (four 44px buttons span the photo's height), then the heading
//              and copy centred underneath.
//   desktop -- the photo beside the copy, with the links in one row along
//              the bottom.
export function AboutPanel() {
  const { activePanel, closePanel, openPanel } = useSiteUI();

  return (
    <Panel open={activePanel === "about"} onClose={closePanel} title="About" size="wide">
      <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-6 [grid-template-areas:'photo_links'_'text_text'] md:gap-x-8 md:[grid-template-areas:'photo_text'_'links_links']">
        <PanelPhoto
          asset={ASSETS.aboutPhoto}
          alt={SITE.name}
          className="aspect-[4/5] w-32 [grid-area:photo] min-[360px]:w-40 sm:w-48 md:w-56"
        />

        <div className="text-center [grid-area:text] md:text-left">
          <h3 className="text-2xl font-bold leading-tight tracking-tight text-ink sm:text-[1.75rem]">About Me</h3>
          <div className="mt-3 flex flex-col gap-3 text-[15px] leading-relaxed text-ink-soft sm:text-base">
            {SITE.about.paragraphs.map((paragraph) => (
              <p key={paragraph}>{linkSchool(paragraph, () => openPanel("education", { returnTo: "about" }))}</p>
            ))}
          </div>
        </div>

        <nav aria-label="Links" className="[grid-area:links] md:border-t-2 md:border-ink-soft/15 md:pt-5">
          <ul className="flex h-full list-none flex-col justify-between gap-2 p-0 md:grid md:grid-cols-4 md:gap-3">
            {LINKS.map((link) => (
              <li key={link.label}>
                <a
                  href={link.href}
                  aria-label={link.ariaLabel}
                  title={link.external ? undefined : SITE.email}
                  {...(link.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                  className={`flex min-h-11 items-center justify-center gap-2 border-2 border-ink-soft px-2 py-2 text-xs font-bold uppercase tracking-wide text-ink transition-colors hover:bg-ink-soft hover:text-paper active:bg-ink active:text-paper sm:px-3 ${FOCUS_CLASS}`}
                >
                  {link.icon}
                  {link.label}
                  {link.external && <span className="sr-only">(opens in a new tab)</span>}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </Panel>
  );
}
