import { useCallback, useState } from "react";

// Missing-image detection for a plain <img>. onError alone isn't enough on a
// prerendered page: an image that fails before hydration has already fired
// its error event, React never sees it, and the browser's broken-image icon
// stays on screen. The ref callback catches that case as the element mounts.
export function useImageFallback() {
  const [failed, setFailed] = useState(false);
  const ref = useCallback((img: HTMLImageElement | null) => {
    if (img?.complete && img.naturalWidth === 0) setFailed(true);
  }, []);
  const onError = useCallback(() => setFailed(true), []);
  return { failed, ref, onError };
}
