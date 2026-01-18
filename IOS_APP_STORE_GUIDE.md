# iOS App Store Submission Guide

## Prerequisites

1. **Apple Developer Account** ($99/year) - https://developer.apple.com
2. **Mac with Xcode** - Required for final build and upload
3. **Your deployed PWA URL** - https://shirur-express.onrender.com (or your domain)

---

## Step 1: Test Your PWA Score

1. Go to https://www.pwabuilder.com
2. Enter your deployed URL
3. Verify your PWA score is 80+ (aim for 100)
4. Fix any issues PWABuilder identifies

---

## Step 2: Generate iOS Package

1. On PWABuilder, click "Package for stores"
2. Select "iOS"
3. Configure options:
   - **Bundle ID**: `com.shirurexpress.app`
   - **App Name**: `Shirur Express`
   - **Status Bar Color**: `#1a1a2e`
4. Download the generated Xcode project

---

## Step 3: Add Splash Screens

Before building in Xcode, add your branded splash screen images to:
`client/public/splash/`

Required sizes are listed in `splash/README.md`

---

## Step 4: Build in Xcode

1. Open the downloaded `.xcodeproj` in Xcode
2. Sign in with your Apple Developer account
3. Select your Team in Signing & Capabilities
4. Update the Bundle Identifier to match your App ID
5. Build for "Any iOS Device (arm64)"

---

## Step 5: Submit to App Store Connect

1. Go to https://appstoreconnect.apple.com
2. Create a new app with:
   - **Platform**: iOS
   - **Name**: Shirur Express
   - **Bundle ID**: com.shirurexpress.app
   - **SKU**: shirurexpress-ios-1
3. Fill in app information:
   - Description
   - Keywords
   - Support URL: https://shirur-express.onrender.com
   - Privacy Policy URL: https://shirur-express.onrender.com/privacy-policy
4. Upload screenshots (iPhone 6.7", 6.5", 5.5" + iPad 12.9")
5. Upload build from Xcode
6. Submit for review

---

## App Store Requirements Checklist

- [ ] App icon (1024x1024 PNG, no transparency)
- [ ] Screenshots for all required device sizes
- [ ] Privacy policy URL
- [ ] App description (max 4000 characters)
- [ ] Keywords (max 100 characters)
- [ ] Support URL
- [ ] Age rating questionnaire completed
- [ ] App builds and runs without crashes

---

## Timeline

- **App Review**: Typically 24-48 hours
- **First submission**: May take longer due to thorough review
- **Common rejection reasons**:
  - App crashes or has bugs
  - Minimal functionality (ensure your app provides value)
  - Missing privacy policy
  - Placeholder content

Good luck with your submission!
