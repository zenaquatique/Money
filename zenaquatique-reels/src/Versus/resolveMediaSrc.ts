import { staticFile } from "remotion";

export const resolveMediaSrc = (src: string): string =>
  /^(https?:|data:)/.test(src) ? src : staticFile(src);
