import React from "react";
import {
  AbsoluteFill,
  Loop,
  OffthreadVideo,
  random,
  Sequence,
  staticFile,
  useVideoConfig,
} from "remotion";
import type { VersusClip } from "./types";

const resolveClipSrc = (src: string): string =>
  /^https?:\/\//.test(src) ? src : staticFile(src);

const coverStyle: React.CSSProperties = {
  width: "100%",
  height: "100%",
  objectFit: "cover",
};

// Renders one background clip, starting at a random point in the source
// when it's longer than the slot it fills — so the same rush doesn't
// always show its first N seconds on every render. `clip.durationInSeconds`
// is looked up server-side (server/render-server.js, via Remotion's own
// compositor — the same decoder OffthreadVideo itself uses) before the
// render starts, so it's a plain synchronous prop here, not fetched in
// the browser. The random point is derived from `seed` (fresh per
// render) via Remotion's deterministic random(), so every frame agrees
// on the same start point instead of drifting frame to frame.
//
// When the rush is *shorter* than the slot instead, OffthreadVideo would
// simply run out and freeze on its last frame for the remainder — so it's
// wrapped in <Loop> (same mechanism already used for the background music
// track, see AudioLayer.tsx) to replay it from frame 0 as many times as
// needed to fill the slot, instead of ever holding a static frame.
const ClipVideo: React.FC<{
  clip: VersusClip;
  allocatedDurationInFrames: number;
  seed: string;
}> = ({ clip, allocatedDurationInFrames, seed }) => {
  const { fps } = useVideoConfig();
  const src = resolveClipSrc(clip.src);

  let trimBefore = 0;
  let clipDurationInFrames: number | undefined;
  if (clip.durationInSeconds !== undefined) {
    clipDurationInFrames = Math.floor(clip.durationInSeconds * fps);
    const maxStart = clipDurationInFrames - allocatedDurationInFrames;
    if (maxStart > 0) {
      trimBefore = Math.floor(random(`${seed}:${clip.src}`) * (maxStart + 1));
    }
  }

  const video = (
    <OffthreadVideo
      src={src}
      muted
      style={coverStyle}
      trimBefore={trimBefore}
    />
  );

  if (
    clipDurationInFrames !== undefined &&
    clipDurationInFrames > 0 &&
    clipDurationInFrames < allocatedDurationInFrames
  ) {
    return <Loop durationInFrames={clipDurationInFrames}>{video}</Loop>;
  }

  return video;
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
  seed: string;
}> = ({
  introClips,
  tailClip,
  hookDurationInFrames,
  totalDurationInFrames,
  seed,
}) => {
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
            <ClipVideo
              clip={clip}
              allocatedDurationInFrames={durationInFrames}
              seed={`${seed}:intro:${index}`}
            />
          </Sequence>
        );
      })}
      <Sequence
        from={hookDurationInFrames}
        durationInFrames={totalDurationInFrames - hookDurationInFrames}
      >
        <ClipVideo
          clip={tailClip}
          allocatedDurationInFrames={totalDurationInFrames - hookDurationInFrames}
          seed={`${seed}:tail`}
        />
      </Sequence>
    </AbsoluteFill>
  );
};
