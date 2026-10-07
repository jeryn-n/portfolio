import type { CSSProperties } from "react";
import { ArtAsset } from "@/components/art/ArtAsset";
import type { ArtAssetDef } from "@/data/assets";

interface StageSpriteProps {
  asset: ArtAssetDef;
  x: number;
  y: number;
  className?: string;
}

// Places an ArtAsset at an absolute position in stage/reference units, so
// scene components describe layout in 1920x1080 coordinates rather than
// raw viewport pixels.
export function StageSprite({ asset, x, y, className }: StageSpriteProps) {
  const style: CSSProperties = { position: "absolute", left: x, top: y };
  return <ArtAsset asset={asset} className={className} style={style} />;
}
