/**
 * BraveTube TV & Mobile - Core Injection Engine
 * 16x Turbo ad-skipping, TV remote D-Pad bridge, anti-adblock immunity, and background play.
 */

(function () {
  'use strict';

  // 1. Enable Background Audio Playback (Screen-off / minimize play)
  try {
    Object.defineProperty(document, 'hidden', { get: () => false, configurable: true });
    Object.defineProperty(document, 'visibilityState', { get: () => 'visible', configurable: true });
    window.addEventListener('visibilitychange', (e) => e.stopImmediatePropagation(), true);
  } catch (err) {}

  let isAdActive = false;
  let originalPlaybackRate = 1.0;
  let originalMuted = false;

  function getActiveVideo() {
    return document.querySelector('video.html5-main-video') ||
           document.querySelector('#movie_player video') ||
           document.querySelector('.html5-video-player video') ||
           document.querySelector('video');
  }

  function isAdShowing() {
    const player = document.querySelector('#movie_player') ||
                   document.querySelector('.html5-video-player') ||
                   document.querySelector('ytm-media-item') ||
                   document.querySelector('.player-container');

    if (player) {
      if (player.classList.contains('ad-showing') || player.classList.contains('ad-interrupting')) {
        return true;
      }
      const adModule = player.querySelector('.ytp-ad-player-overlay, .ytp-ad-text, .ytp-ad-module');
      if (adModule && adModule.children.length > 0) {
        return true;
      }
    }

    const adBadge = document.querySelector('.ytp-ad-text, .ytp-ad-preview-container, .ytm-ad-badge');
    if (adBadge && adBadge.offsetParent !== null) {
      return true;
    }

    return false;
  }

  function clickSkipButtons() {
    const selectors = [
      '.ytp-skip-ad-button',
      '.ytp-ad-skip-button',
      '.ytp-ad-skip-button-modern',
      '.ytp-ad-skip-button-text',
      '.ytp-ad-overlay-close-button',
      'button.ytp-ad-skip-button-modern',
      '.ytp-ad-skip-button-slot button',
      '.videoAdUiSkipButton',
      '.ytm-skip-ad-button',
      '.ytp-ad-skip-button-container button'
    ];

    for (const s of selectors) {
      const btn = document.querySelector(s);
      if (btn && btn.offsetParent !== null) {
        btn.click();
        return true;
      }
    }
    return false;
  }

  function processVideoAd() {
    const video = getActiveVideo();
    const adShowing = isAdShowing();

    if (adShowing && video) {
      if (!isAdActive) {
        isAdActive = true;
        originalPlaybackRate = (video.playbackRate !== 16.0) ? video.playbackRate : 1.0;
        originalMuted = video.muted;
      }

      // 1. Mute ad immediately to eliminate audio pops
      video.muted = true;

      // 2. Accelerate playback rate to 16x (Chromium ceiling)
      video.playbackRate = 16.0;

      // 3. Jump directly to duration
      if (Number.isFinite(video.duration) && video.duration > 0) {
        video.currentTime = video.duration;
      } else {
        video.currentTime = 99999;
      }

      // 4. Click any visible skip button
      clickSkipButtons();

    } else if (isAdActive && !adShowing && video) {
      isAdActive = false;

      // Restore user playback rate and volume
      if (video.playbackRate === 16.0) {
        video.playbackRate = originalPlaybackRate || 1.0;
      }
      if (!originalMuted) {
        video.muted = false;
      }
    }
  }

  function neutralizeAntiAdblock() {
    const enforcement = document.querySelectorAll(
      'ytd-enforcement-message-view-model, tp-yt-paper-dialog:has(.ytd-enforcement-message-view-model), tp-yt-paper-dialog:has(#feedback)'
    );
    enforcement.forEach(el => el.remove());

    const backdrops = document.querySelectorAll('tp-yt-iron-overlay-backdrop');
    backdrops.forEach(el => el.remove());

    document.body.style.overflow = 'hidden';

    const video = getActiveVideo();
    if (video && video.paused && enforcement.length > 0) {
      video.play().catch(() => {});
    }
  }

  // High frequency ad inspection loop (every 40ms)
  function inspect() {
    processVideoAd();
    neutralizeAntiAdblock();
  }

  setInterval(inspect, 40);

  const observer = new MutationObserver(() => inspect());
  const target = document.body || document.documentElement;
  if (target) {
    observer.observe(target, { childList: true, subtree: true, attributes: true });
  }

  // 2. Synthetic TV Remote Navigation Bridge (for 10-foot YouTube Leanback interface)
  window.BraveTubeRemote = {
    dispatchKey: function (key, keyCode) {
      const activeEl = document.activeElement || document.body;
      const opts = {
        key: key,
        code: key,
        keyCode: keyCode,
        which: keyCode,
        bubbles: true,
        cancelable: true,
        view: window
      };
      activeEl.dispatchEvent(new KeyboardEvent('keydown', opts));
      activeEl.dispatchEvent(new KeyboardEvent('keyup', opts));
    }
  };

  console.log('[BraveTube Engine] Activated - 16x Turbo Skip & TV Remote Bridge ready.');
})();
