import React from "react";
import { AbsoluteFill, Sequence, useVideoConfig } from "remotion";
import { AudioLayer } from "../Versus/AudioLayer";
import { BackgroundVideoLayer } from "../Versus/BackgroundVideoLayer";
import { colors } from "../Versus/colors";
import { planClips } from "../Versus/clips";
import { HookSlide } from "../Versus/HookSlide";
import { SlideVoiceover } from "../Versus/SlideVoiceover";
import { BenefitsSlide } from "./BenefitsSlide";
import { CtaSlide } from "./CtaSlide";
import { ProductSlide } from "./ProductSlide";
import { getSlideTimeline, getTotalDurationInFrames, resolveDurations } from "./timing";
import type { Top3Props } from "./types";

export const Top3Composition: React.FC<Top3Props> = ({
  brand,
  hook,
  produit1,
  produit2,
  produit3,
  benefices,
  cta,
  clips,
  durationsInSeconds,
  renderSeed,
  voiceovers,
  musicTrack,
}) => {
  const { fps } = useVideoConfig();
  const durations = resolveDurations(durationsInSeconds);
  const [hookSlide, produit1Slide, produit2Slide, produit3Slide, benefSlide, ctaSlide] =
    getSlideTimeline(durations, fps);
  const totalDurationInFrames = getTotalDurationInFrames(durations, fps);
  const { introClips, tailClip } = planClips(clips);
  const hasVideoBackground = tailClip !== undefined;

  return (
    <AbsoluteFill style={{ backgroundColor: colors.deepWater }}>
      <AudioLayer musicTrack={musicTrack} />
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
        <SlideVoiceover url={voiceovers?.hook} />
      </Sequence>
      <Sequence
        from={produit1Slide.from}
        durationInFrames={produit1Slide.durationInFrames}
      >
        <ProductSlide
          rank={1}
          label={produit1.label}
          text={produit1.text}
          durationInFrames={produit1Slide.durationInFrames}
          hasVideoBackground={hasVideoBackground}
        />
        <SlideVoiceover url={voiceovers?.produit1} />
      </Sequence>
      <Sequence
        from={produit2Slide.from}
        durationInFrames={produit2Slide.durationInFrames}
      >
        <ProductSlide
          rank={2}
          label={produit2.label}
          text={produit2.text}
          durationInFrames={produit2Slide.durationInFrames}
          hasVideoBackground={hasVideoBackground}
        />
        <SlideVoiceover url={voiceovers?.produit2} />
      </Sequence>
      <Sequence
        from={produit3Slide.from}
        durationInFrames={produit3Slide.durationInFrames}
      >
        <ProductSlide
          rank={3}
          label={produit3.label}
          text={produit3.text}
          durationInFrames={produit3Slide.durationInFrames}
          hasVideoBackground={hasVideoBackground}
        />
        <SlideVoiceover url={voiceovers?.produit3} />
      </Sequence>
      <Sequence from={benefSlide.from} durationInFrames={benefSlide.durationInFrames}>
        <BenefitsSlide
          text={benefices}
          durationInFrames={benefSlide.durationInFrames}
          hasVideoBackground={hasVideoBackground}
        />
        <SlideVoiceover url={voiceovers?.benefices} />
      </Sequence>
      <Sequence from={ctaSlide.from} durationInFrames={ctaSlide.durationInFrames}>
        <CtaSlide
          brand={brand}
          cta={cta}
          durationInFrames={ctaSlide.durationInFrames}
          hasVideoBackground={hasVideoBackground}
        />
        <SlideVoiceover url={voiceovers?.cta} />
      </Sequence>
    </AbsoluteFill>
  );
};
