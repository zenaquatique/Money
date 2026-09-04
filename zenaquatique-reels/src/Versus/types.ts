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
  // 2-3 rush clips to use as slide backgrounds, in the exact order to use
  // them: every clip but the last plays as a short cut during the Hook,
  // the last one is the longer clip behind Option A/B/Verdict. The caller
  // (Make) picks which files and their order for each render — Remotion
  // does not choose or randomize clips itself. Omit/empty for a
  // text-only render on a solid background.
  clips?: VersusClip[];
  durationsInSeconds?: Partial<VersusSlideDurations>;
};
