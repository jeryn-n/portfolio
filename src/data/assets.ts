export interface ArtAssetDef {
  id: string;
  src: string;
  label: string;
  designWidth: number;
  designHeight: number;
}

export const ASSETS = {
  // Cabin exterior environment: two registered layers of one 1920x1620
  // master. The mountains-ground layer is transparent above the peaks, so
  // rear clouds can pass behind it. Both are cropped, never stretched -- see
  // ExteriorCrop in src/lib/layout.ts.
  cabinSky: {
    id: "cabinSky",
    src: "/art/cabin/sky.png",
    label: "Sky",
    designWidth: 1920,
    designHeight: 1620,
  },
  cabinMountainsGround: {
    id: "cabinMountainsGround",
    src: "/art/cabin/mountains-ground.png",
    label: "Mountains + Ground",
    designWidth: 1920,
    designHeight: 1620,
  },

  // Cabin: all three layers share the 640x720 logical shell.
  cabinExterior: {
    id: "cabinExterior",
    src: "/art/cabin/cabin-exterior.png",
    label: "Cabin Exterior",
    designWidth: 640,
    designHeight: 720,
  },
  cabinFrontWall: {
    id: "cabinFrontWall",
    src: "/art/cabin/cabin-front-wall.png",
    label: "Cabin Front Wall",
    designWidth: 640,
    designHeight: 720,
  },
  cabinInterior: {
    id: "cabinInterior",
    src: "/art/cabin/cabin-interior.png",
    label: "Cabin Interior",
    designWidth: 640,
    designHeight: 720,
  },
  houseSign: {
    id: "houseSign",
    src: "/art/cabin/house-sign.png",
    label: "Jeryn's House Sign",
    designWidth: 140,
    designHeight: 210,
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
    designHeight: 70,
  },
  titleCard: {
    id: "titleCard",
    src: "/art/cabin/title-card.png",
    label: "Roof Title Card",
    designWidth: 380,
    designHeight: 105,
  },

  // About
  aboutPhoto: {
    id: "aboutPhoto",
    src: "/images/about/jeryn.jpg",
    label: "Jeryn's About Photo",
    designWidth: 480,
    designHeight: 600,
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
  // Bird and airplane art is drawn small in the middle of a 400x250 canvas;
  // the layers that fly them scale them down further to read as distant.
  ambientBird: {
    id: "ambientBird",
    src: "/art/ambient/bird.png",
    label: "Bird",
    designWidth: 400,
    designHeight: 250,
  },
  ambientAirplane: {
    id: "ambientAirplane",
    src: "/art/ambient/airplane.png",
    label: "Airplane",
    designWidth: 400,
    designHeight: 250,
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

// Exactly what the CLOSED exterior needs in order to be shown: the sky and
// mountains, the cabin's closed shell, the sign, the drifting clouds, and the
// door hint. The initial loading screen waits for this list and nothing else
// -- notably not the interior, and not the other two scenes.
export const ESSENTIAL_EXTERIOR_ASSETS: readonly AssetId[] = [
  "cabinSky",
  "cabinMountainsGround",
  "cabinExterior",
  "houseSign",
  "ambientCloud1",
  "ambientCloud2",
  "uiExclamation",
];

// Warmed in the background only AFTER the exterior is on screen and
// interactive: the cabin's inside, the two neighbouring scenes, and the bird
// and airplane sprites. Nothing in here can delay the reveal or block input.
export const SECONDARY_ASSETS: readonly AssetId[] = [
  "ambientBird",
  "ambientAirplane",
  "cabinInterior",
  "cabinFrontWall",
  "titleCard",
  "contactFrame",
  "cat",
  "gramophone",
  "uciFlag",
  "experienceBackground",
  "experienceCloud1",
  "experienceCloud2",
  "experienceCloud3",
  "projectsBackground",
  "projectBoulder1",
  "projectBoulder2",
  "projectBoulder3",
];

export function assetSources(ids: readonly AssetId[]): string[] {
  return ids.map((id) => ASSETS[id].src);
}
