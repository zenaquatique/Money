import React from "react";
import { colors } from "./colors";
import { SlideFrame } from "./SlideFrame";

export const OptionSlide: React.FC<{
  variant: "A" | "B";
  label: string;
  text: string;
  durationInFrames: number;
}> = ({ variant, label, text, durationInFrames }) => {
  const background = variant === "A" ? colors.neutral : colors.brand;
  const accent = variant === "A" ? colors.softWhite : colors.aqua;

  return (
    <SlideFrame background={background} durationInFrames={durationInFrames}>
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 12,
          border: `2px solid ${accent}`,
          borderRadius: 999,
          padding: "10px 28px",
          marginBottom: 40,
        }}
      >
        <span
          style={{
            color: accent,
            fontSize: 26,
            fontWeight: 700,
            letterSpacing: 3,
            textTransform: "uppercase",
          }}
        >
          Option {variant} — {label}
        </span>
      </div>
      <div
        style={{
          color: colors.white,
          fontSize: 56,
          fontWeight: 700,
          lineHeight: 1.3,
          textAlign: "center",
        }}
      >
        {text}
      </div>
    </SlideFrame>
  );
};
