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
- `clips?: { src, label }[]` — 2-3 rushes vidéo prévus pour les fonds de
  slides (non encore rendus dans cette v1, texte uniquement)
- `durationsInSeconds?: { hook, optionA, optionB, verdict }`

Éditez les props par défaut dans `src/Versus/defaultProps.ts`, ou modifiez-les
depuis le panneau de props du Studio (`npm run dev`).

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
