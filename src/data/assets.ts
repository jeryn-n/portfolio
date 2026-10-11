export interface ArtAssetDef {
  id: string;
  src: string;
  label: string;
  designWidth: number;
  designHeight: number;
}

export const ASSETS = {
  // Cabin exterior environment: four registered layers of one 1920x1620
  // master, back to front. The sky is opaque; the other three are
  // transparent except where their artwork is, so clouds and flyers can sit
  // between them. All four are cropped, never stretched -- see ExteriorCrop
  // in src/lib/layout.ts.
  cabinSky: {
    id: "cabinSky",
    src: "/art/cabin/sky.png",
    label: "Sky",
    designWidth: 1920,
    designHeight: 1620,
  },
  cabinMountains: {
    id: "cabinMountains",
    src: "/art/cabin/mountains.png",
    label: "Mountains",
    designWidth: 1920,
    designHeight: 1620,
  },
  cabinFoothillsBackTrees: {
    id: "cabinFoothillsBackTrees",
    src: "/art/cabin/foothills-back-trees.png",
    label: "Foothills + Back Trees",
    designWidth: 1920,
    designHeight: 1620,
  },
  cabinGroundFrontTrees: {
    id: "cabinGroundFrontTrees",
    src: "/art/cabin/ground-front-trees.png",
    label: "Ground + Front Trees",
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

  // Ambient clouds, by category: one very large rear cloud, two medium
  // shapes, three small ones. These are the source canvas sizes; the cabin
  // scene's cloudScale sets how big they render.
  ambientCloud1Medium: {
    id: "ambientCloud1Medium",
    src: "/art/ambient/cloud-1-medium.png",
    label: "Ambient Cloud 1 (Medium)",
    designWidth: 360,
    designHeight: 150,
  },
  ambientCloud2VeryLarge: {
    id: "ambientCloud2VeryLarge",
    src: "/art/ambient/cloud-2-very-large.png",
    label: "Ambient Cloud 2 (Very Large)",
    designWidth: 450,
    designHeight: 175,
  },
  ambientCloud3Medium: {
    id: "ambientCloud3Medium",
    src: "/art/ambient/cloud-3-medium.png",
    label: "Ambient Cloud 3 (Medium)",
    designWidth: 300,
    designHeight: 100,
  },
  ambientCloud4Small: {
    id: "ambientCloud4Small",
    src: "/art/ambient/cloud-4-small.png",
    label: "Ambient Cloud 4 (Small)",
    designWidth: 300,
    designHeight: 100,
  },
  ambientCloud5Small: {
    id: "ambientCloud5Small",
    src: "/art/ambient/cloud-5-small.png",
    label: "Ambient Cloud 5 (Small)",
    designWidth: 300,
    designHeight: 100,
  },
  ambientCloud6Small: {
    id: "ambientCloud6Small",
    src: "/art/ambient/cloud-6-small.png",
    label: "Ambient Cloud 6 (Small)",
    designWidth: 300,
    designHeight: 100,
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

  // Experience. The background is a 1920x1620 master, the sky directly above
  // the cabin's -- cropped, never stretched (see src/lib/worldLayout.ts).
  // cloud-1 is the only shell drawn so far; the scene reuses it for all
  // three entries until cloud-2/3 arrive.
  experienceBackground: {
    id: "experienceBackground",
    src: "/art/experience/background.png",
    label: "Experience Background",
    designWidth: 1920,
    designHeight: 1620,
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

  // Projects. The background is a 1920x1620 master, cropped, never
  // stretched (see src/lib/worldLayout.ts). boulder-1 is the only shell
  // drawn so far; the scene reuses it for all three entries.
  projectsBackground: {
    id: "projectsBackground",
    src: "/art/projects/background.png",
    label: "Projects Background",
    designWidth: 1920,
    designHeight: 1620,
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

// Exactly what the CLOSED exterior needs in order to be shown: the four
// environment layers, the cabin's closed shell, the sign, the drifting
// clouds, and the door hint. The initial loading screen waits for this list
// and nothing else -- notably not the interior, and not the other two scenes.
export const ESSENTIAL_EXTERIOR_ASSETS: readonly AssetId[] = [
  "cabinSky",
  "cabinMountains",
  "cabinFoothillsBackTrees",
  "cabinGroundFrontTrees",
  "cabinExterior",
  "houseSign",
  "ambientCloud1Medium",
  "ambientCloud2VeryLarge",
  "ambientCloud3Medium",
  "ambientCloud4Small",
  "ambientCloud5Small",
  "ambientCloud6Small",
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
  "projectsBackground",
  "projectBoulder1",
];

export function assetSources(ids: readonly AssetId[]): string[] {
  return ids.map((id) => ASSETS[id].src);
}
