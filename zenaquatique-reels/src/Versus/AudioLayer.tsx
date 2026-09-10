import React, { useEffect, useState } from "react";
import { Audio, continueRender, delayRender, Loop, useVideoConfig } from "remotion";
import { getAudioDurationInSeconds } from "@remotion/media-utils";
import { resolveMediaSrc } from "./resolveMediaSrc";

// Music must never cover the voiceover. Keep it clearly in the background.
export const MUSIC_VOLUME = 0.08;

export type MusicTrack = {
  src: string;
};

// Background music (if any) is picked server-side (see
// server/render-server.js — it lists public/audio/music/, since a
// composition has no filesystem access) and loops for the whole video at
// MUSIC_VOLUME. Renders nothing when absent — safe to use on every
// composition regardless of whether a music track was picked for this
// render. Per-slide voiceover playback lives next to each slide's own
// <Sequence> instead (see SlideVoiceover.tsx) since it needs to be
// scoped to that slide's frame range, not the whole video.
export const AudioLayer: React.FC<{
  musicTrack?: MusicTrack;
}> = ({ musicTrack }) => {
  return musicTrack ? <MusicLayer track={musicTrack} /> : null;
};

// Remotion's own compositor (used server-side to probe rush clip
// durations) only understands video files and rejects audio-only ones
// outright ("No video stream found"). @remotion/media-utils's
// getVideoMetadata doesn't work either for a pure audio file — it probes
// via an invisible <video> tag, which never resolves without a video
// stream. getAudioDurationInSeconds is the one built for this: an
// invisible <audio> tag instead. Runs here, in the browser, via the
// standard delayRender/continueRender pattern. Never fails the render:
// if the probe fails, duration stays undefined and the caller falls
// back to playing the track once, unlooped.
const useAudioDurationInSeconds = (src: string): number | undefined => {
  const [durationInSeconds, setDurationInSeconds] = useState<
    number | undefined
  >(undefined);
  const [handle] = useState(() => delayRender(`music-metadata-${src}`));

  useEffect(() => {
    let cancelled = false;
    getAudioDurationInSeconds(src)
      .then((duration) => {
        if (!cancelled) {
          setDurationInSeconds(duration);
        }
        continueRender(handle);
      })
      .catch((err) => {
        if (!cancelled) {
          console.warn(`Impossible de lire la durée de ${src}:`, err);
        }
        continueRender(handle);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src]);

  return durationInSeconds;
};

const MusicLayer: React.FC<{ track: MusicTrack }> = ({ track }) => {
  const { fps } = useVideoConfig();
  const src = resolveMediaSrc(track.src);
  const durationInSeconds = useAudioDurationInSeconds(src);

  if (durationInSeconds && durationInSeconds > 0) {
    const loopDurationInFrames = Math.max(
      1,
      Math.round(durationInSeconds * fps),
    );
    return (
      <Loop durationInFrames={loopDurationInFrames}>
        <Audio src={src} volume={MUSIC_VOLUME} />
      </Loop>
    );
  }

  // Duration unknown (probe failed) — play once rather than guess a loop
  // point that could cut the track oddly or leave a silent gap.
  return <Audio src={src} volume={MUSIC_VOLUME} />;
};
