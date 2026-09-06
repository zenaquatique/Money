import type { MusicTrack } from "./AudioLayer";

export type VersusSlideDurations = {
  hook: number;
  optionA: number;
  optionB: number;
  verdict: number;
};

// Sums to 21s, the target length for the "Versus" Reel format.
export const DEFAULT_VERSUS_DURATIONS_IN_SECONDS: VersusSlideDurations = {
  hook: 4,
  optionA: 6,
  optionB: 6,
  verdict: 5,
};

export type VersusClip = {
  src: string;
  label?: string;
  // Internal: filled in by server/render-server.js (via Remotion's own
  // getVideoMetadata, run once server-side before rendering) when it can
  // determine the source file's real duration. BackgroundVideoLayer uses
  // it to pick a random start point when the clip is longer than the
  // slot it fills; left undefined (start at frame 0) for remote URLs or
  // when the probe fails. Not meant to be set by callers (Make).
  durationInSeconds?: number;
};

export type VersusOption = {
  label: string;
  text: string;
};

export type VersusProps = {
  brand: string;
  hook: string;
  optionA: VersusOption;
  optionB: VersusOption;
  verdict: string;
  cta: string;
  // 2-3 rush clips to use as slide backgrounds, in the exact order to use
  // them: every clip but the last plays as a short cut during the Hook,
  // the last one is the longer clip behind Option A/B/Verdict. The caller
  // (Make) picks which files and their order for each render — Remotion
  // does not choose or randomize clips itself. Omit/empty for a
  // text-only render on a solid background.
  clips?: VersusClip[];
  durationsInSeconds?: Partial<VersusSlideDurations>;
  // Internal: set by server/render-server.js to a fresh value on every
  // render so BackgroundVideoLayer picks a different random start point
  // per clip each time, while staying identical across every frame of
  // this one render. Not meant to be set by callers (Make).
  renderSeed?: string;
  // Voiceover audio, provided by Make. Optional — omit/empty for a
  // silent render (no crash, same output as before this existed).
  // Starts at frame 0, alongside the Hook's text.
  voiceoverUrl?: string;
  // Internal: background music, picked and probed by
  // server/render-server.js from public/audio/music/. Not meant to be
  // set by callers (Make) — absent when that folder is empty/missing.
  musicTrack?: MusicTrack;
};
