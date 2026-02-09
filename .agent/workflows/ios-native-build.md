---
description: Build for iOS with native Vision OCR module
---

# iOS Native Build

This workflow builds the app for iOS with native modules (Apple Vision OCR).

## Prerequisites

- Xcode 15+ installed
- CocoaPods installed (`gem install cocoapods`)

## Steps

1. Add the Vision OCR plugin to `app.json`:

```json
"plugins": [
  "expo-router",
  ["expo-splash-screen", { ... }],
  "./plugins/withVisionOCR"
]
```

// turbo 2. Prebuild the native project:

```bash
npx expo prebuild --platform ios --clean
```

// turbo  
3. Run on iOS simulator or device:

```bash
npx expo run:ios
```

## Notes

- The plugin generates native Swift/Objective-C files during prebuild
- For Expo Go development (without native modules), remove the plugin from app.json
- The VisionOCR module will return mock/empty data when running in Expo Go
