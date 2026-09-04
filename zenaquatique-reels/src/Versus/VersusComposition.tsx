import React from "react";
import { AbsoluteFill, Sequence, useVideoConfig } from "remotion";
import { BackgroundVideoLayer } from "./BackgroundVideoLayer";
import { HookSlide } from "./HookSlide";
import { OptionSlide } from "./OptionSlide";
import { colors } from "./colors";
import { planClips } from "./clips";
import { getSlideTimeline, getTotalDurationInFrames, resolveDurations } from "./timing";
import type { VersusProps } from "./types";
import { VerdictSlide } from "./VerdictSlide";

export const VersusComposition: React.FC<VersusProps> = ({
  brand,
  hook,
  optionA,
  optionB,
  verdict,
  cta,
  clips,
  durationsInSeconds,
}) => {
  const { fps } = useVideoConfig();
  const durations = resolveDurations(durationsInSeconds);
  const [hookSlide, optionASlide, optionBSlide, verdictSlide] =
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
        from={optionASlide.from}
        durationInFrames={optionASlide.durationInFrames}
      >
        <OptionSlide
          variant="A"
          label={optionA.label}
          text={optionA.text}
          durationInFrames={optionASlide.durationInFrames}
          hasVideoBackground={hasVideoBackground}
        />
      </Sequence>
      <Sequence
        from={optionBSlide.from}
        durationInFrames={optionBSlide.durationInFrames}
      >
        <OptionSlide
          variant="B"
          label={optionB.label}
          text={optionB.text}
          durationInFrames={optionBSlide.durationInFrames}
          hasVideoBackground={hasVideoBackground}
        />
      </Sequence>
      <Sequence
        from={verdictSlide.from}
        durationInFrames={verdictSlide.durationInFrames}
      >
        <VerdictSlide
          brand={brand}
          text={verdict}
          cta={cta}
          durationInFrames={verdictSlide.durationInFrames}
          hasVideoBackground={hasVideoBackground}
        />
      </Sequence>
    </AbsoluteFill>
  );
};
