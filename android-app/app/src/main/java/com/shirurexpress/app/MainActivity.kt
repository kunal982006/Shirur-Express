package com.shirurexpress.app

import android.annotation.SuppressLint
import android.content.Context
import android.content.Intent
import android.graphics.Bitmap
import android.net.Uri
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.os.SystemClock
import android.provider.MediaStore
import android.view.HapticFeedbackConstants
import android.view.View
import android.webkit.*
import android.widget.ProgressBar
import android.widget.Toast
import androidx.activity.OnBackPressedCallback
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout
import android.Manifest
import android.app.NotificationManager
import android.content.pm.PackageManager
import android.os.Build
import android.provider.Settings
import android.util.Log
import androidx.activity.result.contract.ActivityResultContracts
import androidx.core.content.ContextCompat
import androidx.core.content.FileProvider
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import java.io.File
import com.razorpay.Checkout
import com.razorpay.PaymentData
import com.razorpay.PaymentResultWithDataListener
import org.json.JSONObject
import androidx.activity.enableEdgeToEdge
import com.facebook.FacebookSdk
import com.facebook.appevents.AppEventsLogger
import com.shirurexpress.app.BuildConfig

class MainActivity : AppCompatActivity(), PaymentResultWithDataListener {

    private lateinit var webView: WebView
    private lateinit var progressBar: ProgressBar
    private lateinit var swipeRefresh: SwipeRefreshLayout
    private lateinit var errorView: View
    
    
    // Facebook SDK App Events Logger
    private lateinit var fbLogger: AppEventsLogger

    // Bluetooth thermal printer for delivery bills
    private val printerManager by lazy { PrinterManager(this) }
    // Runs once the Bluetooth permission dialog is answered (true = granted)
    private var pendingBluetoothAction: ((Boolean) -> Unit)? = null

    // The website's own files, served from inside the APK (see WebAppBundle.kt)
    private val webBundle by lazy { WebAppBundle(this) }
    private lateinit var splash: SplashOverlay
    private lateinit var bottomNav: BottomNavBar
    private val handler = Handler(Looper.getMainLooper())

    // True once the current page has drawn its first screen
    private var pageReady = false
    private var keyboardVisible = false
    private var lastUpdateCheckAt = 0L
    private var pausedAt = 0L
    // A newer web version was downloaded and is waiting for the next page load
    private var newVersionWaiting = false

    // Asks the page whether React has replaced the loading animation yet. Works
    // with every version of the website; newer ones also call appReady() sooner.
    private val readinessPoll = object : Runnable {
        override fun run() {
            if (pageReady || isDestroyed) return
            webView.evaluateJavascript(
                "(function(){var r=document.getElementById('root');" +
                    "return !!(r&&r.firstElementChild&&!r.querySelector('dotlottie-player'))})()"
            ) { result ->
                if (result == "true") onPageReady() else handler.postDelayed(this, READY_POLL_MS)
            }
        }
    }

    // The bundled or saved page never came up: stop using it and load straight
    // from the server, exactly like older versions of the app did.
    private val startupWatchdog = Runnable {
        if (pageReady || isDestroyed || webBundle.networkOnly) return@Runnable
        Log.w("WebAppBundle", "Page did not start in time; loading from the server instead")
        webBundle.networkOnly = true
        webBundle.discardSavedShell()
        webView.reload()
    }

    // File upload callback for WebView file chooser
    private var filePathCallback: ValueCallback<Array<Uri>>? = null
    private var geolocationCallback: GeolocationPermissions.Callback? = null
    private var geolocationOrigin: String? = null
    // URI for camera-captured photo
    private var cameraPhotoUri: Uri? = null

    // Provider permission request launcher (notifications)
    private val permissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { permissions ->
        // Graceful handling without intrusive repeated popup dialogs
        val granted = permissions[Manifest.permission.POST_NOTIFICATIONS] == true
        Log.d("Permissions", "Notification permission granted: $granted")
    }

    // File chooser launcher for handling file upload in WebView
    private val fileChooserLauncher = registerForActivityResult(
        ActivityResultContracts.StartActivityForResult()
    ) { result ->
        if (result.resultCode == RESULT_OK) {
            val data = result.data
            val resultUris: Array<Uri>? = when {
                data?.clipData != null -> {
                    val clipData = data.clipData!!
                    Array(clipData.itemCount) { i -> clipData.getItemAt(i).uri }
                }
                data?.data != null -> {
                    arrayOf(data.data!!)
                }
                cameraPhotoUri != null -> {
                    arrayOf(cameraPhotoUri!!)
                }
                else -> null
            }
            filePathCallback?.onReceiveValue(resultUris ?: arrayOf())
        } else {
            filePathCallback?.onReceiveValue(null)
        }
        filePathCallback = null
        cameraPhotoUri = null
    }

    companion object {
        private const val WEBSITE_URL = "https://shirur-express.onrender.com"
        private const val APP_USER_AGENT = "ShirurExpressApp/1.0 (Android; WebView)"
        private const val READY_POLL_MS = 300L
        // The splash never stays longer than this, even on a very slow connection
        private const val SPLASH_MAX_MS = 8000L
        private const val STARTUP_TIMEOUT_MS = 15000L
        private const val UPDATE_CHECK_INTERVAL_MS = 15 * 60 * 1000L
        // Back in the app after this long, a waiting new version is loaded straight away
        private const val RELOAD_AFTER_BACKGROUND_MS = 30 * 60 * 1000L
    }

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContentView(R.layout.activity_main)

        webView = findViewById(R.id.webView)
        progressBar = findViewById(R.id.progressBar)
        swipeRefresh = findViewById(R.id.swipeRefresh)
        errorView = findViewById(R.id.errorView)

        splash = SplashOverlay(findViewById(R.id.splashRoot))
        bottomNav = BottomNavBar(
            findViewById(R.id.bottomNav),
            findViewById(R.id.bottomNavIsland),
            findViewById(R.id.bottomNavIndicator),
            findViewById(R.id.bottomNavRow),
        ) { href ->
            webView.evaluateJavascript(
                "window.__nativeNavigate&&window.__nativeNavigate(${JSONObject.quote(href)});",
                null
            )
        }

        if (savedInstanceState == null) {
            // Fresh start: the splash animates on top while the app loads underneath.
            splash.show()
            handler.postDelayed({ dismissSplash() }, SPLASH_MAX_MS)
        } else {
            dismissSplash()
        }

        setupWebView()
        watchKeyboard()

        swipeRefresh.setColorSchemeResources(R.color.purple_500)
        swipeRefresh.setOnRefreshListener {
            swipeRefresh.performHapticFeedback(HapticFeedbackConstants.VIRTUAL_KEY)
            webView.reload()
        }

        // Warm up native Razorpay Checkout so it opens quickly when the customer pays
        try {
            Checkout.preload(applicationContext)
        } catch (e: Exception) {
            Log.e("RazorpayInit", "Failed to preload Razorpay Checkout", e)
        }

        try {
            FacebookSdk.sdkInitialize(applicationContext)
            AppEventsLogger.activateApp(application)
            fbLogger = AppEventsLogger.newLogger(this)
        } catch (e: Exception) {
            Log.e("FacebookSDK", "Failed to initialize Facebook SDK", e)
        }

        setupBackPressHandler()

        if (savedInstanceState == null) {
            loadUrl(WEBSITE_URL)
        }

        handleIntent(intent)

        // Once the first screen is up, quietly check whether the server has a newer version.
        handler.postDelayed({ checkForWebUpdate() }, 3000)
    }

    private fun dismissSplash() {
        if (splash.isShowing) {
            splash.dismiss {
                // The splash gradient behind the content is no longer needed.
                window.setBackgroundDrawableResource(R.color.background_dark)
            }
        } else if (findViewById<View>(R.id.splashRoot).visibility != View.VISIBLE) {
            window.setBackgroundDrawableResource(R.color.background_dark)
        }
    }

    /** The current page has drawn its first screen. */
    private fun onPageReady() {
        if (pageReady) return
        pageReady = true
        handler.removeCallbacks(readinessPoll)
        handler.removeCallbacks(startupWatchdog)
        dismissSplash()
    }

    private fun isAppPage(url: String?): Boolean =
        url != null && Uri.parse(url).host == WebAppBundle.HOST

    private fun updateBottomNavBlock() {
        // The bar steps aside for the keyboard and for the offline screen.
        bottomNav.blocked = keyboardVisible || errorView.visibility == View.VISIBLE
    }

    private fun watchKeyboard() {
        val root = findViewById<View>(R.id.contentRoot)
        root.viewTreeObserver.addOnGlobalLayoutListener {
            val visible = ViewCompat.getRootWindowInsets(root)
                ?.isVisible(WindowInsetsCompat.Type.ime()) == true
            if (visible != keyboardVisible) {
                keyboardVisible = visible
                updateBottomNavBlock()
            }
        }
    }

    /** Looks for a newer version of the website on the server, off the main thread. */
    private fun checkForWebUpdate(thenReload: Boolean = false) {
        if (!webBundle.isAvailable || webBundle.networkOnly) {
            if (thenReload) webView.reload()
            return
        }
        lastUpdateCheckAt = SystemClock.elapsedRealtime()
        Thread {
            val updated = webBundle.checkForUpdate()
            runOnUiThread {
                if (isDestroyed) return@runOnUiThread
                if (thenReload) {
                    newVersionWaiting = false
                    webView.reload()
                } else if (updated) {
                    newVersionWaiting = true
                }
            }
        }.start()
    }

    private val locationPermissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { permissions ->
        val granted = permissions[Manifest.permission.ACCESS_FINE_LOCATION] == true ||
            permissions[Manifest.permission.ACCESS_COARSE_LOCATION] == true
        geolocationCallback?.invoke(geolocationOrigin, granted, false)
        geolocationCallback = null
        geolocationOrigin = null
    }

    private val bluetoothPermissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { granted ->
        val action = pendingBluetoothAction
        pendingBluetoothAction = null
        action?.invoke(granted)
    }

    private fun hasBluetoothPermission(): Boolean =
        Build.VERSION.SDK_INT < Build.VERSION_CODES.S ||
            ContextCompat.checkSelfPermission(this, Manifest.permission.BLUETOOTH_CONNECT) == PackageManager.PERMISSION_GRANTED

    /** Runs [action] with true once Bluetooth permission is available, asking for it if needed. */
    private fun withBluetoothPermission(action: (Boolean) -> Unit) {
        runOnUiThread {
            if (hasBluetoothPermission()) {
                action(true)
            } else {
                // A newer request replaces an unanswered one; tell the old caller it did not run.
                pendingBluetoothAction?.invoke(false)
                pendingBluetoothAction = action
                bluetoothPermissionLauncher.launch(Manifest.permission.BLUETOOTH_CONNECT)
            }
        }
    }

    private fun sendPrinterResultToWeb(requestId: String, result: JSONObject) {
        val safeId = JSONObject.quote(requestId)
        runOnUiThread {
            webView.evaluateJavascript(
                "window.__onPrinterResult && window.__onPrinterResult($safeId, $result);",
                null
            )
        }
    }

    private fun printerError(code: String, message: String) =
        JSONObject().put("ok", false).put("code", code).put("message", message)

    private fun checkAllPermissions() {
        val permissionsToRequest = mutableListOf<String>()
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
                permissionsToRequest.add(Manifest.permission.POST_NOTIFICATIONS)
            }
        }
        if (permissionsToRequest.isNotEmpty()) {
            permissionLauncher.launch(permissionsToRequest.toTypedArray())
        }
    }

    @SuppressLint("SetJavaScriptEnabled")
    private fun setupWebView() {
        webView.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            databaseEnabled = true
            userAgentString = "$userAgentString $APP_USER_AGENT"
            builtInZoomControls = true
            displayZoomControls = false
            useWideViewPort = true
            loadWithOverviewMode = true
            cacheMode = WebSettings.LOAD_DEFAULT
            allowFileAccess = false
            allowContentAccess = false
            mixedContentMode = WebSettings.MIXED_CONTENT_NEVER_ALLOW
            mediaPlaybackRequiresUserGesture = false
            setSupportMultipleWindows(false)
            javaScriptCanOpenWindowsAutomatically = false
            setGeolocationEnabled(true)
        }

        // Keep the login session cookie. Without an explicit flush, WebView only
        // writes cookies to disk occasionally, so if Android kills the app in the
        // background the session cookie is lost and the user appears logged out.
        CookieManager.getInstance().apply {
            setAcceptCookie(true)
            setAcceptThirdPartyCookies(webView, true)
        }

        webView.addJavascriptInterface(AndroidBridge(), "AndroidApp")

        // Once the website's service worker is running, page requests go through
        // it instead of the WebViewClient below, so it gets the same local files.
        ServiceWorkerController.getInstance().setServiceWorkerClient(object : ServiceWorkerClient() {
            override fun shouldInterceptRequest(request: WebResourceRequest): WebResourceResponse? =
                webBundle.intercept(request)
        })

        webView.webViewClient = object : WebViewClient() {
            override fun shouldInterceptRequest(view: WebView?, request: WebResourceRequest?): WebResourceResponse? =
                request?.let { webBundle.intercept(it) }

            override fun onPageStarted(view: WebView?, url: String?, favicon: Bitmap?) {
                super.onPageStarted(view, url, favicon)
                // No loading bar under the splash, or for pages that open from the phone at once.
                val servedLocally = webBundle.isAvailable && !webBundle.networkOnly && isAppPage(url)
                progressBar.visibility = if (splash.isShowing || servedLocally) View.GONE else View.VISIBLE
                errorView.visibility = View.GONE
                updateBottomNavBlock()

                pageReady = false
                handler.removeCallbacks(readinessPoll)
                handler.removeCallbacks(startupWatchdog)
                if (servedLocally) handler.postDelayed(startupWatchdog, STARTUP_TIMEOUT_MS)
            }

            override fun onPageFinished(view: WebView?, url: String?) {
                super.onPageFinished(view, url)
                progressBar.visibility = View.GONE
                swipeRefresh.isRefreshing = false
                injectCustomCSS()
                CookieManager.getInstance().flush()
                if (isAppPage(url)) {
                    if (!pageReady) handler.post(readinessPoll)
                } else {
                    // Not our website (e.g. a payment page): nothing to wait for.
                    dismissSplash()
                }
            }

            override fun onReceivedError(view: WebView?, request: WebResourceRequest?, error: WebResourceError?) {
                if (request?.isForMainFrame == true) showErrorPage()
            }

            override fun shouldOverrideUrlLoading(view: WebView?, request: WebResourceRequest?): Boolean {
                val url = request?.url?.toString() ?: return false
                
                // 1. Direct UPI schemes (GPay tez, PhonePe, Paytm, BHIM, upi://)
                if (url.startsWith("upi:") || url.startsWith("intent:") || url.startsWith("paytmmp:") || url.startsWith("phonepe:") || url.startsWith("tez:")) {
                    try {
                        val intent = Intent.parseUri(url, Intent.URI_INTENT_SCHEME)
                        if (intent != null) {
                            intent.addCategory(Intent.CATEGORY_BROWSABLE)
                            intent.component = null
                            if (intent.resolveActivity(packageManager) != null) {
                                startActivity(intent)
                                return true
                            }
                            // Fallback URL if target UPI app is not installed
                            val fallbackUrl = intent.getStringExtra("browser_fallback_url")
                            if (!fallbackUrl.isNullOrEmpty()) {
                                view?.loadUrl(fallbackUrl)
                                return true
                            }
                        }
                    } catch (e: Exception) {
                        Log.e("UPIIntent", "Failed to launch UPI Intent: $url", e)
                    }
                    return true
                }

                // 3. Keep internal Shirur Express web pages inside WebView
                if (url.contains("shirur-express.onrender.com") || url.contains("api.razorpay.com")) {
                    return false
                }
                
                if (url.startsWith("tel:") || url.startsWith("mailto:") || url.startsWith("whatsapp:") || url.contains("whatsapp.com")) {
                    try { startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(url))) } catch (e: Exception) { }
                    return true
                }
                
                if (url.startsWith("http://") || url.startsWith("https://")) {
                    try { startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(url))) } catch (e: Exception) { }
                    return true
                }
                return false
            }
        }

        webView.webChromeClient = object : WebChromeClient() {
            override fun onProgressChanged(view: WebView?, newProgress: Int) {
                progressBar.progress = newProgress
                if (newProgress == 100) progressBar.visibility = View.GONE
            }

            override fun onJsAlert(view: WebView?, url: String?, message: String?, result: JsResult?): Boolean {
                AlertDialog.Builder(this@MainActivity).setTitle("Shirur Express").setMessage(message)
                    .setPositiveButton("OK") { _, _ -> result?.confirm() }.setCancelable(false).show()
                return true
            }

            override fun onJsConfirm(view: WebView?, url: String?, message: String?, result: JsResult?): Boolean {
                AlertDialog.Builder(this@MainActivity).setTitle("Shirur Express").setMessage(message)
                    .setPositiveButton("OK") { _, _ -> result?.confirm() }
                    .setNegativeButton("Cancel") { _, _ -> result?.cancel() }.setCancelable(false).show()
                return true
            }

            override fun onGeolocationPermissionsShowPrompt(origin: String?, callback: GeolocationPermissions.Callback?) {
                val hasLocationPermission = ContextCompat.checkSelfPermission(
                    this@MainActivity,
                    Manifest.permission.ACCESS_FINE_LOCATION
                ) == PackageManager.PERMISSION_GRANTED
                if (hasLocationPermission) {
                    callback?.invoke(origin, true, false)
                } else {
                    // Ask only after a page feature actually requests location.
                    geolocationCallback = callback
                    geolocationOrigin = origin
                    locationPermissionLauncher.launch(arrayOf(
                        Manifest.permission.ACCESS_FINE_LOCATION,
                        Manifest.permission.ACCESS_COARSE_LOCATION,
                    ))
                }
            }

            override fun onShowFileChooser(webView: WebView?, filePathCallback: ValueCallback<Array<Uri>>?, fileChooserParams: FileChooserParams?): Boolean {
                this@MainActivity.filePathCallback?.onReceiveValue(null)
                this@MainActivity.filePathCallback = filePathCallback
                try {
                    val cameraIntents = mutableListOf<Intent>()
                    if (ContextCompat.checkSelfPermission(this@MainActivity, Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED) {
                        val photoFile = File(File(cacheDir, "camera_photos").apply { mkdirs() }, "photo_${System.currentTimeMillis()}.jpg")
                        cameraPhotoUri = FileProvider.getUriForFile(this@MainActivity, "${packageName}.fileprovider", photoFile)
                        val captureIntent = Intent(MediaStore.ACTION_IMAGE_CAPTURE).apply { putExtra(MediaStore.EXTRA_OUTPUT, cameraPhotoUri) }
                        val resolvedActivities = packageManager.queryIntentActivities(captureIntent, 0)
                        for (resolvedActivity in resolvedActivities) {
                            cameraIntents.add(Intent(captureIntent).apply { setPackage(resolvedActivity.activityInfo.packageName) })
                        }
                    }
                    val galleryIntent = Intent(Intent.ACTION_GET_CONTENT).apply {
                        addCategory(Intent.CATEGORY_OPENABLE)
                        type = "image/*"
                        if (fileChooserParams?.mode == WebChromeClient.FileChooserParams.MODE_OPEN_MULTIPLE) putExtra(Intent.EXTRA_ALLOW_MULTIPLE, true)
                    }
                    val chooserIntent = Intent.createChooser(galleryIntent, "Select Image")
                    if (cameraIntents.isNotEmpty()) chooserIntent.putExtra(Intent.EXTRA_INITIAL_INTENTS, cameraIntents.toTypedArray())
                    fileChooserLauncher.launch(chooserIntent)
                    return true
                } catch (e: Exception) {
                    this@MainActivity.filePathCallback?.onReceiveValue(null)
                    return false
                }
            }
        }
        WebView.setWebContentsDebuggingEnabled(BuildConfig.DEBUG)
    }

    private fun setupBackPressHandler() {
        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                if (!pageReady || errorView.visibility == View.VISIBLE) {
                    goBackOrExit()
                    return
                }
                // Like any Android app: Back first closes an open popup, sheet or
                // menu. The website reports whether it had one to close.
                webView.evaluateJavascript(
                    "(function(){try{return !!(window.__nativeBack&&window.__nativeBack())}catch(e){return false}})()"
                ) { handled ->
                    if (handled != "true" && !isDestroyed) goBackOrExit()
                }
            }
        })
    }

    private fun goBackOrExit() {
        if (webView.canGoBack()) webView.goBack()
        else {
            AlertDialog.Builder(this@MainActivity).setTitle("Exit App").setMessage("Are you sure you want to exit?")
                .setPositiveButton("Yes") { _, _ -> finish() }.setNegativeButton("No", null).show()
        }
    }

    private fun loadUrl(url: String) {
        errorView.visibility = View.GONE
        webView.visibility = View.VISIBLE
        webView.loadUrl(url)
    }

    private fun showErrorPage() {
        webView.visibility = View.GONE
        errorView.visibility = View.VISIBLE
        progressBar.visibility = View.GONE
        swipeRefresh.isRefreshing = false
        handler.removeCallbacks(readinessPoll)
        handler.removeCallbacks(startupWatchdog)
        splash.hideNow()
        window.setBackgroundDrawableResource(R.color.background_dark)
        updateBottomNavBlock()
    }

    private fun injectCustomCSS() {
        val css = "body { -webkit-touch-callout: none; -webkit-user-select: none; } ::-webkit-scrollbar { display: none; }"
        val js = "javascript:(function() { var style = document.createElement('style'); style.type = 'text/css'; style.innerHTML = '$css'; document.head.appendChild(style); })()"
        webView.evaluateJavascript(js, null)
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        handleIntent(intent)
    }

    private fun handleIntent(intent: Intent) {
        val data = intent.data
        if (data != null && data.host == "shirur-express.onrender.com") {
            loadUrl(data.toString())
        }
    }

    override fun onSaveInstanceState(outState: Bundle) {
        super.onSaveInstanceState(outState)
        webView.saveState(outState)
    }

    override fun onRestoreInstanceState(savedInstanceState: Bundle) {
        super.onRestoreInstanceState(savedInstanceState)
        webView.restoreState(savedInstanceState)
    }

    override fun onResume() {
        super.onResume()
        webView.onResume()

        val now = SystemClock.elapsedRealtime()
        val awayFor = if (pausedAt == 0L) 0L else now - pausedAt
        if (newVersionWaiting && awayFor >= RELOAD_AFTER_BACKGROUND_MS && isAppPage(webView.url)) {
            // Coming back after a long break: start on the new version (the cart is saved).
            newVersionWaiting = false
            webView.reload()
        } else if (lastUpdateCheckAt != 0L && now - lastUpdateCheckAt >= UPDATE_CHECK_INTERVAL_MS) {
            checkForWebUpdate()
        }
    }

    override fun onPause() {
        super.onPause()
        pausedAt = SystemClock.elapsedRealtime()
        webView.onPause()
        CookieManager.getInstance().flush()
    }

    override fun onStop() {
        super.onStop()
        CookieManager.getInstance().flush()
    }

    override fun onDestroy() {
        handler.removeCallbacksAndMessages(null)
        CookieManager.getInstance().flush()
        webView.destroy()
        super.onDestroy()
    }

    fun onRetryClick(view: View) {
        loadUrl(WEBSITE_URL)
    }

    inner class AndroidBridge {
        // ---- App shell (since 1.5.0) ----

        // The website calls this as soon as its first screen is drawn, so the splash can lift.
        @android.webkit.JavascriptInterface
        fun appReady() {
            runOnUiThread { if (!isDestroyed) onPageReady() }
        }

        // The website sends the bottom tabs, the selected one, colours and
        // whether the bar should show. Its presence also tells the website not
        // to draw its own bar.
        @android.webkit.JavascriptInterface
        fun setBottomNav(stateJson: String) {
            runOnUiThread { if (!isDestroyed) bottomNav.update(stateJson) }
        }

        // A short vibration for touches that change something: "tap", "success" or "warning".
        // Uses the phone's own touch-feedback setting, so it stays silent if the user turned that off.
        @android.webkit.JavascriptInterface
        fun haptic(kind: String) {
            val effect = when (kind) {
                "success" -> if (Build.VERSION.SDK_INT >= 30) HapticFeedbackConstants.CONFIRM else HapticFeedbackConstants.VIRTUAL_KEY
                "warning" -> if (Build.VERSION.SDK_INT >= 30) HapticFeedbackConstants.REJECT else HapticFeedbackConstants.LONG_PRESS
                else -> HapticFeedbackConstants.VIRTUAL_KEY
            }
            runOnUiThread { if (!isDestroyed) webView.performHapticFeedback(effect) }
        }

        // The website found it is out of date (a file from its version is gone
        // from the server): fetch the newest version, then reload.
        @android.webkit.JavascriptInterface
        fun reloadFresh() {
            runOnUiThread { if (!isDestroyed) checkForWebUpdate(thenReload = true) }
        }

        // The website turns swipe-to-refresh off while the finger is inside a popup or another
        // inner scrolling list, where pulling down means "scroll up", not "reload".
        @android.webkit.JavascriptInterface
        fun setPullToRefreshEnabled(enabled: Boolean) {
            runOnUiThread {
                if (!swipeRefresh.isRefreshing) swipeRefresh.isEnabled = enabled
            }
        }

        // Opens native Razorpay Checkout (supports UPI apps). The website calls this
        // instead of checkout.js when running inside the app; the result comes back
        // through window.__onNativePaymentResult.
        @android.webkit.JavascriptInterface
        fun startRazorpayPayment(optionsJson: String) {
            runOnUiThread {
                try {
                    val options = JSONObject(optionsJson)
                    val checkout = Checkout()
                    checkout.setKeyID(options.getString("key"))
                    checkout.open(this@MainActivity, options)
                } catch (e: Exception) {
                    Log.e("RazorpayCheckout", "Failed to open native checkout", e)
                    sendPaymentResultToWeb(JSONObject().apply {
                        put("status", "error")
                        put("description", "Could not open payment. Please try again.")
                    })
                }
            }
        }

        // ---- Bluetooth thermal printer (delivery bills) ----
        // Async calls answer through window.__onPrinterResult(requestId, result).

        @android.webkit.JavascriptInterface
        fun isPrinterSupported(): Boolean = true

        // Since 1.4.0: receipts can carry a raster image (the logo).
        @android.webkit.JavascriptInterface
        fun printerSupportsImages(): Boolean = true

        @android.webkit.JavascriptInterface
        fun getSavedPrinter(): String = printerManager.savedPrinter()?.toString() ?: ""

        @android.webkit.JavascriptInterface
        fun savePrinter(address: String, name: String) = printerManager.savePrinter(address, name)

        @android.webkit.JavascriptInterface
        fun clearPrinter() = printerManager.clearPrinter()

        @android.webkit.JavascriptInterface
        fun listPairedPrinters(requestId: String) {
            withBluetoothPermission { granted ->
                if (!granted) {
                    sendPrinterResultToWeb(requestId, printerError("PERMISSION_DENIED", "Allow 'Nearby devices' permission to use the printer."))
                    return@withBluetoothPermission
                }
                val result = try {
                    JSONObject().put("ok", true).put("devices", printerManager.pairedDevices())
                } catch (e: PrinterManager.PrinterException) {
                    printerError(e.code, e.message ?: "Bluetooth error")
                } catch (e: Exception) {
                    Log.e("Printer", "Could not list paired devices", e)
                    printerError("LIST_FAILED", "Could not read paired Bluetooth devices.")
                }
                sendPrinterResultToWeb(requestId, result)
            }
        }

        @android.webkit.JavascriptInterface
        fun printReceipt(requestId: String, payloadJson: String) {
            withBluetoothPermission { granted ->
                if (!granted) {
                    sendPrinterResultToWeb(requestId, printerError("PERMISSION_DENIED", "Allow 'Nearby devices' permission to use the printer."))
                    return@withBluetoothPermission
                }
                printerManager.print(payloadJson) { result -> sendPrinterResultToWeb(requestId, result) }
            }
        }

        @android.webkit.JavascriptInterface
        fun openBluetoothSettings() {
            runOnUiThread {
                try {
                    startActivity(Intent(Settings.ACTION_BLUETOOTH_SETTINGS))
                } catch (e: Exception) {
                    Log.e("Printer", "Could not open Bluetooth settings", e)
                }
            }
        }

        @android.webkit.JavascriptInterface
        fun getFcmToken(): String {
            val prefs = getSharedPreferences("app_prefs", Context.MODE_PRIVATE)
            return prefs.getString("fcm_token", "") ?: ""
        }

        @android.webkit.JavascriptInterface
        fun isNativeApp(): Boolean = true

        // The website compares this with the latest Play Store version to show the update popup.
        @android.webkit.JavascriptInterface
        fun getAppVersionCode(): Int = BuildConfig.VERSION_CODE

        @android.webkit.JavascriptInterface
        fun showToast(message: String) {
            runOnUiThread { Toast.makeText(this@MainActivity, message, Toast.LENGTH_SHORT).show() }
        }

        @android.webkit.JavascriptInterface
        fun isNotificationPermissionGranted(): Boolean = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) ContextCompat.checkSelfPermission(this@MainActivity, Manifest.permission.POST_NOTIFICATIONS) == PackageManager.PERMISSION_GRANTED else true

        @android.webkit.JavascriptInterface
        fun isFullScreenIntentGranted(): Boolean = if (Build.VERSION.SDK_INT >= 34) getSystemService(NotificationManager::class.java)?.canUseFullScreenIntent() ?: false else true

        @android.webkit.JavascriptInterface
        fun getPermissionStatus(): String {
            // Overlay and battery-optimization exemptions are intentionally not
            // requested. Firebase notifications remain the delivery mechanism.
            val status = mapOf("displayOverApps" to true, "batteryOptimization" to true, "notifications" to isNotificationPermissionGranted(), "fullScreenIntent" to isFullScreenIntentGranted())
            return org.json.JSONObject(status).toString()
        }

        @android.webkit.JavascriptInterface
        fun requestSystemPermissions() {
            runOnUiThread {
                checkAllPermissions()
                // This is only reached from the provider-facing permission banner,
                // never automatically during app launch.
                if (Build.VERSION.SDK_INT >= 34 && !isFullScreenIntentGranted()) {
                    startActivity(Intent(
                        Settings.ACTION_MANAGE_APP_USE_FULL_SCREEN_INTENT,
                        Uri.fromParts("package", packageName, null)
                    ))
                }
            }
        }

        @android.webkit.JavascriptInterface
        fun areAllPermissionsGranted(): Boolean = isNotificationPermissionGranted() && isFullScreenIntentGranted()

        @android.webkit.JavascriptInterface
        fun logFacebookEvent(eventName: String, paramsJson: String) {
            try {
                val params = Bundle()
                val jsonObj = org.json.JSONObject(paramsJson)
                val keys = jsonObj.keys()
                while (keys.hasNext()) {
                    val key = keys.next()
                    val value = jsonObj.get(key)
                    when (value) {
                        is String -> params.putString(key, value)
                        is Int -> params.putInt(key, value)
                        is Double -> params.putDouble(key, value)
                        is Boolean -> params.putBoolean(key, value)
                        else -> params.putString(key, value.toString())
                    }
                }
                if (::fbLogger.isInitialized) {
                    fbLogger.logEvent(eventName, params)
                }
            } catch (e: Exception) { }
        }

        @android.webkit.JavascriptInterface
        fun logFacebookPurchase(amount: Double, currency: String, paramsJson: String) {
            try {
                val params = Bundle()
                val jsonObj = org.json.JSONObject(paramsJson)
                val keys = jsonObj.keys()
                while (keys.hasNext()) {
                    val key = keys.next()
                    val value = jsonObj.get(key)
                    when (value) {
                        is String -> params.putString(key, value)
                        is Int -> params.putInt(key, value)
                        is Double -> params.putDouble(key, value)
                        else -> params.putString(key, value.toString())
                    }
                }
                if (::fbLogger.isInitialized) {
                    fbLogger.logPurchase(java.math.BigDecimal(amount), java.util.Currency.getInstance(currency), params)
                }
            } catch (e: Exception) { }
        }
    }

    // --- Native Razorpay Checkout results, forwarded to the website ---
    override fun onPaymentSuccess(razorpayPaymentId: String?, paymentData: PaymentData?) {
        sendPaymentResultToWeb(JSONObject().apply {
            put("status", "success")
            put("razorpay_payment_id", paymentData?.paymentId ?: razorpayPaymentId ?: "")
            put("razorpay_order_id", paymentData?.orderId ?: "")
            put("razorpay_signature", paymentData?.signature ?: "")
        })
    }

    override fun onPaymentError(code: Int, response: String?, paymentData: PaymentData?) {
        var description = "Payment failed. Please try again."
        try {
            val error = JSONObject(response ?: "{}").optJSONObject("error")
            error?.optString("description")?.takeIf { it.isNotBlank() }?.let { description = it }
        } catch (e: Exception) { }
        sendPaymentResultToWeb(JSONObject().apply {
            put("status", if (code == Checkout.PAYMENT_CANCELED) "cancelled" else "error")
            put("code", code)
            put("description", description)
        })
    }

    private fun sendPaymentResultToWeb(result: JSONObject) {
        runOnUiThread {
            webView.evaluateJavascript(
                "window.__onNativePaymentResult && window.__onNativePaymentResult($result);",
                null
            )
        }
    }
}
