# Changelog

All notable changes to AmbiTube are documented here.
This project follows [Semantic Versioning](https://semver.org/).

## [1.1.0] — 2026-11-25

### Added
- **Firefox support (142+).** The same package now works in Firefox:
  Firefox ID and the "no data collected" declaration required by Mozilla
  in the manifest, promise-based `browser.*` APIs when available, and
  Firefox styles for the menu sliders. Passes Mozilla's `addons-linter`
  with no error or warning.
- Publishing guide for Firefox (addons.mozilla.org) and Microsoft Edge
  Add-ons, and Firefox summaries (EN/FR) in `store/LISTING.md`.

## [1.0.0] — 2026-11-25

First public release.

### Added
- **Light theme support.** On light pages the light becomes a soft pastel
  tint of the video colors that fades to white, with a white text halo, so
  dark text stays readable. Fullscreen always uses the dark rendering.
- **One-time tips** pointing at the light bulb: a welcome bubble on first
  run, and a tip about the dark theme the first time the light theme is used.
- Privacy policy (`PRIVACY.md`, EN/FR).
- Chrome Web Store kit in `store/`: listing texts (EN/FR), privacy answers,
  padded store icon, promo tiles (440×280, 1400×560) and a publishing guide.
- `scripts/package.sh` builds the store `.zip`.

### Changed
- No frame is captured while the tab is in the background.
- The menu notice in light theme now recommends the dark theme instead of
  saying the effect is unavailable.

### Dropped
- Detection of black bars burned into the video: on dark scenes it can
  flicker and make the light inconsistent.

## [0.4.0] — 2026-11-25

### Added
- **Fullscreen support.** The light moves inside the fullscreen element, so
  the black bars of an ultrawide screen (or of a 21:9 film on a 16:9
  screen) are lit by the colors of the video edges.

### Changed
- **The light adapts to the viewing mode.** In windowed view it spreads over
  the page and fades with distance; in theater view and fullscreen the space
  around the video is treated as part of the screen and stays lit up to the
  screen edges (much brighter side bars on wide screens).
- After a view change (theater, fullscreen, window resize) the light is
  re-aligned on every frame for a moment, even while the video is paused,
  so it follows YouTube's multi-step relayout without lag.

## [0.3.0] — 2026-11-25

### Added
- Settings menu opened by the light bulb, styled like YouTube's own menus:
  - main on/off switch and **immersive mode** switch;
  - presets *Subtle · Balanced · Intense*, a *Custom* state as soon as a
    slider moves, and up to 6 saved presets of your own (deletable);
  - four main sliders (intensity, blur, spread, colors) applied live;
  - *Advanced* section (smoothing, edge depth) and a *Reset* button;
  - keyboard friendly: Escape closes it, YouTube shortcuts (space, K,
    arrows…) are not triggered while using the menu; clicking outside closes it.
- Immersive mode: suggested thumbnails and their titles are dimmed until
  hovered; the description box becomes transparent.
- Notice in the menu when YouTube uses the light theme (support coming later).

### Changed
- Settings are applied instantly but saved in batches, to stay within
  Chrome's sync storage write limits while dragging sliders.

## [0.2.0] — 2026-11-25

### Added
- Ambient light over the whole watch page, in default and theater view.
  - WebGL renderer: the colors of the video border are cast outwards along
    rays from the center, then fade with distance.
  - Cheap by design: frames are downscaled to 128×64, blurred at 1/6 of the
    viewport size and scaled up (≈0.04 ms of CPU work per frame).
  - Temporal smoothing to avoid flicker on fast cuts.
  - One capture per decoded video frame (`requestVideoFrameCallback`),
    no work while the video is paused.
- YouTube backgrounds become transparent while the light is on (masthead,
  page, theater container, player), so the side bars of theater view on
  wide screens are lit too.
- YouTube's native ambient mode is hidden while AmbiTube is on.
- Soft text shadows keep titles, descriptions and comments readable on very
  bright light.
- The light follows scrolling, resizing and theater view, turns off outside
  `/watch`, in the miniplayer and in fullscreen.

### Notes
- Light theme and fullscreen on ultrawide screens come in later steps.

## [0.1.0] — 2026-11-25

### Added
- Manifest V3 extension skeleton with English and French translations.
- Light bulb button in the YouTube player controls, next to the autoplay toggle
  (supports the 2025 and the previous player designs).
- On/off state saved with `chrome.storage.sync` and shared across tabs.
- Button survives YouTube's in-page navigation and theater mode switches.
