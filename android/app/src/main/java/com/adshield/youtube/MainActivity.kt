package com.adshield.youtube

import android.annotation.SuppressLint
import android.app.PictureInPictureParams
import android.app.UiModeManager
import android.content.Context
import android.content.pm.PackageManager
import android.content.res.Configuration
import android.graphics.Bitmap
import android.os.Build
import android.os.Bundle
import android.util.Rational
import android.view.KeyEvent
import android.view.View
import android.view.ViewGroup
import android.view.WindowManager
import android.webkit.CookieManager
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.FrameLayout
import android.widget.ProgressBar
import androidx.activity.OnBackPressedCallback
import androidx.appcompat.app.AppCompatActivity
import java.io.ByteArrayInputStream

class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView
    private lateinit var progressBar: ProgressBar
    private lateinit var customViewContainer: FrameLayout

    private var customView: View? = null
    private var customViewCallback: WebChromeClient.CustomViewCallback? = null

    private var injectJs: String = ""
    private var injectCss: String = ""
    private var isTvDevice: Boolean = false

    // Smart TV User Agent (trigggers YouTube's 10-foot remote-friendly Leanback UI)
    private val TV_USER_AGENT = "Mozilla/5.0 (Linux; GoogleTV 12; Chromecast) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36"

    private val blockedAdDomains = listOf(
        "googleads.g.doubleclick.net",
        "pubads.g.doubleclick.net",
        "adservice.google.com",
        "pagead2.googlesyndication.com",
        "securepubads.g.doubleclick.net",
        "youtube.com/pagead/",
        "youtube.com/api/stats/ads"
    )

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        isTvDevice = isRunningOnTv()

        // Keep screen awake continuously if running on Smart TV
        if (isTvDevice) {
            window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
        }

        webView = findViewById(R.id.webView)
        progressBar = findViewById(R.id.progressBar)
        customViewContainer = findViewById(R.id.customViewContainer)

        loadAssets()
        setupWebView()

        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                if (customView != null) {
                    hideCustomView()
                } else if (webView.canGoBack()) {
                    webView.goBack()
                } else {
                    isEnabled = false
                    onBackPressedDispatcher.onBackPressed()
                }
            }
        })

        if (savedInstanceState != null) {
            webView.restoreState(savedInstanceState)
        } else {
            // If running on a TV, load Leanback remote UI; if on Phone, load mobile UI
            val targetUrl = if (isTvDevice) "https://www.youtube.com/tv" else "https://m.youtube.com"
            webView.loadUrl(targetUrl)
        }
    }

    /**
     * Accurately detects whether the app is executing on an Android TV / Google TV device
     */
    private fun isRunningOnTv(): Boolean {
        val uiModeManager = getSystemService(Context.UI_MODE_SERVICE) as? UiModeManager
        if (uiModeManager?.currentModeType == Configuration.UI_MODE_TYPE_TELEVISION) {
            return true
        }
        val pm = packageManager
        val isLeanback = pm.hasSystemFeature(PackageManager.FEATURE_LEANBACK)
        val hasNoTouch = !pm.hasSystemFeature(PackageManager.FEATURE_TOUCHSCREEN)
        return isLeanback || hasNoTouch
    }

    private fun loadAssets() {
        try {
            injectJs = assets.open("adshield_inject.js").bufferedReader().use { it.readText() }
            injectCss = assets.open("adshield_style.css").bufferedReader().use { it.readText() }
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    @SuppressLint("SetJavaScriptEnabled")
    private fun setupWebView() {
        CookieManager.getInstance().setAcceptCookie(true)
        CookieManager.getInstance().setAcceptThirdPartyCookies(webView, true)

        val settings = webView.settings
        settings.javaScriptEnabled = true
        settings.domStorageEnabled = true
        settings.databaseEnabled = true
        settings.mediaPlaybackRequiresUserGesture = false
        settings.loadWithOverviewMode = true
        settings.useWideViewPort = true
        settings.builtInZoomControls = false
        settings.displayZoomControls = false
        settings.cacheMode = WebSettings.LOAD_DEFAULT

        if (isTvDevice) {
            // Android TV optimizations: Leanback User-Agent & 4-way D-Pad focus navigation
            settings.userAgentString = TV_USER_AGENT
            try {
                // Enable spatial navigation for TV remote directional arrows
                val setSpatialNavMethod = settings.javaClass.getMethod("setSupportSpatialNavigation", Boolean::class.javaPrimitiveType)
                setSpatialNavMethod.invoke(settings, true)
            } catch (ignored: Exception) {}

            webView.isFocusable = true
            webView.isFocusableInTouchMode = true
            webView.requestFocus()
        } else {
            settings.userAgentString = settings.userAgentString.replace("; wv", "")
        }

        webView.webViewClient = object : WebViewClient() {
            override fun shouldInterceptRequest(
                view: WebView?,
                request: WebResourceRequest?
            ): WebResourceResponse? {
                val url = request?.url?.toString() ?: ""
                for (domain in blockedAdDomains) {
                    if (url.contains(domain, ignoreCase = true)) {
                        return WebResourceResponse(
                            "text/plain",
                            "UTF-8",
                            ByteArrayInputStream(ByteArray(0))
                        )
                    }
                }
                return super.shouldInterceptRequest(view, request)
            }

            override fun onPageStarted(view: WebView?, url: String?, favicon: Bitmap?) {
                progressBar.visibility = View.VISIBLE
                injectAdBlock()
                super.onPageStarted(view, url, favicon)
            }

            override fun onPageFinished(view: WebView?, url: String?) {
                progressBar.visibility = View.GONE
                injectAdBlock()
                super.onPageFinished(view, url)
            }
        }

        webView.webChromeClient = object : WebChromeClient() {
            override fun onProgressChanged(view: WebView?, newProgress: Int) {
                progressBar.progress = newProgress
                if (newProgress == 100) {
                    progressBar.visibility = View.GONE
                }
            }

            override fun onShowCustomView(view: View?, callback: CustomViewCallback?) {
                if (customView != null) {
                    callback?.onCustomViewHidden()
                    return
                }
                customView = view
                customViewCallback = callback

                customViewContainer.addView(
                    view,
                    FrameLayout.LayoutParams(
                        ViewGroup.LayoutParams.MATCH_PARENT,
                        ViewGroup.LayoutParams.MATCH_PARENT
                    )
                )
                customViewContainer.visibility = View.VISIBLE
                webView.visibility = View.GONE
            }

            override fun onHideCustomView() {
                hideCustomView()
            }
        }
    }

    private fun injectAdBlock() {
        if (injectCss.isNotEmpty()) {
            val encodedCss = android.util.Base64.encodeToString(
                injectCss.toByteArray(),
                android.util.Base64.NO_WRAP
            )
            val cssScript = """
                (function() {
                    var parent = document.head || document.documentElement;
                    var style = document.getElementById('adshield-css');
                    if (!style) {
                        style = document.createElement('style');
                        style.id = 'adshield-css';
                        style.type = 'text/css';
                        style.innerHTML = window.atob('$encodedCss');
                        parent.appendChild(style);
                    }
                })();
            """.trimIndent()
            webView.evaluateJavascript(cssScript, null)
        }

        if (injectJs.isNotEmpty()) {
            webView.evaluateJavascript(injectJs, null)
        }
    }

    private fun hideCustomView() {
        if (customView == null) return
        customViewContainer.removeView(customView)
        customView = null
        customViewContainer.visibility = View.GONE
        webView.visibility = View.VISIBLE
        customViewCallback?.onCustomViewHidden()
        customViewCallback = null
    }

    /**
     * TV Remote Controller Key Handler (D-Pad, Play/Pause, Fast Forward, Rewind)
     */
    override fun dispatchKeyEvent(event: KeyEvent): Boolean {
        val action = event.action
        val keyCode = event.keyCode

        if (action == KeyEvent.ACTION_DOWN) {
            when (keyCode) {
                KeyEvent.KEYCODE_MEDIA_PLAY_PAUSE,
                KeyEvent.KEYCODE_MEDIA_PLAY,
                KeyEvent.KEYCODE_MEDIA_PAUSE -> {
                    // Send spacebar toggle to player
                    webView.evaluateJavascript(
                        "(function(){ var v=document.querySelector('video'); if(v){ v.paused ? v.play() : v.pause(); } })()",
                        null
                    )
                    return true
                }
                KeyEvent.KEYCODE_MEDIA_FAST_FORWARD -> {
                    // Fast forward 10 seconds
                    webView.evaluateJavascript(
                        "(function(){ var v=document.querySelector('video'); if(v){ v.currentTime += 10; } })()",
                        null
                    )
                    return true
                }
                KeyEvent.KEYCODE_MEDIA_REWIND -> {
                    // Rewind 10 seconds
                    webView.evaluateJavascript(
                        "(function(){ var v=document.querySelector('video'); if(v){ v.currentTime -= 10; } })()",
                        null
                    )
                    return true
                }
            }
        }
        return super.dispatchKeyEvent(event)
    }

    override fun onUserLeaveHint() {
        super.onUserLeaveHint()
        if (!isTvDevice && Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            try {
                val params = PictureInPictureParams.Builder()
                    .setAspectRatio(Rational(16, 9))
                    .build()
                enterPictureInPictureMode(params)
            } catch (ignored: Exception) {}
        }
    }

    override fun onPictureInPictureModeChanged(
        isInPictureInPictureMode: Boolean,
        newConfig: Configuration
    ) {
        super.onPictureInPictureModeChanged(isInPictureInPictureMode, newConfig)
        if (isInPictureInPictureMode) {
            progressBar.visibility = View.GONE
        }
    }

    override fun onSaveInstanceState(outState: Bundle) {
        super.onSaveInstanceState(outState)
        webView.saveState(outState)
    }

    override fun onDestroy() {
        webView.destroy()
        super.onDestroy()
    }
}
