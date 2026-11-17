# Shirur Express - Android App

A hybrid Android app: a native shell (splash, bottom tab bar, back button,
haptics, push notifications, payments, printer) around the Shirur Express
website, with the website's own files stored inside the APK so the app opens
from the phone instead of downloading itself on every launch.

## How the app loads (since 1.5.0)

- The WebView still opens `https://shirur-express.onrender.com`, so the login
  session, cart, payments and API calls work exactly as on the website.
- Requests for the website's static files (HTML, JS, CSS, icons, banners) are
  answered from `app/src/main/assets/web` inside the APK (`WebAppBundle.kt`).
  API calls and menu photos still come from the server.
- In the background the app asks the server for its current page. If the server
  has a newer version of the website, the app saves it and uses it from the next
  page load on. **A website deploy therefore still reaches app users without a
  Play Store release.** Files of the new version that are not in the APK are
  downloaded once and then kept in the WebView cache.
- If the stored files ever fail to start, the app falls back to loading
  everything from the server, like versions before 1.5.0.

### Putting the website into the APK

The `assets/web` folder is generated, not committed. Before building a release:

```bash
# 1. Deploy the website first (push to Render) and wait for it to go live.
# 2. Copy exactly what is live into the app:
npm run android:bundle:live
# 3. Build the APK / bundle in Android Studio as usual.
```

For a quick test build from your working copy instead of the live site:

```bash
npm run android:bundle      # builds the website here and copies it in
```

If you skip this step the app still works; it just loads from the server.

### What is native

| Part | File |
| --- | --- |
| Splash that lifts as soon as the first screen is ready | `SplashOverlay.kt` |
| Bottom tab bar (tabs, selection and colours come from the website) | `BottomNavBar.kt` |
| Back button closes popups and sheets before leaving the page | `MainActivity.kt` |
| Haptic feedback on cart changes, tabs and pull-to-refresh | `MainActivity.kt` |
| Website files served from the APK, with update check | `WebAppBundle.kt` |

The website side of each of these is in `client/src/lib/native-app.ts`.

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

- Android Studio (Ladybug or later recommended)
- Android SDK 36 (or latest)
- Kotlin 1.9.21+
- Gradle 8.13+ (compatible with Java 8 through Java 23)

## Setup Instructions

1. **Open in Android Studio**
   - Open Android Studio
   - Select "Open an existing project"
   - Navigate to `android-app` folder
   - Click "Open"

2. **Sync Gradle**
   - Wait for Gradle sync to complete
   - If prompted, update Gradle plugin or JDK configuration (Gradle 8.13 requires Java 8–23)

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
│   │   │   ├── MainActivity.kt          # Main WebView activity + JS bridge
│   │   │   ├── WebAppBundle.kt          # Serves the website's files from the APK
│   │   │   ├── SplashOverlay.kt         # Animated splash over the loading app
│   │   │   ├── BottomNavBar.kt          # Native bottom tab bar
│   │   │   ├── IncomingOrderActivity.kt # Incoming order notifications
│   │   │   └── MyFirebaseMessagingService.kt # FCM service
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
- Primary color
- Background color
- Status bar color

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

### Gradle build failing with Java version error
- Gradle 8.13 supports Java versions 8 through 23. If using JDK 25+, configure Android Studio Gradle JDK to use Java 17 or Java 21 (Settings -> Build, Execution, Deployment -> Build Tools -> Gradle -> Gradle JDK).

## License

MIT License - See LICENSE file for details
