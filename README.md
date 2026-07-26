# Pulse — Expo build-benchmark super app

A deliberately heavyweight [Expo](https://expo.dev) SDK 56 app used to benchmark build and cache
services against EAS Build. It packs the native features found in the most popular consumer apps
into a single project so that prebuild + native compilation exercises a realistic, large dependency
graph.

## What's inside

| Area | Features | Key packages |
| --- | --- | --- |
| Social feed | Infinite scroll, FTS5 search, double-tap likes, stories rail | `@shopify/flash-list`, `expo-image`, `expo-sqlite`, `react-native-gesture-handler`, `react-native-reanimated` |
| Maps | Native Apple/Google maps, markers, location | `expo-maps`, `expo-location` |
| Camera studio | Photo capture, QR scanning, torch, image pipeline, publish to feed | `expo-camera`, `expo-image-picker`, `expo-image-manipulator`, `expo-media-library` |
| Media lab | Streaming video w/ cache + PiP, audio streaming, voice recording, TTS, thumbnails | `expo-video`, `expo-audio`, `expo-speech`, `expo-video-thumbnails` |
| Profile & auth | Biometric lock, secure token storage, device/battery/network info | `expo-local-authentication`, `expo-secure-store`, `expo-device`, `expo-battery`, `expo-network` |
| Payments | Native Stripe card field (test mode) | `@stripe/stripe-react-native` |
| Background | Periodic feed sync, scheduled notifications | `expo-background-task`, `expo-task-manager`, `expo-notifications` |
| Sensors | Accelerometer/gyro/magnetometer/barometer streamed into Skia charts | `expo-sensors`, `@shopify/react-native-skia`, `expo-keep-awake` |
| System toolbox | Files, OTA updates, print, mail, calendar, contacts, clipboard, sharing, screen-capture blocking, ATT, brightness, store review, crypto | `expo-file-system`, `expo-updates`, `expo-print`, `expo-mail-composer`, `expo-calendar`, `expo-contacts`, `expo-clipboard`, `expo-sharing`, `expo-screen-capture`, `expo-tracking-transparency`, `expo-brightness`, `expo-store-review`, `expo-crypto` |
| In-app browser | Full WebView with nav controls | `react-native-webview` |
| State & data | SQLite persistence, query cache, persisted preferences | `expo-sqlite`, `@tanstack/react-query`, `zustand`, `@react-native-async-storage/async-storage` |

The app uses Continuous Native Generation — `android/` and `ios/` are gitignored and produced by
`npx expo prebuild`, so every build service run pays the full prebuild + native compile cost.
Release builds also enable Proguard + resource shrinking on Android via `expo-build-properties`.

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

3. Build natively

   ```bash
   npx expo run:android   # or run:ios
   ```

Most screens rely on native modules, so use a [development build](https://docs.expo.dev/develop/development-builds/introduction/)
— Expo Go will not work.

## Benchmarking

```bash
# Full clean native build, the primary benchmark target
npx expo prebuild --clean
cd android && ./gradlew :app:assembleRelease

# or via EAS
eas build --platform android --profile production
```

## Verification checklist

- `npx tsc --noEmit` — typecheck
- `npx expo lint` — lint
- `npx expo-doctor` — dependency health
- `npx expo export --platform android --platform ios` — Metro bundle check
