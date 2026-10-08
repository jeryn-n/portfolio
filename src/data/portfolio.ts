// Centralized portfolio content for the Experience and Projects scenes and
// their detail routes. Exactly 3 entries per category for v1 -- the shape
// intentionally doesn't block future batches, but pagination/archive support
// is out of scope here.
//
// All copy below is placeholder development content; the user will supply
// real text, screenshots, and skill icons later. Nothing here invents a real
// fact, destination, or credential.

export type MediaType = "image" | "video";

export type PortfolioCategory = "experience" | "project";

export interface FeatureItem {
  title: string;
  // Used as the large text on the detail page when present, falling back to
  // `title`.
  tagline?: string;
  image: string;
  imagePosition?: string;
  description: string;
  // Video rendering isn't implemented yet -- the type just leaves room for
  // it, and the detail page renders an explicit unsupported placeholder
  // rather than inventing playback behavior.
  mediaType?: MediaType;
}

export interface ExternalLink {
  label: string;
  href: string;
}

export interface Skill {
  name: string;
  // Real icon art hasn't arrived; a missing icon renders a clean square
  // placeholder instead.
  icon?: string;
}

export interface PortfolioEntry {
  slug: string;
  category: PortfolioCategory;
  title: string;
  tagline: string;
  description: string;
  displayImage: string;
  // CSS object-position override for the preview/detail media frames.
  displayImagePosition?: string;
  features: FeatureItem[];
  skills: Skill[];
  externalLinks?: ExternalLink[];
}

// example.com is the IANA-reserved example domain -- an explicit placeholder
// destination, not an invented real link.
const PLACEHOLDER_HREF = "https://example.com";

export const EXPERIENCE_ENTRIES: PortfolioEntry[] = [
  {
    slug: "experience-1",
    category: "experience",
    title: "Experience 1",
    tagline: "Placeholder tagline -- real copy coming soon.",
    description:
      "Placeholder description -- real copy coming soon. This paragraph exists only to give the detail template a realistic amount of body text to lay out.",
    displayImage: "/images/portfolio/experience-1.jpg",
    features: [
      {
        title: "Feature 1",
        tagline: "Placeholder feature tagline one.",
        image: "/images/portfolio/experience-1-feature-1.jpg",
        description: "Placeholder feature description -- real copy coming soon.",
      },
      {
        title: "Feature 2",
        tagline: "Placeholder feature tagline two.",
        image: "/images/portfolio/experience-1-feature-2.jpg",
        description: "Placeholder feature description -- real copy coming soon.",
      },
      {
        title: "Feature 3",
        tagline: "Placeholder feature tagline three.",
        image: "/images/portfolio/experience-1-feature-3.jpg",
        description: "Placeholder feature description -- real copy coming soon.",
      },
    ],
    skills: [
      { name: "Skill One" },
      { name: "Skill Two" },
      { name: "Skill Three" },
      { name: "Skill Four" },
      { name: "Skill Five" },
    ],
    externalLinks: [{ label: "Placeholder Link", href: PLACEHOLDER_HREF }],
  },
  {
    slug: "experience-2",
    category: "experience",
    title: "Experience 2",
    tagline: "Placeholder tagline -- real copy coming soon.",
    description:
      "Placeholder description -- real copy coming soon. This paragraph exists only to give the detail template a realistic amount of body text to lay out.",
    displayImage: "/images/portfolio/experience-2.jpg",
    features: [
      {
        title: "Feature 1",
        tagline: "Placeholder feature tagline one.",
        image: "/images/portfolio/experience-2-feature-1.jpg",
        description: "Placeholder feature description -- real copy coming soon.",
      },
      {
        title: "Feature 2",
        tagline: "Placeholder feature tagline two.",
        image: "/images/portfolio/experience-2-feature-2.jpg",
        description: "Placeholder feature description -- real copy coming soon.",
      },
    ],
    skills: [{ name: "Skill One" }, { name: "Skill Two" }, { name: "Skill Three" }, { name: "Skill Four" }],
  },
  {
    slug: "experience-3",
    category: "experience",
    title: "Experience 3",
    tagline: "Placeholder tagline -- real copy coming soon.",
    description:
      "Placeholder description -- real copy coming soon. This paragraph exists only to give the detail template a realistic amount of body text to lay out.",
    displayImage: "/images/portfolio/experience-3.jpg",
    features: [
      {
        title: "Feature 1",
        tagline: "Placeholder feature tagline one.",
        image: "/images/portfolio/experience-3-feature-1.jpg",
        description: "Placeholder feature description -- real copy coming soon.",
      },
      {
        title: "Feature 2",
        tagline: "Placeholder feature tagline two.",
        image: "/images/portfolio/experience-3-feature-2.jpg",
        description: "Placeholder feature description -- real copy coming soon.",
      },
      {
        title: "Feature 3",
        tagline: "Placeholder feature tagline three.",
        image: "/images/portfolio/experience-3-feature-3.jpg",
        description: "Placeholder feature description -- real copy coming soon.",
      },
    ],
    skills: [
      { name: "Skill One" },
      { name: "Skill Two" },
      { name: "Skill Three" },
      { name: "Skill Four" },
      { name: "Skill Five" },
      { name: "Skill Six" },
    ],
  },
];

export const PROJECT_ENTRIES: PortfolioEntry[] = [
  {
    slug: "project-1",
    category: "project",
    title: "Project 1",
    tagline: "Placeholder tagline -- real copy coming soon.",
    description:
      "Placeholder description -- real copy coming soon. This paragraph exists only to give the detail template a realistic amount of body text to lay out.",
    displayImage: "/images/portfolio/project-1.jpg",
    features: [
      {
        title: "Feature 1",
        tagline: "Placeholder feature tagline one.",
        image: "/images/portfolio/project-1-feature-1.jpg",
        description: "Placeholder feature description -- real copy coming soon.",
      },
      {
        title: "Feature 2",
        tagline: "Placeholder feature tagline two.",
        image: "/images/portfolio/project-1-feature-2.jpg",
        description: "Placeholder feature description -- real copy coming soon.",
      },
      {
        title: "Feature 3",
        tagline: "Placeholder feature tagline three.",
        image: "/images/portfolio/project-1-feature-3.jpg",
        description: "Placeholder feature description -- real copy coming soon.",
      },
    ],
    skills: [
      { name: "Skill One" },
      { name: "Skill Two" },
      { name: "Skill Three" },
      { name: "Skill Four" },
      { name: "Skill Five" },
      { name: "Skill Six" },
    ],
    externalLinks: [
      { label: "Placeholder Link", href: PLACEHOLDER_HREF },
      { label: "Placeholder Repo", href: PLACEHOLDER_HREF },
    ],
  },
  {
    slug: "project-2",
    category: "project",
    title: "Project 2",
    tagline: "Placeholder tagline -- real copy coming soon.",
    description:
      "Placeholder description -- real copy coming soon. This paragraph exists only to give the detail template a realistic amount of body text to lay out.",
    displayImage: "/images/portfolio/project-2.jpg",
    features: [
      {
        title: "Feature 1",
        tagline: "Placeholder feature tagline one.",
        image: "/images/portfolio/project-2-feature-1.jpg",
        description: "Placeholder feature description -- real copy coming soon.",
      },
      {
        title: "Feature 2",
        tagline: "Placeholder feature tagline two.",
        image: "/images/portfolio/project-2-feature-2.jpg",
        description: "Placeholder feature description -- real copy coming soon.",
      },
    ],
    skills: [{ name: "Skill One" }, { name: "Skill Two" }, { name: "Skill Three" }, { name: "Skill Four" }],
  },
  {
    slug: "project-3",
    category: "project",
    title: "Project 3",
    tagline: "Placeholder tagline -- real copy coming soon.",
    description:
      "Placeholder description -- real copy coming soon. This paragraph exists only to give the detail template a realistic amount of body text to lay out.",
    displayImage: "/images/portfolio/project-3.jpg",
    features: [
      {
        title: "Feature 1",
        tagline: "Placeholder feature tagline one.",
        image: "/images/portfolio/project-3-feature-1.jpg",
        description: "Placeholder feature description -- real copy coming soon.",
      },
      {
        title: "Feature 2",
        tagline: "Placeholder feature tagline two.",
        image: "/images/portfolio/project-3-feature-2.jpg",
        description: "Placeholder feature description -- real copy coming soon.",
      },
      {
        title: "Feature 3",
        tagline: "Placeholder feature tagline three.",
        image: "/images/portfolio/project-3-feature-3.jpg",
        description: "Placeholder feature description -- real copy coming soon.",
      },
    ],
    skills: [{ name: "Skill One" }, { name: "Skill Two" }, { name: "Skill Three" }],
  },
];

function getCategoryEntries(category: PortfolioCategory): PortfolioEntry[] {
  return category === "experience" ? EXPERIENCE_ENTRIES : PROJECT_ENTRIES;
}

// Category-scoped lookup, so /projects/experience-1 resolves to nothing and
// the route can 404 instead of rendering a cross-category entry.
export function getCategoryEntry(category: PortfolioCategory, slug: string): PortfolioEntry | undefined {
  return getCategoryEntries(category).find((entry) => entry.slug === slug);
}

// Previous/Next Entry navigation loops within one category and never crosses
// into the other.
export function getSiblingEntries(entry: PortfolioEntry): { previous: PortfolioEntry; next: PortfolioEntry } {
  const entries = getCategoryEntries(entry.category);
  const index = entries.findIndex((candidate) => candidate.slug === entry.slug);
  const length = entries.length;
  return {
    previous: entries[(index - 1 + length) % length],
    next: entries[(index + 1) % length],
  };
}

// Route path for an entry -- the single place the category/URL mapping lives,
// shared by the scene previews and the detail page's own controls.
export function getEntryHref(entry: PortfolioEntry): string {
  return entry.category === "project" ? `/projects/${entry.slug}` : `/experience/${entry.slug}`;
}

// Where a detail page's Exit control returns to: the parent scene on the
// homepage, addressed by hash.
export function getCategorySceneHref(category: PortfolioCategory): string {
  return category === "project" ? "/#projects" : "/#experience";
}
