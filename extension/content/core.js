'use strict';

/**
 * AmbiTube core: shared namespace, translations and settings storage.
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
  // Settings
  // ---------------------------------------------------------------------------

  // Values of the "Balanced" look. Sliders use 0–100 (or %) for readability.
  const DEFAULTS = Object.freeze({
    enabled: true,
    intensity: 100, // Overall strength of the light (%).
    blur: 50, // Softness (0–100).
    spread: 50, // How far the light reaches before fading (0–100).
    saturation: 120, // Color vividness (%).
    smoothing: 50, // Smooths fast color changes (0 = instant, 100 = slow).
    edge: 20, // Depth of the video border sampled for the colors (%).
  });

  const data = { ...DEFAULTS };
  const listeners = new Set();

  const notify = (changes) => {
    for (const listener of listeners) {
      try {
        listener(changes);
      } catch (error) {
        AmbiTube.warn('Settings listener failed', error);
      }
    }
  };

  AmbiTube.settings = {
    DEFAULTS,

    /** Loads the saved settings (synced across the user's Chrome profile). */
    async load() {
      try {
        Object.assign(data, await chrome.storage.sync.get(DEFAULTS));
      } catch (error) {
        AmbiTube.warn('Could not load settings, using defaults', error);
      }
      return { ...data };
    },

    get(key) {
      return data[key];
    },

    async set(key, value) {
      if (data[key] === value) return;
      data[key] = value;
      notify({ [key]: value });
      try {
        await chrome.storage.sync.set({ [key]: value });
      } catch (error) {
        AmbiTube.warn(`Could not save setting "${key}"`, error);
      }
    },

    /** Subscribes to changes; returns an unsubscribe function. */
    onChange(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };

  // Keep every open YouTube tab in sync when a setting changes elsewhere.
  try {
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area !== 'sync') return;
      const updated = {};
      for (const [key, { newValue }] of Object.entries(changes)) {
        if (!(key in DEFAULTS) || data[key] === newValue) continue;
        data[key] = newValue === undefined ? DEFAULTS[key] : newValue;
        updated[key] = data[key];
      }
      if (Object.keys(updated).length) notify(updated);
    });
  } catch (error) {
    AmbiTube.warn('Could not watch settings changes', error);
  }
})();
