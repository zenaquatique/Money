import type { MusicTrack } from "../Versus/AudioLayer";
import type { VersusClip } from "../Versus/types";

export type Top3SlideDurations = {
  hook: number;
  produit1: number;
  produit2: number;
  produit3: number;
  benefices: number;
  cta: number;
};

// Sums to 18s, the target length for the "Top3" Reel format.
export const DEFAULT_TOP3_DURATIONS_IN_SECONDS: Top3SlideDurations = {
  hook: 2,
  produit1: 4,
  produit2: 4,
  produit3: 4,
  benefices: 2,
  cta: 2,
};

export type Top3Product = {
  label: string;
  text: string;
};

// Per-slide voiceover clips, provided by Make. Any key can be omitted —
// that slide then keeps its default (or explicit durationsInSeconds)
// duration instead of being timed from real audio.
export type Top3Voiceovers = Partial<{
  hook: string;
  produit1: string;
  produit2: string;
  produit3: string;
  benefices: string;
  cta: string;
}>;

export type Top3Props = {
  brand: string;
  hook: string;
  produit1: Top3Product;
  produit2: Top3Product;
  produit3: Top3Product;
  benefices: string;
  cta: string;
  // Same contract as Versus: 2-3 rush clips, explicitly ordered by the
  // caller (Make) — see src/Versus/clips.ts for how they're split into
  // intro cuts vs. the long tail clip. Omit/empty for a text-only render.
  clips?: VersusClip[];
  durationsInSeconds?: Partial<Top3SlideDurations>;
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
  // calculateTop3Metadata in Root.tsx).
  voiceovers?: Top3Voiceovers;
  // Internal: real duration (in seconds, already including the reading
  // margin) of each voiceovers[key] file, probed server-side by
  // server/render-server.js before the render starts — browser-side
  // probing hits Chromium's ORB protection on hosts like Google Drive, so
  // it's done in Node instead. Not meant to be set by callers (Make); a
  // key missing here (probe failed, or no voiceover for that slide) falls
  // back to that slide's default duration.
  voiceoverDurations?: Partial<Record<keyof Top3Voiceovers, number>>;
  // Internal: background music, picked and probed by
  // server/render-server.js from public/audio/music/. Not meant to be
  // set by callers (Make) — absent when that folder is empty/missing.
  musicTrack?: MusicTrack;
};
