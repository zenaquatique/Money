import React from "react";
import {
  AbsoluteFill,
  Audio,
  interpolate,
  Loop,
  OffthreadVideo,
  random,
  Sequence,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { SFX_FILES } from "./sfx";
import type { ShotEffect, VersusClip } from "./types";

const resolveClipSrc = (src: string): string =>
  /^https?:\/\//.test(src) ? src : staticFile(src);

const coverStyle: React.CSSProperties = {
  width: "100%",
  height: "100%",
  objectFit: "cover",
};

// One motion curve per ShotEffect — scale/pan/rotate as [from, to] pairs
// interpolated across the shot's own span, plus a playback speed. Every
// preset overscales a bit past 1 (even "zoom_out" starts above 1) so a
// panned or rotated frame never shows an empty corner — see the extra
// margin comment below.
type ShotMotion = {
  scaleFrom: number;
  scaleTo: number;
  translateXFrom: number; // percent of frame width
  translateXTo: number;
  rotateFrom: number; // degrees
  rotateTo: number;
  speed: number;
};

const SHOT_MOTION: Record<ShotEffect, ShotMotion> = {
  zoom_in: { scaleFrom: 1, scaleTo: 1.12, translateXFrom: 0, translateXTo: 0, rotateFrom: 0, rotateTo: 0, speed: 1 },
  zoom_out: { scaleFrom: 1.12, scaleTo: 1, translateXFrom: 0, translateXTo: 0, rotateFrom: 0, rotateTo: 0, speed: 1 },
  pan_drift: { scaleFrom: 1.08, scaleTo: 1.08, translateXFrom: -2.5, translateXTo: 2.5, rotateFrom: 0, rotateTo: 0, speed: 1 },
  tilt_zoom: { scaleFrom: 1.1, scaleTo: 1.16, translateXFrom: 0, translateXTo: 0, rotateFrom: -3.5, rotateTo: 3.5, speed: 1 },
  speed_punch: { scaleFrom: 1, scaleTo: 1.08, translateXFrom: 0, translateXTo: 0, rotateFrom: 0, rotateTo: 0, speed: 1.25 },
};

const SHOT_EFFECTS = Object.keys(SHOT_MOTION) as ShotEffect[];

// Safety clamps for values that can come from Make/Claude (see ShotEffect
// in types.ts) — kept narrow enough that even a bad value can't stall
// playback (extreme slow-mo running out of source frames) or look broken
// (a big rotation exposing empty corners the overscale doesn't cover).
const clampSpeed = (speed: number): number =>
  Math.min(1.8, Math.max(0.6, speed));
const clampRotateDeg = (deg: number): number => Math.min(8, Math.max(-8, deg));

// Resolves one shot's motion: explicit per-clip overrides (`clip.effect`/
// `clip.speed`/`clip.rotateDeg`, set by the script-generation step —
// see ShotEffect in types.ts) take priority field by field; anything not
// overridden falls back to an automatically-picked preset (deterministic
// per shot from `seed`, so every render is already varied with zero
// Make/Claude changes required).
//
// `clip` ultimately comes from whatever JSON Make's HTTP module sends —
// server/render-server.js only checks `clip.src`, so `effect`/`speed`/
// `rotateDeg` reach here exactly as an LLM wrote them: a typo'd effect
// name, a stringified number, or a field missing entirely are all
// expected inputs, not edge cases, so every one of them falls back to the
// auto-picked preset rather than producing a broken/undefined shot.
const isShotEffect = (value: unknown): value is ShotEffect =>
  typeof value === "string" && (SHOT_EFFECTS as string[]).includes(value);

const resolveShotMotion = (clip: VersusClip, seed: string): ShotMotion => {
  const autoEffect =
    SHOT_EFFECTS[Math.floor(random(`${seed}:style`) * SHOT_EFFECTS.length)];
  const base = SHOT_MOTION[isShotEffect(clip.effect) ? clip.effect : autoEffect];

  const hasRotateOverride =
    typeof clip.rotateDeg === "number" && Number.isFinite(clip.rotateDeg);
  const rotateFrom = hasRotateOverride ? 0 : base.rotateFrom;
  const rotateTo = hasRotateOverride
    ? clampRotateDeg(clip.rotateDeg as number)
    : base.rotateTo;

  const hasSpeedOverride =
    typeof clip.speed === "number" && Number.isFinite(clip.speed);

  // A rotated frame needs extra overscale to avoid exposing an empty
  // corner — each preset already overscales enough for its own rotation,
  // but an explicit `rotateDeg` can exceed what the auto-picked preset
  // budgeted for, so top up the margin here rather than per-preset.
  const maxAbsRotate = Math.max(Math.abs(rotateFrom), Math.abs(rotateTo));
  const minScaleForRotation = 1 + maxAbsRotate * 0.02;

  return {
    ...base,
    scaleFrom: Math.max(base.scaleFrom, minScaleForRotation),
    scaleTo: Math.max(base.scaleTo, minScaleForRotation),
    rotateFrom,
    rotateTo,
    speed: hasSpeedOverride ? clampSpeed(clip.speed as number) : base.speed,
  };
};

// No background shot ever holds a static, uncut frame for longer than
// this — the "rythme visuel dynamique" ask. A clip allocation longer than
// this gets sliced into several back-to-back shots (see splitIntoShots),
// each re-trimmed to a different random point in the same source clip —
// a jump cut using the existing rush library, no new footage needed.
const MAX_SHOT_DURATION_IN_SECONDS = 2.5;

// A short whoosh plays at every cut (see CutSound) — this is how long its
// own <Sequence> stays mounted; the actual mp3 is shorter and simply
// finishes playing on its own, this only bounds how long it could run.
const SFX_DURATION_IN_SECONDS = 0.8;
const SFX_VOLUME = 0.45;

type Shot = { from: number; durationInFrames: number };

// Splits one [from, from + durationInFrames) span into consecutive shots
// of at most `maxShotFrames` each (the last one absorbs any remainder
// smaller than a full shot, rather than leaving an orphan sliver) — used
// for both intro and tail clip allocations so nothing above the cap ever
// reaches ClipVideo as a single Sequence.
const splitIntoShots = (
  from: number,
  durationInFrames: number,
  maxShotFrames: number,
): Shot[] => {
  if (durationInFrames <= maxShotFrames) {
    return [{ from, durationInFrames }];
  }
  const shots: Shot[] = [];
  let cursor = from;
  const end = from + durationInFrames;
  while (cursor < end) {
    const shotDuration = Math.min(maxShotFrames, end - cursor);
    shots.push({ from: cursor, durationInFrames: shotDuration });
    cursor += shotDuration;
  }
  return shots;
};

// Renders one background shot, starting at a random point in the source
// when it's longer than the slot it fills — so the same rush doesn't
// always show its first N seconds on every render, and so consecutive
// shots sliced from one long rush (see splitIntoShots) land on visibly
// different footage instead of playing back contiguously (which would
// look like one shot, not several cuts). `clip.durationInSeconds` is
// looked up server-side (server/render-server.js, via Remotion's own
// compositor — the same decoder OffthreadVideo itself uses) before the
// render starts, so it's a plain synchronous prop here, not fetched in
// the browser. The random point is derived from `seed` (fresh per render,
// plus a per-shot suffix from the caller) via Remotion's deterministic
// random(), so every frame agrees on the same start point instead of
// drifting frame to frame.
//
// When the rush is *shorter* than its shot instead, OffthreadVideo would
// simply run out and freeze on its last frame for the remainder — so it's
// wrapped in <Loop> (same mechanism already used for the background music
// track, see AudioLayer.tsx) to replay it from frame 0 as many times as
// needed to fill the shot, instead of ever holding a static frame.
//
// Also applies one of a handful of camera-movement presets (zoom, pan,
// a slight tilt-zoom, or a speed "punch") over the shot's own span — see
// resolveShotMotion/ShotEffect above — so even a shot that stays on one
// static piece of footage still reads as camera movement, not a
// diaporama slide. Auto-picked per shot when the clip doesn't request a
// specific one.
const ClipVideo: React.FC<{
  clip: VersusClip;
  allocatedDurationInFrames: number;
  seed: string;
}> = ({ clip, allocatedDurationInFrames, seed }) => {
  const { fps } = useVideoConfig();
  const frame = useCurrentFrame();
  const src = resolveClipSrc(clip.src);

  let trimBefore = 0;
  let clipDurationInFrames: number | undefined;
  if (clip.durationInSeconds !== undefined) {
    clipDurationInFrames = Math.floor(clip.durationInSeconds * fps);
    const maxStart = clipDurationInFrames - allocatedDurationInFrames;
    if (maxStart > 0) {
      trimBefore = Math.floor(
        random(`${seed}:${clip.src}:trim`) * (maxStart + 1),
      );
    }
  }

  const motion = resolveShotMotion(clip, `${seed}:${clip.src}`);
  const progress = interpolate(
    frame,
    [0, Math.max(1, allocatedDurationInFrames)],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  const scale = interpolate(progress, [0, 1], [motion.scaleFrom, motion.scaleTo]);
  const translateX = interpolate(
    progress,
    [0, 1],
    [motion.translateXFrom, motion.translateXTo],
  );
  const rotate = interpolate(progress, [0, 1], [motion.rotateFrom, motion.rotateTo]);

  const video = (
    <OffthreadVideo
      src={src}
      muted
      style={coverStyle}
      trimBefore={trimBefore}
      playbackRate={motion.speed}
    />
  );

  const body =
    clipDurationInFrames !== undefined &&
    clipDurationInFrames > 0 &&
    clipDurationInFrames < allocatedDurationInFrames ? (
      <Loop durationInFrames={clipDurationInFrames}>{video}</Loop>
    ) : (
      video
    );

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          transform: `scale(${scale}) translateX(${translateX}%) rotate(${rotate}deg)`,
        }}
      >
        {body}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// A short whoosh at a shot's own start frame — skipped at frame 0 of the
// whole video (nothing to transition *from* yet). Which file plays is
// picked deterministically from `seed`, same pattern as the background
// music pick (see pickMusicTrack in server/render-server.js) but done
// entirely client-side since the small, fixed sfx set ships in the repo
// (public/audio/sfx/, listed in ./sfx.ts) rather than being probed
// per-render.
const CutSound: React.FC<{ from: number; seed: string; fps: number }> = ({
  from,
  seed,
  fps,
}) => {
  if (from <= 0) {
    return null;
  }
  const index = Math.floor(random(`${seed}:sfx`) * SFX_FILES.length);
  const file = SFX_FILES[Math.min(index, SFX_FILES.length - 1)];
  return (
    <Sequence
      from={from}
      durationInFrames={Math.round(SFX_DURATION_IN_SECONDS * fps)}
    >
      <Audio src={staticFile(file)} volume={SFX_VOLUME} />
    </Sequence>
  );
};

// Renders the clip timeline for one render: 1-2 short intro clips shown
// back to back during the Hook, then one or more clips playing back to
// back behind the rest of the video (the "tail" — see planClips/tailCount
// for how many). Every allocation above MAX_SHOT_DURATION_IN_SECONDS is
// sliced into several jump-cut shots (splitIntoShots) with a whoosh at
// each cut, so nothing here ever plays as one long static plan. Renders
// nothing (falls back to the slides' own solid background) when no clips
// are provided.
export const BackgroundVideoLayer: React.FC<{
  introClips: VersusClip[];
  tailClips: VersusClip[];
  hookDurationInFrames: number;
  totalDurationInFrames: number;
  seed: string;
}> = ({
  introClips,
  tailClips,
  hookDurationInFrames,
  totalDurationInFrames,
  seed,
}) => {
  const { fps } = useVideoConfig();

  if (tailClips.length === 0) {
    return null;
  }

  const maxShotFrames = Math.round(MAX_SHOT_DURATION_IN_SECONDS * fps);

  const introClipDuration =
    introClips.length > 0
      ? Math.floor(hookDurationInFrames / introClips.length)
      : 0;

  const tailTotalDuration = totalDurationInFrames - hookDurationInFrames;
  // Each tail clip after the first starts exactly where the previous
  // clip's own real duration ends — not an equal split — so together they
  // cover the whole span with distinct footage instead of one clip
  // looping (see pickRushesForTailDuration in server/render-server.js for
  // how many clips end up here and why there are usually just enough).
  // The very last one still gets whatever remains, whatever that is —
  // ClipVideo's own loop-if-too-short fallback covers it if that's more
  // than its own real duration (unknown duration, e.g. a remote URL from
  // an explicit Make-provided `clips`, or the rushes pool being too small
  // to fully cover the span).
  let tailCursor = 0;
  const tailAllocations = tailClips
    .map((clip, index) => {
      const isLast = index === tailClips.length - 1;
      const remaining = tailTotalDuration - tailCursor;
      const knownDurationInFrames =
        clip.durationInSeconds !== undefined
          ? Math.floor(clip.durationInSeconds * fps)
          : undefined;
      const durationInFrames =
        isLast || knownDurationInFrames === undefined
          ? remaining
          : Math.min(knownDurationInFrames, remaining);
      const from = hookDurationInFrames + tailCursor;
      tailCursor += durationInFrames;
      return { clip, from, durationInFrames, index };
    })
    .filter((allocation) => allocation.durationInFrames > 0);

  const introShots = introClips.flatMap((clip, index) => {
    const isLast = index === introClips.length - 1;
    const from = index * introClipDuration;
    const durationInFrames = isLast
      ? hookDurationInFrames - from
      : introClipDuration;
    return splitIntoShots(from, durationInFrames, maxShotFrames).map(
      (shot, shotIndex) => ({
        clip,
        shot,
        seed: `${seed}:intro:${index}:shot:${shotIndex}`,
        key: `${clip.src}-intro-${index}-${shotIndex}`,
      }),
    );
  });

  const tailShots = tailAllocations.flatMap(({ clip, from, durationInFrames, index }) =>
    splitIntoShots(from, durationInFrames, maxShotFrames).map(
      (shot, shotIndex) => ({
        clip,
        shot,
        seed: `${seed}:tail:${index}:shot:${shotIndex}`,
        key: `${clip.src}-tail-${index}-${shotIndex}`,
      }),
    ),
  );

  const allShots = [...introShots, ...tailShots];

  return (
    <AbsoluteFill>
      {allShots.map(({ clip, shot, seed: shotSeed, key }) => (
        <Sequence key={key} from={shot.from} durationInFrames={shot.durationInFrames}>
          <ClipVideo
            clip={clip}
            allocatedDurationInFrames={shot.durationInFrames}
            seed={shotSeed}
          />
        </Sequence>
      ))}
      {allShots.map(({ shot, seed: shotSeed, key }) => (
        <CutSound key={`sfx-${key}`} from={shot.from} seed={shotSeed} fps={fps} />
      ))}
    </AbsoluteFill>
  );
};
