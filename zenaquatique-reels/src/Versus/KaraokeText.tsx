import React from "react";
import {
  Audio,
  interpolate,
  random,
  Sequence,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { POP_FILES } from "./sfx";

// How many frames each word takes to pop in (fade + scale from 0.7 to 1) —
// short and snappy, not a full spring cycle, so it doesn't compete with the
// slide's own entrance animation (see SlideFrame).
const POP_IN_FRAMES = 6;

// How many words are visible on screen at once — short-form "dynamic
// caption" style (Hormozi/Submagic/CapCut-auto-caption look): a small
// rolling chunk of words, not the whole sentence accumulating on screen.
// Chunk N replaces chunk N-1 entirely rather than the block growing.
const DEFAULT_GROUP_SIZE = 3;

// A quiet pop plays every time a new chunk of words appears — see sfx.ts.
// Volume kept low since this repeats every 2-3 words (several times per
// slide), unlike the background-cut whoosh which is rarer.
const POP_SFX_DURATION_IN_SECONDS = 0.25;
const POP_SFX_VOLUME = 0.16;

// Shared with NumberOverlay.tsx so a price/quantity badge pops in on
// exactly the same frame as the word it echoes — both split `text` the
// same way and index into the same array, so the two stay in lockstep
// with no separate timing computation to keep in sync by hand. Also
// shared with BackgroundVideoLayer's sfx trigger (see sfx.ts) so the pop
// sound plays on the same frame as each new chunk's entrance.
export const splitWords = (text: string): string[] =>
  text.split(/\s+/).filter(Boolean);

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
  // How many words are visible on screen at once (a "chunk") — see
  // DEFAULT_GROUP_SIZE above. Exposed mainly so the CTA pill (short,
  // already punchy on its own) can ask for a bigger chunk than the main
  // caption text if needed later; most callers don't need to set this.
  groupSize?: number;
  style?: React.CSSProperties;
};

// Returns which word index is "current" at `localFrame` (frames since the
// text's own startFrame), clamped to the last word once the whole text has
// been spoken — or -1 before the text starts at all. Exported so sibling
// components (NumberOverlay, BackgroundVideoLayer's pop sfx) can compute
// the same per-word timing without duplicating the word-index arithmetic.
export const wordIndexAtFrame = (
  localFrame: number,
  wordCount: number,
  framesPerWord: number,
): number => {
  if (localFrame < 0 || wordCount === 0) {
    return -1;
  }
  return Math.min(Math.floor(localFrame / framesPerWord), wordCount - 1);
};

// Renders one <Sequence><Audio/></Sequence> per chunk (not just the
// currently-visible one — every chunk this text will ever show over its
// whole durationInFrames), each starting exactly when that chunk's first
// word starts popping in. Split out from the main component because it
// needs to enumerate *all* chunks up front rather than react to `frame`
// like the visible text does.
const ChunkPopSounds: React.FC<{
  text: string;
  words: string[];
  framesPerWord: number;
  startFrame: number;
  groupSize: number;
}> = ({ text, words, framesPerWord, startFrame, groupSize }) => {
  const { fps } = useVideoConfig();
  const sfxDurationInFrames = Math.round(POP_SFX_DURATION_IN_SECONDS * fps);

  const chunkStarts: number[] = [];
  for (let wordIndex = 0; wordIndex < words.length; wordIndex += groupSize) {
    chunkStarts.push(wordIndex);
  }

  return (
    <>
      {chunkStarts.map((wordIndex) => {
        const from = Math.round(startFrame + wordIndex * framesPerWord);
        const fileIndex = Math.floor(
          random(`${text}:pop:${wordIndex}`) * POP_FILES.length,
        );
        const file = POP_FILES[Math.min(fileIndex, POP_FILES.length - 1)];
        return (
          <Sequence
            key={`pop-${wordIndex}`}
            from={from}
            durationInFrames={sfxDurationInFrames}
          >
            <Audio src={staticFile(file)} volume={POP_SFX_VOLUME} />
          </Sequence>
        );
      })}
    </>
  );
};

export const KaraokeText: React.FC<KaraokeTextProps> = ({
  text,
  durationInFrames,
  startFrame = 0,
  groupSize = DEFAULT_GROUP_SIZE,
  style,
}) => {
  const frame = useCurrentFrame();
  const words = splitWords(text);
  if (words.length === 0) {
    return null;
  }
  const framesPerWord = durationInFrames / words.length;
  const localFrame = frame - startFrame;
  const currentWordIndex = wordIndexAtFrame(localFrame, words.length, framesPerWord);

  const popSounds = (
    <ChunkPopSounds
      text={text}
      words={words}
      framesPerWord={framesPerWord}
      startFrame={startFrame}
      groupSize={groupSize}
    />
  );

  if (currentWordIndex < 0) {
    return popSounds;
  }

  const groupStart = Math.floor(currentWordIndex / groupSize) * groupSize;
  const groupWords = words.slice(groupStart, groupStart + groupSize);

  return (
    <>
      {popSounds}
      <div
        style={{
          ...style,
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: "0 0.3em",
        }}
      >
        {groupWords.map((word, i) => {
          const wordIndex = groupStart + i;
          const wordLocalFrame = localFrame - wordIndex * framesPerWord;
          const opacity = interpolate(wordLocalFrame, [0, POP_IN_FRAMES], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          const scale = interpolate(wordLocalFrame, [0, POP_IN_FRAMES], [0.7, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          return (
            <span
              key={`${wordIndex}-${word}`}
              style={{ display: "inline-block", opacity, transform: `scale(${scale})` }}
            >
              {word}
            </span>
          );
        })}
      </div>
    </>
  );
};
