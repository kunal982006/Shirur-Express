package com.shirurexpress.app

import android.annotation.SuppressLint
import android.content.Intent
import android.content.IntentSender
import android.graphics.Bitmap
import android.net.Uri
import android.os.Bundle
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
import android.content.pm.PackageManager
import androidx.activity.result.contract.ActivityResultContracts
import androidx.activity.result.IntentSenderRequest
import androidx.core.content.ContextCompat
import com.google.android.gms.common.api.ResolvableApiException
import com.google.android.gms.location.*
import com.google.android.gms.tasks.Task

class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView
    private lateinit var progressBar: ProgressBar
    private lateinit var swipeRefresh: SwipeRefreshLayout
    private lateinit var errorView: View

    // Location Permission Launcher
    private val locationPermissionRequest = registerForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { permissions ->
        when {
            permissions.getOrDefault(Manifest.permission.ACCESS_FINE_LOCATION, false) ||
            permissions.getOrDefault(Manifest.permission.ACCESS_COARSE_LOCATION, false) -> {
                // Location access granted.
                checkGpsEnabled()
            }
            else -> {
                // No location access granted.
                Toast.makeText(this, "Location permission is required for delivery features", Toast.LENGTH_LONG).show()
            }
        }
    }

    // GPS Enable Launcher
    private val enableGpsLauncher = registerForActivityResult(
        ActivityResultContracts.StartIntentSenderForResult()
    ) { result ->
        if (result.resultCode == RESULT_OK) {
            Toast.makeText(this, "GPS Enabled", Toast.LENGTH_SHORT).show()
            // Reload page to ensure location APIs work immediately
            webView.reload()
        } else {
            Toast.makeText(this, "GPS is required for location features", Toast.LENGTH_SHORT).show()
        }
    }

    companion object {
        private const val WEBSITE_URL = "https://shirur-express.onrender.com"
        private const val APP_USER_AGENT = "ShirurExpressApp/1.0 (Android; WebView)"
    }

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
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

        // Setup back button handling
        setupBackPressHandler()

        // Load the website
        if (savedInstanceState == null) {
            loadUrl(WEBSITE_URL)
        }

        // Handle deep links
        handleIntent(intent)
        
        // Request Location Permissions
        checkAndRequestLocationPermission()
    }

    private fun checkAndRequestLocationPermission() {
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED ||
            ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_COARSE_LOCATION) == PackageManager.PERMISSION_GRANTED
        ) {
            checkGpsEnabled()
        } else {
            locationPermissionRequest.launch(
                arrayOf(
                    Manifest.permission.ACCESS_FINE_LOCATION,
                    Manifest.permission.ACCESS_COARSE_LOCATION
                )
            )
        }
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
                    // Show the dialog by calling startResolutionForResult(),
                    // and check the result in enableGpsLauncher
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

    override fun onNewIntent(intent: Intent?) {
        super.onNewIntent(intent)
        intent?.let { handleIntent(it) }
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
}
