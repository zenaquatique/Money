import React from "react";
import { colors } from "../Versus/colors";
import type { IconName } from "../Versus/icons";
import { KaraokeText } from "../Versus/KaraokeText";
import { SlideFrame } from "../Versus/SlideFrame";

export const BenefitsSlide: React.FC<{
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
      <KaraokeText
        text={text}
        durationInFrames={durationInFrames}
        style={{
          color: colors.white,
          fontSize: 60,
          fontWeight: 800,
          lineHeight: 1.25,
          textAlign: "center",
          textShadow,
        }}
      />
    </SlideFrame>
  );
};
