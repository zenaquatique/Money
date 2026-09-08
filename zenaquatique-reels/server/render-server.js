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
// Keep in sync with MAX_VERSUS_CLIPS in src/Versus/clips.ts
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
// browser-only protection, so probing here sidesteps it entirely.
const probeAudioDurationInSeconds = async (src) => {
  const { parseBuffer, parseFile } = await getMusicMetadata();
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

// Keep in sync with MAX_CLIPS above — the group size auto-rotation picks.
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

// Auto-picks the next group of RUSH_GROUP_SIZE rush files from
// public/video/rushes/ when the caller (Make) didn't send a `clips` field
// at all — cycles through every file in that folder (sorted, so the order
// is stable across renders), advancing the cursor by RUSH_GROUP_SIZE each
// time and wrapping back to the start once every file has been used, so
// two consecutive renders never reuse the same combination (except right
// at the wrap-around point if the total count isn't a multiple of
// RUSH_GROUP_SIZE — the last, undersized group and the first group after
// it can then share one or two files; a minor, self-correcting edge case
// rather than something worth padding around). The cursor is persisted to
// RUSH_ROTATION_STATE_FILE, not just kept in memory, specifically so it
// survives a server restart — the whole point of this is avoiding repeats
// across separate runs of the pipeline, and on a laptop those are often
// separate server sessions, not just separate renders in one uptime.
// Returns undefined (→ falls back to no video background, same as an
// empty/missing `clips`) when the folder is missing, empty, or contains no
// recognized rush file.
const pickNextRushGroup = () => {
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

  const cursor = readRushRotationCursor() % rushFiles.length;
  const groupSize = Math.min(RUSH_GROUP_SIZE, rushFiles.length);
  const group = Array.from(
    { length: groupSize },
    (_, i) => rushFiles[(cursor + i) % rushFiles.length],
  );
  writeRushRotationCursor((cursor + RUSH_GROUP_SIZE) % rushFiles.length);

  return group.map((file) => ({ src: `video/rushes/${file}` }));
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
  try {
    // Auto-rotation only kicks in when the caller didn't send a `clips`
    // field at all — an explicit `"clips": []` still means "no video
    // background, text only" (see planClips), not "pick for me".
    if (inputProps.clips === undefined) {
      const autoClips = pickNextRushGroup();
      if (autoClips) {
        inputProps.clips = autoClips;
      }
    }

    // Runs concurrently with the voiceover duration probing below — neither
    // depends on the other's result.
    const clipsProbe = Array.isArray(inputProps.clips)
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
    const composition = await selectComposition({
      serveUrl,
      id: compositionConfig.id,
      inputProps,
      browserExecutable: process.env.REMOTION_BROWSER_EXECUTABLE || undefined,
    });

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
      browserExecutable: process.env.REMOTION_BROWSER_EXECUTABLE || undefined,
    });

    console.log(`[${jobId}] Rendu terminé -> ${outputPath}`);
    finishJob(jobId, { status: "done", videoPath: outputPath, format: formatKey });
  } catch (error) {
    console.error(`[${jobId}] Échec du rendu:`, error);
    if (outputPath) {
      fs.unlink(outputPath, () => {});
    }
    finishJob(jobId, {
      status: "error",
      message: error instanceof Error ? error.message : String(error),
    });
  }
};

const app = express();
app.use(express.json({ limit: "2mb" }));
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
