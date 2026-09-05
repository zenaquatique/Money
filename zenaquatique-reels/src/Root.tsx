import "./index.css";
import { Composition, type CalculateMetadataFunction } from "remotion";
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
    </>
  );
};
