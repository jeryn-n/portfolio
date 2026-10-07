import { ASSETS } from "@/data/assets";
import { STAGE_HEIGHT, STAGE_WIDTH } from "@/lib/stage";
import { StageSprite } from "./StageSprite";

// Cabin sits slightly below true vertical center, leaving open sky above
// and room to ground it below.
const CABIN_VERTICAL_OFFSET = 90;
const cabin = ASSETS.cabinExterior;
const cabinX = (STAGE_WIDTH - cabin.designWidth) / 2;
const cabinY = (STAGE_HEIGHT - cabin.designHeight) / 2 + CABIN_VERTICAL_OFFSET;

const sign = ASSETS.houseSign;
const signX = cabinX + cabin.designWidth + 60;
const signY = cabinY + 70;

const cloud1 = ASSETS.ambientCloud1;
const cloud1X = 150;
const cloud1Y = 140;

const cloud2 = ASSETS.ambientCloud2;
const cloud2X = STAGE_WIDTH - cloud2.designWidth - 180;
const cloud2Y = 90;

// P1: the closed exterior cabin state only. No opening, navigation, snow,
// birds, audio, or modals yet.
export function CabinScene() {
  return (
    <>
      <StageSprite asset={ASSETS.cabinExteriorBackground} x={0} y={0} />
      <StageSprite asset={cloud1} x={cloud1X} y={cloud1Y} />
      <StageSprite asset={cloud2} x={cloud2X} y={cloud2Y} />
      <StageSprite asset={cabin} x={cabinX} y={cabinY} />
      <StageSprite asset={sign} x={signX} y={signY} />
    </>
  );
}
