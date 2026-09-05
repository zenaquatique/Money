import React from "react";
import { AbsoluteFill, Sequence, useVideoConfig } from "remotion";
import { BackgroundVideoLayer } from "../Versus/BackgroundVideoLayer";
import { colors } from "../Versus/colors";
import { planClips } from "../Versus/clips";
import { HookSlide } from "../Versus/HookSlide";
import { CtaSlide } from "../Top3/CtaSlide";
import { TipSlide } from "./TipSlide";
import { getSlideTimeline, getTotalDurationInFrames, resolveDurations } from "./timing";
import type { EducatifProps } from "./types";

export const EducatifComposition: React.FC<EducatifProps> = ({
  brand,
  hook,
  conseil1,
  conseil2,
  conseil3,
  cta,
  clips,
  durationsInSeconds,
}) => {
  const { fps } = useVideoConfig();
  const durations = resolveDurations(durationsInSeconds);
  const [hookSlide, conseil1Slide, conseil2Slide, conseil3Slide, ctaSlide] =
    getSlideTimeline(durations, fps);
  const totalDurationInFrames = getTotalDurationInFrames(durations, fps);
  const { introClips, tailClip } = planClips(clips);
  const hasVideoBackground = tailClip !== undefined;

  return (
    <AbsoluteFill style={{ backgroundColor: colors.deepWater }}>
      <BackgroundVideoLayer
        introClips={introClips}
        tailClip={tailClip}
        hookDurationInFrames={hookSlide.durationInFrames}
        totalDurationInFrames={totalDurationInFrames}
      />
      <Sequence from={hookSlide.from} durationInFrames={hookSlide.durationInFrames}>
        <HookSlide
          brand={brand}
          text={hook}
          durationInFrames={hookSlide.durationInFrames}
          hasVideoBackground={hasVideoBackground}
        />
      </Sequence>
      <Sequence
        from={conseil1Slide.from}
        durationInFrames={conseil1Slide.durationInFrames}
      >
        <TipSlide
          index={1}
          text={conseil1}
          durationInFrames={conseil1Slide.durationInFrames}
          hasVideoBackground={hasVideoBackground}
        />
      </Sequence>
      <Sequence
        from={conseil2Slide.from}
        durationInFrames={conseil2Slide.durationInFrames}
      >
        <TipSlide
          index={2}
          text={conseil2}
          durationInFrames={conseil2Slide.durationInFrames}
          hasVideoBackground={hasVideoBackground}
        />
      </Sequence>
      <Sequence
        from={conseil3Slide.from}
        durationInFrames={conseil3Slide.durationInFrames}
      >
        <TipSlide
          index={3}
          text={conseil3}
          durationInFrames={conseil3Slide.durationInFrames}
          hasVideoBackground={hasVideoBackground}
        />
      </Sequence>
      <Sequence from={ctaSlide.from} durationInFrames={ctaSlide.durationInFrames}>
        <CtaSlide
          brand={brand}
          cta={cta}
          durationInFrames={ctaSlide.durationInFrames}
          hasVideoBackground={hasVideoBackground}
        />
      </Sequence>
    </AbsoluteFill>
  );
};
