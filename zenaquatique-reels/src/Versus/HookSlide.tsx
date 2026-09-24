import React from "react";
import { colors } from "./colors";
import type { IconName } from "./icons";
import { KaraokeText } from "./KaraokeText";
import { NumberOverlay } from "./NumberOverlay";
import { SlideFrame } from "./SlideFrame";

export const HookSlide: React.FC<{
  brand: string;
  text: string;
  durationInFrames: number;
  hasVideoBackground: boolean;
  icon?: IconName;
}> = ({ brand, text, durationInFrames, hasVideoBackground, icon }) => {
  const textShadow = hasVideoBackground
    ? "0 2px 16px rgba(0,0,0,0.6)"
    : undefined;

  return (
    <SlideFrame
      background={hasVideoBackground ? "transparent" : colors.deepWater}
      scrim={hasVideoBackground ? colors.scrimNeutral : undefined}
      durationInFrames={durationInFrames}
      icon={icon}
    >
      <div
        style={{
          color: colors.aqua,
          fontSize: 24,
          fontWeight: 700,
          letterSpacing: 4,
          textTransform: "uppercase",
          marginBottom: 18,
          textShadow,
        }}
      >
        {brand}
      </div>
      <KaraokeText
        text={text}
        durationInFrames={durationInFrames}
        style={{
          color: colors.white,
          fontSize: 44,
          fontWeight: 800,
          lineHeight: 1.2,
          textAlign: "center",
          textShadow,
        }}
      />
      <NumberOverlay text={text} durationInFrames={durationInFrames} />
    </SlideFrame>
  );
};
