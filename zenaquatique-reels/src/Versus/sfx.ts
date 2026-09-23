// Short, freely-licensed (CC0) whoosh transition sounds, played at each
// background-video jump cut (see BackgroundVideoLayer's CutSound) — files
// live in public/audio/sfx/, listed here since a composition can't read
// the filesystem itself (unlike public/audio/music/, which is picked
// server-side — these don't need per-render probing, so there's no need
// to route this through server/render-server.js at all).
export const SFX_FILES = [
  "audio/sfx/whoosh-1.mp3",
  "audio/sfx/whoosh-2.mp3",
  "audio/sfx/whoosh-3.mp3",
];
