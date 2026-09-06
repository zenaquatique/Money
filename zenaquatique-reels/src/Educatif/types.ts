import type { MusicTrack } from "../Versus/AudioLayer";
import type { VersusClip } from "../Versus/types";

export type EducatifSlideDurations = {
  hook: number;
  conseil1: number;
  conseil2: number;
  conseil3: number;
  cta: number;
};

// Sums to 20s, the target length for the "Educatif" Reel format.
export const DEFAULT_EDUCATIF_DURATIONS_IN_SECONDS: EducatifSlideDurations = {
  hook: 3,
  conseil1: 5,
  conseil2: 5,
  conseil3: 5,
  cta: 2,
};

export type EducatifProps = {
  brand: string;
  hook: string;
  conseil1: string;
  conseil2: string;
  conseil3: string;
  cta: string;
  // Same contract as Versus/Top3: 2-3 rush clips, explicitly ordered by the
  // caller (Make) — see src/Versus/clips.ts for how they're split into
  // intro cuts vs. the long tail clip. Omit/empty for a text-only render.
  clips?: VersusClip[];
  durationsInSeconds?: Partial<EducatifSlideDurations>;
  // Internal: set by server/render-server.js to a fresh value on every
  // render so BackgroundVideoLayer picks a different random start point
  // per clip each time, while staying identical across every frame of
  // this one render. Not meant to be set by callers (Make).
  renderSeed?: string;
  // Voiceover audio, provided by Make. Optional — omit/empty for a
  // silent render (no crash, same output as before this existed).
  // Starts at frame 0, alongside the Hook's text.
  voiceoverUrl?: string;
  // Internal: background music, picked and probed by
  // server/render-server.js from public/audio/music/. Not meant to be
  // set by callers (Make) — absent when that folder is empty/missing.
  musicTrack?: MusicTrack;
};
