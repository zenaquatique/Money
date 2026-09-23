import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { colors } from "./colors";
import { splitWords } from "./KaraokeText";

// How long a badge stays fully visible after popping in, in frames, once
// the word it echoes has been "spoken" — independent of how long that
// word's own karaoke slot is, so a short word (e.g. "5€") still gives the
// viewer enough time to actually read the number.
const HOLD_FRAMES = 42;
const POP_IN_FRAMES = 8;
const FADE_OUT_FRAMES = 10;

// A word counts as "numeric" (worth calling out as a proof overlay) when
// it contains at least one digit — covers prices ("0,99€", "5€"),
// quantities ("5", "10"), percentages ("30%") and durations ("48h") as
// written by the Claude script-gen prompt, without hard-coding every unit.
const isNumberWord = (word: string): boolean => /\d/.test(word);

// A trailing unit-only token (currency/percent sign with no digit of its
// own) gets folded into the previous numeric word's badge instead of
// spawning a second, empty-looking one — covers the rare case where
// Claude's output has a space before the symbol ("0,99 €" vs "0,99€").
const isUnitOnlyWord = (word: string): boolean =>
  /^[€%]+[.,;:!?)]*$/.test(word);

type NumberToken = {
  key: string;
  label: string;
  wordIndex: number;
};

// Trailing punctuation (from the sentence around it, not the number
// itself) has no place on a big standalone badge — "5€," reads like a
// typo where "5€" reads like a price.
const stripTrailingPunctuation = (word: string): string =>
  word.replace(/[.,;:!?)]+$/, "");

const extractNumberTokens = (words: string[]): NumberToken[] => {
  const tokens: NumberToken[] = [];
  for (let index = 0; index < words.length; index += 1) {
    const word = words[index];
    if (!isNumberWord(word)) {
      continue;
    }
    const next = words[index + 1];
    const label = next && isUnitOnlyWord(next)
      ? `${stripTrailingPunctuation(word)} ${stripTrailingPunctuation(next)}`
      : stripTrailingPunctuation(word);
    tokens.push({ key: `${index}-${word}`, label, wordIndex: index });
  }
  return tokens;
};

// Renders a large, animated "proof" badge for every price/quantity found
// in `text`, each popping in on the exact frame its own word is revealed
// by the sibling <KaraokeText> (same text, same durationInFrames/
// startFrame, same word-splitting — see splitWords) rather than left to
// the voiceover alone (the "overlays de preuve chiffrée" ask). Renders
// nothing when the text has no digit in it — safe to drop into every
// slide unconditionally.
export const NumberOverlay: React.FC<{
  text: string;
  durationInFrames: number;
  startFrame?: number;
}> = ({ text, durationInFrames, startFrame = 0 }) => {
  const frame = useCurrentFrame();
  const words = splitWords(text);
  const framesPerWord = words.length > 0 ? durationInFrames / words.length : 0;
  const tokens = extractNumberTokens(words);

  if (tokens.length === 0) {
    return null;
  }

  return (
    <>
      {tokens.map((token) => {
        const wordStartFrame = startFrame + token.wordIndex * framesPerWord;
        const localFrame = frame - wordStartFrame;
        const fadeOutStart = HOLD_FRAMES;
        const opacity = interpolate(
          localFrame,
          [0, POP_IN_FRAMES, fadeOutStart, fadeOutStart + FADE_OUT_FRAMES],
          [0, 1, 1, 0],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
        );
        const scale = interpolate(
          localFrame,
          [0, POP_IN_FRAMES * 0.6, POP_IN_FRAMES],
          [0.4, 1.12, 1],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
        );

        if (opacity <= 0) {
          return null;
        }

        return (
          <div
            key={token.key}
            style={{
              position: "absolute",
              left: "50%",
              bottom: "16%",
              transform: `translateX(-50%) scale(${scale})`,
              opacity,
              background: colors.aqua,
              color: colors.deepWater,
              fontWeight: 800,
              fontSize: 72,
              lineHeight: 1,
              padding: "20px 40px",
              borderRadius: 24,
              boxShadow: "0 12px 32px rgba(0,0,0,0.45)",
              whiteSpace: "nowrap",
            }}
          >
            {token.label}
          </div>
        );
      })}
    </>
  );
};
