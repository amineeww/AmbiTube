# Changelog

All notable changes to AmbiTube are documented here.
This project follows [Semantic Versioning](https://semver.org/).

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
