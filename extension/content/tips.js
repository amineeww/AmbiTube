'use strict';

/**
 * Tips — one-time bubbles pointing at the light bulb:
 * - a welcome bubble the first time AmbiTube runs;
 * - a tip about the dark theme the first time YouTube uses the light theme.
 * Each bubble is shown once, then remembered in the settings.
 */
(() => {
  const { t, settings } = globalThis.AmbiTube;

  const SHOW_DELAY = 1500; // Let the page settle before drawing attention.
  let bubble = null;
  let showTimer = 0;
  let resizeObserver = null;

  const isDarkTheme = () => document.documentElement.hasAttribute('dark');

  /** Which bubble (if any) should be shown now. */
  function pendingTip() {
    if (!settings.get('welcomeShown')) {
      return { welcome: true, darkTip: !isDarkTheme() };
    }
    if (!isDarkTheme() && !settings.get('darkTipShown')) {
      return { welcome: false, darkTip: true };
    }
    return null;
  }

  function dismiss() {
    clearTimeout(showTimer);
    showTimer = 0;
    if (!bubble) return;
    const { welcome, darkTip } = bubble.ambitubeTip;
    bubble.remove();
    bubble = null;
    resizeObserver?.disconnect();
    resizeObserver = null;
    settings.setMany({
      ...(welcome && { welcomeShown: true }),
      ...(darkTip && { darkTipShown: true }),
    });
  }

  function position(button, player) {
    if (!bubble) return;
    const playerRect = player.getBoundingClientRect();
    const buttonRect = button.getBoundingClientRect();
    const controls = player.querySelector('.ytp-chrome-bottom');
    const bottom = controls ? playerRect.bottom - controls.getBoundingClientRect().top + 8 : 66;
    // The arrow sits 24px from the bubble's right edge, under the bulb.
    const right = Math.max(8, playerRect.right - (buttonRect.left + buttonRect.width / 2) - 24);
    bubble.style.bottom = `${Math.round(bottom)}px`;
    bubble.style.right = `${Math.round(right)}px`;
  }

  function show(button, player, tip) {
    const el = document.createElement('div');
    el.className = 'ambitube-bubble';
    el.setAttribute('role', 'status');
    el.ambitubeTip = tip;

    if (tip.welcome) {
      const title = document.createElement('strong');
      title.className = 'ambitube-bubble__title';
      title.textContent = t('welcomeTitle');
      const body = document.createElement('p');
      body.textContent = t('welcomeBody');
      el.append(title, body);
    }
    if (tip.darkTip) {
      const body = document.createElement('p');
      body.textContent = t('darkThemeTip');
      el.append(body);
    }

    const ok = document.createElement('button');
    ok.type = 'button';
    ok.className = 'ambitube-btn ambitube-btn--primary';
    ok.textContent = t('gotIt');
    ok.addEventListener('click', dismiss);
    el.append(ok);

    // Keep clicks and keys away from the player (play/pause, shortcuts).
    for (const type of ['click', 'dblclick', 'mousedown', 'pointerdown', 'keydown']) {
      el.addEventListener(type, (event) => event.stopPropagation());
    }

    bubble = el;
    player.append(el);
    position(button, player);
    // Follow the bulb when the player changes size (theater view, resizing…).
    resizeObserver = new ResizeObserver(() => position(button, player));
    resizeObserver.observe(player);
  }

  globalThis.AmbiTube.Tips = {
    /** Shows the pending tip next to the button, if there is one. */
    maybeShow(button, player) {
      if (bubble || showTimer || location.pathname !== '/watch') return;
      if (!pendingTip()) return;
      showTimer = setTimeout(() => {
        showTimer = 0;
        const tip = pendingTip();
        if (!tip || !button.isConnected || globalThis.AmbiTube.Menu?.isOpen()) return;
        show(button, player, tip);
      }, SHOW_DELAY);
    },

    dismiss,
  };
})();
