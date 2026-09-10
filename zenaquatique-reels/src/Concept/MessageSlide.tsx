import React from "react";
import { colors } from "../Versus/colors";
import { SlideFrame } from "../Versus/SlideFrame";

export const MessageSlide: React.FC<{
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
          color: colors.white,
          fontSize: 64,
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
