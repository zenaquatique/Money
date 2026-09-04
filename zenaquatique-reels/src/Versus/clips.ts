import type { VersusClip } from "./types";

// A render uses 2-3 distinct clips, explicitly chosen by the caller (Make):
// all clips but the last are short cuts shown during the Hook, and the
// last clip is the long "tail" that plays continuously behind Option A,
// Option B and Verdict — long enough that it never has to freeze/loop.
// Remotion does not pick clips itself; varying the selection across
// consecutive generated videos is the caller's responsibility.
export const MAX_VERSUS_CLIPS = 3;

export type ClipPlan = {
  introClips: VersusClip[];
  tailClip: VersusClip | undefined;
};

export const planClips = (clips: VersusClip[] | undefined): ClipPlan => {
  const usable = (clips ?? []).slice(0, MAX_VERSUS_CLIPS);

  if (usable.length === 0) {
    return { introClips: [], tailClip: undefined };
  }

  if (usable.length === 1) {
    return { introClips: usable, tailClip: usable[0] };
  }

  return {
    introClips: usable.slice(0, -1),
    tailClip: usable[usable.length - 1],
  };
};
