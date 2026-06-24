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

class MainActivity : AppCompatActivity() {

    private lateinit
    var webView: WebView
    private lateinit var progressBar: ProgressBar
    private lateinit var swipeRefresh: SwipeRefreshLayout
    private lateinit var errorView: View
    
    // Razorpay WebView SDK for UPI Intent
    private var razorpayInstance: Razorpay? = null

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
            // All requested permissions granted
            checkGpsEnabled()
            checkSpecialPermissions()
        } else {
            // Some permissions denied. Show rationale or guide to settings.
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
        // Handle the file chooser result
        if (result.resultCode == RESULT_OK) {
            val data = result.data
            val resultUris: Array<Uri>? = when {
                // Handle multiple file selection
                data?.clipData != null -> {
                    val clipData = data.clipData!!
                    Array(clipData.itemCount) { i -> clipData.getItemAt(i).uri }
                }
                // Handle single file selection from gallery
                data?.data != null -> {
                    arrayOf(data.data!!)
                }
                // No data from intent = camera was used, use the saved camera URI
                cameraPhotoUri != null -> {
                    arrayOf(cameraPhotoUri!!)
                }
                else -> null
            }
            filePathCallback?.onReceiveValue(resultUris ?: arrayOf())
        } else {
            // User cancelled the file picker - MUST call with null to prevent WebView from getting stuck
            filePathCallback?.onReceiveValue(null)
        }
        // Clear the callbacks after use
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

        // Initialize views
        webView = findViewById(R.id.webView)
        progressBar = findViewById(R.id.progressBar)
        swipeRefresh = findViewById(R.id.swipeRefresh)
        errorView = findViewById(R.id.errorView)

        // Setup WebView
        setupWebView()

        // Setup SwipeRefresh
        swipeRefresh.setColorSchemeResources(R.color.purple_500)
        swipeRefresh.setOnRefreshListener {
            webView.reload()
        }

        // Initialize Razorpay WebView SDK for UPI Intents
        try {
            razorpayInstance = Razorpay(this, "rzp_live_T1RpMaRRbOqLuO")
            razorpayInstance?.setWebView(webView)
        } catch (e: Exception) {
            Log.e("RazorpayInit", "Failed to initialize Razorpay WebView SDK", e)
        }

        // Setup back button handling
        setupBackPressHandler()

        // Load the website
        if (savedInstanceState == null) {
            loadUrl(WEBSITE_URL)
        }

        // Handle deep links
        handleIntent(intent)
        
        // Request All Necessary Permissions at Startup
        checkAllPermissions()
    }

    private fun checkAllPermissions() {
        val permissionsToRequest = mutableListOf<String>()

        // 1. Notifications (Android 13+)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
                permissionsToRequest.add(Manifest.permission.POST_NOTIFICATIONS)
            }
        }

        // 2. Camera
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.CAMERA) != PackageManager.PERMISSION_GRANTED) {
            permissionsToRequest.add(Manifest.permission.CAMERA)
        }

        // 3. Location
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
            permissionsToRequest.add(Manifest.permission.ACCESS_FINE_LOCATION)
            permissionsToRequest.add(Manifest.permission.ACCESS_COARSE_LOCATION)
        }

        // 4. Media/Storage Access — NOT NEEDED
        // The Android image picker (ACTION_GET_CONTENT) and camera capture
        // via FileProvider do NOT require READ_MEDIA_IMAGES or READ_EXTERNAL_STORAGE.
        // Removed to comply with Play Store guidelines.

        if (permissionsToRequest.isNotEmpty()) {
            permissionLauncher.launch(permissionsToRequest.toTypedArray())
        } else {
            // All core permissions are already granted
            checkGpsEnabled()
            checkSpecialPermissions()
        }
    }

    private fun checkSpecialPermissions() {
        // 1. Android 14+ Full Screen Intent Check (Important for Ringing)
        if (Build.VERSION.SDK_INT >= 34) { // Android 14 (U)
            val notificationManager = getSystemService(NotificationManager::class.java)
            if (notificationManager != null && !notificationManager.canUseFullScreenIntent()) {
                AlertDialog.Builder(this)
                    .setTitle("Full Screen Access Needed")
                    .setMessage("To allow the app to ring for new orders even when your phone is locked, please enable 'Full Screen Intent' in settings.")
                    .setPositiveButton("Go to Settings") { _, _ ->
                        try {
                            // For Android 14 (API 34+), use the proper settings action
                            val intent = Intent(Settings.ACTION_MANAGE_APP_USE_FULL_SCREEN_INTENT)
                            intent.data = Uri.fromParts("package", packageName, null)
                            startActivity(intent)
                        } catch (e: Exception) {
                            // Fallback to app notification settings
                            try {
                                val intent = Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS)
                                intent.putExtra(Settings.EXTRA_APP_PACKAGE, packageName)
                                startActivity(intent)
                            } catch (e2: Exception) {
                                val intent = Intent(Settings.ACTION_SETTINGS)
                                startActivity(intent)
                            }
                        }
                    }
                    .setNegativeButton("Later", null)
                    .show()
            }
        }

        // 2. Exact Alarm Permission (Android 12+)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            val alarmManager = getSystemService(AlarmManager::class.java)
            if (alarmManager != null && !alarmManager.canScheduleExactAlarms()) {
                AlertDialog.Builder(this)
                    .setTitle("Precise Notifications")
                    .setMessage("To ensure order alerts arrive exactly on time, please allow the app to set exact alarms.")
                    .setPositiveButton("Settings") { _, _ ->
                        val intent = Intent(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM)
                        intent.data = Uri.fromParts("package", packageName, null)
                        startActivity(intent)
                    }
                    .setNegativeButton("Later", null)
                    .show()
            }
        }
    }

    private fun showPermissionRationale(deniedPermissions: List<String>) {
        val message = StringBuilder("This app needs the following permissions to function correctly:\n")
        
        if (deniedPermissions.contains(Manifest.permission.POST_NOTIFICATIONS)) {
            message.append("- Notifications: To alert you of new orders\n")
        }
        if (deniedPermissions.contains(Manifest.permission.CAMERA)) {
            message.append("- Camera: To upload profile and item photos\n")
        }
        if (deniedPermissions.contains(Manifest.permission.ACCESS_FINE_LOCATION)) {
            message.append("- Location: To show delivery routes and track orders\n")
        }


        message.append("\nPlease grant them in App Settings.")

        AlertDialog.Builder(this)
            .setTitle("Permissions Required")
            .setMessage(message.toString())
            .setPositiveButton("Open Settings") { _, _ ->
                val intent = Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS)
                intent.data = Uri.fromParts("package", packageName, null)
                startActivity(intent)
            }
            .setNegativeButton("Cancel", null)
            .show()
    }

    private fun checkGpsEnabled() {
        val locationRequest = LocationRequest.Builder(Priority.PRIORITY_HIGH_ACCURACY, 10000).build()
        val builder = LocationSettingsRequest.Builder().addLocationRequest(locationRequest)
        val client: SettingsClient = LocationServices.getSettingsClient(this)
        val task: Task<LocationSettingsResponse> = client.checkLocationSettings(builder.build())

        task.addOnSuccessListener { 
            // All location settings are satisfied.
        }

        task.addOnFailureListener { exception ->
            if (exception is ResolvableApiException) {
                try {
                    val intentSenderRequest = IntentSenderRequest.Builder(exception.resolution).build()
                    enableGpsLauncher.launch(intentSenderRequest)
                } catch (sendEx: IntentSender.SendIntentException) {
                    // Ignore the error.
                }
            }
        }
    }

    @SuppressLint("SetJavaScriptEnabled")
    private fun setupWebView() {
        webView.settings.apply {
            // Enable JavaScript
            javaScriptEnabled = true
            
            // Enable DOM Storage (localStorage, sessionStorage)
            domStorageEnabled = true
            
            // Enable database storage
            databaseEnabled = true
            
            // Set custom User Agent
            userAgentString = "$userAgentString $APP_USER_AGENT"
            
            // Enable zoom controls
            builtInZoomControls = true
            displayZoomControls = false
            
            // Enable wide viewport
            useWideViewPort = true
            loadWithOverviewMode = true
            
            // Enable caching
            cacheMode = WebSettings.LOAD_DEFAULT
            
            // Allow file access
            allowFileAccess = true
            allowContentAccess = true
            
            // Enable mixed content (if needed)
            mixedContentMode = WebSettings.MIXED_CONTENT_COMPATIBILITY_MODE
            
            // Enable media playback without user gesture
            mediaPlaybackRequiresUserGesture = false
            
            // Support multiple windows
            setSupportMultipleWindows(false)
            javaScriptCanOpenWindowsAutomatically = true
            
            // Geolocation
            setGeolocationEnabled(true)
        }

        // Add JavaScript interface for native bridge
        webView.addJavascriptInterface(AndroidBridge(), "AndroidApp")

        // Set WebView client for handling page navigation
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
                
                // Inject CSS to hide any browser-specific elements
                injectCustomCSS()
            }

            override fun onReceivedError(
                view: WebView?,
                request: WebResourceRequest?,
                error: WebResourceError?
            ) {
                super.onReceivedError(view, request, error)
                if (request?.isForMainFrame == true) {
                    showErrorPage()
                }
            }

            override fun shouldOverrideUrlLoading(
                view: WebView?,
                request: WebResourceRequest?
            ): Boolean {
                val url = request?.url?.toString() ?: return false
                
                // Handle internal URLs
                if (url.contains("shirur-express.onrender.com")) {
                    return false // Let WebView handle it
                }
                
                // Allow Razorpay checkout/API URLs to load inside WebView
                if (url.contains("razorpay.com")) {
                    return false // Let WebView handle Razorpay URLs
                }

                // Handle UPI deep links (Razorpay UPI Intent flow)
                if (url.startsWith("upi://")) {
                    try {
                        val intent = Intent(Intent.ACTION_VIEW, Uri.parse(url))
                        startActivity(intent)
                    } catch (e: Exception) {
                        Log.e("MainActivity", "No UPI app found to handle: $url", e)
                        Toast.makeText(this@MainActivity, "No UPI app found on this device", Toast.LENGTH_SHORT).show()
                    }
                    return true
                }

                // Handle intent:// scheme URLs (used by some payment flows)
                if (url.startsWith("intent://")) {
                    try {
                        val intent = Intent.parseUri(url, Intent.URI_INTENT_SCHEME)
                        if (intent.resolveActivity(packageManager) != null) {
                            startActivity(intent)
                        } else {
                            // Try fallback URL if available
                            val fallbackUrl = intent.getStringExtra("browser_fallback_url")
                            if (!fallbackUrl.isNullOrEmpty()) {
                                view?.loadUrl(fallbackUrl)
                            }
                        }
                    } catch (e: Exception) {
                        Log.e("MainActivity", "Failed to handle intent URL: $url", e)
                    }
                    return true
                }

                // Handle external URLs (open in browser)
                if (url.startsWith("http://") || url.startsWith("https://")) {
                    val intent = Intent(Intent.ACTION_VIEW, Uri.parse(url))
                    startActivity(intent)
                    return true
                }
                
                // Handle tel: links
                if (url.startsWith("tel:")) {
                    val intent = Intent(Intent.ACTION_DIAL, Uri.parse(url))
                    startActivity(intent)
                    return true
                }
                
                // Handle mailto: links
                if (url.startsWith("mailto:")) {
                    val intent = Intent(Intent.ACTION_SENDTO, Uri.parse(url))
                    startActivity(intent)
                    return true
                }
                
                // Handle WhatsApp links
                if (url.contains("whatsapp.com") || url.startsWith("whatsapp:")) {
                    try {
                        val intent = Intent(Intent.ACTION_VIEW, Uri.parse(url))
                        startActivity(intent)
                    } catch (e: Exception) {
                        Toast.makeText(this@MainActivity, "WhatsApp not installed", Toast.LENGTH_SHORT).show()
                    }
                    return true
                }
                
                return false
            }
        }

        // Set WebChromeClient for JavaScript dialogs, file uploads, etc.
        webView.webChromeClient = object : WebChromeClient() {
            
            override fun onProgressChanged(view: WebView?, newProgress: Int) {
                progressBar.progress = newProgress
                if (newProgress == 100) {
                    progressBar.visibility = View.GONE
                }
            }

            override fun onJsAlert(
                view: WebView?,
                url: String?,
                message: String?,
                result: JsResult?
            ): Boolean {
                AlertDialog.Builder(this@MainActivity)
                    .setTitle("Shirur Express")
                    .setMessage(message)
                    .setPositiveButton("OK") { _, _ -> result?.confirm() }
                    .setCancelable(false)
                    .show()
                return true
            }

            override fun onJsConfirm(
                view: WebView?,
                url: String?,
                message: String?,
                result: JsResult?
            ): Boolean {
                AlertDialog.Builder(this@MainActivity)
                    .setTitle("Shirur Express")
                    .setMessage(message)
                    .setPositiveButton("OK") { _, _ -> result?.confirm() }
                    .setNegativeButton("Cancel") { _, _ -> result?.cancel() }
                    .setCancelable(false)
                    .show()
                return true
            }

            override fun onGeolocationPermissionsShowPrompt(
                origin: String?,
                callback: GeolocationPermissions.Callback?
            ) {
                callback?.invoke(origin, true, false)
            }

            /**
             * Handle file upload requests from WebView (e.g., <input type="file">)
             * This is called when the user clicks on a file input in the web page.
             */
            override fun onShowFileChooser(
                webView: WebView?,
                filePathCallback: ValueCallback<Array<Uri>>?,
                fileChooserParams: FileChooserParams?
            ): Boolean {
                // If there's a pending callback, cancel it first to prevent the WebView from getting stuck
                this@MainActivity.filePathCallback?.onReceiveValue(null)
                
                // Save the new callback
                this@MainActivity.filePathCallback = filePathCallback
                
                try {
                    // --- Option 1: Camera Capture Intent ---
                    val cameraIntents = mutableListOf<Intent>()
                    
                    // Only add camera option if camera permission is granted
                    if (ContextCompat.checkSelfPermission(this@MainActivity, Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED) {
                        val photoFile = File(
                            File(cacheDir, "camera_photos").apply { mkdirs() },
                            "photo_${System.currentTimeMillis()}.jpg"
                        )
                        cameraPhotoUri = FileProvider.getUriForFile(
                            this@MainActivity,
                            "${packageName}.fileprovider",
                            photoFile
                        )
                        
                        val captureIntent = Intent(MediaStore.ACTION_IMAGE_CAPTURE).apply {
                            putExtra(MediaStore.EXTRA_OUTPUT, cameraPhotoUri)
                        }
                        // Add all activities that can handle camera capture
                        val resolvedActivities = packageManager.queryIntentActivities(captureIntent, 0)
                        for (resolvedActivity in resolvedActivities) {
                            val targetIntent = Intent(captureIntent).apply {
                                setPackage(resolvedActivity.activityInfo.packageName)
                            }
                            cameraIntents.add(targetIntent)
                        }
                    }
                    
                    // --- Option 2: Gallery / File Picker Intent ---
                    val galleryIntent = Intent(Intent.ACTION_GET_CONTENT).apply {
                        addCategory(Intent.CATEGORY_OPENABLE)
                        type = "image/*"
                        if (fileChooserParams?.mode == FileChooserParams.MODE_OPEN_MULTIPLE) {
                            putExtra(Intent.EXTRA_ALLOW_MULTIPLE, true)
                        }
                    }
                    
                    // --- Create a chooser that includes both camera and gallery ---
                    val chooserIntent = Intent.createChooser(galleryIntent, "Select Image")
                    if (cameraIntents.isNotEmpty()) {
                        chooserIntent.putExtra(Intent.EXTRA_INITIAL_INTENTS, cameraIntents.toTypedArray())
                    }
                    
                    fileChooserLauncher.launch(chooserIntent)
                    return true
                } catch (e: Exception) {
                    Log.e("MainActivity", "Error launching file chooser", e)
                    this@MainActivity.filePathCallback?.onReceiveValue(null)
                    this@MainActivity.filePathCallback = null
                    cameraPhotoUri = null
                    Toast.makeText(this@MainActivity, "Cannot open file chooser", Toast.LENGTH_SHORT).show()
                    return false
                }
            }
        }

        // Enable debugging in debug builds
        WebView.setWebContentsDebuggingEnabled(BuildConfig.DEBUG)
    }

    private fun setupBackPressHandler() {
        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                if (webView.canGoBack()) {
                    webView.goBack()
                } else {
                    // Show exit confirmation
                    AlertDialog.Builder(this@MainActivity)
                        .setTitle("Exit App")
                        .setMessage("Are you sure you want to exit?")
                        .setPositiveButton("Yes") { _, _ -> finish() }
                        .setNegativeButton("No", null)
                        .show()
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
        // Inject CSS to ensure full-screen experience
        val css = """
            body {
                -webkit-touch-callout: none;
                -webkit-user-select: none;
            }
            ::-webkit-scrollbar {
                display: none;
            }
        """.trimIndent()
        
        val js = "javascript:(function() { " +
                "var style = document.createElement('style'); " +
                "style.type = 'text/css'; " +
                "style.innerHTML = '${css.replace("\n", " ")}'; " +
                "document.head.appendChild(style); " +
                "})()"
        
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

    // Public method for retry button
    fun onRetryClick(view: View) {
        loadUrl(WEBSITE_URL)
    }

    /**
     * JavaScript Interface to expose native Android functionality to the WebView.
     * The WebView can call window.AndroidApp.getFcmToken() to get the FCM token.
     */
    inner class AndroidBridge {
        
        /**
         * Get the FCM token stored in SharedPreferences.
         * Called from JavaScript: window.AndroidApp.getFcmToken()
         */
        @android.webkit.JavascriptInterface
        fun getFcmToken(): String {
            val prefs = getSharedPreferences("app_prefs", Context.MODE_PRIVATE)
            val token = prefs.getString("fcm_token", "") ?: ""
            Log.d("AndroidBridge", "getFcmToken called, token: ${if (token.isNotEmpty()) "exists (length: ${token.length})" else "empty"}")
            return token
        }

        /**
         * Check if running inside the native Android app.
         * Called from JavaScript: window.AndroidApp.isNativeApp()
         */
        @android.webkit.JavascriptInterface
        fun isNativeApp(): Boolean {
            return true
        }

        /**
         * Show a native Toast message.
         * Called from JavaScript: window.AndroidApp.showToast("message")
         */
        @android.webkit.JavascriptInterface
        fun showToast(message: String) {
            runOnUiThread {
                Toast.makeText(this@MainActivity, message, Toast.LENGTH_SHORT).show()
            }
        }

        // ============ PERMISSION CHECK METHODS ============

        /**
         * Check if "Display Over Other Apps" permission is granted.
         * Called from JavaScript: window.AndroidApp.isDisplayOverAppsGranted()
         */
        @android.webkit.JavascriptInterface
        fun isDisplayOverAppsGranted(): Boolean {
            return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                Settings.canDrawOverlays(this@MainActivity)
            } else {
                true // Permission not needed for older versions
            }
        }

        /**
         * Check if Battery Optimization is disabled for this app.
         * Called from JavaScript: window.AndroidApp.isBatteryOptimizationDisabled()
         */
        @android.webkit.JavascriptInterface
        fun isBatteryOptimizationDisabled(): Boolean {
            return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                val powerManager = getSystemService(Context.POWER_SERVICE) as android.os.PowerManager
                powerManager.isIgnoringBatteryOptimizations(packageName)
            } else {
                true // Permission not needed for older versions
            }
        }

        /**
         * Check if Notification permission is granted (Android 13+).
         * Called from JavaScript: window.AndroidApp.isNotificationPermissionGranted()
         */
        @android.webkit.JavascriptInterface
        fun isNotificationPermissionGranted(): Boolean {
            return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                ContextCompat.checkSelfPermission(
                    this@MainActivity, 
                    Manifest.permission.POST_NOTIFICATIONS
                ) == PackageManager.PERMISSION_GRANTED
            } else {
                true // Permission not needed for older versions
            }
        }

        /**
         * Check if Full Screen Intent permission is granted (Android 14+).
         * Called from JavaScript: window.AndroidApp.isFullScreenIntentGranted()
         */
        @android.webkit.JavascriptInterface
        fun isFullScreenIntentGranted(): Boolean {
            return if (Build.VERSION.SDK_INT >= 34) {
                val notificationManager = getSystemService(NotificationManager::class.java)
                notificationManager?.canUseFullScreenIntent() ?: false
            } else {
                true // Permission not needed for older versions
            }
        }

        /**
         * Get all permission statuses as a JSON string.
         * Called from JavaScript: window.AndroidApp.getPermissionStatus()
         */
        @android.webkit.JavascriptInterface
        fun getPermissionStatus(): String {
            val status = mapOf(
                "displayOverApps" to isDisplayOverAppsGranted(),
                "batteryOptimization" to isBatteryOptimizationDisabled(),
                "notifications" to isNotificationPermissionGranted(),
                "fullScreenIntent" to isFullScreenIntentGranted()
            )
            return org.json.JSONObject(status).toString()
        }

        // ============ PERMISSION REQUEST METHODS ============

        /**
         * Open the Display Over Other Apps settings.
         * Called from JavaScript: window.AndroidApp.requestDisplayOverApps()
         */
        @android.webkit.JavascriptInterface
        fun requestDisplayOverApps() {
            runOnUiThread {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                    try {
                        val intent = Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION)
                        intent.data = Uri.fromParts("package", packageName, null)
                        startActivity(intent)
                    } catch (e: Exception) {
                        Log.e("AndroidBridge", "Failed to open overlay settings", e)
                        Toast.makeText(this@MainActivity, "Please enable 'Display over other apps' in Settings", Toast.LENGTH_LONG).show()
                    }
                }
            }
        }

        /**
         * Open the Battery Optimization settings for this app.
         * Called from JavaScript: window.AndroidApp.requestBatteryOptimization()
         */
        @android.webkit.JavascriptInterface
        fun requestBatteryOptimization() {
            runOnUiThread {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                    try {
                        val intent = Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS)
                        intent.data = Uri.fromParts("package", packageName, null)
                        startActivity(intent)
                    } catch (e: Exception) {
                        Log.e("AndroidBridge", "Failed to open battery optimization settings", e)
                        // Fallback to general battery settings
                        try {
                            val fallbackIntent = Intent(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS)
                            startActivity(fallbackIntent)
                        } catch (e2: Exception) {
                            Toast.makeText(this@MainActivity, "Please disable battery optimization for this app in Settings", Toast.LENGTH_LONG).show()
                        }
                    }
                }
            }
        }

        /**
         * Request all system permissions needed for reliable ringing.
         * Called from JavaScript: window.AndroidApp.requestSystemPermissions()
         */
        @android.webkit.JavascriptInterface
        fun requestSystemPermissions() {
            runOnUiThread {
                // Show a dialog explaining what permissions are needed
                AlertDialog.Builder(this@MainActivity)
                    .setTitle("Enable Reliable Notifications")
                    .setMessage("To ensure you never miss an order, please enable these settings:\n\n" +
                            "1. Display over other apps\n" +
                            "2. Disable battery optimization\n\n" +
                            "This allows the order alert to ring even when your phone is sleeping.")
                    .setPositiveButton("Open Settings") { _, _ ->
                        // Open battery optimization first (most important)
                        if (!isBatteryOptimizationDisabled()) {
                            requestBatteryOptimization()
                        } else if (!isDisplayOverAppsGranted()) {
                            requestDisplayOverApps()
                        } else if (!isFullScreenIntentGranted()) {
                            // Open notification settings for full screen intent
                            try {
                                if (Build.VERSION.SDK_INT >= 34) {
                                    val intent = Intent(Settings.ACTION_MANAGE_APP_USE_FULL_SCREEN_INTENT)
                                    intent.data = Uri.fromParts("package", packageName, null)
                                    startActivity(intent)
                                }
                            } catch (e: Exception) {
                                val intent = Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS)
                                intent.putExtra(Settings.EXTRA_APP_PACKAGE, packageName)
                                startActivity(intent)
                            }
                        } else {
                            Toast.makeText(this@MainActivity, "All permissions are already granted!", Toast.LENGTH_SHORT).show()
                        }
                    }
                    .setNegativeButton("Later", null)
                    .show()
            }
        }

        /**
         * Check if all required permissions for ringing are granted.
         * Called from JavaScript: window.AndroidApp.areAllPermissionsGranted()
         */
        @android.webkit.JavascriptInterface
        fun areAllPermissionsGranted(): Boolean {
            return isNotificationPermissionGranted() && 
                   isBatteryOptimizationDisabled() && 
                   isFullScreenIntentGranted()
        }
    }

    // Handle incoming results from Razorpay UPI intent
    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        super.onActivityResult(requestCode, resultCode, data)
        razorpayInstance?.onActivityResult(requestCode, resultCode, data)
    }
}
