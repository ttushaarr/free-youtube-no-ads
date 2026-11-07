/**
 * Brave AdShield for YouTube™ - Popup Controller
 */

document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const toggleMaster = document.getElementById('toggleMaster');
  const toggleTurbo = document.getElementById('toggleTurbo');
  const toggleAutoClick = document.getElementById('toggleAutoClick');
  const toggleBypass = document.getElementById('toggleBypass');
  const toggleBanners = document.getElementById('toggleBanners');
  const toggleMute = document.getElementById('toggleMute');

  const statusPill = document.getElementById('statusPill');
  const statusLabel = document.getElementById('statusLabel');
  const masterDesc = document.getElementById('masterDesc');

  const adsSkippedVal = document.getElementById('adsSkippedVal');
  const timeSavedVal = document.getElementById('timeSavedVal');

  const btnResetStats = document.getElementById('btnResetStats');
  const btnReloadTab = document.getElementById('btnReloadTab');

  // Format seconds into human readable duration
  function formatTimeSaved(seconds) {
    if (!seconds || seconds <= 0) return '0s';
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins < 60) {
      return `${mins}m ${secs > 0 ? secs + 's' : ''}`.trim();
    }
    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    return `${hours}h ${remainingMins}m`;
  }

  // Update status UI indicator
  function updateStatusUI(isEnabled) {
    if (isEnabled) {
      statusPill.className = 'status-pill active';
      statusLabel.textContent = 'PROTECTED';
      masterDesc.textContent = 'Undetectable hybrid ad skipper active';
    } else {
      statusPill.className = 'status-pill disabled';
      statusLabel.textContent = 'PAUSED';
      masterDesc.textContent = 'Shield is currently disabled';
    }
  }

  // Load initial settings and statistics
  function loadSettings() {
    chrome.storage.local.get(
      {
        enabled: true,
        turboSkip: true,
        autoClickSkip: true,
        antiAdblockBypass: true,
        hideBanners: true,
        muteAds: true,
        adsSkipped: 0,
        timeSavedSeconds: 0
      },
      (data) => {
        toggleMaster.checked = data.enabled;
        toggleTurbo.checked = data.turboSkip;
        toggleAutoClick.checked = data.autoClickSkip;
        toggleBypass.checked = data.antiAdblockBypass;
        toggleBanners.checked = data.hideBanners;
        toggleMute.checked = data.muteAds;

        adsSkippedVal.textContent = data.adsSkipped.toLocaleString();
        timeSavedVal.textContent = formatTimeSaved(data.timeSavedSeconds);

        updateStatusUI(data.enabled);
      }
    );
  }

  // Bind toggle change listeners
  function bindToggle(element, key, callback) {
    element.addEventListener('change', () => {
      chrome.storage.local.set({ [key]: element.checked }, () => {
        if (callback) callback(element.checked);
      });
    });
  }

  bindToggle(toggleMaster, 'enabled', (val) => updateStatusUI(val));
  bindToggle(toggleTurbo, 'turboSkip');
  bindToggle(toggleAutoClick, 'autoClickSkip');
  bindToggle(toggleBypass, 'antiAdblockBypass');
  bindToggle(toggleBanners, 'hideBanners');
  bindToggle(toggleMute, 'muteAds');

  // Reset Stats button
  btnResetStats.addEventListener('click', () => {
    chrome.storage.local.set({ adsSkipped: 0, timeSavedSeconds: 0 }, () => {
      adsSkippedVal.textContent = '0';
      timeSavedVal.textContent = '0s';
    });
  });

  // Reload current YouTube tab
  btnReloadTab.addEventListener('click', () => {
    if (chrome.tabs && chrome.tabs.query) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs && tabs[0] && tabs[0].id) {
          chrome.tabs.reload(tabs[0].id);
        }
      });
    }
  });

  // Listen for real-time stats updates while popup is open
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local') {
      if (changes.adsSkipped) {
        adsSkippedVal.textContent = (changes.adsSkipped.newValue || 0).toLocaleString();
      }
      if (changes.timeSavedSeconds) {
        timeSavedVal.textContent = formatTimeSaved(changes.timeSavedSeconds.newValue || 0);
      }
    }
  });

  loadSettings();
});
