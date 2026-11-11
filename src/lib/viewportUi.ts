// Config for UI that is fixed to the real browser viewport rather than the
// logical stage -- see ViewportNavArrows. Keeping this separate from
// src/lib/layout.ts documents that these values are CSS pixels from a
// viewport edge, not reference-canvas coordinates.
export const NAV_ARROW_VIEWPORT_OFFSET = 24;

// The sound button's size, CSS px -- also its hit area. The icon files are
// 70x70 (12 art px at 5x, inside a 1 art px margin), so this is their native
// size: every art pixel exactly 5 CSS px.
export const SOUND_BUTTON_ICON_SIZE = 70;

// The master volume slider beside it (shown on hover / keyboard focus), CSS
// px, on the same 5px grid: the panel it sits in, and the slider's own
// length inside that.
export const VOLUME_PANEL = { width: 140, height: 35, sliderWidth: 110 };

// While the "still under development" notice is up, the whole sound control
// (button + slider) slides left by the notice's width (17rem) plus a 0.75rem
// gap; the slider opens further left still, away from the notice. Only from
// the sm breakpoint: below it the notice sits higher (bottom 7rem), clear of
// the button. Delete this, and its one use in SoundButton, along with the
// notice.
export const SOUND_BUTTON_DEV_NOTICE_SHIFT = "sm:-translate-x-[17.75rem]";
