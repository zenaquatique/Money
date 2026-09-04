import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

export const SlideFrame: React.FC<{
  background: string;
  scrim?: string;
  durationInFrames: number;
  children: React.ReactNode;
}> = ({ background, scrim, durationInFrames, children }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const fadeFrames = Math.max(1, Math.min(15, Math.floor(durationInFrames / 4)));
  const opacity = interpolate(
    frame,
    [0, fadeFrames, durationInFrames - fadeFrames, durationInFrames],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  const entrance = spring({
    frame,
    fps,
    config: { damping: 200 },
    durationInFrames: fadeFrames * 2,
  });
  const translateY = interpolate(entrance, [0, 1], [40, 0]);

  return (
    <AbsoluteFill style={{ background }}>
      {scrim ? <AbsoluteFill style={{ background: scrim }} /> : null}
      <AbsoluteFill
        style={{
          opacity,
          transform: `translateY(${translateY}px)`,
          justifyContent: "center",
          alignItems: "center",
          padding: "80px 64px",
          fontFamily:
            "'Helvetica Neue', Helvetica, Arial, sans-serif",
        }}
      >
        {children}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
