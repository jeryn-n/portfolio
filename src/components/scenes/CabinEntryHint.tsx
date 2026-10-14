"use client";

import { useEffect, useState } from "react";
import { ExclamationMark } from "./ExclamationMark";

const SHOW_AFTER_MS = 12500;

interface CabinEntryHintProps {
  x: number;
  y: number;
  scale?: number;
}

// Mounted only while the cabin is closed, so its timer is effectively "time
// since the exterior scene became ready" and is torn down the instant entry
// begins -- it never has a chance to fire once the player has clicked in.
export function CabinEntryHint({ x, y, scale }: CabinEntryHintProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), SHOW_AFTER_MS);
    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return <ExclamationMark x={x} y={y} scale={scale} ariaLabel="Hint: click the cabin to go inside!" />;
}
