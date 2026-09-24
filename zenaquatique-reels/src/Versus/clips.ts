import type { VersusClip } from "./types";

export type ClipPlan = {
  introClips: VersusClip[];
  tailClips: VersusClip[];
};

// How many of the *first* clips play as quick establishing cuts during
// the Hook, at most — kept small and independent of the total clip count
// on purpose. Making every clip an intro cut too (a prior version of this
// function did exactly that) divides the Hook's fixed ~4s span by however
// many clips Claude sent: with 7-9 clips that's a cut roughly every
// half-second for the whole Hook, each with its own whoosh — exactly the
// "ça me casse la tête" a real render surfaced. 2 intro cuts at ~2s each
// reads as a deliberate opening, not a strobe.
const MAX_INTRO_CLIPS = 2;

// Splits an ordered `clips` array into the short intro cuts shown during
// the Hook and the clip(s) that play continuously behind the rest of the
// video. `tailCount` says how many of the *last* clips in the array belong
// to that tail — everything before them is intro. Only set internally, by
// server/render-server.js's own auto-rotation (pickRushesForTailDuration)
// when it needs the tail to cover more than one clip can on its own, so
// BackgroundVideoLayer can chain them instead of looping a single one.
//
// When `tailCount` is omitted instead — Make/Claude sending `clips`
// explicitly, which is the normal case for all 4 formats — the first
// MAX_INTRO_CLIPS clips are the Hook's intro cuts and *every other* clip
// goes to the tail (not just the last one — see BackgroundVideoLayer's
// even-split tail allocation), so each clip Claude picked still gets real
// screen time across Option A/B/Verdict without fragmenting the Hook.
export const planClips = (
  clips: VersusClip[] | undefined,
  tailCount: number | undefined,
): ClipPlan => {
  const usable = clips ?? [];

  if (usable.length === 0) {
    return { introClips: [], tailClips: [] };
  }

  if (usable.length === 1) {
    return { introClips: usable, tailClips: usable };
  }

  if (tailCount === undefined) {
    const introCount = Math.min(MAX_INTRO_CLIPS, usable.length - 1);
    return {
      introClips: usable.slice(0, introCount),
      tailClips: usable.slice(introCount),
    };
  }

  const effectiveTailCount = Math.max(1, Math.min(tailCount, usable.length));
  return {
    introClips: usable.slice(0, usable.length - effectiveTailCount),
    tailClips: usable.slice(usable.length - effectiveTailCount),
  };
};
