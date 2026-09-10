import "./index.css";
import { Composition, type CalculateMetadataFunction } from "remotion";
import { conceptDefaultProps } from "./Concept/defaultProps";
import { ConceptComposition } from "./Concept/ConceptComposition";
import {
  getTotalDurationInFrames as getConceptTotalDurationInFrames,
  resolveDurations as resolveConceptDurations,
} from "./Concept/timing";
import type { ConceptProps } from "./Concept/types";
import { educatifDefaultProps } from "./Educatif/defaultProps";
import { EducatifComposition } from "./Educatif/EducatifComposition";
import {
  getTotalDurationInFrames as getEducatifTotalDurationInFrames,
  resolveDurations as resolveEducatifDurations,
} from "./Educatif/timing";
import type { EducatifProps } from "./Educatif/types";
import { top3DefaultProps } from "./Top3/defaultProps";
import {
  getTotalDurationInFrames as getTop3TotalDurationInFrames,
  resolveDurations as resolveTop3Durations,
} from "./Top3/timing";
import type { Top3Props } from "./Top3/types";
import { Top3Composition } from "./Top3/Top3Composition";
import { versusDefaultProps } from "./Versus/defaultProps";
import { getTotalDurationInFrames, resolveDurations } from "./Versus/timing";
import type { VersusProps } from "./Versus/types";
import { VersusComposition } from "./Versus/VersusComposition";
import { resolveSegmentDurationsInSeconds } from "./Versus/voiceoverTimeline";

const FPS = 30;

// Each slide's duration comes from its real voiceover's probed duration
// (props.voiceoverDurations, computed server-side — see
// resolveSegmentDurationsInSeconds and server/render-server.js) when Make
// provided a voiceover for it, otherwise from the format's static
// defaults/explicit durationsInSeconds override — same as before
// voiceovers existed. Either way the resolved seconds are fed back to the
// component as `durationsInSeconds`, so VersusComposition (etc.) doesn't
// need to know or care whether a given value came from a voiceover or a
// static default.
const calculateVersusMetadata: CalculateMetadataFunction<VersusProps> = ({
  props,
}) => {
  const baseline = resolveDurations(props.durationsInSeconds);
  const verdictVoiceoverDuration = props.voiceoverDurations?.verdict;
  const ctaVoiceoverDuration = props.voiceoverDurations?.cta;
  const durationsInSeconds = resolveSegmentDurationsInSeconds(
    {
      hook: props.voiceoverDurations?.hook,
      optionA: props.voiceoverDurations?.optionA,
      optionB: props.voiceoverDurations?.optionB,
      // Versus has no separate CTA slide — the CTA text lives inside the
      // Verdict slide, and when Make sends a *distinct* cta voiceover (as
      // opposed to using cta as a stand-in when verdict itself is
      // missing), its audio plays right after the verdict voiceover
      // within that same slide (see VersusComposition). The slide must
      // therefore be long enough for both, not just one — summing them
      // when at least one is present; falls back to the static default
      // only when neither voiceover was provided at all.
      verdict:
        verdictVoiceoverDuration !== undefined || ctaVoiceoverDuration !== undefined
          ? (verdictVoiceoverDuration ?? 0) + (ctaVoiceoverDuration ?? 0)
          : undefined,
    },
    baseline,
  );
  return {
    durationInFrames: getTotalDurationInFrames(durationsInSeconds, FPS),
    fps: FPS,
    width: 1080,
    height: 1920,
    props: { ...props, durationsInSeconds },
  };
};

const calculateTop3Metadata: CalculateMetadataFunction<Top3Props> = ({
  props,
}) => {
  const baseline = resolveTop3Durations(props.durationsInSeconds);
  const durationsInSeconds = resolveSegmentDurationsInSeconds(
    {
      hook: props.voiceoverDurations?.hook,
      produit1: props.voiceoverDurations?.produit1,
      produit2: props.voiceoverDurations?.produit2,
      produit3: props.voiceoverDurations?.produit3,
      benefices: props.voiceoverDurations?.benefices,
      cta: props.voiceoverDurations?.cta,
    },
    baseline,
  );
  return {
    durationInFrames: getTop3TotalDurationInFrames(durationsInSeconds, FPS),
    fps: FPS,
    width: 1080,
    height: 1920,
    props: { ...props, durationsInSeconds },
  };
};

const calculateEducatifMetadata: CalculateMetadataFunction<EducatifProps> = ({
  props,
}) => {
  const baseline = resolveEducatifDurations(props.durationsInSeconds);
  const durationsInSeconds = resolveSegmentDurationsInSeconds(
    {
      hook: props.voiceoverDurations?.hook,
      conseil1: props.voiceoverDurations?.conseil1,
      conseil2: props.voiceoverDurations?.conseil2,
      conseil3: props.voiceoverDurations?.conseil3,
      cta: props.voiceoverDurations?.cta,
    },
    baseline,
  );
  return {
    durationInFrames: getEducatifTotalDurationInFrames(durationsInSeconds, FPS),
    fps: FPS,
    width: 1080,
    height: 1920,
    props: { ...props, durationsInSeconds },
  };
};

const calculateConceptMetadata: CalculateMetadataFunction<ConceptProps> = ({
  props,
}) => {
  const baseline = resolveConceptDurations(props.durationsInSeconds);
  const durationsInSeconds = resolveSegmentDurationsInSeconds(
    {
      hook: props.voiceoverDurations?.hook,
      message1: props.voiceoverDurations?.message1,
      message2: props.voiceoverDurations?.message2,
      cta: props.voiceoverDurations?.cta,
    },
    baseline,
  );
  return {
    durationInFrames: getConceptTotalDurationInFrames(durationsInSeconds, FPS),
    fps: FPS,
    width: 1080,
    height: 1920,
    props: { ...props, durationsInSeconds },
  };
};

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="Versus"
        component={VersusComposition}
        fps={FPS}
        width={1080}
        height={1920}
        durationInFrames={getTotalDurationInFrames(
          resolveDurations(undefined),
          FPS,
        )}
        defaultProps={versusDefaultProps}
        calculateMetadata={calculateVersusMetadata}
      />
      <Composition
        id="Top3"
        component={Top3Composition}
        fps={FPS}
        width={1080}
        height={1920}
        durationInFrames={getTop3TotalDurationInFrames(
          resolveTop3Durations(undefined),
          FPS,
        )}
        defaultProps={top3DefaultProps}
        calculateMetadata={calculateTop3Metadata}
      />
      <Composition
        id="Educatif"
        component={EducatifComposition}
        fps={FPS}
        width={1080}
        height={1920}
        durationInFrames={getEducatifTotalDurationInFrames(
          resolveEducatifDurations(undefined),
          FPS,
        )}
        defaultProps={educatifDefaultProps}
        calculateMetadata={calculateEducatifMetadata}
      />
      <Composition
        id="Concept"
        component={ConceptComposition}
        fps={FPS}
        width={1080}
        height={1920}
        durationInFrames={getConceptTotalDurationInFrames(
          resolveConceptDurations(undefined),
          FPS,
        )}
        defaultProps={conceptDefaultProps}
        calculateMetadata={calculateConceptMetadata}
      />
    </>
  );
};
