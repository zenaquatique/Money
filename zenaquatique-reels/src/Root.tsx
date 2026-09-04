import "./index.css";
import { Composition, type CalculateMetadataFunction } from "remotion";
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
    </>
  );
};
