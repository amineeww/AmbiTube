<p align="center">
  <img src="assets/icon.svg" width="96" alt="Logo AmbiTube">
</p>

<h1 align="center">AmbiTube</h1>

<p align="center">
  Lumière ambiante pour les vidéos YouTube™ : les couleurs de la vidéo éclairent doucement toute la page.<br>
  <a href="README.md">English version</a>
</p>

---

> **Version 1.0.** Publication sur le Chrome Web Store en préparation — voir [`store/`](store/).

## Pourquoi AmbiTube ?

Des extensions de lumière ambiante existent déjà et elles sont très réussies, mais elles proposent souvent des dizaines de réglages.
AmbiTube vise **le même rendu avec une expérience beaucoup plus simple** :

- **Un seul bouton** dans le lecteur, juste à côté de la lecture automatique : une petite ampoule.
- **Des presets prêts à l'emploi** (*Subtil · Équilibré · Intense*) et jusqu'à 6 presets personnels.
- **Quatre curseurs essentiels** (intensité, flou, étendue, couleurs) ; le reste est automatique ou rangé dans *Avancé*.
- Un **mode immersif** optionnel qui assombrit les miniatures des vidéos suggérées.
- Fonctionne en **mode normal, cinéma et plein écran**, en s'adaptant à chacun : en cinéma et en plein écran, les bandes noires autour de la vidéo (écrans ultrawide, films en 21:9) sont éclairées jusqu'aux bords de l'écran.
- **Thème sombre et clair** : un halo profond sur fond sombre, une teinte pastel sur fond clair.
- Disponible en **français et en anglais**.

## Navigateurs compatibles

| Navigateur | État |
| --- | --- |
| Chrome, Edge, Brave, Opera, Vivaldi, Arc (Chromium) | ✅ Même paquet |
| Firefox 142+ (ordinateur) | ✅ Même paquet |
| Safari | ❌ Pas prévu |

## Installation (version de développement)

**Chrome / Edge / Brave / Opera / Vivaldi**

1. Télécharge ou clone ce dépôt.
2. Ouvre `chrome://extensions` dans Chrome.
3. Active le **Mode développeur** (en haut à droite).
4. Clique sur **Charger l'extension non empaquetée** et sélectionne le dossier `extension`.
5. Ouvre une vidéo YouTube : l'ampoule apparaît à côté de la lecture automatique. Clique dessus pour ouvrir le menu.

Après une modification du code, clique sur l'icône de rechargement de la carte AmbiTube dans `chrome://extensions`, puis actualise YouTube.
(Edge : `edge://extensions` · Brave : `brave://extensions` · Opera : `opera://extensions`.)

**Firefox**

1. Ouvre `about:debugging#/runtime/this-firefox`.
2. Clique sur **Charger un module complémentaire temporaire…** et choisis `extension/manifest.json`.
3. Ouvre une vidéo YouTube. (Les modules temporaires disparaissent à la fermeture de Firefox.)

## Structure du projet

```
extension/          ← le dossier chargé par Chrome
  manifest.json
  _locales/         ← traductions (en, fr)
  content/          ← scripts injectés dans YouTube
    core.js         ← espace de noms partagé, traductions, réglages
    menu.js         ← le menu des réglages (presets, curseurs, mode immersif)
    tips.js         ← bulles de bienvenue / d'astuce (une seule fois)
    player-button.js← le bouton ampoule
    glow-renderer.js← rendu WebGL de la lumière
    ambient-light.js← quand et où la lumière s'affiche
    main.js         ← démarrage et gestion de la navigation YouTube
    content.css
  icons/
assets/             ← illustrations sources (icon.svg)
scripts/            ← build-icons.sh, package.sh (zip pour le store)
store/              ← textes de la fiche, visuels promo, guide de publication
```

## Feuille de route

- [x] **Étape 1 — Base :** Manifest V3, traductions, bouton ampoule dans le lecteur
- [x] **Étape 2 — Lumière ambiante :** couleurs en direct sur toute la page (modes normal et cinéma), désactivation automatique du mode ambiant natif de YouTube
- [x] **Étape 3 — Menu :** presets, quatre curseurs principaux, section *Avancé*, réglages conservés d'une vidéo à l'autre, **mode immersif** (miniatures assombries qui se rallument au survol)
- [x] **Étape 4 — Bandes noires :** bandes latérales des écrans ultrawide et bandes haut/bas des films en 21:9 éclairées en plein écran *(la détection des bandes incrustées dans la vidéo a été abandonnée volontairement : trop de risques de scintillement sur les scènes sombres)*
- [x] **Étape 5 — Finitions et publication :** thème clair, bulles de bienvenue et d'astuce (une seule fois), pause en arrière-plan, politique de confidentialité, kit Chrome Web Store

## Confidentialité

AmbiTube ne fonctionne que sur `www.youtube.com`, enregistre ses réglages dans ton profil Chrome et n'envoie aucune donnée. Voir la [politique de confidentialité](PRIVACY.md).

## Crédits

AmbiTube s'inspire de [Ambient light for YouTube™](https://github.com/WesselKroos/youtube-ambilight) de **Wessel Kroos** (licence MIT).
Icônes issues des [Material Icons](https://github.com/google/material-design-icons) de Google (licence Apache 2.0).
Voir [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

AmbiTube n'est pas affilié à YouTube ni à Google. YouTube est une marque de Google LLC.

## Licence

[MIT](LICENSE) © 2026 Amine Charit
