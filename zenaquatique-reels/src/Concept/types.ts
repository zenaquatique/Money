import type { MusicTrack } from "../Versus/AudioLayer";
import type { VersusClip } from "../Versus/types";

export type ConceptSlideDurations = {
  hook: number;
  message1: number;
  message2: number;
  cta: number;
};

// Sums to 18s, the target length for the "Concept" Reel format.
export const DEFAULT_CONCEPT_DURATIONS_IN_SECONDS: ConceptSlideDurations = {
  hook: 4,
  message1: 5,
  message2: 5,
  cta: 4,
};

// Per-slide voiceover clips, provided by Make. Any key can be omitted —
// that slide then keeps its default (or explicit durationsInSeconds)
// duration instead of being timed from real audio.
export type ConceptVoiceovers = Partial<{
  hook: string;
  message1: string;
  message2: string;
  cta: string;
}>;

export type ConceptProps = {
  brand: string;
  hook: string;
  // Split in two so a voiceover has more room to breathe over the text
  // than a single long block would allow.
  message1: string;
  message2: string;
  cta: string;
  // Same contract as Versus/Top3/Educatif: rush clips, explicitly ordered
  // by the caller (Make) — see src/Versus/clips.ts for how they're split
  // into intro cuts vs. the tail sequence. Omit/empty for a text-only
  // render.
  clips?: VersusClip[];
  // Internal — see the identical field in src/Versus/types.ts.
  tailCount?: number;
  durationsInSeconds?: Partial<ConceptSlideDurations>;
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
  // calculateConceptMetadata in Root.tsx).
  voiceovers?: ConceptVoiceovers;
  // Internal: real duration (in seconds, already including the reading
  // margin) of each voiceovers[key] file, probed server-side by
  // server/render-server.js before the render starts — browser-side
  // probing hits Chromium's ORB protection on hosts like Google Drive, so
  // it's done in Node instead. Not meant to be set by callers (Make); a
  // key missing here (probe failed, or no voiceover for that slide) falls
  // back to that slide's default duration.
  voiceoverDurations?: Partial<Record<keyof ConceptVoiceovers, number>>;
  // Internal: background music, picked and probed by
  // server/render-server.js from public/audio/music/. Not meant to be
  // set by callers (Make) — absent when that folder is empty/missing.
  musicTrack?: MusicTrack;
};
