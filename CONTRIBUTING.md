# Contributing to BraveTube

Thank you for your interest in contributing to BraveTube! We welcome contributions to keep YouTube free from ads, anti-adblock blackouts, and sponsor interruptions across Android, desktop browsers, and macOS.

## Repository Layout
- `android/`: Android app with background audio and hardware-accelerated video playback.
- `extension/`: Manifest V3 browser extension for Brave and Chromium browsers.
- `desktop/`: macOS standalone desktop wrapper.
- `website/`: Live download and distribution landing page.

## Development Guidelines
1. **Never block in a way that breaks playback:** Use the hybrid 16x fast-forward technique so YouTube telemetry views playback as legitimate.
2. **Preserve background audio capabilities:** Ensure Page Visibility API spoofing remains intact for mobile browsers and Android WebView.
3. **Keep code dependency-lean:** Minimize bloat and avoid unnecessary external third-party SDKs.

## Submitting Pull Requests
1. Fork the repository.
2. Create your feature branch (`git checkout -b feature/amazing-feature`).
3. Commit your changes (`git commit -m 'Add some amazing feature'`).
4. Push to the branch (`git push origin feature/amazing-feature`).
5. Open a Pull Request.
