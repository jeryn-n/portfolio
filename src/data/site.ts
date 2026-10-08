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
    program2: string;
    details2: string;
  };
}

export const SITE: SiteData = {
  name: "Jeryn Nyberg",
  title: "Digital Creator",
  email: "jdnyberg@uci.edu",
  linkedinUrl: "www.linkedin.com/in/jerynn",
  resumeUrl: "/resume.pdf",
  about: {
    photoSrc: "/images/about/jeryn.jpg",
    bio: "A builder of things.",
  },
  education: {
    school: "University of California, Irvine",
    program: "School of Information and Computer Science",
    details: "B.S. Game Design & Interactive Media",
    program2: "School of Humanities",
    details2: "B.A. Film & Media Studies"
  },
};
