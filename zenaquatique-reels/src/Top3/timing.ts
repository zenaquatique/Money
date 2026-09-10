import { secondsToFrames } from "../Versus/timing";
import { DEFAULT_TOP3_DURATIONS_IN_SECONDS, type Top3SlideDurations } from "./types";

export const resolveDurations = (
  overrides: Partial<Top3SlideDurations> | undefined,
): Top3SlideDurations => ({
  ...DEFAULT_TOP3_DURATIONS_IN_SECONDS,
  ...overrides,
});

const SLIDE_ORDER = [
  "hook",
  "produit1",
  "produit2",
  "produit3",
  "benefices",
  "cta",
] as const;

export type SlideKey = (typeof SLIDE_ORDER)[number];

export type SlideTiming = {
  key: SlideKey;
  from: number;
  durationInFrames: number;
};

export const getSlideTimeline = (
  durations: Top3SlideDurations,
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
  durations: Top3SlideDurations,
  fps: number,
): number =>
  getSlideTimeline(durations, fps).reduce(
    (sum, slide) => sum + slide.durationInFrames,
    0,
  );
