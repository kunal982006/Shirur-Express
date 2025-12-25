# Shirur Express - Android WebView App

A pure WebView-based Android app that wraps the Shirur Express website.

## Features

- ✅ **Pure WebView** - Uses Android System WebView (no Chrome dependency)
- ✅ **JavaScript Enabled** - Full JS support for web app functionality
- ✅ **DOM Storage** - localStorage and sessionStorage support
- ✅ **Custom User Agent** - Identifies app vs browser traffic
- ✅ **Back Button Handling** - Navigates history, doesn't close app
- ✅ **Swipe to Refresh** - Pull down to reload page
- ✅ **Error Handling** - Offline page with retry button
- ✅ **Deep Links** - Opens app from `shirur-express.onrender.com` links
- ✅ **External Links** - Opens browser for non-app links
- ✅ **Phone/Email Links** - Handles tel: and mailto: properly
- ✅ **Full Screen** - No action bar, status bar matches app theme

## Requirements

- Android Studio Arctic Fox (2020.3.1) or later
- Android SDK 34 (or latest)
- Kotlin 1.9.x
- Gradle 8.x

## Setup Instructions

1. **Open in Android Studio**
   - Open Android Studio
   - Select "Open an existing project"
   - Navigate to `android-app` folder
   - Click "Open"

2. **Sync Gradle**
   - Wait for Gradle sync to complete
   - If prompted, update Gradle plugin

3. **Add App Icons**
   - Replace placeholder icons in `res/mipmap-*` folders
   - Use Android Studio's Asset Studio:
     - Right-click `res` → New → Image Asset
     - Select your icon image
     - Generate all sizes

4. **Build & Run**
   - Connect Android device or start emulator
   - Click "Run" (green play button)
   - Select device and click "OK"

## Building Release APK

1. **Generate Signing Key** (first time only):
   ```bash
   keytool -genkey -v -keystore shirur-express.keystore -alias shirur -keyalg RSA -keysize 2048 -validity 10000
   ```

2. **Configure Signing** in `app/build.gradle.kts`:
   ```kotlin
   signingConfigs {
       create("release") {
           storeFile = file("shirur-express.keystore")
           storePassword = "your_password"
           keyAlias = "shirur"
           keyPassword = "your_password"
       }
   }
   buildTypes {
       getByName("release") {
           signingConfig = signingConfigs.getByName("release")
       }
   }
   ```

3. **Build Release APK**:
   - Build → Generate Signed Bundle/APK
   - Select APK
   - Enter keystore details
   - Select "release" build type
   - Click "Create"

## Project Structure

```
android-app/
├── app/
│   ├── src/main/
│   │   ├── java/com/shirurexpress/app/
│   │   │   ├── MainActivity.kt      # Main WebView activity
│   │   │   └── SplashActivity.kt    # Splash screen
│   │   ├── res/
│   │   │   ├── layout/
│   │   │   │   └── activity_main.xml
│   │   │   ├── values/
│   │   │   │   ├── colors.xml
│   │   │   │   ├── strings.xml
│   │   │   │   └── themes.xml
│   │   │   ├── drawable/
│   │   │   └── xml/
│   │   │       └── network_security_config.xml
│   │   └── AndroidManifest.xml
│   ├── build.gradle.kts
│   └── proguard-rules.pro
├── build.gradle.kts
├── settings.gradle.kts
└── gradle.properties
```

## Customization

### Change Website URL
Edit `MainActivity.kt`:
```kotlin
companion object {
    private const val WEBSITE_URL = "https://your-website.com"
}
```

### Change User Agent
Edit `MainActivity.kt`:
```kotlin
companion object {
    private const val APP_USER_AGENT = "YourAppName/1.0 (Android; WebView)"
}
```

### Change Theme Colors
Edit `res/values/colors.xml` and update:
- `purple_500` - Primary color
- `background_dark` - Background color
- `status_bar` - Status bar color

## Troubleshooting

### WebView not loading
- Check internet permission in manifest
- Verify network security config allows your domain

### Back button closes app instead of going back
- The `OnBackPressedCallback` handles this automatically
- Check if WebView has history with `webView.canGoBack()`

### JavaScript not working
- Ensure `javaScriptEnabled = true` in WebSettings
- Check for console errors in Chrome DevTools remote debugging

## License

MIT License - See LICENSE file for details
