// Minimal image warm-up used by the initial loading screen. No dependency,
// no progress reporting, no cache of its own -- the browser's HTTP cache is
// the cache.
//
// The key decision here: a missing file is a SUCCESS, not a failure. Every
// image in this project renders through ArtAsset -> AssetPlaceholder, so what
// the loading screen actually waits for is "this asset's outcome is known",
// and a 404 settles that outcome just as definitively as a decoded image
// does. Resolving on error is what makes an empty /public (the current state
// of the project) load instantly instead of hanging forever.
export function preloadImages(sources: readonly string[]): Promise<void> {
  if (typeof window === "undefined" || sources.length === 0) {
    return Promise.resolve();
  }

  return Promise.all(sources.map(loadOne)).then(() => undefined);
}

function loadOne(src: string): Promise<void> {
  return new Promise<void>((resolve) => {
    const image = new Image();
    image.onload = () => resolve();
    image.onerror = () => resolve();
    image.src = src;
    // An already-cached image can finish decoding before the handlers above
    // ever fire, which would otherwise leave this promise pending forever.
    if (image.complete) resolve();
  });
}
