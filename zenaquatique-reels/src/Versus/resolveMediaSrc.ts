import { staticFile } from "remotion";

export const resolveMediaSrc = (src: string): string =>
  /^https?:\/\//.test(src) ? src : staticFile(src);
