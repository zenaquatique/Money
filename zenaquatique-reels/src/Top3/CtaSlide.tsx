import React from "react";
import { colors } from "../Versus/colors";
import { SlideFrame } from "../Versus/SlideFrame";

export const CtaSlide: React.FC<{
  brand: string;
  cta: string;
  durationInFrames: number;
  hasVideoBackground: boolean;
}> = ({ brand, cta, durationInFrames, hasVideoBackground }) => {
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
          textShadow,
        }}
      >
        {brand}
      </div>
    </SlideFrame>
  );
};
