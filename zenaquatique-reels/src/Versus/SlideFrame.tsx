import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { colors } from "./colors";
import { ICONS, type IconName } from "./icons";

export const SlideFrame: React.FC<{
  background: string;
  scrim?: string;
  durationInFrames: number;
  // Optional contextual icon badge, tagged per segment by Claude in Make
  // (see README's "Icônes contextuelles") — floats in the top-right
  // corner, synced to the same fade/slide entrance as the rest of the
  // slide (it's rendered inside the same animated container below) so it
  // never needs its own timing logic.
  icon?: IconName;
  iconColor?: string;
  children: React.ReactNode;
}> = ({ background, scrim, durationInFrames, icon, iconColor, children }) => {
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
  const IconComponent = icon ? ICONS[icon] : undefined;

  return (
    <AbsoluteFill style={{ background }}>
      {scrim ? <AbsoluteFill style={{ background: scrim }} /> : null}
      <AbsoluteFill
        style={{
          opacity,
          transform: `translateY(${translateY}px)`,
          // Bottom-anchored "caption band" (like short-form dynamic
          // subtitles) rather than centered — keeps the background video
          // visible instead of a big block of text sitting over the
          // middle of the frame, where the actual subject usually is.
          justifyContent: "flex-end",
          alignItems: "center",
          padding: "80px 64px 140px",
          fontFamily:
            "'Helvetica Neue', Helvetica, Arial, sans-serif",
        }}
      >
        {IconComponent && (
          <div
            style={{
              position: "absolute",
              top: 64,
              right: 64,
              width: 88,
              height: 88,
              borderRadius: "50%",
              background: "rgba(63, 224, 197, 0.16)",
              border: `2px solid ${iconColor ?? colors.aqua}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <IconComponent color={iconColor ?? colors.aqua} size={44} />
          </div>
        )}
        {children}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
