const fs = require("fs");
const os = require("os");
const path = require("path");
const express = require("express");
const { bundle } = require("@remotion/bundler");
const { renderMedia, selectComposition } = require("@remotion/renderer");

const PORT = process.env.PORT || 3001;
const API_KEY = process.env.RENDER_API_KEY;
const COMPOSITION_ID = "Versus";
const ENTRY_POINT = path.join(__dirname, "..", "src", "index.ts");
const REQUIRED_FIELDS = ["brand", "hook", "optionA", "optionB", "verdict", "cta"];

let bundleLocationPromise = null;
const getBundleLocation = () => {
  if (!bundleLocationPromise) {
    console.log("Bundling la composition Remotion (une seule fois au démarrage)...");
    bundleLocationPromise = bundle({ entryPoint: ENTRY_POINT });
  }
  return bundleLocationPromise;
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

  const missing = REQUIRED_FIELDS.filter((field) => !inputProps[field]);
  if (missing.length > 0) {
    res.status(400).json({ error: `Champ(s) manquant(s): ${missing.join(", ")}` });
    return;
  }

  let outputPath;
  try {
    const serveUrl = await getBundleLocation();
    const composition = await selectComposition({
      serveUrl,
      id: COMPOSITION_ID,
      inputProps,
      browserExecutable: process.env.REMOTION_BROWSER_EXECUTABLE || undefined,
    });

    outputPath = path.join(
      os.tmpdir(),
      `versus-${Date.now()}-${Math.random().toString(36).slice(2)}.mp4`,
    );

    console.log(`Rendu en cours -> ${outputPath}`);
    await renderMedia({
      composition,
      serveUrl,
      codec: "h264",
      outputLocation: outputPath,
      inputProps,
      browserExecutable: process.env.REMOTION_BROWSER_EXECUTABLE || undefined,
    });

    res.setHeader("Content-Type", "video/mp4");
    res.setHeader("Content-Disposition", 'attachment; filename="versus.mp4"');
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
