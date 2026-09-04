import React from "react";
import { AbsoluteFill, OffthreadVideo, Sequence, staticFile } from "remotion";
import type { VersusClip } from "./types";

const resolveClipSrc = (src: string): string =>
  /^https?:\/\//.test(src) ? src : staticFile(src);

const coverStyle: React.CSSProperties = {
  width: "100%",
  height: "100%",
  objectFit: "cover",
};

// Renders the clip timeline for one Versus render: 1-2 short intro clips
// shown back to back during the Hook, then a single longer clip playing
// continuously behind the rest of the video. Renders nothing (falls back
// to the slides' own solid background) when no clips are provided.
export const BackgroundVideoLayer: React.FC<{
  introClips: VersusClip[];
  tailClip: VersusClip | undefined;
  hookDurationInFrames: number;
  totalDurationInFrames: number;
}> = ({ introClips, tailClip, hookDurationInFrames, totalDurationInFrames }) => {
  if (!tailClip) {
    return null;
  }

  const introClipDuration =
    introClips.length > 0
      ? Math.floor(hookDurationInFrames / introClips.length)
      : 0;

  return (
    <AbsoluteFill>
      {introClips.map((clip, index) => {
        const isLast = index === introClips.length - 1;
        const from = index * introClipDuration;
        const durationInFrames = isLast
          ? hookDurationInFrames - from
          : introClipDuration;

        return (
          <Sequence
            key={`${clip.src}-${index}`}
            from={from}
            durationInFrames={durationInFrames}
          >
            <OffthreadVideo
              src={resolveClipSrc(clip.src)}
              muted
              style={coverStyle}
            />
          </Sequence>
        );
      })}
      <Sequence
        from={hookDurationInFrames}
        durationInFrames={totalDurationInFrames - hookDurationInFrames}
      >
        <OffthreadVideo
          src={resolveClipSrc(tailClip.src)}
          muted
          style={coverStyle}
        />
      </Sequence>
    </AbsoluteFill>
  );
};
