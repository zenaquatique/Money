import React from "react";
import { colors } from "./colors";
import { SlideFrame } from "./SlideFrame";

export const HookSlide: React.FC<{
  brand: string;
  text: string;
  durationInFrames: number;
  hasVideoBackground: boolean;
}> = ({ brand, text, durationInFrames, hasVideoBackground }) => {
  const textShadow = hasVideoBackground
    ? "0 2px 16px rgba(0,0,0,0.6)"
    : undefined;

  return (
    <SlideFrame
      background={hasVideoBackground ? "transparent" : colors.deepWater}
      scrim={hasVideoBackground ? colors.scrimNeutral : undefined}
      durationInFrames={durationInFrames}
    >
      <div
        style={{
          color: colors.aqua,
          fontSize: 34,
          fontWeight: 700,
          letterSpacing: 4,
          textTransform: "uppercase",
          marginBottom: 32,
          textShadow,
        }}
      >
        {brand}
      </div>
      <div
        style={{
          color: colors.white,
          fontSize: 76,
          fontWeight: 800,
          lineHeight: 1.15,
          textAlign: "center",
          textShadow,
        }}
      >
        {text}
      </div>
    </SlideFrame>
  );
};
