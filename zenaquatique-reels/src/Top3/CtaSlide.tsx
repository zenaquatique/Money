import React from "react";
import { colors } from "../Versus/colors";
import type { IconName } from "../Versus/icons";
import { KaraokeText } from "../Versus/KaraokeText";
import { NumberOverlay } from "../Versus/NumberOverlay";
import { SlideFrame } from "../Versus/SlideFrame";

export const CtaSlide: React.FC<{
  brand: string;
  cta: string;
  durationInFrames: number;
  hasVideoBackground: boolean;
  icon?: IconName;
}> = ({ brand, cta, durationInFrames, hasVideoBackground, icon }) => {
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
        text={cta}
        durationInFrames={durationInFrames}
        style={{
          color: colors.deepWater,
          background: colors.aqua,
          borderRadius: 999,
          padding: "14px 32px",
          fontSize: 24,
          fontWeight: 700,
          textAlign: "center",
        }}
      />
      <NumberOverlay text={cta} durationInFrames={durationInFrames} />
      <div
        style={{
          color: colors.softWhite,
          fontSize: 18,
          fontWeight: 600,
          letterSpacing: 2,
          marginTop: 16,
          textShadow,
        }}
      >
        {brand}
      </div>
    </SlideFrame>
  );
};
