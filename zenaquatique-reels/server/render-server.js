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

let bundleLocationPromise = null;
const getBundleLocation = () => {
  if (!bundleLocationPromise) {
    console.log("Bundling la composition Remotion (une seule fois au démarrage)...");
    bundleLocationPromise = bundle({ entryPoint: ENTRY_POINT });
  }
  return bundleLocationPromise;
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

const app = express();
app.use(express.json({ limit: "2mb" }));

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

  if (inputProps.voiceoverUrl !== undefined && typeof inputProps.voiceoverUrl !== "string") {
    res.status(400).json({ error: "Le champ voiceoverUrl doit être une chaîne." });
    return;
  }

  // Fresh per request unless the caller explicitly passed one (e.g. for a
  // reproducible test render) — lets BackgroundVideoLayer pick a different
  // random start point in each rush clip on every render.
  if (!inputProps.renderSeed) {
    inputProps.renderSeed = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }

  // Look up each local clip's real duration once, server-side, via
  // Remotion's own compositor (the same decoder OffthreadVideo uses at
  // render time — unlike the browser's native <video> element, it isn't
  // picky about encoding quirks). BackgroundVideoLayer uses this to
  // decide whether a clip is long enough to need a random start point.
  // Remote (http/https) clips are left as-is — probing them would need a
  // download first — so they always start at frame 0, same as before.
  if (Array.isArray(inputProps.clips)) {
    await Promise.all(
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
    );
  }

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

  let outputPath;
  try {
    const serveUrl = await getBundleLocation();
    const composition = await selectComposition({
      serveUrl,
      id: compositionConfig.id,
      inputProps,
      browserExecutable: process.env.REMOTION_BROWSER_EXECUTABLE || undefined,
    });

    outputPath = path.join(
      os.tmpdir(),
      `${formatKey}-${Date.now()}-${Math.random().toString(36).slice(2)}.mp4`,
    );

    console.log(`Rendu en cours -> ${outputPath}`);
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

    res.setHeader("Content-Type", "video/mp4");
    res.setHeader("Content-Disposition", `attachment; filename="${formatKey}.mp4"`);
    res.sendFile(outputPath, (err) => {
      fs.unlink(outputPath, () => {});
      if (err && !res.headersSent) {
        res.status(500).json({ error: "Échec de l'envoi du fichier rendu." });
      }
    });
  } catch (error) {
    console.error(error);
    if (outputPath) {
      fs.unlink(outputPath, () => {});
    }
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

app.listen(PORT, () => {
  console.log(`Serveur de rendu Versus démarré sur http://localhost:${PORT}`);
  console.log(`Endpoint à appeler depuis Make: POST http://localhost:${PORT}/render`);
});
