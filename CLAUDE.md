# imjeryn.dev

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
cabin. As it opens, the one snow layer drops behind the cabin (a z-index
change only, so the flakes never restart), so it keeps falling past the
windows and around the roof but never on the interior. Keep it that way: no
second copy of the snow and no stage-sized CSS masks over it -- each such
mask is a stage-sized bitmap on a phone, and a two-copy, cross-masked
version crashed phones as the cabin opened. Each flake is only
dot-sized (it falls `--snow-fall` px), since every flake is its own
compositor layer.

In both modes the cabin grows from its **base** (bottom-center
transform-origin), so the opening zoom expands it upward and outward; on
desktop the open cabin also settles `cabinArt.openOffsetY` (45px) lower. On desktop, the cabin's
640×720 logical shell is a **stable positioning surface**
(`cabinArt.shellScale`) that never itself scales between closed and open --
only the art group inside it resizes, from `cabinArt.closedArtScale` to
exactly 100% of the shell when open. The exterior, front wall and interior
all live in that one art group so they stay registered through the
cross-fade. The click target and door hint live inside it too, so they
track the visible closed artwork rather than the larger shell; the click
target is a polygon a little inside the building's silhouette
(`CABIN_ENTRY_REGION`, a clip-path on the button, with an SVG focus ring),
so the transparent canvas around the cabin doesn't open it. Portrait
keeps the older, simpler model where the whole shell+art group scales
together from `cabinScale.closedScale` to an open scale **fitted to the
phone** (`fitSceneLayout` / `PORTRAIT_OPEN_FIT`, from the visible stage
rect `SceneStage` exposes via `useStageViewport`): the cabin's body spans
the visible width (eaves past the edges), never below V1's 1.43, and on
short screens it settles `openOffsetY` lower so the roof clears the top
arrow. `CabinScene`'s `cabinFrame` is the one place that transform is
built. On
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
fire, lamp (on/off), gramophone, sign, LinkedIn and About icons, banner, cat — each a full 640×720 transparent canvas on
that same surface, so every file is drawn at inset 0 with no per-file
offset. Objects are handled through one box each in `CABIN_OBJECTS`
(`RegisteredCabinObject`): the box is the window the overlay shows through
(art outside it is clipped, unless the box says `clip: false` -- the lamp,
whose pole and glow reach past its clickable shade), the hitbox, and what scales on hover/focus
about its `transformOrigin` — never the whole canvas. Objects that must
not move (the lamp, the two picture-frame icons) have `hoverScale: 1`; the
icons brighten instead (`hoverBrightness`) and don't give on a press
(`press: false`), while the lamp shows no hover change at all, only its
press and the hand cursor. The sign's HTML
name/title live inside its window so they scale with it. The lamp (cuts
between `lamp-on.png` / `lamp-off.png`, both always mounted; the cut waits
until the new art has decoded, so there's never a frame without a lamp), gramophone (music, see
Sound), sign (About), About icon, banner (Education) and cat (a click/tap
makes it hop once, `bounce`, and meows) are buttons; the LinkedIn icon is a
link. Each picture-frame icon falls back to its half of the old combined
`icons.png` if its own file is missing (`fallbackAsset`). The
fire (an animated WebP the browser loops) and `fire-glow.png` (pulsed by CSS
keyframes of two different, random-valued lengths (opacity 90-100%, scale 95-120%); renders nothing if the file is
absent) are only drawn. The two exclamation hints (`DOOR_HINT`, `GRAMOPHONE_HINT`) are
one-line positions in `layout.ts`. Chimney smoke rides the cabin's own
transform (`cabinFrame`, so it zooms with the cabin and keeps rising while
it's open) but in a separate layer behind the cabin whose mask is world
space: per mode, `smokeFade` fades it out between `opaqueY` and `goneY`
(stage px of the cabin scene; desktop gone just short of Experience, up in
the sky bridge), and `WorldSceneController`'s foreground layer reaches that
far above the stage (`getSmokeCorridorHeight`), so travel never shows the
smoke hitting a clipped edge. All of it, and the door-hint position, is
positioned once against that surface and is identical in both modes — only
the cabin group's own stage position and scale differ per mode, so interior
geometry never needs separate mobile coordinates. `?debug=layout` outlines
and labels the object boxes, the entry polygon (on the closed cabin) and the
smoke's fade lines, and faintly shows each overlay's whole canvas.
The old separate prop sprites are switched off (`SPRITE_PROPS_ENABLED`).

## Sound

`AudioProvider` (above the route tree) holds two separate switches --
`masterSoundEnabled` (the bottom-right `SoundButton`) and `musicEnabled`
(the gramophone) -- both off on every fresh visit, plus a master volume
(`MASTER_VOLUME_DEFAULT`, 72%, on a fresh visit; its own context, `useMasterVolume`, so a slider drag
re-renders only the control). Nothing makes a sound until the visitor turns
it on with the button, its slider or the gramophone, and that gesture
creates the Web Audio engine (`soundEngine.ts`), so playback always starts in
one. Master on: world ambience (+ the fireplace while the cabin interior is
the scene, with the ambience muffled to `AUDIO_SCENE_LEVEL.outdoorInCabin`),
one-shots allowed, music only if `musicEnabled`. Master off (button, or
slider at 0): everything stops at once; `musicEnabled` and the last nonzero
volume are kept. The gramophone with master off turns everything on, music
included; with master on it toggles the music only. The track is only ever
paused and resumed in place (it starts at 0 on its first play; at its end it
waits a random 0-`GRAMOPHONE_LOOP_GAP_MAX_MS` and starts over, the
gramophone staying on), and only a gramophone click plays its `gramophoneOn` /
`gramophoneOff` click sounds -- never a mute, `/video`, a scene change or
the loop. Every gain is base
mix (`AUDIO_VOLUME`) x scene level x master volume, never folded together.
Cat meows overlap (up to `CAT_MEOW_MAX_OVERLAP`). Routes pick an
`AmbientMode`: detail pages drop the ambience but keep the music; `/video`
(`VIDEO_PATH`) is isolated by pathname -- nothing of the site's plays there
and the sound control is hidden -- and everything resumes as it was on
leaving. Every path, volume, fade, scene level and the cat-meow weights live
in `src/data/audio.ts`; a missing file is fetched once and stays silent. The
volume slider opens left of the button on hover / keyboard focus (not on
touch); the whole control slides left while the WIP notice
(`DevelopmentNotice`, reporting `devNoticeShowing`) covers its corner.

Custom cursor sprites (`CURSOR_SPRITES` in `src/data/assets.ts`) are used
only once their files exist -- the root layout checks `public/` and sets
`--cursor-pointer` / `--cursor-hand`; anything clickable uses `cursor-hand`.

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
