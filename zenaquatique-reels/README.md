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
