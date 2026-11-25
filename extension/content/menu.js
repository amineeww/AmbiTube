'use strict';

/**
 * Menu — the settings panel opened by the light bulb button.
 * Lives inside the player (like YouTube's own settings menu) and is built with
 * DOM APIs only (YouTube enforces Trusted Types: no innerHTML).
 */
(() => {
  const { t, settings } = globalThis.AmbiTube;

  const MAIN_SLIDERS = [
    { key: 'intensity', labelKey: 'settingIntensity', unit: '%' },
    { key: 'blur', labelKey: 'settingBlur', unit: '' },
    { key: 'spread', labelKey: 'settingSpread', unit: '' },
    { key: 'saturation', labelKey: 'settingSaturation', unit: '%' },
  ];
  const ADVANCED_SLIDERS = [
    { key: 'smoothing', labelKey: 'settingSmoothing', unit: '' },
    { key: 'edge', labelKey: 'settingEdge', unit: '%' },
  ];

  // Events that must not reach the player (play/pause on click, keyboard shortcuts…).
  const ISOLATED_EVENTS = [
    'click', 'dblclick', 'mousedown', 'mouseup', 'pointerdown', 'pointerup',
    'keydown', 'keyup', 'keypress', 'wheel', 'contextmenu',
  ];

  /** Tiny element builder: h('div', { className: 'x', onclick }, ...children). */
  function h(tag, props = {}, ...children) {
    const el = document.createElement(tag);
    for (const [key, value] of Object.entries(props)) {
      if (value === undefined || value === null || value === false) continue;
      if (key.startsWith('on')) el.addEventListener(key.slice(2), value);
      else if (key === 'className' || key === 'textContent' || key === 'value' || key === 'type') el[key] = value;
      else el.setAttribute(key, value === true ? '' : value);
    }
    el.append(...children.flat().filter((c) => c !== null && c !== undefined && c !== false));
    return el;
  }

  const state = {
    menu: null,
    button: null,
    player: null,
    unsubscribe: null,
    saving: false,
  };

  // ---------------------------------------------------------------------------
  // Building blocks
  // ---------------------------------------------------------------------------

  function switchRow(key, labelKey, hintKey) {
    const id = `ambitube-switch-${key}`;
    return h(
      'div',
      { className: 'ambitube-menu__row ambitube-menu__row--switch' },
      h(
        'label',
        { className: 'ambitube-menu__label', for: id },
        h('span', { textContent: t(labelKey) }),
        hintKey && h('span', { className: 'ambitube-menu__hint', textContent: t(hintKey) }),
      ),
      h('button', {
        id,
        type: 'button',
        role: 'switch',
        className: 'ambitube-switch',
        'data-setting': key,
        onclick: () => settings.set(key, !settings.get(key)),
      }),
    );
  }

  function sliderRow({ key, labelKey, unit }) {
    const range = settings.RANGES[key];
    const id = `ambitube-slider-${key}`;
    const input = h('input', {
      id,
      type: 'range',
      className: 'ambitube-slider',
      min: range.min,
      max: range.max,
      step: range.step,
      'data-setting': key,
      'data-unit': unit,
      oninput: (event) => settings.setLookValue(key, Number(event.target.value)),
    });
    return h(
      'div',
      { className: 'ambitube-menu__row ambitube-menu__row--slider' },
      h(
        'div',
        { className: 'ambitube-menu__slider-head' },
        h('label', { className: 'ambitube-menu__label', for: id, textContent: t(labelKey) }),
        h('output', { className: 'ambitube-menu__value', for: id, 'data-value-of': key }),
      ),
      input,
    );
  }

  function presetChips() {
    const active = settings.get('preset');
    const chips = settings.allPresets().map((preset) => {
      const name = preset.builtIn ? t(preset.labelKey) : preset.name;
      const select = h('button', {
        type: 'button',
        className: 'ambitube-chip__select',
        'aria-pressed': String(preset.id === active),
        textContent: name,
        onclick: () => settings.applyPreset(preset.id),
      });
      const remove =
        !preset.builtIn &&
        h('button', {
          type: 'button',
          className: 'ambitube-chip__remove',
          'aria-label': `${t('deletePreset')} ${name}`,
          title: `${t('deletePreset')} ${name}`,
          textContent: '×',
          onclick: () => settings.deleteCustomPreset(preset.id),
        });
      return h(
        'div',
        { className: `ambitube-chip${preset.id === active ? ' is-active' : ''}${remove ? ' is-custom' : ''}` },
        select,
        remove,
      );
    });
    if (active === 'custom') {
      chips.push(
        h(
          'div',
          { className: 'ambitube-chip is-active is-placeholder' },
          h('span', { className: 'ambitube-chip__select', textContent: t('presetCustom') }),
        ),
      );
    }
    return chips;
  }

  function footer() {
    if (state.saving) {
      const count = settings.get('customPresets').length + 1;
      const input = h('input', {
        type: 'text',
        className: 'ambitube-input',
        maxlength: 24,
        placeholder: t('presetNamePlaceholder'),
        value: `${t('defaultPresetName')} ${count}`,
        'aria-label': t('presetNamePlaceholder'),
        onkeydown: (event) => {
          if (event.key === 'Enter') confirmSave(input.value);
          if (event.key === 'Escape') {
            event.preventDefault();
            cancelSave();
          }
        },
      });
      requestAnimationFrame(() => input.select());
      return h(
        'form',
        {
          className: 'ambitube-menu__footer ambitube-menu__save-form',
          onsubmit: (event) => {
            event.preventDefault();
            confirmSave(input.value);
          },
        },
        input,
        h('button', { type: 'submit', className: 'ambitube-btn ambitube-btn--primary', textContent: t('save') }),
        h('button', { type: 'button', className: 'ambitube-btn', textContent: t('cancel'), onclick: cancelSave }),
      );
    }

    return h(
      'div',
      { className: 'ambitube-menu__footer' },
      settings.get('preset') === 'custom' &&
        h('button', {
          type: 'button',
          className: 'ambitube-btn ambitube-btn--primary',
          textContent: t('savePreset'),
          onclick: () => {
            state.saving = true;
            renderFooter();
          },
        }),
      h('button', {
        type: 'button',
        className: 'ambitube-btn ambitube-btn--ghost',
        textContent: t('reset'),
        onclick: () => settings.resetLook(),
      }),
    );
  }

  function confirmSave(name) {
    const fallback = `${t('defaultPresetName')} ${settings.get('customPresets').length + 1}`;
    settings.saveCustomPreset(name.trim() || fallback);
    state.saving = false;
    renderFooter();
  }

  function cancelSave() {
    state.saving = false;
    renderFooter();
    state.menu?.querySelector('.ambitube-menu__footer .ambitube-btn')?.focus();
  }

  function build() {
    const menu = h(
      'div',
      {
        className: 'ambitube-menu',
        role: 'dialog',
        'aria-label': t('menuTitle'),
      },
      h(
        'div',
        { className: 'ambitube-menu__section' },
        switchRow('enabled', 'menuAmbientLight'),
        switchRow('immersive', 'menuImmersive', 'menuImmersiveHint'),
        h('p', { className: 'ambitube-menu__notice', textContent: t('menuDarkTip') }),
      ),
      h(
        'div',
        { className: 'ambitube-menu__section' },
        h('div', { className: 'ambitube-menu__heading', textContent: t('menuPresets') }),
        h('div', { className: 'ambitube-menu__chips' }),
      ),
      h('div', { className: 'ambitube-menu__section' }, MAIN_SLIDERS.map(sliderRow)),
      h(
        'details',
        { className: 'ambitube-menu__section ambitube-menu__advanced' },
        h('summary', { className: 'ambitube-menu__heading', textContent: t('menuAdvanced') }),
        ADVANCED_SLIDERS.map(sliderRow),
      ),
      h('div', { className: 'ambitube-menu__footer' }),
    );

    for (const type of ISOLATED_EVENTS) {
      menu.addEventListener(type, (event) => {
        if (type === 'keydown' && event.key === 'Escape' && !event.defaultPrevented) {
          close({ focusButton: true });
        }
        event.stopPropagation();
      });
    }
    return menu;
  }

  // ---------------------------------------------------------------------------
  // Rendering
  // ---------------------------------------------------------------------------

  function renderFooter() {
    const current = state.menu?.querySelector('.ambitube-menu__footer');
    if (current) current.replaceWith(footer());
  }

  function render() {
    const { menu } = state;
    if (!menu) return;

    for (const el of menu.querySelectorAll('.ambitube-switch')) {
      el.setAttribute('aria-checked', String(!!settings.get(el.dataset.setting)));
    }

    menu.classList.toggle('is-light-theme', !document.documentElement.hasAttribute('dark'));
    menu.classList.toggle('is-disabled', !settings.get('enabled'));

    menu.querySelector('.ambitube-menu__chips').replaceChildren(...presetChips());

    for (const input of menu.querySelectorAll('.ambitube-slider')) {
      const key = input.dataset.setting;
      const value = settings.get(key);
      if (Number(input.value) !== value) input.value = value;
      const { min, max } = settings.RANGES[key];
      input.style.setProperty('--fill', `${((value - min) / (max - min)) * 100}%`);
      const output = menu.querySelector(`[data-value-of="${key}"]`);
      if (output) output.textContent = `${value}${input.dataset.unit}`;
    }

    if (!state.saving) renderFooter();
  }

  /** Places the menu above the control bar, aligned right like YouTube's. */
  function position() {
    const { menu, player } = state;
    if (!menu || !player) return;
    const playerRect = player.getBoundingClientRect();
    const controls = player.querySelector('.ytp-chrome-bottom');
    const bottom = controls
      ? Math.round(playerRect.bottom - controls.getBoundingClientRect().top + 3)
      : 62;
    menu.style.bottom = `${bottom}px`;
    menu.style.maxHeight = `${Math.max(160, playerRect.height - bottom - 12)}px`;
  }

  // ---------------------------------------------------------------------------
  // Open / close
  // ---------------------------------------------------------------------------

  function onOutsidePointer(event) {
    const { menu, button } = state;
    if (!menu) return;
    const path = event.composedPath();
    if (path.includes(menu) || path.includes(button)) return;
    close();
  }

  function open(button) {
    const player = button.closest('#movie_player') || document.querySelector('#movie_player');
    if (!player) return;
    close();
    globalThis.AmbiTube.Tips?.dismiss();

    state.button = button;
    state.player = player;
    state.saving = false;
    state.menu = build();
    player.append(state.menu);
    render();
    position();

    button.setAttribute('aria-expanded', 'true');
    button.classList.add('is-open');
    state.unsubscribe = settings.onChange(render);
    document.addEventListener('pointerdown', onOutsidePointer, true);
    window.addEventListener('resize', position);
    document.addEventListener('fullscreenchange', closeSilently);
    document.addEventListener('yt-navigate-start', closeSilently);

    state.menu.querySelector('.ambitube-switch')?.focus({ preventScroll: true });
  }

  function close({ focusButton = false } = {}) {
    if (!state.menu) return;
    state.menu.remove();
    state.menu = null;
    state.unsubscribe?.();
    state.unsubscribe = null;
    document.removeEventListener('pointerdown', onOutsidePointer, true);
    window.removeEventListener('resize', position);
    document.removeEventListener('fullscreenchange', closeSilently);
    document.removeEventListener('yt-navigate-start', closeSilently);
    if (state.button) {
      state.button.setAttribute('aria-expanded', 'false');
      state.button.classList.remove('is-open');
      if (focusButton) state.button.focus({ preventScroll: true });
    }
  }

  function closeSilently() {
    close();
  }

  globalThis.AmbiTube.Menu = {
    toggle(button) {
      if (state.menu && state.button === button) close();
      else open(button);
    },
    close,
    isOpen: () => !!state.menu,
  };
})();
