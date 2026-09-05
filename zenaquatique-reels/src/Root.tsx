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

const FPS = 30;

const calculateVersusMetadata: CalculateMetadataFunction<VersusProps> = ({
  props,
}) => {
  const durations = resolveDurations(props.durationsInSeconds);
  return {
    durationInFrames: getTotalDurationInFrames(durations, FPS),
    fps: FPS,
    width: 1080,
    height: 1920,
  };
};

const calculateTop3Metadata: CalculateMetadataFunction<Top3Props> = ({
  props,
}) => {
  const durations = resolveTop3Durations(props.durationsInSeconds);
  return {
    durationInFrames: getTop3TotalDurationInFrames(durations, FPS),
    fps: FPS,
    width: 1080,
    height: 1920,
  };
};

const calculateEducatifMetadata: CalculateMetadataFunction<EducatifProps> = ({
  props,
}) => {
  const durations = resolveEducatifDurations(props.durationsInSeconds);
  return {
    durationInFrames: getEducatifTotalDurationInFrames(durations, FPS),
    fps: FPS,
    width: 1080,
    height: 1920,
  };
};

const calculateConceptMetadata: CalculateMetadataFunction<ConceptProps> = ({
  props,
}) => {
  const durations = resolveConceptDurations(props.durationsInSeconds);
  return {
    durationInFrames: getConceptTotalDurationInFrames(durations, FPS),
    fps: FPS,
    width: 1080,
    height: 1920,
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
