# Add project specific ProGuard rules here.
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# Keep WebView JavaScript interface
-keepattributes JavascriptInterface

# Keep the app's WebView client
-keep class com.shirurexpress.app.** { *; }
