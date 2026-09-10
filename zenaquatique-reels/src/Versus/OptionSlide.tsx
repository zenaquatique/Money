import React from "react";
import { colors } from "./colors";
import { SlideFrame } from "./SlideFrame";

export const OptionSlide: React.FC<{
  variant: "A" | "B";
  label: string;
  text: string;
  durationInFrames: number;
  hasVideoBackground: boolean;
}> = ({ variant, label, text, durationInFrames, hasVideoBackground }) => {
  const background = variant === "A" ? colors.neutral : colors.brand;
  const scrim = variant === "A" ? colors.scrimNeutral : colors.scrimBrand;
  const accent = variant === "A" ? colors.softWhite : colors.aqua;
  const textShadow = hasVideoBackground
    ? "0 2px 16px rgba(0,0,0,0.6)"
    : undefined;

  return (
    <SlideFrame
      background={hasVideoBackground ? "transparent" : background}
      scrim={hasVideoBackground ? scrim : undefined}
      durationInFrames={durationInFrames}
    >
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 12,
          border: `2px solid ${accent}`,
          borderRadius: 999,
          padding: "10px 28px",
          marginBottom: 40,
          backgroundColor: hasVideoBackground
            ? "rgba(4,12,15,0.35)"
            : undefined,
        }}
      >
        <span
          style={{
            color: accent,
            fontSize: 26,
            fontWeight: 700,
            letterSpacing: 3,
            textTransform: "uppercase",
            textShadow,
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
          textShadow,
        }}
      >
        {text}
      </div>
    </SlideFrame>
  );
};
