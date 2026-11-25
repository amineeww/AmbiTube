# Publier AmbiTube sur le Chrome Web Store

Guide pas à pas. Tout ce qu'il faut est dans ce dossier `store/`.

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
