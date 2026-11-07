/**
 * Brave AdShield for YouTube™ - Content Script
 * High-performance, undetectable ad fast-forwarding, skipping, and anti-adblock bypass.
 */

(function () {
  'use strict';

  // Default configuration
  let config = {
    enabled: true,
    turboSkip: true,
    autoClickSkip: true,
    antiAdblockBypass: true,
    hideBanners: true,
    muteAds: true
  };

  // State trackers
  let isAdActive = false;
  let originalPlaybackRate = 1.0;
  let originalMuted = false;
  let lastAdSkippedTime = 0;
  let pendingStatsUpdate = null;

  // Initialize configuration from storage
  function loadConfig() {
    if (chrome && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get(config, (stored) => {
        if (stored) {
          config = { ...config, ...stored };
        }
      });
    }
  }

  // Listen for configuration updates from popup
  if (chrome && chrome.storage && chrome.storage.onChanged) {
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area === 'local') {
        for (const [key, value] of Object.entries(changes)) {
          if (key in config) {
            config[key] = value.newValue;
          }
        }
      }
    });
  }

  loadConfig();

  /**
   * Update stats in chrome.storage.local (debounced)
   */
  function recordAdSkipped(savedSeconds = 15) {
    const now = Date.now();
    // Avoid double counting same ad within 800ms
    if (now - lastAdSkippedTime < 800) return;
    lastAdSkippedTime = now;

    if (!chrome || !chrome.storage || !chrome.storage.local) return;

    if (pendingStatsUpdate) clearTimeout(pendingStatsUpdate);
    pendingStatsUpdate = setTimeout(() => {
      chrome.storage.local.get({ adsSkipped: 0, timeSavedSeconds: 0 }, (stats) => {
        const newAdsSkipped = (stats.adsSkipped || 0) + 1;
        const newTimeSaved = (stats.timeSavedSeconds || 0) + savedSeconds;
        chrome.storage.local.set({
          adsSkipped: newAdsSkipped,
          timeSavedSeconds: newTimeSaved
        });
      });
    }, 300);
  }

  /**
   * Find the current active HTML5 video element on YouTube
   */
  function getActiveVideo() {
    return document.querySelector('video.html5-main-video') ||
           document.querySelector('#movie_player video') ||
           document.querySelector('video');
  }

  /**
   * Check if an ad is currently playing or showing in the YouTube player
   */
  function isAdShowing() {
    const moviePlayer = document.querySelector('#movie_player') ||
                        document.querySelector('.html5-video-player');

    if (!moviePlayer) return false;

    // Direct ad class checks on player container
    if (
      moviePlayer.classList.contains('ad-showing') ||
      moviePlayer.classList.contains('ad-interrupting')
    ) {
      return true;
    }

    // Check for ad overlays / elements inside player
    const adOverlay = moviePlayer.querySelector(
      '.ytp-ad-player-overlay, .ytp-ad-text, .ytp-ad-preview-container, .ytp-ad-module'
    );
    if (adOverlay && adOverlay.children.length > 0) {
      return true;
    }

    return false;
  }

  /**
   * Attempt to find and click any skip buttons
   */
  function clickSkipButtons() {
    if (!config.autoClickSkip) return false;

    const skipButtonSelectors = [
      '.ytp-skip-ad-button',
      '.ytp-ad-skip-button',
      '.ytp-ad-skip-button-modern',
      '.ytp-ad-skip-button-text',
      '.ytp-ad-overlay-close-button',
      'button.ytp-ad-skip-button-modern',
      '.ytp-ad-skip-button-slot button',
      '.ytp-ad-preview-container button'
    ];

    let clicked = false;
    for (const selector of skipButtonSelectors) {
      const btn = document.querySelector(selector);
      if (btn && btn.offsetParent !== null) { // visible
        btn.click();
        clicked = true;
      }
    }
    return clicked;
  }

  /**
   * Fast-forward and skip current video ad
   */
  function processVideoAd() {
    if (!config.enabled) return;

    const video = getActiveVideo();
    const adPresent = isAdShowing();

    if (adPresent && video) {
      if (!isAdActive) {
        // Just started an ad segment
        isAdActive = true;
        originalPlaybackRate = video.playbackRate !== 16 ? video.playbackRate : 1.0;
        originalMuted = video.muted;
        recordAdSkipped(Math.round(video.duration || 15));
      }

      // 1. Mute ad audio to prevent sudden loud blasts
      if (config.muteAds) {
        video.muted = true;
      }

      // 2. Turbo fast-forward to the end of the ad
      if (config.turboSkip) {
        // Set maximum playback rate (16x is the Chromium HTML5 maximum)
        video.playbackRate = 16.0;

        // Jump directly to end of ad segment
        if (Number.isFinite(video.duration) && video.duration > 0) {
          video.currentTime = video.duration;
        } else {
          video.currentTime = 99999;
        }
      }

      // 3. Immediately click any skip buttons
      clickSkipButtons();

    } else if (isAdActive && !adPresent && video) {
      // Ad just finished, restore user settings
      isAdActive = false;

      // Restore playback rate
      if (video.playbackRate === 16.0) {
        video.playbackRate = originalPlaybackRate || 1.0;
      }

      // Restore muted state
      if (config.muteAds && !originalMuted) {
        video.muted = false;
      }
    }
  }

  /**
   * Neutralize YouTube Anti-Adblock Warning Modals
   */
  function neutralizeAntiAdblock() {
    if (!config.antiAdblockBypass || !config.enabled) return;

    // Detect enforcement dialogs
    const enforcementSelectors = [
      'ytd-enforcement-message-view-model',
      'tp-yt-paper-dialog:has(.ytd-enforcement-message-view-model)',
      'tp-yt-paper-dialog:has(ytd-enforcement-message-view-model)',
      'ytd-popup-container:has(ytd-enforcement-message-view-model)'
    ];

    let foundModal = false;

    for (const selector of enforcementSelectors) {
      try {
        const dialogs = document.querySelectorAll(selector);
        for (const dialog of dialogs) {
          dialog.remove();
          foundModal = true;
        }
      } catch (e) {
        // Ignore CSS selector errors on older engines if :has isn't supported
      }
    }

    // Also check standard dialogs containing adblock text
    const dialogs = document.querySelectorAll('tp-yt-paper-dialog');
    dialogs.forEach((dialog) => {
      const text = dialog.textContent || '';
      if (text.includes('Ad blockers violate YouTube') || text.includes('Ad blockers are not allowed')) {
        dialog.remove();
        foundModal = true;
      }
    });

    if (foundModal) {
      // Remove backdrop overlay that darkens screen
      document.querySelectorAll('tp-yt-iron-overlay-backdrop').forEach(el => el.remove());

      // Restore scrolling if locked
      document.body.style.overflow = 'auto';
      if (document.documentElement) {
        document.documentElement.style.overflow = 'auto';
      }

      // Resume video playback if YouTube paused it
      const video = getActiveVideo();
      if (video && video.paused) {
        video.play().catch(() => {});
      }
    }
  }

  /**
   * Main inspection tick
   */
  function inspect() {
    processVideoAd();
    neutralizeAntiAdblock();
  }

  // 1. High frequency inspection loop (every 50ms)
  // Ensures ads are skipped before user even perceives them
  setInterval(inspect, 50);

  // 2. DOM Mutation Observer for instant reactivity
  const observer = new MutationObserver((mutations) => {
    inspect();
  });

  function startObserver() {
    const target = document.body || document.documentElement;
    if (target) {
      observer.observe(target, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['class', 'src']
      });
    } else {
      setTimeout(startObserver, 50);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startObserver);
  } else {
    startObserver();
  }

  // 3. YouTube SPA Navigation Listener
  window.addEventListener('yt-navigate-finish', () => {
    isAdActive = false;
    inspect();
  });

  window.addEventListener('yt-page-data-updated', () => {
    inspect();
  });

  console.log('[Brave AdShield for YouTube] Engine loaded and protecting your stream.');
})();
