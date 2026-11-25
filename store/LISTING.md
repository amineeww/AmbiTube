# Chrome Web Store listing — texts to paste

The store takes the **name** and **short description** from the extension itself
(`extension/_locales/*/messages.json`). The texts below go into the dashboard.

---

## English

**Detailed description**

```
Light up the room around your videos.

AmbiTube reads the colors at the edges of the video you are watching and spreads them softly over the whole YouTube page — like the ambient lights of a TV, right in your browser.

ONE BUTTON
A small light bulb appears in the player, next to autoplay. Click it to open a simple menu, styled like YouTube's own.

PRESETS, NOT 80 SLIDERS
• Three ready-made styles: Subtle, Balanced and Intense.
• Four live sliders: intensity, blur, spread and colors.
• Save up to 6 presets of your own. Advanced options stay tucked away.

ADAPTS TO HOW YOU WATCH
• Default view: the light fills the page and fades with distance.
• Theater view and fullscreen: the black bars around the video (ultrawide screens, 21:9 films) light up all the way to the edges of the screen.
• Dark theme: a deep glow. Light theme: a soft pastel tint that keeps text readable.

IMMERSIVE MODE
Dims the suggested videos until you hover them, so nothing distracts you from what you are watching.

LIGHT ON YOUR COMPUTER
Tiny frames (128×64) and a WebGL renderer keep the extension light. Nothing runs while the video is paused or the tab is in the background.

PRIVATE BY DESIGN
No account, no tracking, no data sent anywhere. Open source (MIT): github.com/amineeww/AmbiTube

Inspired by "Ambient light for YouTube™" by Wessel Kroos (MIT).
AmbiTube is not affiliated with YouTube or Google. YouTube is a trademark of Google LLC.
```

---

## Français

**Description détaillée**

```
Éclairez la pièce autour de vos vidéos.

AmbiTube lit les couleurs sur les bords de la vidéo que vous regardez et les diffuse doucement sur toute la page YouTube — comme les lumières d'ambiance d'une télévision, directement dans votre navigateur.

UN SEUL BOUTON
Une petite ampoule apparaît dans le lecteur, à côté de la lecture automatique. Un clic ouvre un menu simple, dans le style de YouTube.

DES PRESETS, PAS 80 CURSEURS
• Trois ambiances prêtes à l'emploi : Subtil, Équilibré et Intense.
• Quatre curseurs en direct : intensité, flou, étendue et couleurs.
• Enregistrez jusqu'à 6 presets personnels. Les options avancées restent discrètes.

S'ADAPTE À VOTRE FAÇON DE REGARDER
• Mode normal : la lumière remplit la page et s'estompe avec la distance.
• Mode cinéma et plein écran : les bandes noires autour de la vidéo (écrans ultrawide, films en 21:9) s'illuminent jusqu'aux bords de l'écran.
• Thème sombre : un halo profond. Thème clair : une teinte pastel qui garde le texte lisible.

MODE IMMERSIF
Assombrit les vidéos suggérées jusqu'au survol, pour que rien ne vous détourne de ce que vous regardez.

LÉGER POUR VOTRE ORDINATEUR
De toutes petites images (128×64) et un rendu WebGL rendent l'extension très légère. Rien ne tourne quand la vidéo est en pause ou l'onglet en arrière-plan.

RESPECT DE LA VIE PRIVÉE
Aucun compte, aucun pistage, aucune donnée envoyée. Code source ouvert (MIT) : github.com/amineeww/AmbiTube

Inspiré de « Ambient light for YouTube™ » de Wessel Kroos (MIT).
AmbiTube n'est pas affilié à YouTube ni à Google. YouTube est une marque de Google LLC.
```

---

## Privacy tab (dashboard)

**Single purpose**

```
AmbiTube adds an ambient light effect around YouTube videos: it extends the colors of the video over the YouTube page, with a simple menu to adjust the effect.
```

**Permission justification — `storage`**

```
Saves the user's settings (on/off, immersive mode, presets and slider values) so they persist between videos and browser sessions.
```

**Permission justification — host access (www.youtube.com, via content scripts)**

```
Needed to add the light bulb button to the YouTube player and to draw the ambient light on YouTube watch pages. The extension runs on no other site.
```

**Remote code:** No, the extension does not use remote code.

**Data usage:** the extension collects none of the listed data types. Tick the three certifications (no sale, no unrelated use, no creditworthiness use).

**Privacy policy URL**

```
https://github.com/amineeww/AmbiTube/blob/main/PRIVACY.md
```
