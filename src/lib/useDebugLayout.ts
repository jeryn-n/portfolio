"use client";

import { useSearchParams } from "next/navigation";

// Shared `?debug=layout` flag, used by the cabin's LayoutGuide and by the
// Experience/Projects scenes' lightweight debug labels.
export function useDebugLayout(): boolean {
  const searchParams = useSearchParams();
  return searchParams.get("debug") === "layout";
}
