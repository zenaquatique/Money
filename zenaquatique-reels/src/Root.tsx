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

// Each slide's duration comes from its real voiceover clip when Make
// provided one (see resolveSegmentDurationsInSeconds), otherwise from the
// format's static defaults/explicit durationsInSeconds override — same
// as before voiceovers existed. Either way the resolved seconds are fed
// back to the component as `durationsInSeconds`, so VersusComposition
// (etc.) doesn't need to know or care whether a given value came from a
// voiceover probe or a static default.
const calculateVersusMetadata: CalculateMetadataFunction<VersusProps> = async ({
  props,
}) => {
  const baseline = resolveDurations(props.durationsInSeconds);
  const durationsInSeconds = await resolveSegmentDurationsInSeconds(
    {
      hook: props.voiceovers?.hook,
      optionA: props.voiceovers?.optionA,
      optionB: props.voiceovers?.optionB,
      verdict: props.voiceovers?.verdict ?? props.voiceovers?.cta,
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

const calculateTop3Metadata: CalculateMetadataFunction<Top3Props> = async ({
  props,
}) => {
  const baseline = resolveTop3Durations(props.durationsInSeconds);
  const durationsInSeconds = await resolveSegmentDurationsInSeconds(
    {
      hook: props.voiceovers?.hook,
      produit1: props.voiceovers?.produit1,
      produit2: props.voiceovers?.produit2,
      produit3: props.voiceovers?.produit3,
      benefices: props.voiceovers?.benefices,
      cta: props.voiceovers?.cta,
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

const calculateEducatifMetadata: CalculateMetadataFunction<EducatifProps> = async ({
  props,
}) => {
  const baseline = resolveEducatifDurations(props.durationsInSeconds);
  const durationsInSeconds = await resolveSegmentDurationsInSeconds(
    {
      hook: props.voiceovers?.hook,
      conseil1: props.voiceovers?.conseil1,
      conseil2: props.voiceovers?.conseil2,
      conseil3: props.voiceovers?.conseil3,
      cta: props.voiceovers?.cta,
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

const calculateConceptMetadata: CalculateMetadataFunction<ConceptProps> = async ({
  props,
}) => {
  const baseline = resolveConceptDurations(props.durationsInSeconds);
  const durationsInSeconds = await resolveSegmentDurationsInSeconds(
    {
      hook: props.voiceovers?.hook,
      message1: props.voiceovers?.message1,
      message2: props.voiceovers?.message2,
      cta: props.voiceovers?.cta,
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
