/**
 * Brave AdShield for YouTube - Android Mobile Engine
 * Fast-forwarding, instant auto-skip, cosmetic ad removal, and background playback enabler.
 */

(function () {
  'use strict';

  // 1. Enable Background Audio Playback (Prevent YouTube from pausing when minimized)
  try {
    Object.defineProperty(document, 'hidden', { get: () => false, configurable: true });
    Object.defineProperty(document, 'visibilityState', { get: () => 'visible', configurable: true });
    window.addEventListener('visibilitychange', (e) => e.stopImmediatePropagation(), true);
  } catch (err) {}

  let isAdActive = false;
  let originalPlaybackRate = 1.0;

  function getActiveVideo() {
    return document.querySelector('video.html5-main-video') ||
           document.querySelector('#movie_player video') ||
           document.querySelector('video');
  }

  function isAdShowing() {
    const player = document.querySelector('#movie_player') ||
                   document.querySelector('.html5-video-player') ||
                   document.querySelector('ytm-media-item') ||
                   document.querySelector('.player-container');

    if (!player) return false;

    if (player.classList.contains('ad-showing') || player.classList.contains('ad-interrupting')) {
      return true;
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
      '.ytm-skip-ad-button'
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
        originalPlaybackRate = (video.playbackRate !== 16) ? video.playbackRate : 1.0;
      }

      // Mute ad
      video.muted = true;

      // Turbo 16x fast forward & seek to duration
      video.playbackRate = 16.0;
      if (Number.isFinite(video.duration) && video.duration > 0) {
        video.currentTime = video.duration;
      } else {
        video.currentTime = 99999;
      }

      // Instant click skip
      clickSkipButtons();

    } else if (isAdActive && !adShowing && video) {
      isAdActive = false;
      if (video.playbackRate === 16.0) {
        video.playbackRate = originalPlaybackRate || 1.0;
      }
      video.muted = false;
    }
  }

  function neutralizeAntiAdblock() {
    const enforcement = document.querySelectorAll(
      'ytd-enforcement-message-view-model, tp-yt-paper-dialog:has(.ytd-enforcement-message-view-model)'
    );
    enforcement.forEach(el => el.remove());

    const backdrops = document.querySelectorAll('tp-yt-iron-overlay-backdrop');
    backdrops.forEach(el => el.remove());

    const video = getActiveVideo();
    if (video && video.paused && enforcement.length > 0) {
      video.play().catch(() => {});
    }
  }

  function inspect() {
    processVideoAd();
    neutralizeAntiAdblock();
  }

  setInterval(inspect, 50);

  const observer = new MutationObserver(() => inspect());
  const target = document.body || document.documentElement;
  if (target) {
    observer.observe(target, { childList: true, subtree: true, attributes: true });
  }

  console.log('[BraveTube Android Engine] Activated.');
})();
