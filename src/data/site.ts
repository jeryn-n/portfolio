// Centralized, editable site content. Real copy/links will replace the
// placeholders here without any component changes.

// Whether Projects is discoverable from the homepage. While false, the
// Cabin -> Projects arrow, the menu's Projects item and the cabin's downward
// wheel/swipe/key travel are all off. Nothing is deleted: the scene stays
// mounted and the /projects/* detail routes stay built, so direct project
// URLs still work.
export const PROJECTS_ENABLED = true;

// Temporary: while true, the Projects scene shows its "Under Construction"
// cover instead of its entries (they aren't rendered at all). Independent of
// PROJECTS_ENABLED. Set to false to show the entries.
export const PROJECTS_UNDER_CONSTRUCTION = true;

export interface SiteData {
  name: string;
  title: string;
  email: string;
  linkedinUrl: string;
  githubUrl: string;
  resumeUrl: string;
  // The About and Education photos themselves are registered in
  // src/data/assets.ts (aboutPhoto, educationPhoto).
  about: {
    paragraphs: string[];
  };
  education: {
    school: string;
    // One per program, listed in order under the school.
    entries: { program: string; details: string }[];
  };
}

export const SITE: SiteData = {
  name: "Jeryn Nyberg",
  title: "Digital Creator",
  email: "jdnyberg@uci.edu",
  linkedinUrl: "https://www.linkedin.com/in/jerynn",
  githubUrl: "https://github.com/jeryn-n",
  resumeUrl: "/resume.pdf",
  about: {
    paragraphs: [
      "Hi, I’m Jeryn! I am a creative technologist studying Information Systems and Media at UC Irvine. I like working at the intersection of tech, media, design, and storytelling, whether that means building an interactive product, developing a visual experience, producing media, or approaching a creative problem strategically.",
      "I’m most interested in work that combines analytical thinking with creativity. Across my projects, I try to make things that are useful, memorable, and enjoyable to interact with.",
      "P.S. I designed everything on this website! You will find no AI here.",
    ],
  },
  education: {
    school: "University of California, Irvine",
    entries: [
      { program: "School of Information and Computer Science", details: "B.S. Game Design & Interactive Media" },
      { program: "School of Humanities", details: "B.A. Film & Media Studies" },
    ],
  },
};
