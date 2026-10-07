import type { CSSProperties } from "react";
import type { ArtAssetDef } from "@/data/assets";

interface AssetPlaceholderProps {
  asset: ArtAssetDef;
  className?: string;
  style?: CSSProperties;
}

// Stands in for missing/broken artwork, filling the exact same layout bounds
// the real image would occupy so scenes never shift when art lands later.
export function AssetPlaceholder({ asset, className, style }: AssetPlaceholderProps) {
  return (
    <div
      role="img"
      aria-label={`${asset.label} (placeholder)`}
      className={`relative overflow-hidden border border-dashed border-wireframe-border bg-wireframe-fill ${className ?? ""}`}
      style={style}
    >
      <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-wireframe-border/60" />
      <div className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-wireframe-border/60" />
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5 overflow-hidden p-1 text-center leading-tight">
        <span className="text-[10px] font-semibold uppercase tracking-wide text-paper">
          {asset.label}
        </span>
        <span className="break-all px-1 text-[8px] text-paper/70">{asset.src}</span>
        <span className="text-[8px] text-paper/70">
          {asset.designWidth}×{asset.designHeight}
        </span>
      </div>
    </div>
  );
}
