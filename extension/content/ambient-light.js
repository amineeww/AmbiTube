'use strict';

/**
 * AmbientLight — decides when the light is shown and keeps it in sync with
 * the video: captures frames, follows the video's position (scroll, theater
 * view, resizing) and applies the user's settings.
 */
(() => {
  const { settings, GlowRenderer, log, warn } = globalThis.AmbiTube;

  const ACTIVE_CLASS = 'ambitube-active';
  /** The light canvas is rendered at 1/SCALE of the viewport, then scaled up. */
  const SCALE = 6;

  const state = {
    active: false,
    video: null,
    canvas: null,
    renderer: null,
    midCanvas: null,
    midCtx: null,
    frameCanvas: null,
    frameCtx: null,
    hasFrame: false,
    area: [0, 0, 0, 0],
    frameRequest: 0,
    renderQueued: false,
    resizeObserver: null,
  };

  // ---------------------------------------------------------------------------
  // Conditions
  // ---------------------------------------------------------------------------

  const getVideo = () => document.querySelector('#movie_player video.html5-main-video');

  const isDarkTheme = () => document.documentElement.hasAttribute('dark');

  function shouldBeActive() {
    if (!settings.get('enabled')) return false;
    if (location.pathname !== '/watch') return false;
    if (document.fullscreenElement) return false; // Ultrawide support: step 4.
    if (!isDarkTheme()) return false; // Light theme support: step 5.
    if (document.querySelector('ytd-app[miniplayer-is-active]')) return false;
    const video = getVideo();
    return !!video && !!video.closest('ytd-watch-flexy');
  }

  // ---------------------------------------------------------------------------
  // Setup / teardown
  // ---------------------------------------------------------------------------

  function createCanvases() {
    const canvas = document.createElement('canvas');
    canvas.className = 'ambitube-light';
    canvas.setAttribute('aria-hidden', 'true');
    document.body.prepend(canvas);
    state.canvas = canvas;

    try {
      state.renderer = new GlowRenderer(canvas);
    } catch (error) {
      warn('Ambient light unavailable (WebGL)', error);
      canvas.remove();
      state.canvas = null;
      return false;
    }

    // Two-step downscale (video → 512×256 → 128×64) gives clean, stable colors.
    state.midCanvas = document.createElement('canvas');
    state.midCanvas.width = 512;
    state.midCanvas.height = 256;
    state.midCtx = state.midCanvas.getContext('2d', { alpha: false });
    state.midCtx.imageSmoothingQuality = 'medium';

    state.frameCanvas = document.createElement('canvas');
    state.frameCanvas.width = GlowRenderer.FRAME_WIDTH;
    state.frameCanvas.height = GlowRenderer.FRAME_HEIGHT;
    state.frameCtx = state.frameCanvas.getContext('2d', { alpha: false });
    state.frameCtx.imageSmoothingQuality = 'medium';
    return true;
  }

  function start() {
    if (state.active) return;
    if (!state.canvas && !createCanvases()) return;
    state.active = true;
    state.hasFrame = false;
    document.documentElement.classList.add(ACTIVE_CLASS);

    window.addEventListener('scroll', queueRender, { passive: true });
    window.addEventListener('resize', onResize);
    state.resizeObserver = new ResizeObserver(queueRender);

    applySettings();
    attachVideo(getVideo());
    onResize();
    log('Ambient light on');
  }

  function stop() {
    if (!state.active) return;
    state.active = false;
    document.documentElement.classList.remove(ACTIVE_CLASS);
    window.removeEventListener('scroll', queueRender);
    window.removeEventListener('resize', onResize);
    state.resizeObserver?.disconnect();
    state.resizeObserver = null;
    attachVideo(null);
    log('Ambient light off');
  }

  // ---------------------------------------------------------------------------
  // Video tracking
  // ---------------------------------------------------------------------------

  const VIDEO_EVENTS = ['loadeddata', 'seeked', 'play', 'pause', 'emptied'];

  function onVideoEvent() {
    captureAndRender();
    requestFrames();
  }

  function attachVideo(video) {
    const previous = state.video;
    if (previous === video) return;
    if (previous) {
      VIDEO_EVENTS.forEach((type) => previous.removeEventListener(type, onVideoEvent));
      if (state.frameRequest && previous.cancelVideoFrameCallback) {
        previous.cancelVideoFrameCallback(state.frameRequest);
      }
      state.resizeObserver?.unobserve(previous);
    }
    state.frameRequest = 0;
    state.video = video;
    state.hasFrame = false;
    if (!video) return;

    VIDEO_EVENTS.forEach((type) => video.addEventListener(type, onVideoEvent));
    state.resizeObserver?.observe(video);
    captureAndRender();
    requestFrames();
  }

  /** One capture per decoded video frame (no work while paused). */
  function requestFrames() {
    const { video } = state;
    if (!state.active || !video || state.frameRequest) return;
    if (video.paused || video.ended) return;

    if (video.requestVideoFrameCallback) {
      state.frameRequest = video.requestVideoFrameCallback(() => {
        state.frameRequest = 0;
        captureAndRender();
        requestFrames();
      });
    } else {
      state.frameRequest = requestAnimationFrame(() => {
        state.frameRequest = 0;
        captureAndRender();
        requestFrames();
      });
    }
  }

  // ---------------------------------------------------------------------------
  // Rendering
  // ---------------------------------------------------------------------------

  function capture() {
    const { video, midCtx, frameCtx, frameCanvas, midCanvas } = state;
    if (!video || video.readyState < 2 || !video.videoWidth) return false;

    midCtx.drawImage(video, 0, 0, midCanvas.width, midCanvas.height);

    // Blending with the previous frame smooths sudden color changes.
    const smoothing = settings.get('smoothing') / 100;
    frameCtx.globalAlpha = state.hasFrame ? 1 - smoothing * 0.85 : 1;
    frameCtx.drawImage(midCanvas, 0, 0, frameCanvas.width, frameCanvas.height);
    frameCtx.globalAlpha = 1;

    state.renderer.upload(frameCanvas);
    state.hasFrame = true;
    return true;
  }

  function render() {
    const { video, renderer } = state;
    if (!state.active || !video || !renderer || !state.hasFrame) return;

    const rect = video.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    renderer.draw({
      area: state.area,
      video: [rect.left, rect.top, rect.width, rect.height],
      edge: (settings.get('edge') / 100) * 0.5,
      spread: 0.3 + (settings.get('spread') / 100) * 2.4,
      far: 0.25 + (settings.get('spread') / 100) * 0.35,
    });
  }

  function captureAndRender() {
    if (!state.active) return;
    try {
      capture();
      render();
    } catch (error) {
      warn('Render failed', error);
    }
  }

  function queueRender() {
    if (state.renderQueued || !state.active) return;
    state.renderQueued = true;
    requestAnimationFrame(() => {
      state.renderQueued = false;
      render();
    });
  }

  /** Blur radius in CSS px of the final (scaled-up) light. */
  const blurRadius = () => 20 + settings.get('blur') * 1.2;

  /** Sizes the light canvas to cover the viewport plus a margin for the blur. */
  function onResize() {
    const { canvas } = state;
    if (!canvas) return;
    const margin = Math.ceil(blurRadius() * 2);
    const width = window.innerWidth + margin * 2;
    const height = window.innerHeight + margin * 2;

    canvas.width = Math.ceil(width / SCALE);
    canvas.height = Math.ceil(height / SCALE);
    canvas.style.left = `${-margin}px`;
    canvas.style.top = `${-margin}px`;
    canvas.style.width = `${canvas.width}px`;
    canvas.style.height = `${canvas.height}px`;
    canvas.style.transform = `scale(${SCALE})`;
    state.area = [-margin, -margin, canvas.width * SCALE, canvas.height * SCALE];
    render();
  }

  function applySettings() {
    const { canvas } = state;
    if (!canvas) return;
    const blur = blurRadius() / SCALE;
    canvas.style.filter = `blur(${blur.toFixed(2)}px) saturate(${settings.get('saturation')}%)`;
    canvas.style.opacity = String(Math.min(1, settings.get('intensity') / 100));
  }

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  /** Immersive mode (dimmed suggestions) works with or without the light. */
  function updatePageModes() {
    const immersive = !!settings.get('immersive') && location.pathname === '/watch';
    document.documentElement.classList.toggle('ambitube-immersive', immersive);
  }

  /** Starts, stops or refreshes the light depending on the page state. */
  function update() {
    updatePageModes();
    if (!shouldBeActive()) {
      stop();
      return;
    }
    if (!state.active) {
      start();
    } else {
      attachVideo(getVideo());
      queueRender();
    }
  }

  globalThis.AmbiTube.AmbientLight = {
    update,

    init() {
      settings.onChange((changes) => {
        if ('enabled' in changes || 'immersive' in changes) update();
        if ('blur' in changes) onResize();
        applySettings();
        queueRender();
      });

      // Theater view, theme and miniplayer changes are attributes on YouTube's elements.
      const attributeObserver = new MutationObserver(update);
      const watchAttributes = () => {
        attributeObserver.disconnect();
        attributeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['dark'] });
        const app = document.querySelector('ytd-app');
        if (app) attributeObserver.observe(app, { attributes: true, attributeFilter: ['miniplayer-is-active'] });
        const flexy = document.querySelector('ytd-watch-flexy');
        if (flexy) attributeObserver.observe(flexy, { attributes: true, attributeFilter: ['theater', 'fullscreen'] });
      };

      document.addEventListener('fullscreenchange', update);
      document.addEventListener('yt-navigate-finish', () => {
        watchAttributes();
        update();
      });
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden) update();
      });

      watchAttributes();
      update();
    },
  };
})();
