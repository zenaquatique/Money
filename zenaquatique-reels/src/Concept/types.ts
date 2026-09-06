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

export type ConceptProps = {
  brand: string;
  hook: string;
  // Split in two so a voiceover has more room to breathe over the text
  // than a single long block would allow.
  message1: string;
  message2: string;
  cta: string;
  // Same contract as Versus/Top3/Educatif: 2-3 rush clips, explicitly
  // ordered by the caller (Make) — see src/Versus/clips.ts for how
  // they're split into intro cuts vs. the long tail clip. Omit/empty for
  // a text-only render.
  clips?: VersusClip[];
  durationsInSeconds?: Partial<ConceptSlideDurations>;
  // Internal: set by server/render-server.js to a fresh value on every
  // render so BackgroundVideoLayer picks a different random start point
  // per clip each time, while staying identical across every frame of
  // this one render. Not meant to be set by callers (Make).
  renderSeed?: string;
};
