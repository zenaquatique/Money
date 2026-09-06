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

// Per-slide voiceover clips, provided by Make. Any key can be omitted —
// that slide then keeps its default (or explicit durationsInSeconds)
// duration instead of being timed from real audio. Versus has no
// separate CTA slide (the CTA text lives inside the Verdict slide), so
// `cta` is accepted as a fallback for `verdict` when `verdict` itself is
// absent: whichever of the two is provided drives the Verdict slide's
// voiceover and timing.
export type VersusVoiceovers = Partial<{
  hook: string;
  optionA: string;
  optionB: string;
  verdict: string;
  cta: string;
}>;

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
  // Per-slide voiceovers, provided by Make. Optional as a whole (and
  // per-key) — any slide without a matching voiceover keeps its default
  // timing, no crash either way. When present, each slide's real audio
  // duration (+ a small margin) drives that slide's own duration, and
  // the composition's total length adjusts to match automatically (see
  // calculateVersusMetadata in Root.tsx).
  voiceovers?: VersusVoiceovers;
  // Internal: background music, picked and probed by
  // server/render-server.js from public/audio/music/. Not meant to be
  // set by callers (Make) — absent when that folder is empty/missing.
  musicTrack?: MusicTrack;
};
