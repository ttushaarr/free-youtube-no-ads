/**
 * BraveTube Website Interactive Scripts
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Dynamic QR Code Generator for Direct Mobile APK Download
  const qrContainer = document.getElementById('qrcode');
  const qrUrlLabel = document.getElementById('qrUrlLabel');

  if (qrContainer && typeof QRCode !== 'undefined') {
    // Determine download URL
    let origin = window.location.origin;
    if (!origin || origin.includes('localhost') || origin.startsWith('file://')) {
      // Use local Wi-Fi IP so other phones on the network can download
      origin = 'http://10.255.228.133:8080';
    }
    const apkUrl = `${origin}/downloads/BraveTube.apk`;

    try {
      new QRCode(qrContainer, {
        text: apkUrl,
        width: 100,
        height: 100,
        colorDark: '#000000',
        colorLight: '#ffffff',
        correctLevel: QRCode.CorrectLevel.M
      });
      if (qrUrlLabel) {
        qrUrlLabel.textContent = `Direct Mobile Link: ${apkUrl}`;
      }
    } catch (e) {
      console.error('QR code generation error:', e);
    }
  }

  // 2. Install Guide Tab Switcher
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');

  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-tab');

      tabButtons.forEach(b => b.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));

      btn.classList.add('active');
      const targetContent = document.getElementById(targetId);
      if (targetContent) {
        targetContent.classList.add('active');
      }
    });
  });

  // 3. FAQ Accordion
  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach(item => {
    const question = item.querySelector('.faq-question');
    question.addEventListener('click', () => {
      const isOpen = item.classList.contains('active');
      faqItems.forEach(i => i.classList.remove('active'));
      if (!isOpen) {
        item.classList.add('active');
      }
    });
  });

  // 4. Device / OS Auto Detection
  const userAgent = navigator.userAgent || navigator.vendor || window.opera;
  const btnAndroid = document.getElementById('btnDownloadAndroid');
  const btnBrave = document.getElementById('btnDownloadBrave');
  const btnMac = document.getElementById('btnDownloadMac');

  if (/android/i.test(userAgent)) {
    if (btnAndroid) btnAndroid.style.boxShadow = '0 0 20px rgba(16, 185, 129, 0.6)';
  } else if (/Macintosh|MacIntel|MacPPC|Mac68K/i.test(userAgent)) {
    if (btnBrave) btnBrave.style.boxShadow = '0 0 20px rgba(255, 98, 0, 0.6)';
  }
});
