import { secondsToFrames } from "../Versus/timing";
import { DEFAULT_CONCEPT_DURATIONS_IN_SECONDS, type ConceptSlideDurations } from "./types";

export const resolveDurations = (
  overrides: Partial<ConceptSlideDurations> | undefined,
): ConceptSlideDurations => ({
  ...DEFAULT_CONCEPT_DURATIONS_IN_SECONDS,
  ...overrides,
});

const SLIDE_ORDER = ["hook", "message", "cta"] as const;

export type SlideKey = (typeof SLIDE_ORDER)[number];

export type SlideTiming = {
  key: SlideKey;
  from: number;
  durationInFrames: number;
};

export const getSlideTimeline = (
  durations: ConceptSlideDurations,
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
  durations: ConceptSlideDurations,
  fps: number,
): number =>
  getSlideTimeline(durations, fps).reduce(
    (sum, slide) => sum + slide.durationInFrames,
    0,
  );
