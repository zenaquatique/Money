import React, { useEffect, useState } from "react";
import {
  Audio,
  continueRender,
  delayRender,
  Loop,
  staticFile,
  useVideoConfig,
} from "remotion";
import { getAudioDurationInSeconds } from "@remotion/media-utils";

// Music must never cover the voiceover. Keep it in the 0.15-0.20 range.
export const MUSIC_VOLUME = 0.18;
const VOICEOVER_VOLUME = 1;

const resolveSrc = (src: string): string =>
  /^https?:\/\//.test(src) ? src : staticFile(src);

export type MusicTrack = {
  src: string;
};

// Voiceover (if any) starts at frame 0, alongside the first subtitle, and
// plays at full volume. Background music (if any) is picked server-side
// (see server/render-server.js — it lists public/audio/music/, since a
// composition has no filesystem access) and loops for the whole video at
// MUSIC_VOLUME. Renders nothing for whichever of the two is absent — safe
// to use on every composition regardless of whether Make sent audio for
// this render.
export const AudioLayer: React.FC<{
  voiceoverUrl?: string;
  musicTrack?: MusicTrack;
}> = ({ voiceoverUrl, musicTrack }) => {
  return (
    <>
      {voiceoverUrl ? (
        <Audio src={resolveSrc(voiceoverUrl)} volume={VOICEOVER_VOLUME} />
      ) : null}
      {musicTrack ? <MusicLayer track={musicTrack} /> : null}
    </>
  );
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
  const src = resolveSrc(track.src);
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
