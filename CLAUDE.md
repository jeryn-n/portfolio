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

There are two explicit composition modes, chosen by viewport aspect ratio
(`src/lib/stage.ts`), not a single hardcoded pixel breakpoint:

- **Desktop** (aspect ratio > 1): a logical **1920×1080 reference canvas**.
- **Portrait/mobile** (aspect ratio ≤ 1): a logical **1080×1920 reference
  canvas** — a genuinely separate composition, not the desktop stage plus a
  zoom multiplier.

`SceneStage` measures the viewport, picks the mode, and scales whichever
stage is active to cover the real viewport, exposing the mode via
`CompositionModeContext`. `CabinScene` reads that mode and looks up a
mode-specific `SceneLayout` (`src/lib/layout.ts`) for scene-level placement
(cabin position, sign, title card, clouds) — it's one component and one
state machine reused across both modes, not two.

The cabin scene's exterior is four registered layers -- `cabinSky`,
`cabinMountains`, `cabinFoothillsBackTrees`, `cabinGroundFrontTrees` -- of
one **1920×1620 master** that is never stretched. Each mode's
`SceneLayout.exterior` (`ExteriorCrop`) places it at one uniform scale:
desktop keeps the full art width at 1:1 and crops vertically; portrait keeps
the full art height and crops horizontally. All four layers always render
through the same crop. Back to front: sky → airplane → all clouds →
mountains (+ birds) → foothills + back trees → ground + front trees →
world darkness overlay → cabin → snow → cabin UI. Birds and the airplane
are currently disabled (`BIRDS_ENABLED` / `AIRPLANE_ENABLED` in
`CabinScene`), code kept. The darkness overlay is ONE layer in
`WorldSceneController` over the whole Experience/Cabin/Projects strip (20%
only while the open cabin is the scene, cleared early in travel away,
restored as travel lands); `CabinScene` portals its foreground into a layer
above it so the cabin itself is never dimmed. The Experience background is a
second 1920×1620 master, the sky directly above the cabin's, cropped the
same way (desktop: its bottom 1080 rows; portrait: the cabin's portrait
crop) -- see `src/lib/worldLayout.ts`. On desktop the cabin window starts at
its art row 320, so Experience parks that much further up and the cabin's
environment clip extends upward to show its real sky rows 0-320 as the
bridge during travel (`getSkyBridgeHeight`; zero on portrait). Experience
entries are placed by slug and sized directly (no transforms). Each terrain layer is its own
parallax depth (sky ×1.02 … ground ×1.08) zooming from the cabin's base
(`getCabinBaseY`) as the cabin opens. Snow falls in front of the closed
cabin and is masked out over the open cabin's box (`getOpenCabinBox`).

In both modes the cabin grows from a **fixed base** (bottom-center
transform-origin), so the opening zoom expands it upward and outward and
never pushes it down toward the Projects arrow. On desktop, the cabin's
640×720 logical shell is a **stable positioning surface**
(`cabinArt.shellScale`) that never itself scales between closed and open --
only the art group inside it resizes, from `cabinArt.closedArtScale` to
exactly 100% of the shell when open. The exterior, front wall and interior
all live in that one art group so they stay registered through the
cross-fade. The click target and door hint live inside it too, so they
track the visible closed artwork rather than the larger shell. Portrait
keeps the older, simpler model where the whole shell+art group scales
together as one explicit closed/open pair (`cabinScale.closedScale` /
`cabinScale.openScale`). On
desktop the title card and house sign are positioned independently of the
cabin (stage-relative); on portrait they instead derive their Y from the
cabin's own Y plus a fixed offset (`titleCardOffsetFromCabinY` /
`houseSignOffsetFromCabinY`), so moving the portrait cabin moves them with
it. Ambient clouds are environment objects, not cabin-local, rendered at
each mode's `cloudScale`, all drifting at one shared `cloudSpeed`. They
come in three categories (very large / medium / small, `CLOUD_ASSETS`), each
with a count and a vertical band per mode; `cloudField.ts` scatters them
once per load so their artwork never overlaps (wrap included), and the
shared speed keeps it that way.

Nav arrows (Experience/Projects) are **viewport-fixed UI, not stage
objects** — they're rendered by `ViewportNavArrows` as a sibling of the
scaled stage div (outside its `transform`), pinned near the top/bottom of
the real browser viewport via CSS `position: fixed` and `env(safe-area-inset-*)`,
so they never scale or shrink with the stage/cabin. Their shared
closed/opening/open state comes from `CabinStateContext`, which is lifted
above `SceneStage` so both the stage content and the viewport UI can read it.

The cabin itself has its own **cabin-local 640×720 coordinate surface**
(`CABIN_WIDTH`/`CABIN_HEIGHT`, also in `src/lib/layout.ts`). Every interior
prop (fireplace, gramophone, cat, UCI flag, contact frame, the door-hint
position) is positioned once against that surface and is identical in both
modes — only the cabin group's own stage position and scale differ per
mode, so interior geometry never needs separate mobile coordinates.

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
