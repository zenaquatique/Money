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
  // 2-3 short video clips ("rushes") to use as slide backgrounds.
  // Accepted here so the schema is stable, not rendered yet (text-only v1).
  clips?: VersusClip[];
  durationsInSeconds?: Partial<VersusSlideDurations>;
};
