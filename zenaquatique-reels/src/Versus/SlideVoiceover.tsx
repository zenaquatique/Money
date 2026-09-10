import React from "react";
import { Audio } from "remotion";
import { resolveMediaSrc } from "./resolveMediaSrc";

const VOICEOVER_VOLUME = 1;

// Drop inside a slide's own <Sequence> — Remotion scopes playback to that
// Sequence's frame range automatically, so this needs no timing math of
// its own. Renders nothing when there's no voiceover for this slide.
export const SlideVoiceover: React.FC<{ url: string | undefined }> = ({
  url,
}) => {
  if (!url) {
    return null;
  }
  return <Audio src={resolveMediaSrc(url)} volume={VOICEOVER_VOLUME} />;
};
