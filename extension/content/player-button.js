'use strict';

/**
 * The light bulb button shown in the YouTube player controls,
 * right before the autoplay toggle. A click opens the AmbiTube menu.
 */
(() => {
  const { t, settings } = globalThis.AmbiTube;

  const SVG_NS = 'http://www.w3.org/2000/svg';
  const BUTTON_CLASS = 'ambitube-button';

  // Material Icons "lightbulb" (Apache License 2.0, Google).
  const ICON_ON =
    'M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7z';
  // Material Icons "lightbulb_outline" (Apache License 2.0, Google).
  const ICON_OFF =
    'M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7zm2.85 11.1l-.85.6V16h-4v-2.3l-.85-.6C7.8 12.16 7 10.63 7 9c0-2.76 2.24-5 5-5s5 2.24 5 5c0 1.63-.8 3.16-2.15 4.1z';

  /**
   * YouTube ships two control bar designs: the 2025 one uses 24×24 icons,
   * the older one draws 36×36 icons that fill the button.
   */
  const usesLegacyIcons = (player) =>
    !!player.querySelector('.ytp-settings-button svg[viewBox="0 0 36 36"]');

  function createButton(player) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `ytp-button ${BUTTON_CLASS}`;

    // Built with DOM APIs: YouTube enforces Trusted Types, innerHTML is refused.
    const svg = document.createElementNS(SVG_NS, 'svg');
    if (usesLegacyIcons(player)) {
      svg.setAttribute('viewBox', '-6 -6 36 36');
      svg.setAttribute('width', '100%');
      svg.setAttribute('height', '100%');
    } else {
      svg.setAttribute('viewBox', '0 0 24 24');
      svg.setAttribute('width', '24');
      svg.setAttribute('height', '24');
    }
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');

    const path = document.createElementNS(SVG_NS, 'path');
    path.setAttribute('class', 'ambitube-button__icon');
    svg.append(path);

    // Own tooltip element: YouTube already uses the button's ::before/::after.
    const tooltip = document.createElement('span');
    tooltip.className = 'ambitube-tooltip';
    tooltip.setAttribute('aria-hidden', 'true');

    button.append(svg, tooltip);

    button.setAttribute('aria-haspopup', 'dialog');
    button.setAttribute('aria-expanded', 'false');
    button.addEventListener('click', (event) => {
      // Keep the click away from the player (it would toggle play/pause).
      event.preventDefault();
      event.stopPropagation();
      globalThis.AmbiTube.Menu.toggle(button);
    });

    render(button);
    return button;
  }

  /** Reflects the current state (icon, label, tooltip) on the button. */
  function render(button) {
    const enabled = !!settings.get('enabled');
    const label = t(enabled ? 'buttonLabelOn' : 'buttonLabelOff');
    button.querySelector('.ambitube-button__icon')?.setAttribute('d', enabled ? ICON_ON : ICON_OFF);
    button.setAttribute('aria-pressed', String(enabled));
    button.setAttribute('aria-label', label);
    const tooltip = button.querySelector('.ambitube-tooltip');
    if (tooltip) tooltip.textContent = label;
  }

  /** Where the button goes: before autoplay, else before settings, else first. */
  function findSlot(player) {
    const controls = player.querySelector('.ytp-right-controls');
    if (!controls) return null;
    const anchor =
      controls.querySelector('.ytp-autonav-toggle, [data-tooltip-target-id="ytp-autonav-toggle-button"]') ||
      controls.querySelector('.ytp-subtitles-button') ||
      controls.querySelector('.ytp-settings-button');
    if (anchor) return { parent: anchor.parentNode, before: anchor };
    return { parent: controls, before: controls.firstChild };
  }

  globalThis.AmbiTube.PlayerButton = {
    /**
     * Makes sure the player has exactly one AmbiTube button.
     * Returns true when the button is in place.
     */
    ensure(player) {
      const existing = player.querySelectorAll(`.${BUTTON_CLASS}`);
      if (existing.length === 1) return true;
      existing.forEach((el) => el.remove());

      const slot = findSlot(player);
      if (!slot) return false;
      slot.parent.insertBefore(createButton(player), slot.before);
      return true;
    },

    /** Re-renders every button on the page (e.g. after a settings change). */
    refreshAll() {
      document.querySelectorAll(`.${BUTTON_CLASS}`).forEach(render);
    },
  };
})();
