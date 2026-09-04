import React from "react";
import { colors } from "./colors";
import { SlideFrame } from "./SlideFrame";

export const VerdictSlide: React.FC<{
  brand: string;
  text: string;
  cta: string;
  durationInFrames: number;
}> = ({ brand, text, cta, durationInFrames }) => {
  return (
    <SlideFrame background={colors.brand} durationInFrames={durationInFrames}>
      <div
        style={{
          color: colors.aqua,
          fontSize: 30,
          fontWeight: 700,
          letterSpacing: 4,
          textTransform: "uppercase",
          marginBottom: 32,
        }}
      >
        Verdict
      </div>
      <div
        style={{
          color: colors.white,
          fontSize: 60,
          fontWeight: 800,
          lineHeight: 1.25,
          textAlign: "center",
          marginBottom: 56,
        }}
      >
        {text}
      </div>
      <div
        style={{
          color: colors.deepWater,
          background: colors.aqua,
          borderRadius: 999,
          padding: "20px 44px",
          fontSize: 32,
          fontWeight: 700,
          textAlign: "center",
        }}
      >
        {cta}
      </div>
      <div
        style={{
          color: colors.softWhite,
          fontSize: 24,
          fontWeight: 600,
          letterSpacing: 2,
          marginTop: 28,
        }}
      >
        {brand}
      </div>
    </SlideFrame>
  );
};
