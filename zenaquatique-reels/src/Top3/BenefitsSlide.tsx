import React from "react";
import { colors } from "../Versus/colors";
import { SlideFrame } from "../Versus/SlideFrame";

export const BenefitsSlide: React.FC<{
  text: string;
  durationInFrames: number;
  hasVideoBackground: boolean;
}> = ({ text, durationInFrames, hasVideoBackground }) => {
  const textShadow = hasVideoBackground
    ? "0 2px 16px rgba(0,0,0,0.6)"
    : undefined;

  return (
    <SlideFrame
      background={hasVideoBackground ? "transparent" : colors.brand}
      scrim={hasVideoBackground ? colors.scrimBrand : undefined}
      durationInFrames={durationInFrames}
    >
      <div
        style={{
          color: colors.aqua,
          fontSize: 30,
          fontWeight: 700,
          letterSpacing: 4,
          textTransform: "uppercase",
          marginBottom: 32,
          textShadow,
        }}
      >
        Bénéfices
      </div>
      <div
        style={{
          color: colors.white,
          fontSize: 60,
          fontWeight: 800,
          lineHeight: 1.25,
          textAlign: "center",
          textShadow,
        }}
      >
        {text}
      </div>
    </SlideFrame>
  );
};
