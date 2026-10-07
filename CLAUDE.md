# imjeryn.com

An interactive, artistic portfolio — not a conventional content site. The desktop
experience is a pixel-art world the visitor explores; copy and visuals are the
product as much as the information they convey.

## Experience model

- **Desktop-first, mobile-functional.** The primary experience is desktop. Mobile
  gets a working, simplified layout, not full parity.
- Three primary scene states, eventually navigable as **Experience ⇄ Cabin ⇄
  Projects**. Only the closed exterior Cabin state exists so far.
- Scene transitions will use `motion/react` and run roughly 0.9s. The cabin
  entrance (closed → interior) will run roughly 1.1–1.4s. Neither is built yet —
  don't add animation ahead of the interactions that need it.
- Desktop scenes are **viewport-locked**, not conventionally scrollable. The
  stage fills the viewport and clips overflow instead of growing the page.

## Coordinate system

Desktop scenes are authored against a logical **1920×1080 reference canvas**
(`src/lib/stage.ts`). `SceneStage` scales that canvas to cover the real
viewport and centers it; scene components place children using stage-unit
`x`/`y` coordinates via `StageSprite`, never raw viewport pixels. Mobile will
get its own positioning rules layered on top of this same stage — don't bypass
it with one-off viewport math.

## Art & content

- Artwork is data-driven: every asset is declared once in `src/data/assets.ts`
  with its `src`, `label`, and design (reference-canvas) dimensions.
- Keep art components modular only where independent motion or state actually
  requires it (e.g. a sprite that animates on its own). Don't split art into
  components preemptively.
- Real artwork and real copy haven't arrived yet. Everything currently renders
  through the `ArtAsset` → `AssetPlaceholder` fallback. **Preserve that
  fallback path** — a missing or failed image must always render the
  wireframe placeholder in the same layout bounds, never a broken-image icon.
  Keep this true in production, not just development.

## Engineering

- Avoid unnecessary dependencies and avoid overengineering — this project
  favors a handful of clear, direct components over configurable
  abstractions. A bug fix or small scene doesn't need a new framework layer.
- No custom font yet; the UI palette is a small set of white/dark-blue CSS
  variables in `globals.css`.
