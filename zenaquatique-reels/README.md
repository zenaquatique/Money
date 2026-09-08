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
  derrière Option A, Option B et Verdict, sur toute cette durée (~17s par
  défaut). Idéalement assez long pour la couvrir en une fois, mais s'il est
  plus court, il boucle automatiquement (reprend à 0) plutôt que de geler
  sur sa dernière image — voir plus bas.
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

**Point de départ aléatoire dans un rush trop long** : si un fichier local
(`clips[].src` relatif à `public/`) dure plus longtemps que le segment où il
est utilisé, le rendu démarre à un point aléatoire du fichier plutôt que
toujours au début — pour varier ce qui est montré si le même rush est
réutilisé sur plusieurs générations. `server/render-server.js` lit la durée
réelle de chaque clip local avant le rendu (via `getVideoMetadata` de
`@remotion/renderer`) ; si le fichier est plus court ou égal au segment,
ou si sa durée n'a pas pu être lue, le comportement reste inchangé (départ
à 0). Cette lecture de durée ne s'applique qu'aux fichiers locaux — un
`clips[].src` en URL `http(s)://` démarre toujours à 0.

**Boucle si le rush est trop court** : à l'inverse, si un fichier local dure
*moins* longtemps que le segment/slide qu'il illustre, `BackgroundVideoLayer`
le fait boucler (reprend à la frame 0 du fichier, autant de fois que
nécessaire) plutôt que de le laisser se figer sur sa dernière image une fois
fini — que ce soit le clip long derrière Option A/B/Verdict, ou un des clips
courts de l'intro. Le point de redémarrage de la boucle est toujours la
frame 0 du fichier, pas le point de départ aléatoire éventuel décrit
ci-dessus (qui ne s'applique qu'au tout premier passage). C'est un cut net
à chaque reprise (pas de fondu), donc un rush qui boucle proprement (contenu
qui ne saute pas trop visuellement entre sa dernière et sa première image)
reste préférable ; ce mécanisme évite juste l'effet de gel, ce n'est pas un
substitut à un rush bien choisi/assez long. S'applique aux 4 formats, tous
partagent le même `BackgroundVideoLayer`.

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
(1080×1920, 30fps) au format "message inspirant" en 4 slides : Hook /
Message 1 / Message 2 / CTA. Durée totale : 18s (4s / 5s / 5s / 4s),
ajustable via `durationsInSeconds`. Le message est scindé en deux blocs
(au lieu d'un seul bloc de 9s) pour laisser plus de place à une voix off
qui se pose sur le texte. Rythme plus posé que les autres formats
(pas de badge/kicker sur les slides Message) — même mécanique d'animation
que les autres, juste un tempo plus lent porté par la durée des slides.

Props (voir `src/Concept/types.ts`) :

- `brand`, `hook`, `message1`, `message2`, `cta` (chaînes de texte simples)
- `clips?: { src, label }[]` — même contrat que les autres formats (voir
  section "Fonds vidéo" plus haut)
- `durationsInSeconds?: { hook, message1, message2, cta }`

Réutilise les mêmes composants partagés que les autres formats
(`SlideFrame`, `colors`, `BackgroundVideoLayer`, `clips.ts`, `HookSlide` de
Versus, `CtaSlide` de Top3) ; seul `MessageSlide` est propre à ce format.

## Voix off et musique de fond (`AudioLayer`)

Les 4 formats acceptent aussi, en plus de `clips` :

- `voiceovers?: { [slide]: string }` — fourni par l'appelant (Make), un
  fichier audio par sous-titre. Les clés attendues dépendent du format
  (chemins relatifs à `public/` ou URLs `http(s)://` complètes, chaque clé
  optionnelle) :
  - Versus : `hook`, `optionA`, `optionB`, `verdict`, `cta` — Versus n'a pas
    de slide CTA séparée (le CTA est intégré à la slide Verdict, affiché en
    même temps que le texte du verdict). Si les deux voix off `verdict` et
    `cta` sont fournies, elles s'enchaînent l'une après l'autre **dans
    cette même slide** (verdict d'abord, puis cta dès que l'audio du
    verdict se termine) et la slide dure le temps des deux réunis ; si une
    seule des deux est fournie, elle joue seule sur toute la slide (`cta`
    sert alors de voix off pour toute la slide, comme si c'était la seule
    fournie)
  - Top3 : `hook`, `produit1`, `produit2`, `produit3`, `benefices`, `cta`
  - Educatif : `hook`, `conseil1`, `conseil2`, `conseil3`, `cta`
  - Concept : `hook`, `message1`, `message2`, `cta`

  Chaque slide dont la clé est fournie est chronométrée sur la durée réelle
  de son fichier audio (+ une marge de 0.15s pour la lisibilité du texte),
  et son voiceover démarre pile avec sa slide — bout à bout, sans blanc ni
  chevauchement, à partir de la frame 0 pour `hook`. La durée totale de la
  vidéo s'ajuste automatiquement à la somme des slides. Une clé absente
  garde le comportement par défaut (durée fixe du format, ou
  `durationsInSeconds` si fourni) pour cette slide, sans erreur ni casser
  les autres. `voiceovers` absent ou vide → comportement identique à avant
  (durée fixe, vidéo silencieuse pour la voix off) sur toutes les slides.

La musique de fond, elle, n'est **pas** un champ à envoyer : à chaque rendu,
`server/render-server.js` pioche automatiquement un fichier dans
`public/audio/music/` (liste le dossier, choix déterministe via le même
`renderSeed` que pour les rushes vidéo — donc un `renderSeed` réutilisé
donne le même choix, un `renderSeed` frais varie), le joue en boucle sur
toute la durée de la vidéo à volume 8% (`MUSIC_VOLUME` dans
`src/Versus/AudioLayer.tsx`) pour rester nettement en retrait et ne jamais
couvrir la voix off. Dossier vide/introuvable → pas de musique, sans
erreur.

Formats de fichier acceptés dans `public/audio/music/` :
`.mp3`, `.wav`, `.m4a`, `.aac`, `.ogg`, `.flac`.

**Détail technique** : la durée des rushes vidéo est sondée côté serveur
(compositor Remotion), mais ce compositor rejette les fichiers audio purs
("No video stream found").

Pour les **voix off** (`voiceovers`), cette durée est sondée côté serveur
également (`server/render-server.js`, fonction `probeVoiceoverDurations`),
mais avec un outil différent : le package npm `music-metadata` (lit les
métadonnées audio d'un buffer téléchargé via `fetch`, ou d'un fichier
local). Le résultat est transmis à la composition via un champ interne
`voiceoverDurations`, en secondes. Ce sondage a volontairement lieu côté
serveur (Node) et **pas** dans le navigateur : Chromium (utilisé par
Remotion pour le rendu) bloque par sa protection ORB (Opaque Response
Blocking) les requêtes audio cross-origin vers des hébergeurs comme Google
Drive (`net::ERR_BLOCKED_BY_ORB`), ce qui faisait planter le rendu quand
cette même durée était sondée côté navigateur (ancienne approche, comme
pour la musique ci-dessous). `fetch` côté Node n'est pas soumis à cette
protection — d'où le déplacement. Un fichier dont le téléchargement ou la
lecture échoue est simplement ignoré (log d'avertissement) : la slide
concernée retombe sur sa durée par défaut, sans faire planter le reste du
rendu.

Pour la **musique de fond**, la durée est en revanche toujours sondée côté
navigateur, au moment du rendu, via `getAudioDurationInSeconds` de
`@remotion/media-utils` (`getVideoMetadata`, côté serveur comme côté
navigateur, échoue aussi sur l'audio pur) — ce qui reste possible sans
souci ici car les fichiers de musique sont servis localement depuis
`public/`, donc en same-origin avec la page de rendu (pas de restriction
ORB, celle-ci ne visant que les requêtes cross-origin). Si ce sondage
échoue, le morceau choisi joue une fois sans boucler plutôt que de risquer
un point de boucle incorrect — jamais d'erreur de rendu dans tous les cas.

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

Un petit serveur (`server/render-server.js`) expose trois routes : tu lui
envoies les textes des slides (+ éventuellement `clips`) en JSON sur
`POST /render`, il répond **immédiatement** avec un identifiant de tâche
(`jobId`) pendant qu'il rend la vidéo en arrière-plan ; tu interroges
ensuite `GET /render/status/:jobId` jusqu'à ce que le rendu soit terminé,
puis tu télécharges le mp4 via l'URL qu'il te renvoie. Cette section
explique comment connecter tout ça à Make via un tunnel local (ngrok) —
pratique pour tester, mais **ton ordinateur doit rester allumé et
connecté** pendant que Make peut appeler le webhook (voir plus bas pour une
solution permanente).

**Pourquoi trois appels et pas un seul** : un rendu peut prendre plusieurs
minutes (Top3 avec 6 segments de voix off, notamment), alors que les
tunnels gratuits (Cloudflare, ngrok...) coupent la connexion après un délai
fixe (souvent 120s, non modifiable sur ces offres). Une seule requête qui
bloque jusqu'à la fin du rendu se ferait donc couper en plein milieu sur un
format un peu long. En répondant tout de suite avec un `jobId` et en
laissant Make revenir demander l'état, plus aucun appel HTTP individuel
n'a besoin de rester ouvert plus de quelques secondes, quelle que soit la
durée réelle du rendu.

**1. Démarrer le serveur en local**

```console
cd zenaquatique-reels
npm install
npm run server
```

Le serveur écoute sur `http://localhost:3001`. Teste-le sans Make d'abord :

```console
# 1. Lancer le rendu — répond tout de suite avec un jobId
curl -X POST http://localhost:3001/render \
  -H "Content-Type: application/json" \
  -d '{"brand":"ZenAquatique","hook":"Ton bac vire au vert ?","optionA":{"label":"La méthode classique","text":"Produits chimiques, résultats incertains."},"optionB":{"label":"ZenAquatique","text":"Un écosystème équilibré."},"verdict":"L'\''aquascaping durable.","cta":"zenaquatique.fr"}'
# -> {"jobId":"2e382c61-...","status":"processing"}

# 2. Interroger le statut (répéter toutes les quelques secondes)
curl http://localhost:3001/render/status/2e382c61-...
# -> {"status":"processing"}                                        (pas encore fini)
# -> {"status":"done","videoUrl":"http://localhost:3001/render/result/2e382c61-..."}  (fini)
# -> {"status":"error","message":"..."}                              (échec)

# 3. Une fois "done", télécharger le mp4 depuis videoUrl
curl "http://localhost:3001/render/result/2e382c61-..." -o test.mp4
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

**4. Configurer les modules HTTP dans Make**

Le scénario a besoin de 3 modules HTTP à la suite (plus une boucle
d'attente entre le 2ᵉ et le 3ᵉ) au lieu d'un seul :

*Module 1 — lancer le rendu*
- Méthode : `POST`
- URL : `https://xxxx.ngrok-free.app/render`
- En-têtes : `Content-Type: application/json` et `x-api-key: un-secret-a-toi`
  (si configuré à l'étape 2)
- Corps (JSON) : les champs `brand`, `hook`, `optionA`, `optionB`, `verdict`,
  `cta`, et optionnellement `clips` (voir section ci-dessus)
- Réponse : JSON `{"jobId": "...", "status": "processing"}` — parsing JSON
  normal (contrairement à avant, ce n'est plus le fichier vidéo)

*Attente + Module 2 — interroger le statut*
- Ajoute un délai (module "Sleep", ~5-10s) puis un module HTTP `GET`
  `https://xxxx.ngrok-free.app/render/status/{{jobId du module 1}}`
  (même en-tête `x-api-key` si configuré)
- Renvoie `{"status": "processing"}`, `{"status": "done", "videoUrl": "..."}`
  ou `{"status": "error", "message": "..."}`
- Enveloppe ces deux étapes (Sleep + HTTP status) dans un **Repeater** ou une
  branche conditionnelle qui reboucle tant que `status = "processing"`, et
  sort dès que `status` vaut `"done"` (continuer vers le module 3) ou
  `"error"` (arrêter/notifier). Un rendu prend de quelques dizaines de
  secondes à plusieurs minutes selon le format et le nombre de voix off —
  prévois une limite raisonnable de tentatives (ex. 60 × 10s = 10 min) pour
  éviter une boucle infinie en cas de souci.

*Module 3 — télécharger le fichier final*
- Méthode : `GET`
- URL : le `videoUrl` reçu à l'étape précédente (déjà une URL complète,
  pointant vers `/render/result/:jobId`)
- Même en-tête `x-api-key` si configuré
- Le module doit interpréter la réponse comme un **fichier binaire** (pas
  du JSON) — dans Make, choisis "Parse response" désactivé ou récupère le
  contenu brut pour l'enregistrer/l'envoyer ailleurs (Google Drive, etc.)
- Le fichier reste disponible en téléchargement pendant 30 minutes après la
  fin du rendu (au cas où ce module échouerait et devrait réessayer) —
  passé ce délai, le `jobId` expire et `videoUrl` renvoie une 404.

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
