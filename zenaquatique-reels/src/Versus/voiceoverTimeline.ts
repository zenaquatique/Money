// Per-slide voiceover durations are probed server-side, in
// server/render-server.js, before the render starts — not in the browser.
// Browser-side probing (getAudioDurationInSeconds) used to do this, but
// Chromium's ORB (Opaque Response Blocking) protection blocks cross-origin
// audio fetches to hosts like Google Drive ("net::ERR_BLOCKED_BY_ORB"),
// which Node's own fetch isn't subject to. This just merges those
// already-computed durations into the shape each format's timing.ts
// expects, falling back to the static default for any slide whose
// voiceover is absent or failed to probe.
export const resolveSegmentDurationsInSeconds = <Key extends string>(
  voiceoverDurations: Partial<Record<Key, number>> | undefined,
  defaults: Record<Key, number>,
): Record<Key, number> => {
  const keys = Object.keys(defaults) as Key[];
  const entries = keys.map((key): [Key, number] => [
    key,
    voiceoverDurations?.[key] ?? defaults[key],
  ]);
  return Object.fromEntries(entries) as Record<Key, number>;
};
