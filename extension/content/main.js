'use strict';

/**
 * Entry point. YouTube is a single-page app: changing video does not reload
 * the page, and the player controls can be re-rendered at any time.
 * We therefore (re)check the player after every navigation and watch its
 * controls for changes.
 */
(() => {
  const { PlayerButton, AmbientLight, settings, sleep, log } = globalThis.AmbiTube;

  let observedControls = null;
  const controlsObserver = new MutationObserver(() => scheduleEnsure());

  const getPlayer = () => document.querySelector('#movie_player');

  /** Adds the button if missing. Returns true when everything is in place. */
  function ensure() {
    const player = getPlayer();
    if (!player) return false;

    const ok = PlayerButton.ensure(player);
    AmbientLight.update();
    const button = player.querySelector('.ambitube-button');
    if (button) globalThis.AmbiTube.Tips.maybeShow(button, player);

    const controls = player.querySelector('.ytp-right-controls');
    if (controls && controls !== observedControls) {
      controlsObserver.disconnect();
      controlsObserver.observe(controls, { childList: true, subtree: true });
      observedControls = controls;
    }
    return ok;
  }

  let ensureScheduled = false;
  function scheduleEnsure() {
    if (ensureScheduled) return;
    ensureScheduled = true;
    requestAnimationFrame(() => {
      ensureScheduled = false;
      ensure();
    });
  }

  /** The player can take a few seconds to appear; retry for up to ~30 s. */
  let waitToken = 0;
  async function waitForPlayer() {
    const token = ++waitToken;
    for (let attempt = 0; attempt < 60; attempt++) {
      if (token !== waitToken) return; // A newer navigation took over.
      if (ensure()) return;
      await sleep(500);
    }
    log('Player controls not found on this page.');
  }

  async function init() {
    await settings.load();
    settings.onChange(() => PlayerButton.refreshAll());

    document.addEventListener('yt-navigate-finish', waitForPlayer);
    AmbientLight.init();
    waitForPlayer();
    log('Ready');
  }

  init();
})();
