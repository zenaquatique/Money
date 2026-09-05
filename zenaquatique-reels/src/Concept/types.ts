import type { VersusClip } from "../Versus/types";

export type ConceptSlideDurations = {
  hook: number;
  message: number;
  cta: number;
};

// Sums to 18s, the target length for the "Concept" Reel format.
export const DEFAULT_CONCEPT_DURATIONS_IN_SECONDS: ConceptSlideDurations = {
  hook: 5,
  message: 9,
  cta: 4,
};

export type ConceptProps = {
  brand: string;
  hook: string;
  message: string;
  cta: string;
  // Same contract as Versus/Top3/Educatif: 2-3 rush clips, explicitly
  // ordered by the caller (Make) — see src/Versus/clips.ts for how
  // they're split into intro cuts vs. the long tail clip. Omit/empty for
  // a text-only render.
  clips?: VersusClip[];
  durationsInSeconds?: Partial<ConceptSlideDurations>;
};
