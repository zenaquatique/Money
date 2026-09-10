import type { VersusClip } from "./types";

export type ClipPlan = {
  introClips: VersusClip[];
  tailClips: VersusClip[];
};

// Splits an ordered `clips` array into the short intro cuts shown during
// the Hook and the clip(s) that play continuously behind the rest of the
// video. `tailCount` says how many of the *last* clips in the array belong
// to that tail — everything before them is intro. Historically the tail
// was always exactly 1 clip (server/render-server.js's fixed group of 3:
// 2 intro + 1 tail), which is still what happens when `tailCount` is
// omitted (Make sending `clips` explicitly, without this internal field).
// When the caller needs the tail to cover more than one clip can on its
// own — see pickRushesForTailDuration in server/render-server.js — it sets
// `tailCount` to however many of the trailing clips make up that
// sequence, so BackgroundVideoLayer can chain them instead of looping a
// single one.
export const planClips = (
  clips: VersusClip[] | undefined,
  tailCount: number | undefined,
): ClipPlan => {
  const usable = clips ?? [];

  if (usable.length === 0) {
    return { introClips: [], tailClips: [] };
  }

  // Only one clip available at all: it serves as both intro and tail
  // (regardless of tailCount) rather than being intro-only with no tail.
  if (usable.length === 1) {
    return { introClips: usable, tailClips: usable };
  }

  const effectiveTailCount = Math.max(1, Math.min(tailCount ?? 1, usable.length));
  return {
    introClips: usable.slice(0, usable.length - effectiveTailCount),
    tailClips: usable.slice(usable.length - effectiveTailCount),
  };
};
