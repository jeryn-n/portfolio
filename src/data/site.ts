// Centralized, editable site content. Real copy/links will replace the
// placeholders here without any component changes.
export interface SiteData {
  name: string;
  title: string;
  email: string;
  // Not supplied yet -- stays explicitly null rather than an invented URL.
  // The LinkedIn control gracefully disables itself until this is filled in.
  linkedinUrl: string | null;
  resumeUrl: string;
  about: {
    photoSrc: string;
    bio: string;
  };
  education: {
    school: string;
    program: string;
    details: string;
  };
}

export const SITE: SiteData = {
  name: "Jeryn Nyberg",
  title: "Digital Creator",
  email: "jdnyberg@uci.edu",
  linkedinUrl: null,
  resumeUrl: "/resume.pdf",
  about: {
    photoSrc: "/images/about/jeryn.jpg",
    bio: "Placeholder bio -- real copy coming soon.",
  },
  education: {
    school: "University of California, Irvine",
    program: "Placeholder degree / program",
    details: "Placeholder education details -- real copy coming soon.",
  },
};
