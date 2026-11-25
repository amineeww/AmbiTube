# Publier AmbiTube

Guide pas à pas pour le **Chrome Web Store**, puis **Firefox** et **Microsoft Edge**. Le même `.zip` sert pour les trois boutiques. Tout ce qu'il faut est dans ce dossier `store/`.

---

# Chrome Web Store

## 1. Créer le compte développeur (une seule fois)

1. Ouvre le [tableau de bord développeur](https://chrome.google.com/webstore/devconsole) avec le compte Google qui publiera l'extension. Google conseille une adresse dédiée, car elle ne peut plus être changée ensuite.
2. Accepte le contrat développeur et paie les frais d'inscription (paiement unique de 5 $).
3. Dans **Compte**, renseigne l'adresse e-mail de contact et vérifie-la.

## 2. Préparer le paquet

Depuis la racine du dépôt :

```bash
./scripts/package.sh
```

Le script crée `dist/AmbiTube-<version>.zip` (le contenu du dossier `extension/`).

## 3. Créer la fiche

Dans le tableau de bord : **Nouvel élément** → envoie le `.zip`.

### Onglet « Fiche de l'article » (Store listing)

| Champ | Quoi mettre |
| --- | --- |
| Description | Texte anglais de [`LISTING.md`](LISTING.md) ; ajoute ensuite la langue **Français** avec le texte français |
| Catégorie | Celle qui te semble la plus proche dans la liste proposée |
| Langue | Anglais, puis ajoute le français (l'extension est traduite) |
| Icône de la boutique | [`images/store-icon-128.png`](images/store-icon-128.png) |
| Petite tuile (440×280) | [`images/promo-small-440x280.png`](images/promo-small-440x280.png) |
| Tuile « marquee » (1400×560) | [`images/marquee-1400x560.png`](images/marquee-1400x560.png) (facultatif) |
| Captures d'écran | À faire toi-même, voir ci-dessous |
| Site web / assistance | `https://github.com/amineeww/AmbiTube` |

### Captures d'écran (1280×800, de 1 à 5)

Le plus simple : fenêtre Chrome redimensionnée, puis capture.

1. Mode normal, lumière **Équilibré** sur une vidéo colorée.
2. Le menu ouvert (presets + curseurs).
3. Mode cinéma sur écran large, bandes latérales éclairées.
4. Mode immersif (miniatures assombries).
5. Thème clair (teinte pastel).

Conseil : choisis des vidéos sous licence libre (par exemple les films de la Blender Foundation) pour éviter tout souci de droits sur les images.

### Onglet « Confidentialité »

Copie les textes de la section *Privacy tab* de [`LISTING.md`](LISTING.md) : objectif unique, justification des autorisations, absence de code distant, utilisation des données, et l'URL de la politique de confidentialité.

### Onglet « Distribution »

Gratuit, public, tous les pays.

## 4. Envoyer pour examen

**Envoyer pour examen.** L'examen prend généralement de quelques jours à quelques semaines. Tu reçois un e-mail à la fin.

## Mises à jour

1. Augmente `version` dans `extension/manifest.json` (ex. `1.0.1`) et complète `CHANGELOG.md`.
2. Relance `./scripts/package.sh`.
3. Dans le tableau de bord : **Package** → **Importer un nouveau package**, puis renvoie pour examen.

---

# Firefox (addons.mozilla.org)

Gratuit. Le manifeste contient déjà l'identifiant Firefox (`ambitube@amineeww`) et la déclaration « aucune donnée collectée » exigée par Mozilla.

1. Crée un compte sur [addons.mozilla.org](https://addons.mozilla.org) puis ouvre le [Developer Hub](https://addons.mozilla.org/developers/).
2. **Soumettre un nouveau module** → « Sur ce site » → envoie le même `dist/AmbiTube-<version>.zip`.
3. Question sur le code source : réponds **non** (le code n'est ni minifié ni compilé).
4. Fiche : reprends les textes de [`LISTING.md`](LISTING.md). Le **résumé** (250 caractères max) est dans la section *Firefox*.
5. Catégorie, licence **MIT**, politique de confidentialité : l'URL de `PRIVACY.md`.
6. Envoie. Les vérifications automatiques sont immédiates, l'examen humain peut suivre.

Avant d'envoyer, tu peux vérifier le paquet comme le fait Mozilla :

```bash
npx addons-linter extension/
```

---

# Microsoft Edge Add-ons (facultatif)

Gratuit. Les utilisateurs d'Edge peuvent déjà installer AmbiTube depuis le Chrome Web Store, mais une fiche Edge le rend plus visible.

1. Inscris-toi au [Partner Center](https://partner.microsoft.com/dashboard/microsoftedge/overview) (programme « Microsoft Edge »).
2. **Créer une extension** → envoie le même `.zip`.
3. Reprends les textes, images et réponses de confidentialité de [`LISTING.md`](LISTING.md).
