import React from "react";
import { interpolate, useCurrentFrame } from "remotion";

// How many frames each word takes to pop in (fade + scale from 0.7 to 1) —
// short and snappy, not a full spring cycle, so it doesn't compete with the
// slide's own entrance animation (see SlideFrame).
const POP_IN_FRAMES = 6;

type KaraokeTextProps = {
  text: string;
  // Total budget, in frames, across which text's words are spread evenly
  // (durationInFrames ÷ word count) — an approximation of the real
  // per-word voiceover timing. ElevenLabs can return exact word timestamps
  // via its "with-timestamps" endpoint, but wiring that through (Make's
  // ElevenLabs calls, then render-server.js, then here) is a larger change
  // than this v1; swapping in real per-word timings later only needs new
  // values computed for `durationInFrames`/`startFrame` per word — this
  // component's own reveal logic wouldn't need to change.
  durationInFrames: number;
  // Frame, relative to the parent Sequence, at which this text's reveal
  // window begins — for a slide with two sequential voiceover segments
  // sharing one Sequence (see VerdictSlide's cta text, which starts once
  // the verdict voiceover ends).
  startFrame?: number;
  style?: React.CSSProperties;
};

export const KaraokeText: React.FC<KaraokeTextProps> = ({
  text,
  durationInFrames,
  startFrame = 0,
  style,
}) => {
  const frame = useCurrentFrame();
  const words = text.split(/\s+/).filter(Boolean);
  const framesPerWord = words.length > 0 ? durationInFrames / words.length : 0;

  return (
    <div
      style={{
        ...style,
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "center",
        gap: "0 0.3em",
      }}
    >
      {words.map((word, index) => {
        const localFrame = frame - startFrame - index * framesPerWord;
        const opacity = interpolate(localFrame, [0, POP_IN_FRAMES], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        const scale = interpolate(localFrame, [0, POP_IN_FRAMES], [0.7, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        return (
          <span
            key={`${index}-${word}`}
            style={{ display: "inline-block", opacity, transform: `scale(${scale})` }}
          >
            {word}
          </span>
        );
      })}
    </div>
  );
};
