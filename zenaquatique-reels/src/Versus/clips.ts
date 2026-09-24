import type { VersusClip } from "./types";

export type ClipPlan = {
  introClips: VersusClip[];
  tailClips: VersusClip[];
};

// Splits an ordered `clips` array into the short intro cuts shown during
// the Hook and the clip(s) that play continuously behind the rest of the
// video. `tailCount` says how many of the *last* clips in the array belong
// to that tail — everything before them is intro. Only set internally, by
// server/render-server.js's own auto-rotation (pickRushesForTailDuration)
// when it needs the tail to cover more than one clip can on its own, so
// BackgroundVideoLayer can chain them instead of looping a single one.
//
// When `tailCount` is omitted instead — Make/Claude sending `clips`
// explicitly, which is the normal case for all 4 formats — every clip
// becomes BOTH an intro cut and part of the tail sequence, rather than
// reserving all but the last as brief Hook-only glimpses: Claude picks
// each clip deliberately (often with its own `effect`/`speed`, see
// ShotEffect in types.ts) expecting it to actually appear, in order, not
// mostly be discarded after a flash during the Hook while one clip alone
// covers the rest of the video.
export const planClips = (
  clips: VersusClip[] | undefined,
  tailCount: number | undefined,
): ClipPlan => {
  const usable = clips ?? [];

  if (usable.length === 0) {
    return { introClips: [], tailClips: [] };
  }

  if (usable.length === 1 || tailCount === undefined) {
    return { introClips: usable, tailClips: usable };
  }

  const effectiveTailCount = Math.max(1, Math.min(tailCount, usable.length));
  return {
    introClips: usable.slice(0, usable.length - effectiveTailCount),
    tailClips: usable.slice(usable.length - effectiveTailCount),
  };
};
