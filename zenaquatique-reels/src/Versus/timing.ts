import {
  DEFAULT_VERSUS_DURATIONS_IN_SECONDS,
  type VersusSlideDurations,
} from "./types";

export const resolveDurations = (
  overrides: Partial<VersusSlideDurations> | undefined,
): VersusSlideDurations => ({
  ...DEFAULT_VERSUS_DURATIONS_IN_SECONDS,
  ...overrides,
});

export const secondsToFrames = (seconds: number, fps: number): number =>
  Math.round(seconds * fps);

const SLIDE_ORDER = ["hook", "optionA", "optionB", "verdict"] as const;

export type SlideKey = (typeof SLIDE_ORDER)[number];

export type SlideTiming = {
  key: SlideKey;
  from: number;
  durationInFrames: number;
};

export const getSlideTimeline = (
  durations: VersusSlideDurations,
  fps: number,
): SlideTiming[] => {
  let cursor = 0;
  return SLIDE_ORDER.map((key) => {
    const durationInFrames = secondsToFrames(durations[key], fps);
    const timing: SlideTiming = { key, from: cursor, durationInFrames };
    cursor += durationInFrames;
    return timing;
  });
};

export const getTotalDurationInFrames = (
  durations: VersusSlideDurations,
  fps: number,
): number =>
  getSlideTimeline(durations, fps).reduce(
    (sum, slide) => sum + slide.durationInFrames,
    0,
  );
