"use client";

import { useState, type CSSProperties } from "react";
import type { ArtAssetDef } from "@/data/assets";
import { AssetPlaceholder } from "./AssetPlaceholder";

interface ArtAssetProps {
  asset: ArtAssetDef;
  className?: string;
  style?: CSSProperties;
}

// Renders the real artwork when it exists; falls back to AssetPlaceholder in the
// exact same box the moment the file 404s, so a missing asset never shows the
// browser's broken-image icon in any environment.
export function ArtAsset({ asset, className, style }: ArtAssetProps) {
  const [failed, setFailed] = useState(false);

  const boxStyle: CSSProperties = {
    width: asset.designWidth,
    height: asset.designHeight,
    ...style,
  };

  if (failed) {
    return <AssetPlaceholder asset={asset} className={className} style={boxStyle} />;
  }

  return (
    // Plain <img> keeps us in control of onError fallback and pixelated rendering.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={asset.src}
      alt={asset.label}
      width={asset.designWidth}
      height={asset.designHeight}
      draggable={false}
      decoding="async"
      className={className}
      style={{ ...boxStyle, imageRendering: "pixelated" }}
      onError={() => setFailed(true)}
    />
  );
}
