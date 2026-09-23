import React from "react";
import { colors } from "./colors";
import { KaraokeText } from "./KaraokeText";
import { SlideFrame } from "./SlideFrame";

export const VerdictSlide: React.FC<{
  brand: string;
  text: string;
  cta: string;
  durationInFrames: number;
  hasVideoBackground: boolean;
  // Frame, within this slide, where the cta voiceover starts — 0 when
  // there's no distinct cta voiceover (verdict and cta reveal together),
  // otherwise where the verdict voiceover ends (see VersusComposition's
  // ctaVoiceoverOffsetInFrames), so cta's words don't start popping in
  // until verdict's narration has actually finished.
  ctaOffsetInFrames?: number;
}> = ({
  brand,
  text,
  cta,
  durationInFrames,
  hasVideoBackground,
  ctaOffsetInFrames = 0,
}) => {
  const textShadow = hasVideoBackground
    ? "0 2px 16px rgba(0,0,0,0.6)"
    : undefined;
  const verdictDurationInFrames =
    ctaOffsetInFrames > 0 ? ctaOffsetInFrames : durationInFrames;

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
        Verdict
      </div>
      <KaraokeText
        text={text}
        durationInFrames={verdictDurationInFrames}
        style={{
          color: colors.white,
          fontSize: 60,
          fontWeight: 800,
          lineHeight: 1.25,
          textAlign: "center",
          marginBottom: 56,
          textShadow,
        }}
      />
      <KaraokeText
        text={cta}
        durationInFrames={durationInFrames - ctaOffsetInFrames}
        startFrame={ctaOffsetInFrames}
        style={{
          color: colors.deepWater,
          background: colors.aqua,
          borderRadius: 999,
          padding: "20px 44px",
          fontSize: 32,
          fontWeight: 700,
          textAlign: "center",
        }}
      />
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
