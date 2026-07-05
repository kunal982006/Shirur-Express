package com.shirurexpress.app

import android.annotation.SuppressLint
import android.content.Context
import android.content.Intent
import android.content.IntentSender
import android.graphics.Bitmap
import android.net.Uri
import android.os.Bundle
import android.os.Environment
import android.provider.MediaStore
import android.view.KeyEvent
import android.view.View
import android.webkit.*
import android.widget.ProgressBar
import android.widget.Toast
import androidx.activity.OnBackPressedCallback
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout
import android.Manifest
import android.app.AlarmManager
import android.app.NotificationManager
import android.content.pm.PackageManager
import android.os.Build
import android.provider.Settings
import android.util.Log
import androidx.activity.result.contract.ActivityResultContracts
import androidx.activity.result.IntentSenderRequest
import androidx.core.content.ContextCompat
import androidx.core.content.FileProvider
import com.google.android.gms.common.api.ResolvableApiException
import com.google.android.gms.location.*
import com.google.android.gms.tasks.Task
import java.io.File
import com.razorpay.Razorpay
import androidx.activity.enableEdgeToEdge
import com.facebook.FacebookSdk
import com.facebook.appevents.AppEventsLogger

class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView
    private lateinit var progressBar: ProgressBar
    private lateinit var swipeRefresh: SwipeRefreshLayout
    private lateinit var errorView: View
    
    // Razorpay WebView SDK for UPI Intent
    private var razorpayInstance: Razorpay? = null
    
    // Facebook SDK App Events Logger
    private lateinit var fbLogger: AppEventsLogger

    // File upload callback for WebView file chooser
    private var filePathCallback: ValueCallback<Array<Uri>>? = null
    // URI for camera-captured photo
    private var cameraPhotoUri: Uri? = null

    // Unified permission request launcher
    private val permissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { permissions ->
        val deniedPermissions = permissions.filter { !it.value }.map { it.key }
        
        if (deniedPermissions.isEmpty()) {
            checkGpsEnabled()
            checkSpecialPermissions()
        } else {
            showPermissionRationale(deniedPermissions)
        }
    }

    private val enableGpsLauncher = registerForActivityResult(
        ActivityResultContracts.StartIntentSenderForResult()
    ) { result ->
        if (result.resultCode == RESULT_OK) {
            Toast.makeText(this, "GPS Enabled", Toast.LENGTH_SHORT).show()
            webView.reload()
        } else {
            Toast.makeText(this, "GPS is required for location features", Toast.LENGTH_SHORT).show()
        }
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

        setupWebView()

        swipeRefresh.setColorSchemeResources(R.color.purple_500)
        swipeRefresh.setOnRefreshListener {
            webView.reload()
        }

        try {
            razorpayInstance = Razorpay(this, "rzp_live_T1RpMaRRbOqLuO")
            razorpayInstance?.setWebView(webView)
        } catch (e: Exception) {
            Log.e("RazorpayInit", "Failed to initialize Razorpay WebView SDK", e)
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
        checkAllPermissions()
    }

    private fun checkAllPermissions() {
        val permissionsToRequest = mutableListOf<String>()
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
                permissionsToRequest.add(Manifest.permission.POST_NOTIFICATIONS)
            }
        }
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.CAMERA) != PackageManager.PERMISSION_GRANTED) {
            permissionsToRequest.add(Manifest.permission.CAMERA)
        }
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
            permissionsToRequest.add(Manifest.permission.ACCESS_FINE_LOCATION)
            permissionsToRequest.add(Manifest.permission.ACCESS_COARSE_LOCATION)
        }
        if (permissionsToRequest.isNotEmpty()) {
            permissionLauncher.launch(permissionsToRequest.toTypedArray())
        } else {
            checkGpsEnabled()
            checkSpecialPermissions()
        }
    }

    private fun checkSpecialPermissions() {
        if (Build.VERSION.SDK_INT >= 34) {
            val notificationManager = getSystemService(NotificationManager::class.java)
            if (notificationManager != null && !notificationManager.canUseFullScreenIntent()) {
                AlertDialog.Builder(this)
                    .setTitle("Full Screen Access Needed")
                    .setMessage("To allow the app to ring for new orders even when your phone is locked, please enable 'Full Screen Intent' in settings.")
                    .setPositiveButton("Go to Settings") { _, _ ->
                        try {
                            val intent = Intent(Settings.ACTION_MANAGE_APP_USE_FULL_SCREEN_INTENT, Uri.fromParts("package", packageName, null))
                            startActivity(intent)
                        } catch (e: Exception) {
                            try {
                                val intent = Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS).apply {
                                    putExtra(Settings.EXTRA_APP_PACKAGE, packageName)
                                }
                                startActivity(intent)
                            } catch (e2: Exception) {
                                startActivity(Intent(Settings.ACTION_SETTINGS))
                            }
                        }
                    }
                    .setNegativeButton("Later", null).show()
            }
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            val alarmManager = getSystemService(AlarmManager::class.java)
            if (alarmManager != null && !alarmManager.canScheduleExactAlarms()) {
                AlertDialog.Builder(this)
                    .setTitle("Precise Notifications")
                    .setMessage("To ensure order alerts arrive exactly on time, please allow the app to set exact alarms.")
                    .setPositiveButton("Settings") { _, _ ->
                        val intent = Intent(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM, Uri.fromParts("package", packageName, null))
                        startActivity(intent)
                    }
                    .setNegativeButton("Later", null).show()
            }
        }
    }

    private fun showPermissionRationale(deniedPermissions: List<String>) {
        val message = StringBuilder("This app needs the following permissions to function correctly:\n")
        if (deniedPermissions.contains(Manifest.permission.POST_NOTIFICATIONS)) message.append("- Notifications: To alert you of new orders\n")
        if (deniedPermissions.contains(Manifest.permission.CAMERA)) message.append("- Camera: To upload photos\n")
        if (deniedPermissions.contains(Manifest.permission.ACCESS_FINE_LOCATION)) message.append("- Location: To track orders\n")
        AlertDialog.Builder(this).setTitle("Permissions Required").setMessage(message.append("\nPlease grant them in Settings.").toString())
            .setPositiveButton("Settings") { _, _ ->
                startActivity(Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, Uri.fromParts("package", packageName, null)))
            }.setNegativeButton("Cancel", null).show()
    }

    private fun checkGpsEnabled() {
        val locationRequest = LocationRequest.Builder(Priority.PRIORITY_HIGH_ACCURACY, 10000).build()
        val builder = LocationSettingsRequest.Builder().addLocationRequest(locationRequest)
        LocationServices.getSettingsClient(this).checkLocationSettings(builder.build())
            .addOnFailureListener { exception ->
                if (exception is ResolvableApiException) {
                    try {
                        enableGpsLauncher.launch(IntentSenderRequest.Builder(exception.resolution).build())
                    } catch (sendEx: Exception) { }
                }
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
            allowFileAccess = true
            allowContentAccess = true
            mixedContentMode = WebSettings.MIXED_CONTENT_COMPATIBILITY_MODE
            mediaPlaybackRequiresUserGesture = false
            setSupportMultipleWindows(false)
            javaScriptCanOpenWindowsAutomatically = true
            setGeolocationEnabled(true)
        }

        webView.addJavascriptInterface(AndroidBridge(), "AndroidApp")

        webView.webViewClient = object : WebViewClient() {
            override fun onPageStarted(view: WebView?, url: String?, favicon: Bitmap?) {
                super.onPageStarted(view, url, favicon)
                progressBar.visibility = View.VISIBLE
                errorView.visibility = View.GONE
            }

            override fun onPageFinished(view: WebView?, url: String?) {
                super.onPageFinished(view, url)
                progressBar.visibility = View.GONE
                swipeRefresh.isRefreshing = false
                injectCustomCSS()
            }

            override fun onReceivedError(view: WebView?, request: WebResourceRequest?, error: WebResourceError?) {
                if (request?.isForMainFrame == true) showErrorPage()
            }

            override fun shouldOverrideUrlLoading(view: WebView?, request: WebResourceRequest?): Boolean {
                val url = request?.url?.toString() ?: return false
                if (url.contains("shirur-express.onrender.com") || url.contains("razorpay.com")) return false
                
                if (url.startsWith("upi:") || url.startsWith("intent:") || url.startsWith("paytmmp:") || url.startsWith("phonepe:") || url.startsWith("tez:")) {
                    try {
                        val intent = Intent.parseUri(url, Intent.URI_INTENT_SCHEME)
                        if (intent != null) {
                            startActivity(intent)
                            return true
                        }
                    } catch (e: Exception) { }
                    return true
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
                callback?.invoke(origin, true, false)
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
                if (webView.canGoBack()) webView.goBack()
                else {
                    AlertDialog.Builder(this@MainActivity).setTitle("Exit App").setMessage("Are you sure you want to exit?")
                        .setPositiveButton("Yes") { _, _ -> finish() }.setNegativeButton("No", null).show()
                }
            }
        })
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
    }

    override fun onPause() {
        super.onPause()
        webView.onPause()
    }

    override fun onDestroy() {
        webView.destroy()
        super.onDestroy()
    }

    fun onRetryClick(view: View) {
        loadUrl(WEBSITE_URL)
    }

    inner class AndroidBridge {
        @android.webkit.JavascriptInterface
        fun getFcmToken(): String {
            val prefs = getSharedPreferences("app_prefs", Context.MODE_PRIVATE)
            return prefs.getString("fcm_token", "") ?: ""
        }

        @android.webkit.JavascriptInterface
        fun isNativeApp(): Boolean = true

        @android.webkit.JavascriptInterface
        fun showToast(message: String) {
            runOnUiThread { Toast.makeText(this@MainActivity, message, Toast.LENGTH_SHORT).show() }
        }

        @android.webkit.JavascriptInterface
        fun isDisplayOverAppsGranted(): Boolean = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) Settings.canDrawOverlays(this@MainActivity) else true

        @android.webkit.JavascriptInterface
        fun isBatteryOptimizationDisabled(): Boolean = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) (getSystemService(Context.POWER_SERVICE) as android.os.PowerManager).isIgnoringBatteryOptimizations(packageName) else true

        @android.webkit.JavascriptInterface
        fun isNotificationPermissionGranted(): Boolean = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) ContextCompat.checkSelfPermission(this@MainActivity, Manifest.permission.POST_NOTIFICATIONS) == PackageManager.PERMISSION_GRANTED else true

        @android.webkit.JavascriptInterface
        fun isFullScreenIntentGranted(): Boolean = if (Build.VERSION.SDK_INT >= 34) getSystemService(NotificationManager::class.java)?.canUseFullScreenIntent() ?: false else true

        @android.webkit.JavascriptInterface
        fun getPermissionStatus(): String {
            val status = mapOf("displayOverApps" to isDisplayOverAppsGranted(), "batteryOptimization" to isBatteryOptimizationDisabled(), "notifications" to isNotificationPermissionGranted(), "fullScreenIntent" to isFullScreenIntentGranted())
            return org.json.JSONObject(status).toString()
        }

        @android.webkit.JavascriptInterface
        fun requestDisplayOverApps() {
            runOnUiThread {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                    startActivity(Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION, Uri.fromParts("package", packageName, null)))
                }
            }
        }

        @android.webkit.JavascriptInterface
        fun requestBatteryOptimization() {
            runOnUiThread {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                    startActivity(Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS, Uri.fromParts("package", packageName, null)))
                }
            }
        }

        @android.webkit.JavascriptInterface
        fun areAllPermissionsGranted(): Boolean = isNotificationPermissionGranted() && isBatteryOptimizationDisabled() && isFullScreenIntentGranted()

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

    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        super.onActivityResult(requestCode, resultCode, data)
        razorpayInstance?.onActivityResult(requestCode, resultCode, data)
    }
}
