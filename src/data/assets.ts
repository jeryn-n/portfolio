export interface ArtAssetDef {
  id: string;
  src: string;
  label: string;
  designWidth: number;
  designHeight: number;
}

export const ASSETS = {
  // Cabin
  cabinExteriorBackground: {
    id: "cabinExteriorBackground",
    src: "/art/cabin/exterior-background.png",
    label: "Exterior Background",
    designWidth: 1920,
    designHeight: 1080,
  },
  cabinExterior: {
    id: "cabinExterior",
    src: "/art/cabin/cabin-exterior.png",
    label: "Cabin Exterior",
    designWidth: 760,
    designHeight: 570,
  },
  cabinFrontWall: {
    id: "cabinFrontWall",
    src: "/art/cabin/cabin-front-wall.png",
    label: "Cabin Front Wall",
    designWidth: 760,
    designHeight: 570,
  },
  cabinInterior: {
    id: "cabinInterior",
    src: "/art/cabin/cabin-interior.png",
    label: "Cabin Interior",
    designWidth: 760,
    designHeight: 570,
  },
  houseSign: {
    id: "houseSign",
    src: "/art/cabin/house-sign.png",
    label: "Jeryn's House Sign",
    designWidth: 210,
    designHeight: 140,
  },
  cat: {
    id: "cat",
    src: "/art/cabin/cat.png",
    label: "Cat",
    designWidth: 150,
    designHeight: 120,
  },
  gramophone: {
    id: "gramophone",
    src: "/art/cabin/gramophone.png",
    label: "Gramophone",
    designWidth: 150,
    designHeight: 160,
  },
  uciFlag: {
    id: "uciFlag",
    src: "/art/cabin/uci-flag.png",
    label: "UCI Flag",
    designWidth: 220,
    designHeight: 130,
  },
  contactFrame: {
    id: "contactFrame",
    src: "/art/cabin/contact-frame.png",
    label: "Contact Frame",
    designWidth: 300,
    designHeight: 90,
  },
  titleCard: {
    id: "titleCard",
    src: "/art/cabin/title-card.png",
    label: "Roof Title Card",
    designWidth: 380,
    designHeight: 105,
  },

  // UI
  uiExclamation: {
    id: "uiExclamation",
    src: "/art/ui/exclamation.png",
    label: "Exclamation Hint",
    designWidth: 48,
    designHeight: 64,
  },

  // Ambient
  ambientCloud1: {
    id: "ambientCloud1",
    src: "/art/ambient/cloud-1.png",
    label: "Ambient Cloud 1",
    designWidth: 360,
    designHeight: 150,
  },
  ambientCloud2: {
    id: "ambientCloud2",
    src: "/art/ambient/cloud-2.png",
    label: "Ambient Cloud 2",
    designWidth: 450,
    designHeight: 175,
  },
  ambientBird: {
    id: "ambientBird",
    src: "/art/ambient/bird.png",
    label: "Bird",
    designWidth: 80,
    designHeight: 50,
  },

  // Experience
  experienceBackground: {
    id: "experienceBackground",
    src: "/art/experience/background.png",
    label: "Experience Background",
    designWidth: 1920,
    designHeight: 1080,
  },
  experienceCloud1: {
    id: "experienceCloud1",
    src: "/art/experience/cloud-1.png",
    label: "Experience Cloud 1",
    designWidth: 620,
    designHeight: 350,
  },
  experienceCloud2: {
    id: "experienceCloud2",
    src: "/art/experience/cloud-2.png",
    label: "Experience Cloud 2",
    designWidth: 620,
    designHeight: 350,
  },
  experienceCloud3: {
    id: "experienceCloud3",
    src: "/art/experience/cloud-3.png",
    label: "Experience Cloud 3",
    designWidth: 620,
    designHeight: 350,
  },

  // Projects
  projectsBackground: {
    id: "projectsBackground",
    src: "/art/projects/background.png",
    label: "Projects Background",
    designWidth: 1920,
    designHeight: 1080,
  },
  projectBoulder1: {
    id: "projectBoulder1",
    src: "/art/projects/boulder-1.png",
    label: "Project Boulder 1",
    designWidth: 620,
    designHeight: 350,
  },
  projectBoulder2: {
    id: "projectBoulder2",
    src: "/art/projects/boulder-2.png",
    label: "Project Boulder 2",
    designWidth: 620,
    designHeight: 350,
  },
  projectBoulder3: {
    id: "projectBoulder3",
    src: "/art/projects/boulder-3.png",
    label: "Project Boulder 3",
    designWidth: 620,
    designHeight: 350,
  },
} as const satisfies Record<string, ArtAssetDef>;

export type AssetId = keyof typeof ASSETS;
