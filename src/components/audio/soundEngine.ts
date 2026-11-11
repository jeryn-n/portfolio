import { AUDIO, AUDIO_FADE, AUDIO_VOLUME, MASTER_VOLUME_DEFAULT } from "@/data/audio";

// The two seamless ambience loops.
export type LoopKey = "worldAmbience" | "fireplace";
// One-shot channels. Each holds a bounded number of voices (see playOneShot).
export type OneShotChannel = "lamp" | "door" | "transitionWind" | "cat";

// How long a stop or a mute is ramped over: short enough to read as instant,
// long enough not to click.
const DECLICK = 0.03;

interface Loop {
  src: string;
  // Its base volume (the mix) ...
  volume: number;
  // ... times the scene's multiplier for it. 0 = not wanted at all.
  level: number;
  gain: GainNode;
  source: AudioBufferSourceNode | null;
  // The current source's start: where in the loop, and when (context time).
  startOffset: number;
  startedAt: number;
  // Where the loop picks up when it next starts -- pause/resume, not restart.
  resumeAt: number;
  stopTimer: ReturnType<typeof setTimeout> | undefined;
}

interface Voice {
  source: AudioBufferSourceNode;
  gain: GainNode;
}

function noop() {}

// Freezes a gain wherever it is right now, mid-ramp included, so the next ramp
// starts from there.
function holdGain(gain: GainNode, now: number) {
  const param = gain.gain;
  if (typeof param.cancelAndHoldAtTime === "function") {
    param.cancelAndHoldAtTime(now);
  } else {
    const value = param.value;
    param.cancelScheduledValues(now);
    param.setValueAtTime(value, now);
  }
}

// Every sound on the site, behind one master switch and one master volume, on
// a Web Audio graph:
//
//   ambience loops (decoded buffers) -+
//   gramophone (streamed <audio>) ----+--> master gain --> speakers
//   one-shots (decoded buffers) ------+
//
// Each channel's own gain is its base volume (the mix) times its scene level;
// the master gain is the visitor's volume while sound is on, 0 while it's off.
// Neither is ever folded into the other, so the slider can't disturb the mix.
//
// Web Audio rather than plain <audio> elements for two reasons: buffer loops
// are sample-accurate (an <audio loop> leaves a gap at the seam), and gain
// nodes give real volume control and fades on iOS, which ignores an element's
// `volume`. The music is the exception -- it's long, so it streams through
// an <audio> element wired into the same graph.
//
// Created only inside a user gesture (see AudioProvider), so the context
// starts running under every browser's autoplay rules. Each file is fetched at
// most once: a missing or undecodable one stays silent for the rest of the
// visit, without errors and without retries. Nothing here throws.
export class SoundEngine {
  private readonly ctx: AudioContext;
  private readonly master: GainNode;
  private on = false;
  private volume = MASTER_VOLUME_DEFAULT;
  private suspendTimer: ReturnType<typeof setTimeout> | undefined;

  private readonly loading = new Map<string, Promise<AudioBuffer | null>>();
  private readonly decoded = new Map<string, AudioBuffer>();
  private readonly loops: Record<LoopKey, Loop>;
  private readonly voices = new Map<OneShotChannel, Voice[]>();

  private readonly music: HTMLAudioElement;
  private musicWanted = false;
  private musicBroken = false;

  static create(): SoundEngine | null {
    if (typeof window === "undefined" || typeof AudioContext === "undefined") return null;
    try {
      return new SoundEngine(new AudioContext());
    } catch {
      return null;
    }
  }

  private constructor(ctx: AudioContext) {
    this.ctx = ctx;
    this.master = ctx.createGain();
    this.master.gain.value = 0;
    this.master.connect(ctx.destination);

    const loop = (src: string, volume: number): Loop => {
      const gain = ctx.createGain();
      gain.gain.value = 0;
      gain.connect(this.master);
      return { src, volume, level: 0, gain, source: null, startOffset: 0, startedAt: 0, resumeAt: 0, stopTimer: undefined };
    };
    this.loops = {
      worldAmbience: loop(AUDIO.worldAmbience, AUDIO_VOLUME.worldAmbience),
      fireplace: loop(AUDIO.fireplace, AUDIO_VOLUME.fireplace),
    };

    // preload "none": nothing is fetched until the gramophone first plays.
    this.music = new Audio();
    this.music.preload = "none";
    this.music.loop = true;
    this.music.src = AUDIO.music;
    this.music.addEventListener("error", () => {
      this.musicBroken = true;
    });
    const musicGain = ctx.createGain();
    musicGain.gain.value = AUDIO_VOLUME.music;
    ctx.createMediaElementSource(this.music).connect(musicGain);
    musicGain.connect(this.master);

    // Everything but the music, decoded ahead of time so the first lamp
    // click, door or meow plays the moment it's asked for.
    for (const src of [AUDIO.worldAmbience, AUDIO.fireplace, ...Object.values(AUDIO.sfx), ...AUDIO.catMeows]) {
      void this.load(src);
    }
  }

  // The master switch. Off stops every sound at once -- the loops remember
  // where they were, the music pauses in place -- and suspends the context.
  setOn(on: boolean) {
    if (on === this.on) return;
    this.on = on;
    const now = this.ctx.currentTime;
    holdGain(this.master, now);
    if (on) {
      clearTimeout(this.suspendTimer);
      this.ctx.resume().catch(noop);
      this.master.gain.linearRampToValueAtTime(this.volume, now + DECLICK);
      for (const loop of Object.values(this.loops)) {
        if (loop.level > 0) this.startLoop(loop, AUDIO_FADE.soundOn);
      }
      if (this.musicWanted) this.playMusic();
    } else {
      this.master.gain.linearRampToValueAtTime(0, now + DECLICK);
      for (const loop of Object.values(this.loops)) this.haltLoop(loop, DECLICK);
      for (const voices of this.voices.values()) {
        for (const voice of voices) this.stopVoice(voice, DECLICK);
      }
      this.voices.clear();
      this.music.pause();
      this.suspendTimer = setTimeout(() => this.ctx.suspend().catch(noop), 200);
    }
  }

  // The visitor's master volume, 0-1 (never 0 -- that's off, see setOn).
  // Followed with a ramp short enough to feel immediate under a dragged
  // slider.
  setMasterVolume(volume: number) {
    if (volume === this.volume) return;
    this.volume = volume;
    if (!this.on) return;
    const now = this.ctx.currentTime;
    holdGain(this.master, now);
    this.master.gain.linearRampToValueAtTime(volume, now + AUDIO_FADE.masterVolume);
  }

  // How loud a loop should be (while the master is on), as a multiple of its
  // base volume: 0 stops it, anything else plays it at that level. Starting
  // and stopping are ramped over `fade` seconds; a change of level while it
  // plays on (the outdoors muffling as the cabin opens) over `levelFade`.
  setLoop(key: LoopKey, level: number, fade: number, levelFade = fade) {
    const loop = this.loops[key];
    if (loop.level === level) return;
    const wasWanted = loop.level > 0;
    loop.level = level;
    if (!this.on) return;
    if (level > 0) this.startLoop(loop, wasWanted ? levelFade : fade);
    else this.fadeOutLoop(loop, fade);
  }

  // Whether the gramophone should be playing (while the master is on).
  // `fromStart` rewinds it first: a fresh play starts at the top, and a stop
  // leaves it at the top for next time.
  setMusic(wanted: boolean, fromStart: boolean) {
    this.musicWanted = wanted;
    if (fromStart) {
      try {
        this.music.currentTime = 0;
      } catch {
        // Not seekable yet -- it's at the start anyway.
      }
    }
    if (wanted && this.on) this.playMusic();
    else this.music.pause();
  }

  // Plays a decoded clip once on its channel, alongside up to maxVoices - 1
  // others already playing there; past that, the oldest is cut off (so 1 =
  // each play replaces the last). Each play is its own short-lived source and
  // gain, disconnected the moment it ends, so nothing accumulates. A clip
  // that hasn't finished loading (or never will) is skipped rather than
  // played late. Returns whether it played.
  playOneShot(channel: OneShotChannel, src: string, volume: number, maxVoices = 1): boolean {
    if (!this.on) return false;
    const buffer = this.decoded.get(src);
    if (!buffer) return false;
    const voices = this.voices.get(channel) ?? [];
    while (voices.length >= maxVoices) {
      const oldest = voices.shift();
      if (oldest) this.stopVoice(oldest, DECLICK);
    }

    const gain = this.ctx.createGain();
    gain.gain.value = volume;
    gain.connect(this.master);
    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(gain);
    const voice = { source, gain };
    source.onended = () => {
      source.disconnect();
      gain.disconnect();
      const current = this.voices.get(channel);
      const index = current?.indexOf(voice) ?? -1;
      if (current && index >= 0) current.splice(index, 1);
    };
    source.start();
    voices.push(voice);
    this.voices.set(channel, voices);
    return true;
  }

  // Decoded and ready to play right now.
  isReady(src: string): boolean {
    return this.decoded.has(src);
  }

  dispose() {
    clearTimeout(this.suspendTimer);
    for (const loop of Object.values(this.loops)) clearTimeout(loop.stopTimer);
    this.music.pause();
    this.music.removeAttribute("src");
    this.ctx.close().catch(noop);
  }

  private load(src: string): Promise<AudioBuffer | null> {
    let pending = this.loading.get(src);
    if (!pending) {
      pending = fetch(src)
        .then((response) => (response.ok ? response.arrayBuffer() : null))
        .then((data) => (data ? this.ctx.decodeAudioData(data) : null))
        .then((buffer) => {
          if (buffer) this.decoded.set(src, buffer);
          return buffer;
        })
        .catch(() => null);
      this.loading.set(src, pending);
    }
    return pending;
  }

  private playMusic() {
    if (this.musicBroken || !this.music.paused) return;
    this.music.play().catch(noop);
  }

  // Starts a loop fading in over `fade` -- or, if it's already playing (or
  // still fading out), ramps it to its current level from wherever it is.
  private startLoop(loop: Loop, fade: number) {
    clearTimeout(loop.stopTimer);
    const buffer = this.decoded.get(loop.src);
    if (!buffer) {
      // Starts once it has loaded, if it's still wanted by then.
      void this.load(loop.src).then((loaded) => {
        if (loaded && loop.level > 0 && this.on && !loop.source) this.startLoop(loop, fade);
      });
      return;
    }
    const now = this.ctx.currentTime;
    if (loop.source) {
      holdGain(loop.gain, now);
    } else {
      const source = this.ctx.createBufferSource();
      source.buffer = buffer;
      source.loop = true;
      source.connect(loop.gain);
      loop.startOffset = loop.resumeAt % buffer.duration;
      loop.startedAt = now;
      source.start(now, loop.startOffset);
      loop.source = source;
      loop.gain.gain.cancelScheduledValues(now);
      loop.gain.gain.setValueAtTime(0, now);
    }
    loop.gain.gain.linearRampToValueAtTime(loop.volume * loop.level, now + fade);
  }

  private fadeOutLoop(loop: Loop, fade: number) {
    if (!loop.source) return;
    const now = this.ctx.currentTime;
    holdGain(loop.gain, now);
    loop.gain.gain.linearRampToValueAtTime(0, now + fade);
    clearTimeout(loop.stopTimer);
    loop.stopTimer = setTimeout(() => this.haltLoop(loop, 0), fade * 1000);
  }

  // Stops a loop `after` seconds from now, remembering where it got to.
  private haltLoop(loop: Loop, after: number) {
    clearTimeout(loop.stopTimer);
    const source = loop.source;
    if (!source) return;
    const now = this.ctx.currentTime;
    if (after > 0) {
      holdGain(loop.gain, now);
      loop.gain.gain.linearRampToValueAtTime(0, now + after);
    }
    loop.resumeAt = loop.startOffset + (now + after - loop.startedAt);
    source.onended = () => source.disconnect();
    try {
      source.stop(now + after);
    } catch {
      // Already stopped.
    }
    loop.source = null;
  }

  private stopVoice(voice: Voice, after: number) {
    const now = this.ctx.currentTime;
    holdGain(voice.gain, now);
    voice.gain.gain.linearRampToValueAtTime(0, now + after);
    try {
      voice.source.stop(now + after);
    } catch {
      // Already stopped.
    }
  }
}
