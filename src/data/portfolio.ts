// Centralized portfolio content for the Experience and Projects scenes.
// Exactly 3 entries per category for v1 -- the shape intentionally doesn't
// block future batches, but pagination/archive support is out of scope here.
// All copy below is placeholder; the user will supply real text later.

export type MediaType = "image" | "video";

export interface FeatureItem {
  title: string;
  tagline?: string;
  image: string;
  imagePosition?: string;
  description: string;
  // Video rendering isn't implemented yet -- the type just leaves room for it.
  mediaType?: MediaType;
}

export interface ExternalLink {
  label: string;
  href: string;
}

export interface PortfolioEntry {
  slug: string;
  category: "experience" | "project";
  title: string;
  tagline: string;
  description: string;
  displayImage: string;
  // CSS object-position override for the 3:2 preview frame.
  displayImagePosition?: string;
  features: FeatureItem[];
  skills: string[];
  externalLinks?: ExternalLink[];
}

export const EXPERIENCE_ENTRIES: PortfolioEntry[] = [
  {
    slug: "experience-1",
    category: "experience",
    title: "Experience 1",
    tagline: "Placeholder tagline -- real copy coming soon.",
    description: "Placeholder description -- real copy coming soon.",
    displayImage: "/images/portfolio/experience-1.jpg",
    features: [],
    skills: ["Placeholder"],
  },
  {
    slug: "experience-2",
    category: "experience",
    title: "Experience 2",
    tagline: "Placeholder tagline -- real copy coming soon.",
    description: "Placeholder description -- real copy coming soon.",
    displayImage: "/images/portfolio/experience-2.jpg",
    features: [],
    skills: ["Placeholder"],
  },
  {
    slug: "experience-3",
    category: "experience",
    title: "Experience 3",
    tagline: "Placeholder tagline -- real copy coming soon.",
    description: "Placeholder description -- real copy coming soon.",
    displayImage: "/images/portfolio/experience-3.jpg",
    features: [],
    skills: ["Placeholder"],
  },
];

export const PROJECT_ENTRIES: PortfolioEntry[] = [
  {
    slug: "project-1",
    category: "project",
    title: "Project 1",
    tagline: "Placeholder tagline -- real copy coming soon.",
    description: "Placeholder description -- real copy coming soon.",
    displayImage: "/images/portfolio/project-1.jpg",
    features: [],
    skills: ["Placeholder"],
  },
  {
    slug: "project-2",
    category: "project",
    title: "Project 2",
    tagline: "Placeholder tagline -- real copy coming soon.",
    description: "Placeholder description -- real copy coming soon.",
    displayImage: "/images/portfolio/project-2.jpg",
    features: [],
    skills: ["Placeholder"],
  },
  {
    slug: "project-3",
    category: "project",
    title: "Project 3",
    tagline: "Placeholder tagline -- real copy coming soon.",
    description: "Placeholder description -- real copy coming soon.",
    displayImage: "/images/portfolio/project-3.jpg",
    features: [],
    skills: ["Placeholder"],
  },
];

export function getPortfolioEntry(slug: string): PortfolioEntry | undefined {
  return [...EXPERIENCE_ENTRIES, ...PROJECT_ENTRIES].find((entry) => entry.slug === slug);
}
