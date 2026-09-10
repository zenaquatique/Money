import React from "react";
import { colors } from "../Versus/colors";
import { SlideFrame } from "../Versus/SlideFrame";

export const TipSlide: React.FC<{
  index: 1 | 2 | 3;
  text: string;
  durationInFrames: number;
  hasVideoBackground: boolean;
}> = ({ index, text, durationInFrames, hasVideoBackground }) => {
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
          display: "inline-flex",
          alignItems: "center",
          gap: 12,
          border: `2px solid ${colors.aqua}`,
          borderRadius: 999,
          padding: "10px 28px",
          marginBottom: 40,
          backgroundColor: hasVideoBackground
            ? "rgba(4,12,15,0.35)"
            : undefined,
        }}
      >
        <span
          style={{
            color: colors.aqua,
            fontSize: 26,
            fontWeight: 700,
            letterSpacing: 3,
            textTransform: "uppercase",
            textShadow,
          }}
        >
          Conseil {index}
        </span>
      </div>
      <div
        style={{
          color: colors.white,
          fontSize: 56,
          fontWeight: 700,
          lineHeight: 1.3,
          textAlign: "center",
          textShadow,
        }}
      >
        {text}
      </div>
    </SlideFrame>
  );
};
