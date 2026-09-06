import React from "react";
import { AbsoluteFill, Sequence, useVideoConfig } from "remotion";
import { BackgroundVideoLayer } from "../Versus/BackgroundVideoLayer";
import { colors } from "../Versus/colors";
import { planClips } from "../Versus/clips";
import { HookSlide } from "../Versus/HookSlide";
import { CtaSlide } from "../Top3/CtaSlide";
import { MessageSlide } from "./MessageSlide";
import { getSlideTimeline, getTotalDurationInFrames, resolveDurations } from "./timing";
import type { ConceptProps } from "./types";

export const ConceptComposition: React.FC<ConceptProps> = ({
  brand,
  hook,
  message1,
  message2,
  cta,
  clips,
  durationsInSeconds,
  renderSeed,
}) => {
  const { fps } = useVideoConfig();
  const durations = resolveDurations(durationsInSeconds);
  const [hookSlide, message1Slide, message2Slide, ctaSlide] =
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
        seed={renderSeed ?? "static-seed"}
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
        from={message1Slide.from}
        durationInFrames={message1Slide.durationInFrames}
      >
        <MessageSlide
          text={message1}
          durationInFrames={message1Slide.durationInFrames}
          hasVideoBackground={hasVideoBackground}
        />
      </Sequence>
      <Sequence
        from={message2Slide.from}
        durationInFrames={message2Slide.durationInFrames}
      >
        <MessageSlide
          text={message2}
          durationInFrames={message2Slide.durationInFrames}
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
