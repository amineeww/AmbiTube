'use strict';

/**
 * AmbiTube core: shared namespace, translations, settings and presets.
 * Loaded first; the other content scripts read from `globalThis.AmbiTube`.
 */
(() => {
  const AmbiTube = (globalThis.AmbiTube = globalThis.AmbiTube || {});

  AmbiTube.log = (...args) => console.debug('[AmbiTube]', ...args);
  AmbiTube.warn = (...args) => console.warn('[AmbiTube]', ...args);

  /** Translated string from _locales (falls back to the key). */
  AmbiTube.t = (key, substitutions) => {
    try {
      return chrome.i18n.getMessage(key, substitutions) || key;
    } catch {
      return key; // Extension was reloaded or removed: keep the page working.
    }
  };

  AmbiTube.sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  // ---------------------------------------------------------------------------
  // Presets
  // ---------------------------------------------------------------------------

  /** Settings that make up a "look" (what a preset stores). */
  const LOOK_KEYS = Object.freeze(['intensity', 'blur', 'spread', 'saturation', 'smoothing', 'edge']);

  /** Slider ranges, shared by the menu and the validation of stored values. */
  const RANGES = Object.freeze({
    intensity: { min: 10, max: 100, step: 1 },
    blur: { min: 0, max: 100, step: 1 },
    spread: { min: 0, max: 100, step: 1 },
    saturation: { min: 50, max: 200, step: 5 },
    smoothing: { min: 0, max: 100, step: 1 },
    edge: { min: 5, max: 50, step: 1 },
  });

  const BUILT_IN_PRESETS = Object.freeze([
    {
      id: 'subtle',
      labelKey: 'presetSubtle',
      values: { intensity: 65, blur: 75, spread: 25, saturation: 100, smoothing: 65, edge: 20 },
    },
    {
      id: 'balanced',
      labelKey: 'presetBalanced',
      values: { intensity: 100, blur: 50, spread: 50, saturation: 120, smoothing: 50, edge: 20 },
    },
    {
      id: 'intense',
      labelKey: 'presetIntense',
      values: { intensity: 100, blur: 35, spread: 85, saturation: 145, smoothing: 30, edge: 15 },
    },
  ]);

  const MAX_CUSTOM_PRESETS = 6;

  // ---------------------------------------------------------------------------
  // Settings
  // ---------------------------------------------------------------------------

  const DEFAULTS = Object.freeze({
    enabled: true,
    immersive: false, // Dims suggested thumbnails on the watch page.
    preset: 'balanced', // Id of the active preset, or 'custom'.
    customPresets: [], // [{ id, name, values }]
    ...BUILT_IN_PRESETS[1].values,
  });

  const data = structuredClone(DEFAULTS);
  const listeners = new Set();
  const same = (a, b) => a === b || JSON.stringify(a) === JSON.stringify(b);

  const notify = (changes) => {
    for (const listener of listeners) {
      try {
        listener(changes);
      } catch (error) {
        AmbiTube.warn('Settings listener failed', error);
      }
    }
  };

  // chrome.storage.sync allows ~120 writes per minute: slider moves are
  // applied instantly in memory and saved together once the user pauses.
  let pending = {};
  let saveTimer = 0;
  const flush = async () => {
    clearTimeout(saveTimer);
    saveTimer = 0;
    const toSave = pending;
    pending = {};
    if (!Object.keys(toSave).length) return;
    try {
      await chrome.storage.sync.set(toSave);
    } catch (error) {
      AmbiTube.warn('Could not save settings', error);
    }
  };
  const scheduleSave = (values) => {
    Object.assign(pending, values);
    clearTimeout(saveTimer);
    saveTimer = setTimeout(flush, 400);
  };
  window.addEventListener('pagehide', flush);

  const settings = {
    DEFAULTS,
    LOOK_KEYS,
    RANGES,
    BUILT_IN_PRESETS,
    MAX_CUSTOM_PRESETS,

    /** Loads the saved settings (synced across the user's Chrome profile). */
    async load() {
      try {
        Object.assign(data, await chrome.storage.sync.get(DEFAULTS));
      } catch (error) {
        AmbiTube.warn('Could not load settings, using defaults', error);
      }
      return structuredClone(data);
    },

    get(key) {
      return data[key];
    },

    /** Current values of the look (intensity, blur…). */
    look() {
      return Object.fromEntries(LOOK_KEYS.map((key) => [key, data[key]]));
    },

    /** Changes several settings at once (one notification, one save). */
    setMany(values) {
      const changes = {};
      for (const [key, value] of Object.entries(values)) {
        if (!(key in DEFAULTS) || same(data[key], value)) continue;
        data[key] = structuredClone(value);
        changes[key] = data[key];
      }
      if (!Object.keys(changes).length) return;
      notify(changes);
      scheduleSave(changes);
    },

    set(key, value) {
      this.setMany({ [key]: value });
    },

    /** Subscribes to changes; returns an unsubscribe function. */
    onChange(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },

    // -- Presets --------------------------------------------------------------

    /** Built-in presets first, then the user's own. */
    allPresets() {
      return [
        ...BUILT_IN_PRESETS.map((preset) => ({ ...preset, builtIn: true })),
        ...data.customPresets.map((preset) => ({ ...preset, builtIn: false })),
      ];
    },

    applyPreset(id) {
      const preset = this.allPresets().find((p) => p.id === id);
      if (preset) this.setMany({ ...preset.values, preset: id });
    },

    /** Changes one value of the look; the preset becomes "custom". */
    setLookValue(key, value) {
      this.setMany({ [key]: value, preset: 'custom' });
    },

    /** Saves the current look as a new preset and selects it. */
    saveCustomPreset(name) {
      const presets = data.customPresets.slice(-(MAX_CUSTOM_PRESETS - 1));
      const id = `custom-${Date.now().toString(36)}`;
      presets.push({ id, name: name.trim().slice(0, 24), values: this.look() });
      this.setMany({ customPresets: presets, preset: id });
      return id;
    },

    deleteCustomPreset(id) {
      const presets = data.customPresets.filter((p) => p.id !== id);
      this.setMany({ customPresets: presets, preset: data.preset === id ? 'custom' : data.preset });
    },

    /** Back to the "Balanced" look (keeps on/off, immersive mode and presets). */
    resetLook() {
      this.applyPreset('balanced');
    },
  };

  AmbiTube.settings = settings;

  // Keep every open YouTube tab in sync when a setting changes elsewhere.
  try {
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area !== 'sync') return;
      const updated = {};
      for (const [key, { newValue }] of Object.entries(changes)) {
        if (!(key in DEFAULTS) || key in pending) continue;
        const value = newValue === undefined ? structuredClone(DEFAULTS[key]) : newValue;
        if (same(data[key], value)) continue;
        data[key] = value;
        updated[key] = value;
      }
      if (Object.keys(updated).length) notify(updated);
    });
  } catch (error) {
    AmbiTube.warn('Could not watch settings changes', error);
  }
})();
