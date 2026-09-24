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
  { "src": "video/rushes/rush_a.mp4", "effect": "zoom_in", "speed": 1.2 },
  { "src": "video/rushes/rush_b.mp4" },
  { "src": "video/rushes/rush_c.mp4" }
]
```

- `src` est soit un chemin relatif à `public/` (ex. `video/rushes/xxx.mp4`,
  résolu via `staticFile`), soit une URL `http(s)://` complète.
- `effect`/`speed`/`rotateDeg` sont optionnels par clip — voir "Rythme
  visuel dynamique" plus bas pour le détail (styles de caméra disponibles,
  bornes, comportement par défaut quand ils sont omis).
- **Chaque clip apparaît à la fois** en bref aperçu pendant le Hook (une
  fraction de seconde à quelques secondes chacun, tous dans l'ordre donné)
  **et** sur une portion proportionnelle du reste de la vidéo (Option A,
  Option B, Verdict) — voir `planClips` dans `src/Versus/clips.ts`. Ce
  n'est **plus** "tous les clips sauf le dernier en intro, le dernier
  seul pour tout le reste" (ancien comportement, corrigé — voir plus bas) :
  avec N clips explicites, chacun des N couvre une vraie portion du corps
  de la vidéo, pas juste le dernier.
- Jusqu'à **9 clips** par rendu (`MAX_CLIPS` dans `server/render-server.js`)
  — au-delà, `POST /render` répond `400`, la requête entière est rejetée
  (pas de troncature silencieuse). `planClips`/`BackgroundVideoLayer`
  n'ont eux-mêmes aucune limite câblée en dur ; ce plafond n'est qu'un
  garde-fou côté validation d'entrée, testé par rendu réel jusqu'à 8 clips
  simultanés sans problème.
- 1 seul clip → il sert à la fois d'intro et de fond continu.
- `"clips": []` (tableau explicitement vide) → repli volontaire sur le fond
  uni de la v1 (texte seul), aucune rotation automatique.

Placez vos rushes dans `public/video/rushes/` (ou tout autre sous-dossier de
`public/`) pour qu'ils soient servis en `src` relatif.

**Rotation automatique si `clips` est absent** : si le champ `clips` n'est
**pas du tout envoyé** dans la requête (différent d'un tableau vide, voir
ci-dessus), `server/render-server.js` choisit lui-même les rushes à la
place de Make — plus besoin de gérer une rotation côté Make. Il liste
`public/video/rushes/` (fichiers `.mp4`/`.mov`), en pioche jusqu'à 2 comme
coupes courtes pour le Hook, puis pioche **autant de clips que nécessaire**
pour la partie qui joue derrière Option A/B/Verdict — **le nombre n'est
plus fixé à 3** :

- Si les rushes piochés pour cette partie totalisent déjà assez de durée
  (souvent : 1 seul clip assez long), le rendu s'arrête là — 3 rushes au
  total, comme avant.
- Sinon, il continue à piocher un 4ᵉ, un 5ᵉ (etc.) rush jusqu'à couvrir
  toute la durée, pour enchaîner de vrais rushes différents plutôt que de
  laisser le dernier boucler plusieurs fois (voir "Boucle si le rush est
  trop court" ci-dessous — ce mécanisme reste un filet de sécurité pour le
  tout dernier clip, mais n'est presque plus jamais nécessaire).

**Équilibrage par catégorie** — la rotation n'est plus un simple curseur
qui avance dans l'ordre alphabétique du dossier (ça clusterait les rushes
par catégorie plutôt que de varier, puisque le tri par défaut classe les
majuscules avant les minuscules : tous les `Neocaridina .../Limnobium ...`
avant tout `general_...`). Chaque fichier est classé à partir de son nom
(nom d'espèce en toutes lettres + `_NN`, ou `general_NN` pour les rushes
génériques) :

- commence par `general` → catégorie **general**
- sinon, commence par `Neocaridina` (le genre de toutes les crevettes
  vendues) → catégorie **crevettes**, espèce = le nom complet
- sinon → catégorie **plantes** (par élimination — une nouvelle espèce de
  plante n'a donc besoin d'aucune modification de code), espèce = le nom
  complet

Chaque rendu place **un rush `general` en premier** (s'il en existe au
moins un) — donc quasi systématiquement parmi les 3 premiers rushes
choisis (les coupes du Hook) — puis alterne entre les différentes espèces
disponibles, en reléguant en dernier celles utilisées lors du rendu
précédent : deux rendus consécutifs n'utilisent donc jamais exactement la
même paire crevette/plante, sauf si le nombre d'espèces disponibles est
trop faible pour l'éviter. À l'intérieur d'une même espèce qui a plusieurs
clips numérotés, ceux-ci tournent aussi (jamais toujours `_01`).

Chaque rendu avance l'état de rotation du **nombre réel** de rushes
utilisés cette fois-ci (3, 4, 5...), jamais un nombre fixe — sinon la
rotation se désynchroniserait (des rushes reviendraient plus souvent que
d'autres, ou seraient sautés). Il est persisté dans
`server/.rush-rotation-state.json` (pas commité dans Git — état
d'exécution, pas du code) pour survivre à un redémarrage du serveur, pas
seulement entre deux rendus de la même session. Dossier vide/introuvable
→ aucun clip choisi, même repli que `"clips": []` (fond uni, sans erreur).
S'applique aux 4 formats. Pour revenir à un contrôle explicite depuis Make
sur un rendu donné, il suffit d'envoyer `clips` comme avant — cela
désactive la rotation automatique pour ce rendu précis (et revient au
comportement "dernier clip = seul clip de fond", sans en piocher
davantage), sans rien changer aux autres.

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

**Boucle si le rush est trop court** : si un fichier local dure *moins*
longtemps que le segment/slide qu'il illustre, `BackgroundVideoLayer` le
fait boucler (reprend à la frame 0 du fichier, autant de fois que
nécessaire) plutôt que de le laisser se figer sur sa dernière image une fois
fini — que ce soit un des clips courts de l'intro, ou le tout dernier clip
de la partie Option A/B/Verdict. Le point de redémarrage de la boucle est
toujours la frame 0 du fichier, pas le point de départ aléatoire éventuel
décrit ci-dessus (qui ne s'applique qu'au tout premier passage). C'est un
cut net à chaque reprise (pas de fondu).

Pour la partie Option A/B/Verdict spécifiquement, ce mécanisme n'est plus
la ligne de défense principale contre l'effet de gel : avec la rotation
automatique (voir plus haut), le serveur pioche désormais autant de
rushes que nécessaire pour couvrir toute cette durée avec de vrais clips
différents enchaînés bout à bout (chacun chronométré sur sa propre durée
réelle), donc le dernier clip de la séquence n'a presque plus jamais
besoin de boucler. La boucle reste un filet de sécurité pour les cas
limites (durée illisible, `clips` fourni explicitement par Make avec un
seul clip trop court, ou dossier de rushes trop petit pour couvrir toute
la durée même en le vidant entièrement) — un rush qui boucle proprement
(pas de saut visuel entre sa dernière et sa première image) reste
préférable si jamais ce filet de sécurité doit s'activer. S'applique aux
4 formats, tous partagent le même `BackgroundVideoLayer`.

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

## Sous-titres dynamiques bas d'écran (`KaraokeText`)

Le texte de chaque slide (Hook, Option A/B, Verdict, CTA, Top3/Educatif/
Concept...) s'affiche en petits groupes de mots roulants façon sous-titres
dynamiques courte-vidéo (style Hormozi/CapCut/Submagic), ancrés en bas de
l'écran plutôt qu'en gros bloc centré — ça laisse le fond vidéo visible
(l'ancien bloc centré le cachait trop) et lit comme un vrai montage plutôt
qu'un pavé de texte figé. `src/Versus/KaraokeText.tsx` est le composant
partagé (réutilisé par les 4 formats via `../Versus/...`) qui fait ce
travail — il remplace les anciens `<div>{text}</div>` dans les 8
composants de slide (`HookSlide`, `OptionSlide`, `VerdictSlide`,
`ProductSlide`, `BenefitsSlide`, `CtaSlide`, `TipSlide`, `MessageSlide`).

**Groupes roulants, pas accumulation** : contrairement à une v1 antérieure
qui affichait tous les mots déjà "prononcés" en même temps (le bloc
grossissait au fil de la phrase), seul un petit groupe de mots (3 par
défaut, `DEFAULT_GROUP_SIZE`/prop `groupSize`) est visible à la fois — le
groupe suivant **remplace** entièrement le précédent plutôt que de
s'ajouter dessous. Chaque mot du groupe actif garde son propre pop-in
(fondu + zoom) individuel, calculé sur le même découpage `durationInFrames
÷ nombre de mots` qu'avant (voir "Timing" plus bas, inchangé). Exporté
aussi : `wordIndexAtFrame`, l'utilitaire qui détermine quel mot est
"courant" à une frame donnée — partagé avec `NumberOverlay` pour rester en
phase sans dupliquer le calcul.

**Position** : `SlideFrame.tsx` ancre maintenant tout le contenu de la
slide en bas (`justifyContent: "flex-end"`, padding bas 140px) plutôt
qu'au centre — la police de chaque `KaraokeText` a aussi été réduite en
conséquence dans chaque slide (ex. Hook : 76px → 44px) pour rester
proportionnée à ce nouvel espace, plus petit et bas d'écran. Le badge
`NumberOverlay` (overlays de preuve chiffrée, voir plus bas) a été
remonté (`bottom: "16%"` → `"34%"`) pour ne plus chevaucher cette nouvelle
bande de sous-titres.

**Timing** : chaque mot se voit attribuer une fenêtre de
`durationInFrames ÷ nombre de mots` — une approximation (durée totale du
texte divisée équitablement), pas les vrais timestamps par mot de la voix
off. ElevenLabs propose un endpoint dédié (`with-timestamps`) qui renvoie
l'alignement mot par mot réel, mais l'utiliser demanderait de modifier les
~20 appels HTTP ElevenLabs du scénario Make (réponse JSON avec alignement
au lieu de l'audio brut actuel) et de faire transiter ces timings jusqu'à
Remotion via `render-server.js` — un chantier plus large, pas fait pour
l'instant. Le composant est conçu pour absorber ce changement plus tard
sans changer son interface publique (`text`/`durationInFrames`/`startFrame`
resteraient, seules les valeurs passées viendraient d'un vrai alignement).

**Cas particulier — `VerdictSlide`** : c'est la seule slide avec deux
textes voix-off distincts dans la même séquence (`verdict` puis `cta`, qui
s'enchaînent — voir `ctaVoiceoverOffsetInFrames` dans
`VersusComposition.tsx`). `VerdictSlide` reçoit ce décalage via sa prop
`ctaOffsetInFrames` et le transmet à la seconde `KaraokeText` via son prop
`startFrame`, pour que les mots du CTA ne commencent à apparaître qu'une
fois la narration du verdict terminée — plutôt que les deux textes qui
révèlent leurs mots en parallèle. Sans voix off `cta` distincte (le pill
CTA est alors juste un texte statique accompagnant le verdict), les deux
révèlent leurs mots ensemble sur toute la durée de la slide, comme avant.

**Mise en page** : `KaraokeText` découpe le texte en mots
(`text.split(/\s+/)`) et les rend dans un conteneur flex
(`flexWrap: "wrap", justifyContent: "center"`) — tous les mots (y compris
ceux pas encore "prononcés") occupent leur place dans la mise en page dès
le départ, seule leur opacité/échelle change ; la ligne (ou les lignes)
reste donc centrée comme avant, et les mots apparaissent progressivement
à leur emplacement final plutôt que de faire bouger le texte déjà affiché.

## Icônes contextuelles (`icons`)

Chaque slide peut afficher une petite icône en médaillon (coin haut-droit,
synchronisée avec l'apparition/disparition de la slide) illustrant l'idée
du segment — ex: `check` pour l'option B d'un Versus, `warning` pour un
conseil qui met en garde. `src/Versus/icons.tsx` définit un jeu de 13
icônes SVG inline (aucune dépendance externe) : `check`, `cross`,
`trending_up`, `trending_down`, `clock`, `warning`, `star`, `heart`,
`lightbulb`, `arrow_right`, `euro`, `leaf`, `drop`.

**Comment ça arrive** : un nouveau champ `icons` (optionnel, comme
`voiceovers`) dans le payload JSON envoyé à `POST /render` — un objet qui
associe à chaque segment une des 13 valeurs ci-dessus (mêmes clés que
`voiceovers`, ex: `{"hook": "trending_up", "optionA": "cross", "optionB":
"check", "verdict": "leaf", "cta": "arrow_right"}` pour Versus). Absent ou
avec une clé manquante → cette slide n'affiche simplement pas d'icône, pas
d'erreur. Le champ transite tel quel de `render-server.js` (`inputProps`)
jusqu'à chaque composition, qui le déconstruit vers la bonne slide (voir
`icons?.hook`, `icons?.optionA`, etc. dans chaque `*Composition.tsx`).

**Où le générer côté Make** : c'est Claude (le module qui génère le script
— `hook`/`optionA`/etc.) qui doit taguer chaque segment avec une icône de
la liste fermée ci-dessus dans son propre JSON de réponse, puis le module
HTTP qui construit le corps envoyé à `render.zen-aquatique.fr/render`
doit relayer cet objet `icons`. Ce n'est pas encore fait côté Make à ce
jour — le scénario doit être mis à jour (voir historique de conversation
pour les instructions exactes données au moment de cette fonctionnalité).

**Personnalisation visuelle** : `SlideFrame` accepte `icon`/`iconColor` —
la couleur par défaut est `colors.aqua`, mais `OptionSlide` passe déjà sa
propre couleur d'accent (`softWhite` pour l'option A, `aqua` pour la B)
pour rester lisible sur son propre fond. Une seule icône par slide (pas de
minuterie interne séparée) — pour `VerdictSlide`, qui a deux textes voix
off distincts (`verdict` et `cta`), seul `verdict` peut avoir une icône,
le CTA restant un badge visuellement distinct sans icône dédiée.

## Overlays de preuve chiffrée (`NumberOverlay`)

Chaque prix ou quantité mentionné dans le texte d'une slide (`"0,99€"`,
`"5€"`, `"30%"`, `"48h"`...) s'affiche en plus, en gros, dans un badge
animé qui apparaît exactement au moment où ce mot est "prononcé" par le
sous-titrage karaoké — pour que le chiffre ne repose pas que sur la voix
off (l'un des 4 points de l'audit qualité IA de septembre 2026 : "overlays
de preuve chiffrée"). `src/Versus/NumberOverlay.tsx` est le composant
partagé, ajouté en frère de chaque `<KaraokeText>` dans les 8 composants
de slide — même `text`/`durationInFrames`/`startFrame` que la
`KaraokeText` voisine, pour rester synchronisé sans timing séparé à
maintenir (les deux composants partagent `splitWords`, exporté par
`KaraokeText.tsx`).

**Détection** : tout mot contenant au moins un chiffre est traité comme
une "preuve chiffrée" — pas de liste d'unités à maintenir. Un mot suivant
qui n'est qu'un symbole (`€`, `%`) est fusionné dans le même badge (couvre
le cas rare où Claude écrit `"0,99 €"` avec un espace plutôt que `"0,99€"`
collé). Rien à changer côté Make : ça lit le texte déjà généré
(`hook`/`optionA.text`/etc.), aucun nouveau champ JSON. Un texte sans
aucun chiffre n'affiche simplement aucun badge.

**Timing** : badge qui apparaît (fondu + léger effet de zoom, ~0,25s),
reste visible ~1,4s le temps d'être lu, puis s'efface — indépendant de la
durée du mot karaoké lui-même, pour laisser le temps de lire même un
chiffre bref comme `"5€"`.

## Rythme visuel dynamique (`BackgroundVideoLayer`)

Avant cette fonctionnalité, un rush pouvait couvrir toute la durée d'une
slide sans coupe ni mouvement dès lors qu'il était assez long — l'effet
"diaporama figé" relevé par l'audit qualité IA. `BackgroundVideoLayer.tsx`
gère maintenant ça en deux volets :

**Bug corrigé — les clips explicites n'étaient pas tous utilisés**
(`src/Versus/clips.ts`) : quand Make envoie `clips` explicitement (3 à 9
rushs choisis par Claude selon le format et le prompt en place — voir
`MAX_CLIPS` dans `server/render-server.js`) sans le champ interne
`tailCount`, `planClips` réservait tous les clips sauf le dernier à un
simple passage éclair pendant le Hook — le dernier clip seul couvrait
ensuite TOUT le reste de la vidéo (options A/B + verdict, souvent 15+
secondes). Les jump cuts/zoom s'appliquaient bien dessus, mais comme
c'était toujours la même source ré-écourtée, Gemini lisait ça comme "un
plan fixe unique" même une fois les styles de caméra ajoutés. Corrigé :
sans `tailCount` explicite, tous les clips deviennent à la fois intro (un
bref aperçu de chacun pendant le Hook) et tail (chacun couvre une part
proportionnelle du reste de la vidéo).

**Bug corrigé — l'allocation du "tail" suivait la durée réelle du fichier,
pas le nombre de clips** : même une fois le bug ci-dessus réglé, l'appel à
`Math.min(knownDurationInFrames, remaining)` donnait à chaque clip sa
propre durée réelle plutôt qu'une part égale du temps disponible — avec
peu de clips (2-3) aux fichiers longs, les premiers épuisaient tout le
budget "tail" et les suivants recevaient `remaining = 0` (silencieusement
filtrés). Avec 7-9 clips choisis exprès par Claude pour leurs effets
individuels, la plupart n'apparaissaient donc jamais. Corrigé :
`perClipDuration = Math.floor(tailTotalDuration / tailClips.length)` —
chaque clip reçoit une part égale (~1,5-2s pour 7-9 clips sur ~20s),
proche ou sous le seuil `MAX_SHOT_DURATION_IN_SECONDS` (donc pas besoin
d'un second découpage par `splitIntoShots`), et le dernier absorbe le
reste de la division entière. `ClipVideo` gère déjà les deux sens (boucle
si la source est plus courte que sa part, re-trim aléatoire si plus
longue) — seule la taille de la part a changé, pas comment elle est
remplie. Vérifié par rendu réel avec 8 clips distincts : chacun apparaît
sur sa propre portion, changement visible toutes les ~2s sur toute la
durée.

**Coupes automatiques (jump cuts)** : aucun plan ne reste statique plus de
`MAX_SHOT_DURATION_IN_SECONDS` (2,5s) d'affilée. Toute allocation de clip
(intro ou tail) plus longue que ça est découpée en plusieurs plans
consécutifs (`splitIntoShots`), chacun rejoué depuis un point de départ
aléatoire différent dans le **même** fichier source (`trimBefore` recalculé
par plan, avec un suffixe de seed distinct) — un vrai jump cut en réutilisant
le stock de rushes existant, sans qu'aucune nouvelle vidéo ne soit
nécessaire. Un plan issu d'un rush trop court pour être re-trimmé retombe
sur le comportement `<Loop>` déjà existant.

**Mouvement de caméra (5 styles, `ShotEffect`)** : chaque plan reçoit en
plus un des 5 styles de mouvement de `SHOT_MOTION` (`BackgroundVideoLayer.tsx`) —
`zoom_in`, `zoom_out`, `pan_drift` (léger travelling latéral), `tilt_zoom`
(zoom + rotation subtile ±3,5°) ou `speed_punch` (zoom + vitesse de lecture
x1,25) — même un plan filmé statique à la prise de vue lit comme un
mouvement de caméra plutôt qu'une image figée. Choisi automatiquement par
plan via `random(seed)` quand rien n'est précisé (donc déjà varié sans
aucun changement côté Make), ou imposé explicitement par plan via les
champs optionnels `effect`/`speed`/`rotateDeg` sur l'objet `clips[i]` (voir
`ShotEffect`/`VersusClip` dans `src/Versus/types.ts`) — c'est le point
d'accroche pour qu'une future étape (le prompt Claude, qui reçoit déjà
`video_quality_lessons`) puisse un jour *diriger* le montage plutôt que de
laisser le hasard décider. Une rotation demandée explicitement au-delà de
ce que le style choisi prévoit se voit automatiquement compenser par un
zoom supplémentaire (`minScaleForRotation` dans `resolveShotMotion`) pour
ne jamais exposer un coin vide ; vitesse et angle sont bornés (0,6-1,8x,
±8°) pour qu'une valeur aberrante ne puisse jamais casser un rendu.

**Transitions sonores (v2)** : un bref whoosh joue à chaque coupe de plan
(`CutSound` dans `BackgroundVideoLayer.tsx`, skip à la toute première
frame de la vidéo), et un léger pop à chaque nouveau groupe de mots des
sous-titres (`ChunkPopSounds` dans `KaraokeText.tsx`). Une v1 de ce whoosh
avait été retirée après s'être révélée trop forte/dure en conditions
réelles — v2 corrige ça sur trois points : synthèse plus douce (mélange
bruit filtré + une fine sous-couche tonale, lissage passe-bas au lieu du
bruit brut, pic normalisé à 0,5 au lieu de 0,85), durée plus courte
(0,35-0,45s), et surtout un volume de lecture nettement plus bas
(`SFX_VOLUME = 0.22` pour le whoosh, `POP_SFX_VOLUME = 0.16` pour le pop —
contre 0,45 en v1). Fichiers synthétisés par script (toujours aucun accès
aux bibliothèques CC0 depuis ce sandbox — voir l'historique de
conversation pour le détail), 3 variantes de whoosh + 2 de pop dans
`public/audio/sfx/`, listées dans `src/Versus/sfx.ts`
(`WHOOSH_FILES`/`POP_FILES`) — fichier choisi à chaque déclenchement au
hasard mais déterministe (`random(seed)`). Si le rendu sonore ne convient
toujours pas, dis-le : c'est un aller-retour de synthèse à l'aveugle (pas
d'écoute possible depuis ce sandbox), pas une science exacte du premier
coup.

Combiné à `NumberOverlay` : un texte long avec plusieurs prix (donc
plusieurs badges) tombe naturellement sur une slide au montage déjà plus
riche en coupes/zooms/pops, sans lien direct entre les deux mais un effet
cohérent à l'écran.

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

## Bundle Remotion et fichiers écrits pendant l'exécution

`server/render-server.js` ne bundle la composition Remotion (`bundle()`,
fonction `getBundleLocation`) qu'**une seule fois**, au tout premier rendu
après le démarrage du serveur — le résultat est mis en cache
(`bundleLocationPromise`) pour toute la durée de vie du process, pour ne
pas payer le coût du bundling à chaque requête.

Par défaut, `bundle()` **copie** `public/` dans le dossier de sortie du
bundle à ce moment précis, une seule fois. N'importe quel fichier écrit
dans `public/` *après* ce premier bundling (par exemple chaque voix off
matérialisée en `.mp3` sous `public/tmp-voiceovers/`, voir
`materializeVoiceovers` — nécessairement écrite après coup, puisqu'elle
dépend de la requête) serait invisible pour Remotion : le rendu suivant
irait chercher un fichier qui n'existe pas dans cette copie figée, avec une
erreur `404 - could not be found` malgré un fichier bien présent sur le
disque. C'est un piège classique à ne pas confondre avec une race
condition d'écriture (l'écriture elle-même est `await`-ée bien avant que
Remotion n'entre en jeu) — c'est le bundle qui est périmé, pas le fichier
qui arrive en retard.

`getBundleLocation` passe donc `symlinkPublicDir: true` à `bundle()` : au
lieu d'une copie figée, Remotion crée un **lien symbolique** vers le vrai
dossier `public/`, qui reflète donc toujours son contenu actuel — tout
fichier ajouté après coup (voix off, ou n'importe quoi d'autre à l'avenir)
devient visible immédiatement, sans avoir besoin de rebundler. Ne pas
retirer cette option : la retirer réintroduit ce bug, qui n'apparaît qu'à
partir du 2ᵉ rendu sur un même process serveur (le tout premier rendu
fonctionne toujours, puisque le bundling n'a lieu qu'à ce moment-là — d'où
le caractère "intermittent" de l'erreur en pratique).

## Post-traitement faststart (upload Instagram/TikTok)

Une fois le rendu Remotion terminé, `server/render-server.js` (fonction
`applyFaststart`, appelée depuis `runRenderJob` — un seul point d'appel
partagé par les 4 formats) passe le fichier par `ffmpeg -c copy -movflags
+faststart` avant de le marquer comme prêt (`status: "done"`). Ça déplace
l'atome `moov` (l'index du fichier) au tout début du mp4 au lieu de la fin
— sans ça, Instagram et TikTok refusent l'upload (erreur Meta 2207077) car
leurs validateurs ont besoin de lire cet index avant de streamer le
fichier. `-c copy` ne fait que réécrire le conteneur (pas de ré-encodage),
donc c'est rapide et sans perte.

**Prérequis** : `ffmpeg` doit être installé et accessible dans le `PATH` du
serveur (`which ffmpeg`) — c'est un binaire système, pas une dépendance
npm.

Si cette étape échoue (ffmpeg absent, fichier corrompu...), le job entier
passe en `status: "error"` avec le message de l'erreur ffmpeg — le fichier
original (sans faststart) n'est jamais servi tel quel, puisqu'il échouerait
de toute façon à l'upload sur ces plateformes. Le serveur continue de
tourner normalement, cette erreur n'affecte que la tâche en cours.

## Images clés et transcription (`preview_frames`, `transcribed_audio`)

Une fois le faststart appliqué, deux enrichissements tournent sur le
fichier final avant que le job passe à `"done"` (images clés et
transcription en parallèle) — contrairement à faststart, **aucun des deux
ne peut faire échouer le rendu** : la vidéo elle-même est déjà valide à ce
stade, ce sont des compléments, pas des prérequis. Une erreur sur l'un des
deux est juste loguée (`console.warn`) et laisse le champ correspondant
vide/absent, sans toucher à l'autre ni à la vidéo.

**Images clés (`extractPreviewFrames`)** — 8 images JPEG extraites à
intervalles réguliers sur toute la durée de la vidéo (via `ffmpeg -ss ...
-frames:v 1`, un appel par image, en parallèle), aux centres de 8 segments
égaux (jamais la toute première ni la toute dernière frame, plus
susceptibles d'être un cut/bumper noir que du contenu représentatif).
Chaque image est servie par une nouvelle route, sur le même principe que
la vidéo (même cycle de vie/rétention de 60 min, même clé API) :

```
GET /render/frame/:jobId/:index   (index de 0 à 7)
```

**Transcription (`transcribeVoiceover`)** — la piste audio du fichier
final (voix off + musique de fond éventuelle mixée dessous — Whisper
tolère bien un fond sonore discret) est transcrite en texte, entièrement
en local via [faster-whisper](https://github.com/SYSTRAN/faster-whisper)
(modèle `base`, quantification `int8` pour rester léger en ressources sur
un VPS sans GPU) — pas d'API payante, l'audio ne quitte jamais le serveur.
`server/transcribe.py` fait le travail ; `render-server.js` extrait
d'abord un wav 16kHz mono (`ffmpeg -vn -acodec pcm_s16le -ar 16000 -ac 1`,
le format que Whisper attend nativement) puis appelle ce script comme
sous-processus Python.

**Prérequis (transcription uniquement)** — contrairement aux images clés
(seulement ffmpeg, déjà requis), la transcription a besoin de :

```console
pip3 install faster-whisper
```

Le modèle `base` (~150 Mo) est téléchargé automatiquement au tout premier
appel (via `huggingface_hub`, mis en cache ensuite dans
`~/.cache/huggingface`) — la toute première transcription après
l'installation sera donc plus lente que les suivantes, et nécessite un
accès réseau sortant vers `huggingface.co` à ce moment-là. Si
`faster-whisper` n'est pas installé (ou si ce tout premier téléchargement
échoue), la transcription est simplement absente pour ce rendu
(`transcribed_audio: null`), sans erreur ni impact sur le reste — tu peux
donc déployer cette fonctionnalité plus tard sans rien casser d'ici là.

**Critique visuelle — retirée.** Une première version faisait analyser 2
images clés par moondream2 (`server/visual_critique.py`, en local via
`transformers`, CPU-only) et remontait le résultat dans
`visual_critique`. Retiré : c'est maintenant Gemini, côté Make (scénario
"Analyse Performance IA"), qui regarde directement la vidéo rendue —
un signal bien plus fiable qu'un petit modèle de vision CPU décrivant 2
frames isolées, pour un coût en moins à chaque rendu (l'inférence CPU
prenait plusieurs minutes). `visual_critique` reste présent dans la
réponse JSON mais vaut toujours `null` désormais, pour ne pas casser un
module Make qui le référencerait encore (`{{...data.visual_critique}}`
résout simplement à vide).

**Réponse de `GET /render/status/:jobId`** une fois `status: "done"` :

```json
{
  "status": "done",
  "videoUrl": "https://.../render/result/abc123",
  "preview_frames": [
    "https://.../render/frame/abc123/0",
    "https://.../render/frame/abc123/1"
  ],
  "transcribed_audio": "Ton bac vire au vert ? ...",
  "visual_critique": null
}
```

`preview_frames` est toujours un tableau (vide si l'extraction a échoué) ;
`transcribed_audio` est soit une chaîne, soit `null`.

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
- Renvoie `{"status": "processing"}`, `{"status": "done", "videoUrl": "...",
  "preview_frames": [...], "transcribed_audio": "...", "visual_critique":
  null}` (les deux champs utiles, voir section "Images clés et
  transcription" plus haut — utilise-les directement depuis la réponse de
  ce module, pas besoin d'un 4e appel ; `visual_critique` reste présent
  mais vaut toujours `null`, voir cette même section) ou
  `{"status": "error", "message": "..."}`
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
- Le fichier reste disponible en téléchargement pendant 60 minutes après la
  fin du rendu (au cas où ce module échouerait et devrait réessayer, ou
  qu'une plateforme comme Instagram traite le Reel de façon asynchrone et
  vienne le récupérer avec du retard) — passé ce délai, le `jobId` expire
  et `videoUrl` renvoie une 404.

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
