import React from "react";
import { colors } from "../Versus/colors";
import type { IconName } from "../Versus/icons";
import { KaraokeText } from "../Versus/KaraokeText";
import { NumberOverlay } from "../Versus/NumberOverlay";
import { SlideFrame } from "../Versus/SlideFrame";

export const MessageSlide: React.FC<{
  text: string;
  durationInFrames: number;
  hasVideoBackground: boolean;
  icon?: IconName;
}> = ({ text, durationInFrames, hasVideoBackground, icon }) => {
  const textShadow = hasVideoBackground
    ? "0 2px 16px rgba(0,0,0,0.6)"
    : undefined;

  return (
    <SlideFrame
      background={hasVideoBackground ? "transparent" : colors.brand}
      scrim={hasVideoBackground ? colors.scrimBrand : undefined}
      durationInFrames={durationInFrames}
      icon={icon}
    >
      <KaraokeText
        text={text}
        durationInFrames={durationInFrames}
        style={{
          color: colors.white,
          fontSize: 38,
          fontWeight: 700,
          lineHeight: 1.3,
          textAlign: "center",
          textShadow,
        }}
      />
      <NumberOverlay text={text} durationInFrames={durationInFrames} />
    </SlideFrame>
  );
};
