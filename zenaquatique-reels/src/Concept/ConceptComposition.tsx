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
  message,
  cta,
  clips,
  durationsInSeconds,
}) => {
  const { fps } = useVideoConfig();
  const durations = resolveDurations(durationsInSeconds);
  const [hookSlide, messageSlide, ctaSlide] = getSlideTimeline(durations, fps);
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
      <Sequence from={messageSlide.from} durationInFrames={messageSlide.durationInFrames}>
        <MessageSlide
          text={message}
          durationInFrames={messageSlide.durationInFrames}
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
