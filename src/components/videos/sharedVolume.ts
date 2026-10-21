// One volume for every player on /video: muted until the viewer turns the
// sound on, then whatever they set on one video carries to the rest (local
// videos and YouTube embeds alike). Lives for the session, so it survives
// leaving the page and coming back.

export const YOUTUBE_ORIGIN = "https://www.youtube-nocookie.com";

const state = { muted: true, volume: 1 };

export function sharedVolume() {
  return state;
}

export function applyToVideo(video: HTMLVideoElement) {
  if (video.muted !== state.muted) video.muted = state.muted;
  if (video.volume !== state.volume) video.volume = state.volume;
}

// A lazy embed that hasn't loaded yet is still a blank page, and messages to
// it would be refused (with a console warning), so they're only sent once
// it's loaded.
export function markEmbedLoaded(iframe: HTMLIFrameElement) {
  iframe.dataset.loaded = "";
}

function post(iframe: HTMLIFrameElement, message: object) {
  if (iframe.dataset.loaded === undefined) return;
  iframe.contentWindow?.postMessage(JSON.stringify(message), YOUTUBE_ORIGIN);
}

// YouTube's postMessage interface (the embeds load with enablejsapi=1).
function youTubeCommand(iframe: HTMLIFrameElement, func: string, args: unknown[] = []) {
  post(iframe, { event: "command", func, args });
}

export function applyToEmbed(iframe: HTMLIFrameElement) {
  youTubeCommand(iframe, state.muted ? "mute" : "unMute");
  youTubeCommand(iframe, "setVolume", [Math.round(state.volume * 100)]);
}

export function pauseEmbed(iframe: HTMLIFrameElement | null) {
  if (iframe) youTubeCommand(iframe, "pauseVideo");
}

export function playEmbed(iframe: HTMLIFrameElement) {
  youTubeCommand(iframe, "playVideo");
}

// Ask an embed to report its state (including volume changes) back to this
// window as "infoDelivery" messages.
export function listenToEmbed(iframe: HTMLIFrameElement) {
  post(iframe, { event: "listening", id: 1, channel: "widget" });
}

// Things showing the volume (the covers' sound toggles) re-render on change.
const listeners = new Set<() => void>();

export function subscribeVolume(listener: () => void) {
  listeners.add(listener);
  return () => void listeners.delete(listener);
}

// Record a change made on one player; true if anything actually changed.
export function updateSharedVolume(muted: boolean, volume: number) {
  if (muted === state.muted && volume === state.volume) return false;
  state.muted = muted;
  state.volume = volume;
  for (const listener of listeners) listener();
  return true;
}

// The covers' sound toggle: mute or unmute every player on the page at once.
export function setSharedMuted(muted: boolean) {
  if (!updateSharedVolume(muted, state.volume)) return;
  const root = document.querySelector("[data-video-portfolio]");
  if (!root) return;
  for (const video of root.querySelectorAll("video")) applyToVideo(video);
  for (const iframe of root.querySelectorAll<HTMLIFrameElement>("iframe[data-youtube-embed]")) applyToEmbed(iframe);
}
