import { getAudioDurationInSeconds } from "@remotion/media-utils";
import { resolveMediaSrc } from "./resolveMediaSrc";

// Added to a segment's real voiceover duration so the subtitle doesn't
// feel cut off the instant the audio stops.
export const VOICEOVER_SEGMENT_MARGIN_SECONDS = 0.15;

// Resolves each slide's duration from its real voiceover clip where one
// is provided, falling back to `defaults[key]` (the caller's existing
// resolved durations — static per-format defaults, already merged with
// any explicit `durationsInSeconds` override) for any key whose
// `keyMap` entry is missing or fails to probe. With every key missing
// (voiceovers absent/empty entirely) this returns `defaults` unchanged,
// which is exactly the pre-voiceover fixed-timing behavior.
//
// Runs inside calculateMetadata, which Remotion executes in the same
// browser context a render happens in (that's how our server already
// determines durationInFrames before rendering) — so probing real audio
// duration here via @remotion/media-utils works the same way it does
// for background music in AudioLayer.
export const resolveSegmentDurationsInSeconds = async <Key extends string>(
  keyMap: Partial<Record<Key, string | undefined>>,
  defaults: Record<Key, number>,
): Promise<Record<Key, number>> => {
  const keys = Object.keys(defaults) as Key[];
  const entries = await Promise.all(
    keys.map(async (key): Promise<[Key, number]> => {
      const url = keyMap[key];
      if (!url) {
        return [key, defaults[key]];
      }
      try {
        const duration = await getAudioDurationInSeconds(resolveMediaSrc(url));
        return [key, duration + VOICEOVER_SEGMENT_MARGIN_SECONDS];
      } catch (err) {
        console.warn(`Impossible de lire la durée de la voix off (${url}):`, err);
        return [key, defaults[key]];
      }
    }),
  );
  return Object.fromEntries(entries) as Record<Key, number>;
};
