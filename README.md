<div align="center">

# 🦁⚡ BraveTube — Free YouTube Without Any Ads

**Enjoy uninterrupted, ad-free YouTube streaming everywhere. 100% Free, Private, and Undetectable.**

[![License: MIT](https://img.shields.io/badge/License-MIT-orange.svg)](LICENSE)
[![Android](https://img.shields.io/badge/Platform-Android%208.0+-3DDC84.svg?logo=android&logoColor=white)](android/)
[![Brave / Chrome](https://img.shields.io/badge/Extension-Manifest%20V3-FB542B.svg?logo=brave&logoColor=white)](extension/)
[![macOS](https://img.shields.io/badge/Desktop-macOS%2011+-000000.svg?logo=apple&logoColor=white)](desktop/)
[![AdBlock Status](https://img.shields.io/badge/Anti--Adblock-Undetectable-10b981.svg)](README.md#how-it-works)
[![Background Play](https://img.shields.io/badge/Background%20Play-Supported-blue.svg)](android/)

<p align="center">
  <a href="#-key-features">Key Features</a> •
  <a href="#-feature-comparison">Comparison</a> •
  <a href="#-quick-installation-guides">Installation</a> •
  <a href="#-how-it-works">How It Works</a> •
  <a href="#-repository-structure">Architecture</a>
</p>

---

</div>

## 📖 Overview

**BraveTube** is an open-source suite designed to restore the classic, uninterrupted YouTube experience across all your devices:

1. **Android App (`android/`):** Dedicated mobile app with zero ads, hardware-accelerated 4K playback, floating **Picture-in-Picture (PiP)**, and **screen-off background audio playback** without needing YouTube Premium.
2. **Brave & Chrome Extension (`extension/`):** Manifest V3 extension with 16x turbo skip, instant skip-clicker, and anti-adblock detection bypass.
3. **macOS Native App (`desktop/`):** Standalone desktop application running in a dedicated window with zero browser URL bar clutter.
4. **Distribution Website (`website/`):** Self-hostable, modern landing page with automatic Wi-Fi QR code for direct mobile APK downloads.

---

## ✨ Key Features

- **⚡ 16x Turbo Ad Fast-Forwarding:** Instead of aborting network requests (which triggers YouTube's 3-strike blackout warning), the player accelerates ads to 16x speed and seeks directly to the end in under 50ms. YouTube registers that the ad played legitimately.
- **🎧 Background Audio Playback:** Listen to podcasts, commentary, and music on your Android device even when your screen is locked or while using other apps.
- **🖼️ Picture-in-Picture (PiP):** Tap Home or switch apps while playing any video on Android to instantly transition into a floating mini-player.
- **🛡️ Anti-Adblock Immunity:** Automatically deletes and suppresses YouTube's *"Ad blockers violate YouTube's Terms of Service"* warning dialogs and unfreezes the video player.
- **🔇 Zero-Leak Mute Guard:** Mutes audio during ad skips so you never hear even a fraction of a second of ad noise.
- **🧹 Clean Cosmetic Filtering:** Eradicates homepage mastheads, sponsored search listings, and sidebar recommendations.
- **🔒 100% Private & Open:** Zero tracking telemetry, no cloud relays, and no account requirements.

---

## 📊 Feature Comparison

| Feature | Standard YouTube | YouTube Premium ($13.99/mo) | BraveTube (Free) |
| :--- | :---: | :---: | :---: |
| **No Video Ads (Pre/Mid-roll)** | ❌ | ✅ | ✅ *(Undetectable Skip)* |
| **No Banner / Feed Ads** | ❌ | ✅ | ✅ |
| **Screen-Off Background Audio** | ❌ | ✅ | ✅ |
| **Picture-in-Picture (PiP)** | Limited | ✅ | ✅ |
| **No Account / Login Required** | ❌ | ❌ | ✅ |
| **Anti-Adblock Proof** | N/A | N/A | ✅ |
| **100% Free & Open Source** | ❌ | ❌ | ✅ |

---

## 🚀 Quick Installation Guides

### 1. 📱 Android App (`BraveTube.apk`)

#### Direct Download
- Download the precompiled APK directly from `android/release/BraveTube.apk` or via the built-in [website](website/).
- Tap the APK file on your Android phone and select **"Install"** (enable *"Allow from this source"* if prompted).

#### Installing via USB / ADB
If your phone is connected to your computer via USB debugging:
```bash
adb install -r android/release/BraveTube.apk
```

---

### 2. 🦁 Brave & Chrome Extension (`extension/`)

1. Open your browser and navigate to:
   ```text
   brave://extensions   # (or chrome://extensions)
   ```
2. Enable **Developer mode** toggle in the top-right corner.
3. Click **"Load unpacked"** and select the [`extension/`](extension/) directory from this repository.
4. Pin the shield icon to your toolbar and visit [YouTube](https://www.youtube.com).

---

### 3. 🍎 Standalone macOS Desktop App (`desktop/`)

1. Navigate to the [`desktop/`](desktop/) folder.
2. Drag `YouTube Ad-Free.app` into your `/Applications` directory.
3. Open it via **Spotlight Search** (`Cmd + Space` → `YouTube Ad-Free`) or pin it to your macOS Dock.

---

### 4. 🌐 Self-Hosting the Download Website (`website/`)

To host the download portal for yourself or devices on your local Wi-Fi:
```bash
python3 website/server.py
```
- **Local Access:** `http://localhost:8080`
- **Network Access:** `http://<your-local-ip>:8080`
- Includes a live QR code so anyone on your Wi-Fi can scan and download the APK to their phone directly.

---

## 🛠️ How It Works (Technical Architecture)

```
                     ┌─────────────────────────────────────────┐
                     │          YouTube Video Player           │
                     └────────────────────┬────────────────────┘
                                          │
                                   [ Ad Segment Cued ]
                                          │
                     ┌────────────────────┴────────────────────┐
                     ▼                                         ▼
            [ Network Domain Level ]               [ Runtime Video Level ]
           Interception Drops Ad Domains          1. Mute audio channel
           (doubleclick, adservice)               2. Playback speed = 16x (Max)
                                                  3. Seek currentTime to duration
                                                  4. Instant-click "Skip Ad" button
                                                               │
                                          ┌────────────────────┴────────────────────┐
                                          ▼                                         ▼
                             [ Anti-Adblock Detection ]                 [ Main Video Stream ]
                             Removes enforcement dialogs                Restore normal playback speed
                             Unlocks screen & resumes play              Restore audio volume
```

### Why Traditional Ad Blockers Fail
YouTube tests server-side ad stitching and aggressive client-side anti-adblock scripts. When an ad request is blocked at the network/DNS level, YouTube triggers an enforcement modal (`ytd-enforcement-message-view-model`) that freezes video playback.

### Why BraveTube Succeeds
1. **Telemetry spoofing:** Rather than aborting player execution, BraveTube executes the ad at 16x speed and seeks directly to the end in &lt;50ms. Telemetry reports that the ad completed legitimately.
2. **Page Visibility Override:** YouTube pauses playback whenever a browser tab or mobile app loses focus. BraveTube overrides `document.hidden` and `document.visibilityState` to remain permanently `visible`, enabling background playback without a paid subscription.

---

## 📁 Repository Structure

```text
free-youtube-no-ads/
├── android/                         # Android Native App
│   ├── app/                         # Application source (Kotlin + WebView)
│   │   ├── src/main/java/           # MainActivity with PiP & ad filtering
│   │   ├── src/main/assets/         # AdShield JS & CSS injection scripts
│   │   └── src/main/AndroidManifest.xml
│   ├── release/
│   │   └── BraveTube.apk            # Prebuilt, ready-to-install Android APK
│   ├── build.gradle.kts
│   └── settings.gradle.kts
├── extension/                       # Manifest V3 Extension for Brave / Chrome
│   ├── manifest.json
│   ├── content.js                   # 16x fast-forward engine & skip-clicker
│   ├── styles.css                   # Cosmetic banner & promo filters
│   └── popup/                       # Dark-mode control center UI
├── desktop/                         # macOS Standalone Desktop App
│   └── YouTube Ad-Free.app          # Dedicated borderless desktop app bundle
├── website/                         # Live Distribution & Download Website
│   ├── index.html                   # Responsive glassmorphic landing page
│   ├── styles.css
│   ├── script.js                    # Dynamic Wi-Fi QR code generator
│   ├── server.py                    # Multi-threaded server with APK MIME types
│   └── downloads/                   # Download packages for all platforms
├── LICENSE                          # MIT License
└── README.md                        # Documentation
```

---

## ⚖️ Disclaimer

*BraveTube is an independent open-source project created for personal productivity, educational research, and privacy enhancement. This project is not affiliated with, endorsed by, or associated with Google LLC or YouTube.*
