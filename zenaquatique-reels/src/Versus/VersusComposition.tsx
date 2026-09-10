import React from "react";
import { AbsoluteFill, Sequence, useVideoConfig } from "remotion";
import { AudioLayer } from "./AudioLayer";
import { BackgroundVideoLayer } from "./BackgroundVideoLayer";
import { HookSlide } from "./HookSlide";
import { OptionSlide } from "./OptionSlide";
import { SlideVoiceover } from "./SlideVoiceover";
import { colors } from "./colors";
import { planClips } from "./clips";
import {
  getSlideTimeline,
  getTotalDurationInFrames,
  resolveDurations,
  secondsToFrames,
} from "./timing";
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
  tailCount,
  durationsInSeconds,
  renderSeed,
  voiceovers,
  voiceoverDurations,
  musicTrack,
}) => {
  const { fps } = useVideoConfig();
  const durations = resolveDurations(durationsInSeconds);
  const [hookSlide, optionASlide, optionBSlide, verdictSlide] =
    getSlideTimeline(durations, fps);
  const totalDurationInFrames = getTotalDurationInFrames(durations, fps);
  const { introClips, tailClips } = planClips(clips, tailCount);
  const hasVideoBackground = tailClips.length > 0;
  // Versus has no separate CTA slide (see VerdictSlide) — when both a
  // verdict and a distinct cta voiceover are provided, cta's audio starts
  // right where verdict's real audio ends, both within this one Sequence
  // (see calculateVersusMetadata in Root.tsx for why the slide is sized
  // to fit both). No verdict voiceover → cta starts immediately instead.
  const ctaVoiceoverOffsetInFrames = voiceovers?.verdict
    ? secondsToFrames(voiceoverDurations?.verdict ?? 0, fps)
    : 0;

  return (
    <AbsoluteFill style={{ backgroundColor: colors.deepWater }}>
      <AudioLayer musicTrack={musicTrack} />
      <BackgroundVideoLayer
        introClips={introClips}
        tailClips={tailClips}
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
        <SlideVoiceover url={voiceovers?.hook} />
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
        <SlideVoiceover url={voiceovers?.optionA} />
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
        <SlideVoiceover url={voiceovers?.optionB} />
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
        <SlideVoiceover url={voiceovers?.verdict} />
        {voiceovers?.cta && (
          <Sequence from={ctaVoiceoverOffsetInFrames}>
            <SlideVoiceover url={voiceovers.cta} />
          </Sequence>
        )}
      </Sequence>
    </AbsoluteFill>
  );
};
