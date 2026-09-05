import type { VersusClip } from "../Versus/types";

export type EducatifSlideDurations = {
  hook: number;
  conseil1: number;
  conseil2: number;
  conseil3: number;
  cta: number;
};

// Sums to 20s, the target length for the "Educatif" Reel format.
export const DEFAULT_EDUCATIF_DURATIONS_IN_SECONDS: EducatifSlideDurations = {
  hook: 3,
  conseil1: 5,
  conseil2: 5,
  conseil3: 5,
  cta: 2,
};

export type EducatifProps = {
  brand: string;
  hook: string;
  conseil1: string;
  conseil2: string;
  conseil3: string;
  cta: string;
  // Same contract as Versus/Top3: 2-3 rush clips, explicitly ordered by the
  // caller (Make) — see src/Versus/clips.ts for how they're split into
  // intro cuts vs. the long tail clip. Omit/empty for a text-only render.
  clips?: VersusClip[];
  durationsInSeconds?: Partial<EducatifSlideDurations>;
};
