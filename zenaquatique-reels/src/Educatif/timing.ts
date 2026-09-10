import { secondsToFrames } from "../Versus/timing";
import { DEFAULT_EDUCATIF_DURATIONS_IN_SECONDS, type EducatifSlideDurations } from "./types";

export const resolveDurations = (
  overrides: Partial<EducatifSlideDurations> | undefined,
): EducatifSlideDurations => ({
  ...DEFAULT_EDUCATIF_DURATIONS_IN_SECONDS,
  ...overrides,
});

const SLIDE_ORDER = ["hook", "conseil1", "conseil2", "conseil3", "cta"] as const;

export type SlideKey = (typeof SLIDE_ORDER)[number];

export type SlideTiming = {
  key: SlideKey;
  from: number;
  durationInFrames: number;
};

export const getSlideTimeline = (
  durations: EducatifSlideDurations,
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
  durations: EducatifSlideDurations,
  fps: number,
): number =>
  getSlideTimeline(durations, fps).reduce(
    (sum, slide) => sum + slide.durationInFrames,
    0,
  );
