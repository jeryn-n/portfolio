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
parallax depth (sky ×1 … ground ×1.11) zooming, like the cabin, from one
focus point near the cabin's base (`getZoomFocusY`) as the cabin opens. Snow falls in front of the closed
cabin and is masked out over the open cabin's box (`getOpenCabinBox`).

In both modes the cabin grows from its **base** (bottom-center
transform-origin), so the opening zoom expands it upward and outward; on
desktop the open cabin also settles `cabinArt.openOffsetY` (45px) lower. On desktop, the cabin's
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
so they never scale or shrink with the stage/cabin. On desktop
(aspect > 1) the cabin's Experience and Projects controls are `EdgeTab`s
instead -- narrow pixel-cut navy tabs tucked into the top/bottom viewport edge
that slide 5px in on hover/focus; portrait keeps the arrows. Detail pages own
their touch/scroll (`overscroll-contain`, `touch-action: pan-y`, and the
world's gestures only run while the pathname is `/`) and autoplay their
carousel every 10s until the first interaction. Their shared
closed/opening/open state comes from `CabinStateContext`, which is lifted
above `SceneStage` so both the stage content and the viewport UI can read it.

The cabin itself has its own **cabin-local 640×720 coordinate surface**
(`CABIN_WIDTH`/`CABIN_HEIGHT`, also in `src/lib/layout.ts`). The interior is
a base drawing (`cabin-interior.png`) plus **registered overlays** — fire glow,
fire, gramophone, sign, icons, banner, cat — each a full 640×720 transparent canvas on
that same surface, so every file is drawn at inset 0 with no per-file
offset. Objects are handled through one box each in `CABIN_OBJECTS`
(`RegisteredCabinObject`): the box is the window the overlay shows through
(art outside it is clipped), the hitbox, and what scales on hover/focus
about its `transformOrigin` — never the whole canvas. The sign's HTML
name/title live inside its window so they scale with it. The sign (About),
banner (Education), gramophone (for now it only dismisses its exclamation --
no audio) and cat (a click/tap makes it hop once, `bounce`) are buttons; the
fire (an animated WebP the browser loops) and `fire-glow.png` (pulsed by CSS
keyframes of two different, random-valued lengths (opacity 90-100%, scale 95-120%); renders nothing if the file is
absent) are only drawn. `icons.png` draws both picture-frame icons as one
object (`PictureFrame`): the frame (`CABIN_ART_HOTSPOTS`) is split into
two invisible click halves (the art itself has no hover effect) -- left LinkedIn, right
About. The two exclamation hints (`DOOR_HINT`, `GRAMOPHONE_HINT`) are
one-line positions in `layout.ts`. Chimney smoke lives in the cabin's art
group (so it zooms with the cabin) and keeps rising while the cabin is open. All of it, and the door-hint position, is
positioned once against that surface and is identical in both modes — only
the cabin group's own stage position and scale differ per mode, so interior
geometry never needs separate mobile coordinates. `?debug=layout` outlines
and labels the object boxes and faintly shows each overlay's whole canvas.
The old separate prop sprites are switched off (`SPRITE_PROPS_ENABLED`).

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
  Keep this true in production, not just development. The one exception is
  the cabin's full-canvas registered overlays: a missing one renders nothing
  (a cabin-sized placeholder would hide the interior), keeps its hitbox, and
  drops its hover growth.

## Engineering

- Avoid unnecessary dependencies and avoid overengineering — this project
  favors a handful of clear, direct components over configurable
  abstractions. A bug fix or small scene doesn't need a new framework layer.
- The only custom fonts are the cabin sign's Silkscreen Bold
  (`next/font` in the root layout, `font-pixel-label`); the UI
  palette is a small set of white/dark-blue CSS variables in `globals.css`.
