import React from "react";
import { colors } from "./colors";
import { SlideFrame } from "./SlideFrame";

export const HookSlide: React.FC<{
  brand: string;
  text: string;
  durationInFrames: number;
}> = ({ brand, text, durationInFrames }) => {
  return (
    <SlideFrame background={colors.deepWater} durationInFrames={durationInFrames}>
      <div
        style={{
          color: colors.aqua,
          fontSize: 34,
          fontWeight: 700,
          letterSpacing: 4,
          textTransform: "uppercase",
          marginBottom: 32,
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
        }}
      >
        {text}
      </div>
    </SlideFrame>
  );
};
