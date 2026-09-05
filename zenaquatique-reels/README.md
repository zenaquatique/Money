# Remotion video

<p align="center">
  <a href="https://github.com/remotion-dev/logo">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://github.com/remotion-dev/logo/raw/main/animated-logo-banner-dark.apng">
      <img alt="Animated Remotion Logo" src="https://github.com/remotion-dev/logo/raw/main/animated-logo-banner-light.gif">
    </picture>
  </a>
</p>

Welcome to your Remotion project!

## Format "Versus"

Composition `Versus` (`src/Versus/`) génère des Reels verticaux (1080×1920,
30fps) au format comparaison de valeur en 4 slides : Hook / Option A
(marché) / Option B (ZenAquatique) / Verdict + CTA. Durée par défaut : 21s
(4s / 6s / 6s / 5s), ajustable via `durationsInSeconds`.

Props (voir `src/Versus/types.ts`) :

- `brand`, `hook`, `optionA: { label, text }`, `optionB: { label, text }`,
  `verdict`, `cta`
- `clips?: { src, label }[]` — 2 à 3 rushes vidéo en fond de slides
- `durationsInSeconds?: { hook, optionA, optionB, verdict }`

Éditez les props par défaut dans `src/Versus/defaultProps.ts`, ou modifiez-les
depuis le panneau de props du Studio (`npm run dev`).

### Fonds vidéo (`clips`)

`clips` est une **liste ordonnée et explicite** de rushes à utiliser pour ce
rendu précis — c'est l'appelant (Make) qui décide quels fichiers et dans quel
ordre, Remotion ne choisit ni ne randomise rien lui-même :

```json
"clips": [
  { "src": "video/rushes/rush_a.mp4" },
  { "src": "video/rushes/rush_b.mp4" },
  { "src": "video/rushes/rush_c.mp4" }
]
```

- `src` est soit un chemin relatif à `public/` (ex. `video/rushes/xxx.mp4`,
  résolu via `staticFile`), soit une URL `http(s)://` complète.
- **Tous les clips sauf le dernier** sont des coupes courtes jouées à la
  suite pendant le Hook (intro dynamique, montage cut).
- **Le dernier clip** de la liste est le clip long : il joue en continu
  derrière Option A, Option B et Verdict. Il doit couvrir toute cette durée
  (~17s par défaut) pour éviter l'effet de gel (image figée) en fin de
  vidéo — c'est le rôle de l'appelant de fournir un rush assez long ici.
- 2 clips → 1 court + 1 long. 3 clips → 2 courts + 1 long. 1 seul clip → il
  sert à la fois d'intro et de fond continu. Aucun clip → repli sur le fond
  uni de la v1 (texte seul).
- Ne jamais fournir deux fois la même combinaison de rushes pour deux
  vidéos générées consécutivement : c'est la responsabilité de l'appelant
  (Make), pas de Remotion.

Placez vos rushes dans `public/video/rushes/` (ou tout autre sous-dossier de
`public/`) pour qu'ils soient servis en `src` relatif.

**Formats de fichier** : `.mp4` et `.mov` fonctionnent tous les deux sans
rien à configurer (`.mov` est un export standard iPhone/caméra en H.264 ou
H.265 + AAC — testé et validé). Seul cas à éviter : un `.mov` encodé en
**ProRes** (fréquent en export "pro"/montage), non pris en charge par le
moteur de rendu — reconvertis-le d'abord en H.264 :

```console
ffmpeg -i rush.mov -c:v libx264 -pix_fmt yuv420p -c:a aac rush.mp4
```

## Format "Top3"

Composition `Top3` (`src/Top3/`) génère des Reels verticaux (1080×1920,
30fps) au format "top 3 produits" en 6 slides : Hook / Produit 1 / Produit 2
/ Produit 3 / Bénéfices / CTA. Durée totale : 18s (2s / 4s / 4s / 4s / 2s /
2s), ajustable via `durationsInSeconds`.

Props (voir `src/Top3/types.ts`) :

- `brand`, `hook`, `produit1: { label, text }`, `produit2: { label, text }`,
  `produit3: { label, text }`, `benefices`, `cta`
- `clips?: { src, label }[]` — même contrat que pour Versus (voir section
  "Fonds vidéo" plus haut) : 2-3 rushes fournis explicitement par l'appelant
- `durationsInSeconds?: { hook, produit1, produit2, produit3, benefices, cta }`

Réutilise les mêmes composants partagés que Versus (`SlideFrame`, `colors`,
`BackgroundVideoLayer`, `clips.ts`) pour une identité visuelle cohérente.

## Format "Educatif"

Composition `Educatif` (`src/Educatif/`) génère des Reels verticaux
(1080×1920, 30fps) au format "conseils" en 5 slides : Hook / Conseil 1 /
Conseil 2 / Conseil 3 / CTA. Durée totale : 20s (3s / 5s / 5s / 5s / 2s),
ajustable via `durationsInSeconds`.

Props (voir `src/Educatif/types.ts`) :

- `brand`, `hook`, `conseil1`, `conseil2`, `conseil3`, `cta` (chaînes de
  texte simples, pas d'objet `{label, text}` contrairement à Top3)
- `clips?: { src, label }[]` — même contrat que Versus/Top3 (voir section
  "Fonds vidéo" plus haut)
- `durationsInSeconds?: { hook, conseil1, conseil2, conseil3, cta }`

Réutilise les mêmes composants partagés que Versus et Top3 (`SlideFrame`,
`colors`, `BackgroundVideoLayer`, `clips.ts`, et le `CtaSlide` de Top3) pour
une identité visuelle cohérente.

## Format "Concept"

Composition `Concept` (`src/Concept/`) génère des Reels verticaux
(1080×1920, 30fps) au format "message inspirant" en 3 slides : Hook /
Message / CTA. Durée totale : 18s (5s / 9s / 4s), ajustable via
`durationsInSeconds`. Rythme plus posé que les autres formats (slides plus
longues, pas de badge/kicker sur le Message) — même mécanique d'animation
que les autres, juste un tempo plus lent porté par la durée des slides.

Props (voir `src/Concept/types.ts`) :

- `brand`, `hook`, `message`, `cta` (chaînes de texte simples)
- `clips?: { src, label }[]` — même contrat que les autres formats (voir
  section "Fonds vidéo" plus haut)
- `durationsInSeconds?: { hook, message, cta }`

Réutilise les mêmes composants partagés que les autres formats
(`SlideFrame`, `colors`, `BackgroundVideoLayer`, `clips.ts`, `HookSlide` de
Versus, `CtaSlide` de Top3) ; seul `MessageSlide` est propre à ce format.

## Qualité de rendu (netteté)

`server/render-server.js` appelle `renderMedia` via l'API Node.js de
Remotion — **`remotion.config.ts` ne s'applique pas** dans ce cas (voir le
commentaire en tête de ce fichier), donc tous les réglages de qualité sont
passés explicitement à `renderMedia` :

- `imageFormat: "png"` — capture chaque frame sans perte avant l'encodage.
  Sans ce réglage, Remotion retombe sur son défaut interne (`jpeg`), qui
  rend tout flou (y compris le texte, jamais filmé mais recapturé avec
  perte à chaque frame).
- `crf: 18` — qualité H.264 quasi sans perte (l'échelle va de 0 à 51, plus
  bas = meilleure qualité).

Ne pas retirer ces deux options sous peine de retomber sur des rendus flous.

## Déclencher un rendu depuis Make (webhook + tunnel local)

Un petit serveur (`server/render-server.js`) expose un webhook `POST /render` :
tu lui envoies les textes des slides (+ éventuellement `clips`) en JSON, il
te renvoie le mp4 généré. Cette section explique comment le connecter à
Make via un tunnel local (ngrok) — pratique pour tester, mais **ton
ordinateur doit rester allumé et connecté** pendant que Make peut appeler
le webhook (voir plus bas pour une solution permanente).

**1. Démarrer le serveur en local**

```console
cd zenaquatique-reels
npm install
npm run server
```

Le serveur écoute sur `http://localhost:3001`. Teste-le sans Make d'abord :

```console
curl -X POST http://localhost:3001/render \
  -H "Content-Type: application/json" \
  -d '{"brand":"ZenAquatique","hook":"Ton bac vire au vert ?","optionA":{"label":"La méthode classique","text":"Produits chimiques, résultats incertains."},"optionB":{"label":"ZenAquatique","text":"Un écosystème équilibré."},"verdict":"L'\''aquascaping durable.","cta":"zenaquatique.fr"}' \
  -o test.mp4
```

Si `test.mp4` s'ouvre et joue la vidéo, le serveur fonctionne.

**2. Sécuriser le webhook (recommandé)**

Comme le tunnel sera accessible publiquement, protège-le avec une clé :

```console
RENDER_API_KEY=un-secret-a-toi npm run server
```

Make devra alors envoyer l'en-tête `x-api-key: un-secret-a-toi` dans sa requête.

**3. Ouvrir un tunnel avec ngrok**

- Installe ngrok : https://ngrok.com/download (compte gratuit, récupère ton
  "authtoken" sur leur site puis `ngrok config add-authtoken <ton-token>`)
- Dans un **autre terminal** (laisse le serveur tourner dans le premier) :

```console
ngrok http 3001
```

ngrok affiche une adresse du type `https://xxxx.ngrok-free.app` — c'est
l'URL publique à donner à Make. ⚠️ Avec un compte gratuit, cette adresse
**change à chaque redémarrage** de ngrok : il faudra la remettre à jour
dans Make.

**4. Configurer le module HTTP dans Make**

- Méthode : `POST`
- URL : `https://xxxx.ngrok-free.app/render`
- En-têtes : `Content-Type: application/json` et `x-api-key: un-secret-a-toi`
  (si configuré à l'étape 2)
- Corps (JSON) : les champs `brand`, `hook`, `optionA`, `optionB`, `verdict`,
  `cta`, et optionnellement `clips` (voir section ci-dessus)
- Le module doit interpréter la réponse comme un **fichier binaire** (pas
  du JSON) — dans Make, choisis "Parse response" désactivé ou récupère le
  contenu brut pour l'enregistrer/l'envoyer ailleurs (Google Drive, etc.)
- Augmente le timeout du module HTTP à ~120s : un rendu de 21s peut prendre
  30 à 90 secondes selon la machine.

**Choisir le format** : ajoute un champ `"format"` dans le corps JSON —
`"versus"` (défaut si le champ est absent, donc les scénarios Make déjà en
place n'ont rien à changer), `"top3"`, `"educatif"` ou `"concept"`. Chaque
format attend ses propres champs obligatoires (voir sections
"Versus"/"Top3"/"Educatif"/"Concept" ci-dessus) ; il n'y a rien d'autre à
changer dans la configuration Make (même URL, mêmes en-têtes).

```json
{ "format": "top3", "brand": "ZenAquatique", "hook": "...", "produit1": {...}, ... }
```

**Important** : les fichiers listés dans `clips[].src` (chemins relatifs)
doivent exister dans `public/` **sur la machine qui fait tourner le
serveur** — donc place tes vraies rushes dans
`public/video/rushes/` sur ton PC avant de lancer `npm run server`.

**Pour un usage régulier (pas juste des tests)** : cette solution locale +
ngrok n'est pas faite pour durer (PC à garder allumé, URL qui change). La
suite logique est d'héberger ce même serveur sur une machine cloud
toujours allumée (ex. Render.com) avec une adresse fixe — demande-le
quand tu seras prêt à passer en continu.

## Commands

**Install Dependencies**

```console
npm i
```

**Start Preview**

```console
npm run dev
```

**Render video**

```console
npx remotion render
```

**Upgrade Remotion**

```console
npx remotion upgrade
```

## Docs

Get started with Remotion by reading the [fundamentals page](https://www.remotion.dev/docs/the-fundamentals).

## Help

We provide help on our [Discord server](https://discord.gg/6VzzNDwUwV).

## Issues

Found an issue with Remotion? [File an issue here](https://github.com/remotion-dev/remotion/issues/new).

## License

Note that for some entities a company license is needed. [Read the terms here](https://github.com/remotion-dev/remotion/blob/main/LICENSE.md).
