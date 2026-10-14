// Minimal image warm-up used by the initial loading screen. No dependency,
// no progress reporting, no cache of its own -- the browser's HTTP cache is
// the cache.
//
// The key decision here: a missing file is a SUCCESS, not a failure. Every
// image in this project renders through ArtAsset -> AssetPlaceholder, so what
// the loading screen actually waits for is "this asset's outcome is known",
// and a 404 settles that outcome just as definitively as a decoded image
// does. Resolving on error is what makes a missing file load instantly
// instead of hanging forever.
//
// `priority: "high"` is for the set a loading screen is waiting on, so it
// isn't starved by the other scenes' images the page requests at the same
// time.
export function preloadImages(sources: readonly string[], priority: "high" | "low" | "auto" = "auto"): Promise<void> {
  if (typeof window === "undefined" || sources.length === 0) {
    return Promise.resolve();
  }

  return Promise.all(sources.map((src) => loadOne(src, priority))).then(() => undefined);
}

// Settles once the image is loaded AND decoded (or known to be missing), so a
// screen waiting on it never uncovers an <img> that is still decoding.
function loadOne(src: string, priority: "high" | "low" | "auto"): Promise<void> {
  return new Promise<void>((resolve) => {
    const image = new Image();
    image.fetchPriority = priority;
    const settle = () => {
      image.decode().then(resolve, resolve);
    };
    image.onload = settle;
    image.onerror = () => resolve();
    image.src = src;
    // An already-cached image can finish loading before the handlers above
    // ever fire, which would otherwise leave this promise pending forever.
    if (image.complete) settle();
  });
}
