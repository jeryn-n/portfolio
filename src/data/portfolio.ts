// Centralized portfolio content for the Experience and Projects scenes and
// their detail routes. Exactly 3 entries per category for v1 -- the shape
// intentionally doesn't block future batches, but pagination/archive support
// is out of scope here.
//
// All copy below is placeholder development content; the user will supply
// real text, screenshots, and skill icons later. Nothing here invents a real
// fact, destination, or credential.
//
// Media lives in public/portfolio/experience/ and public/portfolio/projects/,
// named <slug>.jpg for an entry's overview/preview image and
// <slug>-feature-<n>.jpg for its features. Until a file exists, its
// placeholder shows that exact filename and folder.

export type MediaType = "image" | "video";

// A media path split into what its placeholder shows: the filename to create
// and the public folder to put it in.
export function mediaFileHint(src: string): { file: string; folder: string } {
  const slash = src.lastIndexOf("/");
  return { file: src.slice(slash + 1), folder: `public${src.slice(0, slash + 1)}` };
}

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
  // The feature's photo is a flat grey "Coming Soon" card instead of `image`.
  mediaComingSoon?: boolean;
  // Shown only while this feature's slide is up, after any entry-level links.
  externalLinks?: ExternalLink[];
}

export interface ExternalLink {
  label: string;
  href: string;
}

// An href with no scheme ("www.createuci.com") would resolve relative to the
// current route (/experience/www.createuci.com), so it's treated as https.
export function externalHref(href: string): string {
  return /^[a-z][a-z\d+.-]*:/i.test(href) ? href : `https://${href.replace(/^\/+/, "")}`;
}

export interface Skill {
  name: string;
  // Optional override. Normally left out: the icon path is derived from the
  // name (skillNameToIconPath), and a missing file renders a clean square
  // placeholder instead.
  icon?: string;
}

// Skill icons are named after the skill with every non-letter removed,
// lowercased: "Project Management" -> projectmanagement.png, "C++" -> c.png,
// "UI/UX" -> uiux.png. Deterministic, so there's no filename map to maintain.
export function skillNameToIconPath(name: string): string {
  return `/art/skills/${name.replace(/[^A-Za-z]/g, "").toLowerCase()}.png`;
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
  // The cover image (scene preview and detail overview) shows under a
  // delicate grey "Coming Soon" overlay.
  coverComingSoon?: boolean;
  features: FeatureItem[];
  skills: Skill[];
  // Shown on every slide of the entry, overview and features alike.
  externalLinks?: ExternalLink[];
}

// example.com is the IANA-reserved example domain -- an explicit placeholder
// destination, not an invented real link.
const PLACEHOLDER_HREF = "https://example.com";

export const EXPERIENCE_ENTRIES: PortfolioEntry[] = [
  {
    slug: "experience-1",
    category: "experience",
    title: "Creative Net",
    tagline: "Connecting creatives across UC Irvine.",
    description:
      "The Creative Media Network at UCI is an emerging organization on campus that helps streamline the connection process of artists across different mediums. I directed the design, development, and deployment of the website that our organization resides on.",
    displayImage: "/portfolio/experience/experience-1.jpg",
    features: [
      {
        title: "Website",
        image: "/portfolio/experience/experience-1-feature-1.jpg",
        description: "Using my skills in UI/UX and dynamic networking systems, I built and promoted a functional platform that hosts over 30 individual members, allowing them to connect and collaborate anytime, from wherever they are.",
      },
      {
        title: "Design",
        image: "/portfolio/experience/experience-1-feature-2.jpg",
        description: "From logos and page designs to marketing material and presentations, I managed the creative development of this project from development to deployment.",
      },
    ],
    skills: [
      { name: "UI/UX" },
      { name: "React" },
      { name: "HTML" },
      { name: "CSS" },
      { name: "SQL" },
      { name: "Design" },
    ],
    externalLinks: [{ label: "CreateUCI.com", href: "https://www.createuci.com" }],
  },
  {
    slug: "experience-2",
    category: "experience",
    title: "Madison Art Consulting",
    tagline: "Using creative platforms to make a real difference.",
    description:
      "At Madison, I worked alongside award winning designers to deliver media packages and implementation plans for corporate entities.",
    displayImage: "/portfolio/experience/experience-2.jpg",
    features: [
      {
        title: "Art Project Lead",
        image: "/portfolio/experience/experience-2-feature-1.jpg",
        description: "I was responsible for the research, development, and presentation of an initial design plan for a series of artwork (over 200 sq ft) to be professionally designed and installed for a new hospital care unit.",
      },
      {
        title: "Inventory Management",
        image: "/portfolio/experience/experience-2-feature-2.jpg",
        description: "Using excel and python, I scraped through hundreds of scattered inventory entries provided by a law firm client. I was then responsible for the validation and presentation of the $500,000+ of artistic inventory for the firm.",
      },
      {
        title: "Website Security",
        image: "/portfolio/experience/experience-2-feature-3.jpg",
        description: "I performed a full audit of the company website, reinforcing design flaws, security hazards, and technical risks.",
      },
    ],
    skills: [{ name: "Internship" }, { name: "Media" }, { name: "Design" }, { name: "Excel" }, { name: "CyberSecurity" }, { name: "Leadership" }],
  },
  {
    slug: "experience-3",
    category: "experience",
    title: "Turnbull Equine Productions",
    tagline: "Digital renovation for a live auction platform.",
    description:
      "In progress. Updates coming soon.",
    displayImage: "/portfolio/experience/experience-3.jpg",
    coverComingSoon: true,
    features: [
      {
        title: "In Progress",
        image: "/portfolio/experience/experience-3-feature-1.jpg",
        mediaComingSoon: true,
        description: "",
      },
    ],
    skills: [
      { name: "Internship" },
      { name: "UI/UX" },
      { name: "Design" },
      { name: "Content" },
      { name: "Media" },
      { name: "Strategy" },
    ],
  },
];

export const PROJECT_ENTRIES: PortfolioEntry[] = [
  {
    slug: "project-1",
    category: "project",
    title: "Content",
    tagline: "Tangible metrics on creative exercises.",
    description:
      "",
    displayImage: "/portfolio/projects/project-1.jpg",
    features: [
      {
        title: "Souplex",
        image: "/portfolio/projects/project-1-feature-1.jpg",
        description: "A multi-platform comedy brand achieving: \n - 35+ million views \n - 5+ million interactions \n - 22+ thousand followers \n - 250+ active community members",
      },
      {
        title: "Strategy Consultant",
        image: "/portfolio/projects/project-1-feature-2.jpg",
        description: "Analyzed content performance, publishing structure, and creative format to identify barriers to sustainable growth. Recommended data-informed changes that increased typical video viewership from approximately 500–1,000 views to more than 10,000 views per video.",
      },
    ],
    skills: [
      { name: "Scripts" },
      { name: "Editing" },
      { name: "Audio" },
      { name: "Analysis" },
      { name: "Metrics" },
    ],
  },
  {
    slug: "project-2",
    category: "project",
    title: "Programming",
    tagline: "Because you just can’t escape it.",
    description:
      "Programming has been essential to so much of the creative and professional work I have done. Check out some of the highlights here.",
    displayImage: "/portfolio/projects/project-2.jpg",
    features: [
      {
        title: "Dart Job Finder",
        image: "/portfolio/projects/project-2-feature-1.jpg",
        description: "",
      },
      {
        title: "Fully Functional DBMS",
        image: "/portfolio/projects/project-2-feature-2.jpg",
        description: "",
      },
      {
        title: "Github",
        image: "/portfolio/projects/project-2-feature-3.jpg",
        description: "",
        // Placeholder destination -- swap in the real GitHub profile URL.
        externalLinks: [{ label: "GitHub", href: PLACEHOLDER_HREF }],
      },
    ],
    skills: [{ name: "Python" }, { name: "C++" }, { name: "Javascript" }, { name: "HTML" }, { name: "Git" }, { name: "AI" }],
  },
  {
    slug: "project-3",
    category: "project",
    title: "Production",
    tagline: "Beyond the computer screen.",
    description:
      "I have developed a bredth of experience around creative production, from the courses I have taken, to the array of short films I have helped produce, to the performances I have participated in.",
    displayImage: "/portfolio/projects/project-3.jpg",
    features: [
      {
        title: "Dante’s Disaster (Award)",
        image: "/portfolio/projects/project-3-feature-1.jpg",
        description: "I was awarded the national Sound Design award at the College 48 short film awards ceremony for my sound capture, editing and sound design work in our 7-minute short.",
      },
      {
        title: "Music Performance (Award)",
        image: "/portfolio/projects/project-3-feature-2.jpg",
        description: "I was awarded the principal player for my instrument at both the Colorado All-State and Colorado University honors festivals after multiple rigorous rounds of auditions. I also held leadership positions in multiple state-wide and nationally awarded ensembles.",
      },
    ],
    skills: [{ name: "Project Management" }, { name: "Camera" }, { name: "Audio" }, { name: "Editing" }, { name: "Music" }, { name: "Leadership" }],
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
