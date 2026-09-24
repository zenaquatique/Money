// Short, synthesized (no network access to CC0 sound libraries from the
// dev sandbox — verified blocked) sound effects. v2: quieter/smoother
// than the first attempt, which was pulled after sounding "horrible" in
// production — see gen-sfx-v2.js in the conversation history for the
// synthesis approach and what changed. Listed here (not probed
// server-side like public/audio/music/) since the set is small, fixed,
// and ships with the repo.
export const WHOOSH_FILES = [
  "audio/sfx/whoosh-1.mp3",
  "audio/sfx/whoosh-2.mp3",
  "audio/sfx/whoosh-3.mp3",
];

export const POP_FILES = ["audio/sfx/pop-1.mp3", "audio/sfx/pop-2.mp3"];
