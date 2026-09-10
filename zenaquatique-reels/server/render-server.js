const crypto = require("crypto");
const fs = require("fs");
const os = require("os");
const path = require("path");
const express = require("express");
const { bundle } = require("@remotion/bundler");
const { renderMedia, selectComposition, getVideoMetadata } = require("@remotion/renderer");
const { random } = require("remotion");

const PORT = process.env.PORT || 3001;
const API_KEY = process.env.RENDER_API_KEY;
const ENTRY_POINT = path.join(__dirname, "..", "src", "index.ts");
const PUBLIC_DIR = path.join(__dirname, "..", "public");
const MUSIC_DIR = path.join(PUBLIC_DIR, "audio", "music");
const MUSIC_EXTENSIONS = new Set([".mp3", ".wav", ".m4a", ".aac", ".ogg", ".flac"]);
const RUSHES_DIR = path.join(PUBLIC_DIR, "video", "rushes");
const RUSH_EXTENSIONS = new Set([".mp4", ".mov"]);

// Where materialized voiceover audio files (decoded from the base64 Data
// URIs Make sends) are written before rendering — see materializeVoiceovers
// below for why this is needed at all.
const VOICEOVER_TMP_DIR = path.join(PUBLIC_DIR, "tmp-voiceovers");
try {
  fs.mkdirSync(VOICEOVER_TMP_DIR, { recursive: true });
} catch (error) {
  console.warn("Impossible de créer le dossier tmp-voiceovers:", error.message || error);
}

// Where the "next group to use" cursor is persisted (see
// pickNextRushGroup below) — a file, not just an in-memory variable, so
// the rotation survives a server restart instead of reusing the same
// first group every time the server is relaunched (e.g. every time you
// restart it on your laptop). Not committed to git (see .gitignore) —
// it's runtime state, not source.
const RUSH_ROTATION_STATE_FILE = path.join(__dirname, ".rush-rotation-state.json");
const DEFAULT_FORMAT = "versus";
// Which Remotion composition to render per "format" value, and the fields
// each one requires. "format" is absent → DEFAULT_FORMAT, unchanged from
// before "Top3" existed, so existing Versus callers don't need to change.
const COMPOSITIONS = {
  versus: {
    id: "Versus",
    requiredFields: ["brand", "hook", "optionA", "optionB", "verdict", "cta"],
  },
  top3: {
    id: "Top3",
    requiredFields: [
      "brand",
      "hook",
      "produit1",
      "produit2",
      "produit3",
      "benefices",
      "cta",
    ],
  },
  educatif: {
    id: "Educatif",
    requiredFields: [
      "brand",
      "hook",
      "conseil1",
      "conseil2",
      "conseil3",
      "cta",
    ],
  },
  concept: {
    id: "Concept",
    requiredFields: ["brand", "hook", "message1", "message2", "cta"],
  },
};
// Caps how many clips Make can send *explicitly* in `clips` — unrelated to
// how many the composition can actually display: the auto-rotation path
// (pickRushesForTailDuration below) can pick more than this for the tail
// sequence, since it decides the count itself rather than trusting
// arbitrary caller input.
const MAX_CLIPS = 3;
// Small readability margin added on top of each voiceover's real duration
// (same value used before this moved server-side — see
// src/Versus/voiceoverTimeline.ts for how it's consumed).
const VOICEOVER_MARGIN_SECONDS = 0.15;

// Renders run in the background (see POST /render below) — a render can
// take well over two minutes (e.g. Top3 with 6 voiceover segments), which
// free-tier Cloudflare tunnels hard-cut at 120s ("context canceled") since
// that limit isn't configurable on that tier. Job state lives in a plain
// in-memory Map, not a real queue/Redis: this server handles one render at
// a time on a single machine, so a Map is enough and needs no extra
// dependency — it's simply empty again after a restart, which is fine
// since Make always starts a fresh POST /render and gets a fresh jobId.
const jobs = new Map();
// How long a finished (done/error) job's status + video file are kept
// after completion, so Make has time to poll and download even if it's
// slow to come back. Swept by a timer started the moment the job finishes
// (see finishJob below), not from job creation, so a slow render itself is
// never cut short by this.
const JOB_RETENTION_MS = 30 * 60 * 1000;

const finishJob = (jobId, result) => {
  const job = jobs.get(jobId);
  if (!job) {
    return;
  }
  Object.assign(job, result, { finishedAt: Date.now() });
  setTimeout(() => {
    const current = jobs.get(jobId);
    if (current?.videoPath) {
      fs.unlink(current.videoPath, () => {});
    }
    if (current?.voiceoverFiles) {
      for (const filePath of current.voiceoverFiles) {
        fs.unlink(filePath, () => {});
      }
    }
    jobs.delete(jobId);
  }, JOB_RETENTION_MS).unref();
};

let bundleLocationPromise = null;
const getBundleLocation = () => {
  if (!bundleLocationPromise) {
    console.log("Bundling la composition Remotion (une seule fois au démarrage)...");
    bundleLocationPromise = bundle({ entryPoint: ENTRY_POINT });
  }
  return bundleLocationPromise;
};

// music-metadata is ESM-only; this file is CommonJS, so it's loaded via a
// cached dynamic import (same one-time-cost pattern as getBundleLocation
// above).
let musicMetadataPromise = null;
const getMusicMetadata = () => {
  if (!musicMetadataPromise) {
    musicMetadataPromise = import("music-metadata");
  }
  return musicMetadataPromise;
};

// Reads a single voiceover file's real duration, server-side (Node), before
// the render starts. This used to run in the browser via
// getAudioDurationInSeconds (@remotion/media-utils), but Chromium's ORB
// (Opaque Response Blocking) protection blocks cross-origin audio fetches
// to hosts like Google Drive ("net::ERR_BLOCKED_BY_ORB" / "MEDIA_ELEMENT_
// ERROR: Format error") — Node's own fetch isn't subject to that
// browser-only protection, so probing here sidesteps it entirely. Also
// handles data: URIs (base64-encoded audio sent directly by Make) by
// decoding the buffer in-process, without any network round-trip at all.
const probeAudioDurationInSeconds = async (src) => {
  const { parseBuffer, parseFile } = await getMusicMetadata();
  if (/^data:/.test(src)) {
    const match = /^data:([^;]+);base64,(.+)$/.exec(src);
    if (!match) {
      throw new Error("Data URI audio malformée");
    }
    const [, mimeType, base64Data] = match;
    const buffer = Buffer.from(base64Data, "base64");
    const metadata = await parseBuffer(buffer, mimeType);
    return metadata.format.duration;
  }
  if (/^https?:\/\//.test(src)) {
    const response = await fetch(src);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} en téléchargeant ${src}`);
    }
    const buffer = Buffer.from(await response.arrayBuffer());
    const metadata = await parseBuffer(buffer, response.headers.get("content-type") || undefined);
    return metadata.format.duration;
  }
  const metadata = await parseFile(path.join(PUBLIC_DIR, src));
  return metadata.format.duration;
};

// Probes every present voiceovers[key] file, returning
// { [key]: durationInSeconds } (real duration + reading margin) for the
// keys that succeeded. A key whose download/parse fails is simply omitted
// — the composition then falls back to that slide's default duration
// instead of the whole render failing. Returns undefined when voiceovers
// itself is absent/empty, same "no error, just less precise" contract as
// the rest of this file's best-effort probing (see clip duration probing
// below).
const probeVoiceoverDurations = async (voiceovers) => {
  if (!voiceovers || Object.keys(voiceovers).length === 0) {
    return undefined;
  }
  const entries = await Promise.all(
    Object.entries(voiceovers).map(async ([key, src]) => {
      try {
        const duration = await probeAudioDurationInSeconds(src);
        return [key, duration + VOICEOVER_MARGIN_SECONDS];
      } catch (error) {
        console.warn(
          `Impossible de lire la durée de la voix off "${key}" (${src}):`,
          error.message || error,
        );
        return [key, undefined];
      }
    }),
  );
  const durations = Object.fromEntries(entries.filter(([, duration]) => duration !== undefined));
  return Object.keys(durations).length > 0 ? durations : undefined;
};

// Remotion's Rust compositor (used to write each media asset to a temp
// file before ffprobe/ffmpeg touch it) writes an EMPTY file when the
// <Audio src="data:..."> URI it's asked to decode is a large inline
// base64 payload — unlike Node's own Buffer decoding above (used for
// duration probing), which handles the exact same data fine. Rather than
// fight the compositor's own decoding, this sidesteps it entirely:
// decode each data: URI here, in Node, write the raw bytes to a real
// file under public/tmp-voiceovers/, and hand the composition a normal
// relative path instead — from the compositor's point of view that's
// just an ordinary public asset, no inline decoding involved. Non-data:
// URIs (plain URLs, if ever used) pass through untouched. Returns the
// list of files written so the caller can clean them up once the job is
// done (see finishJob).
const materializeVoiceovers = (jobId, voiceovers) => {
  if (!voiceovers) {
    return { resolved: voiceovers, writtenFiles: [] };
  }
  const writtenFiles = [];
  const resolved = {};
  for (const [key, src] of Object.entries(voiceovers)) {
    const match = /^data:([^;]+);base64,(.+)$/.exec(src);
    if (!match) {
      resolved[key] = src;
      continue;
    }
    const [, , base64Data] = match;
    const buffer = Buffer.from(base64Data, "base64");
    const fileName = `${jobId}-${key}.mp3`;
    const filePath = path.join(VOICEOVER_TMP_DIR, fileName);
    fs.writeFileSync(filePath, buffer);
    writtenFiles.push(filePath);
    resolved[key] = `tmp-voiceovers/${fileName}`;
  }
  return { resolved, writtenFiles };
};

// Picks one file from public/audio/music/ deterministically from `seed`
// (reuses the same renderSeed as the background-clip randomization) —
// same seed always picks the same track, a fresh seed (the normal case,
// see renderSeed above) picks independently each render. Returns null
// when the folder is missing/empty/unreadable, or contains no
// recognized audio file — callers must treat that as "no music", not
// an error.
const pickMusicTrack = (seed) => {
  let files;
  try {
    files = fs.readdirSync(MUSIC_DIR);
  } catch {
    return null;
  }
  const audioFiles = files
    .filter((file) => MUSIC_EXTENSIONS.has(path.extname(file).toLowerCase()))
    .sort();
  if (audioFiles.length === 0) {
    return null;
  }
  const index = Math.floor(random(`${seed}:music`) * audioFiles.length);
  return audioFiles[Math.min(index, audioFiles.length - 1)];
};

// The intro-clip count auto-rotation picks (RUSH_GROUP_SIZE - 1) matches
// what the old fixed group of RUSH_GROUP_SIZE used to give (2 intro + 1
// tail) — only the tail count changed, see pickRushesForTailDuration.
const RUSH_GROUP_SIZE = MAX_CLIPS;

const readRushRotationCursor = () => {
  try {
    const parsed = JSON.parse(fs.readFileSync(RUSH_ROTATION_STATE_FILE, "utf8"));
    return typeof parsed.cursor === "number" && Number.isFinite(parsed.cursor) ? parsed.cursor : 0;
  } catch {
    return 0;
  }
};

const writeRushRotationCursor = (cursor) => {
  try {
    fs.writeFileSync(RUSH_ROTATION_STATE_FILE, JSON.stringify({ cursor }), "utf8");
  } catch (error) {
    console.warn(
      "Impossible d'enregistrer le curseur de rotation des rushes:",
      error.message || error,
    );
  }
};

// Probes every candidate rush file's real duration in one batch (cheap:
// local files, same decoder used elsewhere in this file for explicit
// Make-provided clips) so pickRushesForTailDuration below can reason about
// them as plain numbers instead of probing one at a time as it picks.
const probeRushDurationsInSeconds = async (files) => {
  const entries = await Promise.all(
    files.map(async (file) => {
      try {
        const metadata = await getVideoMetadata(path.join(RUSHES_DIR, file));
        return [file, metadata.durationInSeconds];
      } catch (error) {
        console.warn(`Impossible de lire la durée de ${file}:`, error.message || error);
        return [file, undefined];
      }
    }),
  );
  return Object.fromEntries(entries);
};

// Auto-picks rush files from public/video/rushes/ for one render, when the
// caller (Make) didn't send a `clips` field at all. The rush COUNT is no
// longer fixed at RUSH_GROUP_SIZE (3): up to RUSH_GROUP_SIZE - 1 short
// intro clips are picked as before (played during the Hook), but the tail
// keeps picking additional clips — 4th, 5th, as many as needed — until
// their combined real duration covers the whole post-Hook span
// (tailDurationInFrames, passed in by the caller once it knows the
// video's real total duration — see runRenderJob). BackgroundVideoLayer's
// own loop-if-short fallback still exists as a last resort (a duration
// that couldn't be read, or a rushes pool too small to ever cover the
// span), but with this the very last picked clip essentially never needs
// it in practice.
//
// Every render advances the shared rotation cursor by exactly the number
// of files it actually used (not always RUSH_GROUP_SIZE) — see
// readRushRotationCursor/writeRushRotationCursor — so a render that needed
// 5 rushes doesn't leave 2 "owed", and the next render's first pick is
// always the very next unused file, whatever ran before it. Returns
// undefined (→ falls back to no video background, same as an empty/missing
// `clips`) when the folder is missing, empty, or contains no recognized
// rush file.
const pickRushesForTailDuration = async (tailDurationInFrames, fps) => {
  let files;
  try {
    files = fs.readdirSync(RUSHES_DIR);
  } catch {
    return undefined;
  }
  const rushFiles = files
    .filter((file) => RUSH_EXTENSIONS.has(path.extname(file).toLowerCase()))
    .sort();
  if (rushFiles.length === 0) {
    return undefined;
  }

  const durationsInSeconds = await probeRushDurationsInSeconds(rushFiles);
  const cursor = readRushRotationCursor() % rushFiles.length;
  let offset = 0;
  const nextFile = () => {
    const file = rushFiles[(cursor + offset) % rushFiles.length];
    offset += 1;
    return file;
  };
  const toClip = (file) => ({
    src: `video/rushes/${file}`,
    durationInSeconds: durationsInSeconds[file],
  });

  // Only one rush exists at all: it serves as both intro and tail (same
  // special case planClips itself falls back to), nothing more to pick.
  if (rushFiles.length === 1) {
    const clip = toClip(nextFile());
    writeRushRotationCursor(cursor);
    return { clips: [clip], tailCount: 1 };
  }

  const introCount = Math.min(RUSH_GROUP_SIZE - 1, rushFiles.length - 1);
  const introClips = Array.from({ length: introCount }, () => toClip(nextFile()));

  const tailClips = [];
  let coveredInFrames = 0;
  const maxTailClips = rushFiles.length - introCount;
  while (tailClips.length < maxTailClips) {
    const clip = toClip(nextFile());
    tailClips.push(clip);
    coveredInFrames +=
      clip.durationInSeconds !== undefined
        ? Math.floor(clip.durationInSeconds * fps)
        // Unknown duration (probe failed): assume it's enough on its own
        // rather than keep piling on more clips past it — matches the
        // "no error, just less precise" contract used for every other
        // best-effort probe in this file.
        : tailDurationInFrames;
    if (coveredInFrames >= tailDurationInFrames) {
      break;
    }
  }

  writeRushRotationCursor((cursor + offset) % rushFiles.length);

  return { clips: [...introClips, ...tailClips], tailCount: tailClips.length };
};

// Does the actual rendering work for one job — everything that used to run
// inline in the POST /render handler between validation and sending the
// response. Never touches `res`: it only ever writes its outcome into the
// `jobs` map, since by the time it runs the client already got its jobId
// back (see POST /render below). Same rendering logic as before this
// change (voix off, musique, rushs, sous-titres) — only how the result is
// communicated to the caller changed.
const runRenderJob = async (jobId, formatKey, compositionConfig, inputProps) => {
  let outputPath;
  let voiceoverFiles = [];
  try {
    // Auto-rotation only kicks in when the caller didn't send a `clips`
    // field at all — an explicit `"clips": []` still means "no video
    // background, text only" (see planClips), not "pick for me". How many
    // rushes that needs isn't known yet at this point (it depends on the
    // video's real total duration, itself driven by voiceoverDurations
    // below) — see the second selectComposition call further down for
    // where the actual picking happens.
    const needsAutoRotation = inputProps.clips === undefined;

    // Explicit Make-provided clips get their real duration probed same as
    // always. Auto-rotation clips get probed as part of picking them
    // instead (see pickRushesForTailDuration) — skip here.
    const clipsProbe = !needsAutoRotation && Array.isArray(inputProps.clips)
      ? Promise.all(
          inputProps.clips.map(async (clip) => {
            if (/^https?:\/\//.test(clip.src)) {
              return;
            }
            try {
              const metadata = await getVideoMetadata(path.join(PUBLIC_DIR, clip.src));
              clip.durationInSeconds = metadata.durationInSeconds;
            } catch (error) {
              console.warn(`Impossible de lire la durée de ${clip.src}:`, error.message || error);
            }
          }),
        )
      : Promise.resolve();

    const [, voiceoverDurations] = await Promise.all([
      clipsProbe,
      probeVoiceoverDurations(inputProps.voiceovers),
    ]);
    inputProps.voiceoverDurations = voiceoverDurations;

    // Write each base64 voiceover to a real file under public/tmp-voiceovers/
    // and swap inputProps.voiceovers to point at those paths instead — see
    // materializeVoiceovers above for why this step exists at all.
    const materialized = materializeVoiceovers(jobId, inputProps.voiceovers);
    inputProps.voiceovers = materialized.resolved;
    voiceoverFiles = materialized.writtenFiles;

    // Background music: pick one file from public/audio/music/ (same seed
    // as above, namespaced separately) — that's as far as the server goes.
    // Its duration is probed client-side in AudioLayer (see there for why:
    // Remotion's compositor, used above for video clips, refuses
    // audio-only files outright). No file found → musicTrack stays
    // undefined and AudioLayer simply renders no music.
    const musicFile = pickMusicTrack(inputProps.renderSeed);
    if (musicFile) {
      inputProps.musicTrack = { src: `audio/music/${musicFile}` };
    }

    const serveUrl = await getBundleLocation();
    const browserExecutable = process.env.REMOTION_BROWSER_EXECUTABLE || undefined;
    let composition = await selectComposition({
      serveUrl,
      id: compositionConfig.id,
      inputProps,
      browserExecutable,
    });

    if (needsAutoRotation) {
      // composition.props here already carries calculateMetadata's
      // resolved durationsInSeconds (see Root.tsx) — clips never factor
      // into that calculation, so it's safe to read the Hook's real
      // duration and the video's total duration *before* clips are
      // decided, then pick exactly as many tail rushes as needed to cover
      // what's left.
      const hookDurationInSeconds = composition.props?.durationsInSeconds?.hook ?? 0;
      const hookDurationInFrames = Math.floor(hookDurationInSeconds * composition.fps);
      const tailDurationInFrames = composition.durationInFrames - hookDurationInFrames;
      const picked = await pickRushesForTailDuration(tailDurationInFrames, composition.fps);
      if (picked) {
        inputProps.clips = picked.clips;
        inputProps.tailCount = picked.tailCount;
        // Re-resolve now that clips/tailCount are set, so composition.props
        // (what renderMedia below actually uses) includes them — the
        // clips-less first call couldn't have produced them itself. This
        // can't change durationInFrames/fps/durationsInSeconds (still
        // purely a function of voiceoverDurations, untouched since the
        // first call).
        composition = await selectComposition({
          serveUrl,
          id: compositionConfig.id,
          inputProps,
          browserExecutable,
        });
      }
    }

    outputPath = path.join(os.tmpdir(), `${formatKey}-${jobId}.mp4`);

    console.log(`[${jobId}] Rendu en cours -> ${outputPath}`);
    await renderMedia({
      composition,
      serveUrl,
      codec: "h264",
      // remotion.config.ts does NOT apply when calling the Node.js API
      // directly (only to the CLI), so every encoding quality setting
      // must be passed here explicitly or Remotion silently falls back
      // to its own defaults. In particular the default image format is
      // "jpeg" (lossy per-frame capture) — that was making every frame,
      // including the crisp on-screen text, blurry. "png" is lossless.
      imageFormat: "png",
      crf: 18,
      outputLocation: outputPath,
      inputProps,
      browserExecutable,
    });

    console.log(`[${jobId}] Rendu terminé -> ${outputPath}`);
    finishJob(jobId, { status: "done", videoPath: outputPath, format: formatKey, voiceoverFiles });
  } catch (error) {
    console.error(`[${jobId}] Échec du rendu:`, error);
    if (outputPath) {
      fs.unlink(outputPath, () => {});
    }
    for (const filePath of voiceoverFiles) {
      fs.unlink(filePath, () => {});
    }
    finishJob(jobId, {
      status: "error",
      message: error instanceof Error ? error.message : String(error),
    });
  }
};

const app = express();
app.use(express.json({ limit: "50mb" }));
// Behind the Cloudflare tunnel, requests reach this process as plain HTTP
// (the tunnel terminates TLS) but set X-Forwarded-Proto: https — trusting
// the proxy makes req.protocol reflect that, so the videoUrl built in GET
// /render/status/:jobId below is a correct https:// link instead of http://.
app.set("trust proxy", true);

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.post("/render", async (req, res) => {
  if (API_KEY && req.header("x-api-key") !== API_KEY) {
    res.status(401).json({ error: "Clé API invalide ou manquante (en-tête x-api-key)." });
    return;
  }

  const inputProps = req.body;
  if (!inputProps || typeof inputProps !== "object") {
    res.status(400).json({ error: "Corps de requête JSON attendu." });
    return;
  }

  const formatKey = String(inputProps.format || DEFAULT_FORMAT).toLowerCase();
  const compositionConfig = COMPOSITIONS[formatKey];
  if (!compositionConfig) {
    res.status(400).json({
      error: `format inconnu: "${inputProps.format}". Valeurs acceptées: ${Object.keys(COMPOSITIONS).join(", ")}.`,
    });
    return;
  }

  const missing = compositionConfig.requiredFields.filter((field) => !inputProps[field]);
  if (missing.length > 0) {
    res.status(400).json({ error: `Champ(s) manquant(s): ${missing.join(", ")}` });
    return;
  }

  if (inputProps.clips !== undefined) {
    if (!Array.isArray(inputProps.clips)) {
      res.status(400).json({ error: "Le champ clips doit être un tableau." });
      return;
    }
    if (inputProps.clips.length > MAX_CLIPS) {
      res.status(400).json({
        error:
          `clips contient ${inputProps.clips.length} fichiers, le maximum est ${MAX_CLIPS}. ` +
          "Choisis explicitement 2-3 rushes pour ce rendu (le dernier étant le plus long), " +
          "ne renvoie pas toute la bibliothèque de rushes disponible.",
      });
      return;
    }
    const badClip = inputProps.clips.find((clip) => !clip || typeof clip.src !== "string" || !clip.src);
    if (badClip) {
      res.status(400).json({ error: "Chaque élément de clips doit avoir un champ src (chaîne non vide)." });
      return;
    }
  }

  if (inputProps.voiceovers !== undefined) {
    if (
      typeof inputProps.voiceovers !== "object" ||
      inputProps.voiceovers === null ||
      Array.isArray(inputProps.voiceovers)
    ) {
      res.status(400).json({ error: "Le champ voiceovers doit être un objet." });
      return;
    }
    const badKey = Object.entries(inputProps.voiceovers).find(
      ([, url]) => typeof url !== "string" || !url,
    );
    if (badKey) {
      res.status(400).json({
        error: `Le champ voiceovers.${badKey[0]} doit être une chaîne non vide.`,
      });
      return;
    }
  }

  // Fresh per request unless the caller explicitly passed one (e.g. for a
  // reproducible test render) — lets BackgroundVideoLayer pick a different
  // random start point in each rush clip on every render.
  if (!inputProps.renderSeed) {
    inputProps.renderSeed = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }

  // From here on the request is valid — hand it off to a background job
  // instead of rendering inline. The old synchronous version blocked this
  // whole request until renderMedia finished, which free-tier Cloudflare
  // tunnels cut off at a hard 120s ("context canceled") regardless of how
  // long the render actually needed (Top3 with 6 voiceover segments
  // routinely takes longer than that). The response below is immediate;
  // the caller polls GET /render/status/:jobId and downloads from the
  // videoUrl it returns once status is "done".
  const jobId = crypto.randomUUID();
  jobs.set(jobId, { status: "processing", createdAt: Date.now() });
  runRenderJob(jobId, formatKey, compositionConfig, inputProps).catch((error) => {
    // runRenderJob already catches its own errors and calls finishJob —
    // this only fires if something throws outside that (e.g. a bug in
    // finishJob itself), so the job doesn't hang as "processing" forever.
    console.error(`[${jobId}] Erreur inattendue:`, error);
    finishJob(jobId, {
      status: "error",
      message: error instanceof Error ? error.message : String(error),
    });
  });

  res.status(202).json({ jobId, status: "processing" });
});

app.get("/render/status/:jobId", (req, res) => {
  if (API_KEY && req.header("x-api-key") !== API_KEY) {
    res.status(401).json({ error: "Clé API invalide ou manquante (en-tête x-api-key)." });
    return;
  }

  const job = jobs.get(req.params.jobId);
  if (!job) {
    res.status(404).json({ error: "jobId inconnu (jamais créé, ou expiré après téléchargement)." });
    return;
  }

  if (job.status === "processing") {
    res.json({ status: "processing" });
    return;
  }

  if (job.status === "error") {
    res.json({ status: "error", message: job.message });
    return;
  }

  const videoUrl = `${req.protocol}://${req.get("host")}/render/result/${req.params.jobId}`;
  res.json({ status: "done", videoUrl });
});

app.get("/render/result/:jobId", (req, res) => {
  if (API_KEY && req.header("x-api-key") !== API_KEY) {
    res.status(401).json({ error: "Clé API invalide ou manquante (en-tête x-api-key)." });
    return;
  }

  const job = jobs.get(req.params.jobId);
  if (!job) {
    res.status(404).json({ error: "jobId inconnu (jamais créé, ou expiré)." });
    return;
  }
  if (job.status !== "done") {
    res.status(409).json({ error: `Rendu pas encore terminé (status: ${job.status}).` });
    return;
  }

  res.setHeader("Content-Type", "video/mp4");
  res.setHeader("Content-Disposition", `attachment; filename="${job.format}.mp4"`);
  // Deliberately not deleted after being sent — kept until the
  // JOB_RETENTION_MS cleanup timer (started in finishJob) fires, so Make
  // has time to fetch it even if it's slow to come back or retries.
  res.sendFile(job.videoPath, (err) => {
    if (err && !res.headersSent) {
      res.status(500).json({ error: "Échec de l'envoi du fichier rendu." });
    }
  });
});

app.listen(PORT, () => {
  console.log(`Serveur de rendu Versus démarré sur http://localhost:${PORT}`);
  console.log(`Endpoints à appeler depuis Make:`);
  console.log(`  POST   http://localhost:${PORT}/render               -> { jobId, status }`);
  console.log(`  GET    http://localhost:${PORT}/render/status/:jobId -> { status, videoUrl? }`);
  console.log(`  GET    http://localhost:${PORT}/render/result/:jobId -> le fichier mp4`);
});
