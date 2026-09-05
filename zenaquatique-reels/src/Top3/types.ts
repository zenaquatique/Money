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
};
