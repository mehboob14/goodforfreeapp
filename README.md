# GoodForFree — Clock + Articles Mobile App

A React Native (Expo) app with:

- ⏰ **Clock** — switchable digital / analog clock with live seconds
- 🌍 **World Clock** — add/remove cities, persists your selection
- 📰 **Articles** — pulled live from the GoodForFree WordPress REST API
  (search, categories, infinite scroll, pull-to-refresh, full article view)
- 🔔 **Notifications** — permission flow, local test notifications, "new article"
  alerts, and an Expo push token for server-sent push
- 🎨 **In-app customization** — dark/light/system theme, accent color, 12/24h,
  show seconds/date, default clock style — all persisted on device

Runs on **Android and iOS** from one codebase.

---

## Prerequisites (on the laptop with Android Studio)

- **Node.js 18+** (LTS recommended)
- **Android Studio** with an emulator or a physical Android device (USB debugging on)
- For iOS: a **Mac with Xcode** (iOS can't be built from Windows/Linux)
- The **Expo Go** app on your phone is the fastest way to preview (see below)

## 1. Install dependencies

```bash
cd GoodForFree_Mobile_App
npm install
```

> If you ever see a version-mismatch warning, let Expo align native package
> versions to your installed SDK:
>
> ```bash
> npx expo install --fix
> ```

## 2. Run it

### Quickest preview — Expo Go (no Android Studio build needed)

```bash
npx expo start
```

Then press `a` for an Android emulator, or scan the QR code with the **Expo Go**
app on your phone. (iOS: scan with the Camera app.)

> ⚠️ Notifications and the push token need a **development build** or a physical
> device — they are limited inside Expo Go and don't work on simulators.

### Full native build (recommended for notifications)

Android (needs Android Studio set up):

```bash
npx expo run:android
```

iOS (needs a Mac + Xcode):

```bash
npx expo run:ios
```

This generates the `android/` and `ios/` native projects and installs the app on
your device/emulator.

---

## Configuration

### WordPress API

Already wired to your site in [`src/api/wordpress.ts`](src/api/wordpress.ts):

```ts
export const WP_URL = 'https://goodforfree.com/wp-json/wp/v2';
export const WP_BASE_URL = 'https://goodforfree.com';
```

### Push notifications (optional, for server-sent push)

Local notifications and the "new article" check work out of the box. To send
**remote** push from a server:

1. Create an Expo account and an EAS project: `npx eas init`
2. Put the project ID in [`app.json`](app.json) → `extra.eas.projectId`.
3. In the app: **Settings → Notifications → Enable**, then tap the Expo push
   token to copy it. Send that token to your backend.
4. Your backend posts to Expo's push service:
   `https://exp.host/--/api/v2/push/send` with `{ "to": "<token>", "title": "...", "body": "..." }`.

See: https://docs.expo.dev/push-notifications/sending-notifications/

---

## Project structure

```
App.tsx                      # Navigation, tabs, theming, notification routing
src/
  api/wordpress.ts           # WordPress REST client (posts, categories)
  components/
    AnalogClock.tsx          # SVG analog clock
    DigitalClock.tsx         # Digital clock
  context/SettingsContext.tsx# Persisted user settings + theme
  hooks/useNow.ts            # Ticking clock hook
  notifications/notifications.ts # Permissions, local + push, new-article check
  navigation/types.ts        # Typed navigation params
  screens/
    ClockScreen.tsx
    WorldClockScreen.tsx
    ArticlesScreen.tsx
    ArticleDetailScreen.tsx
    SettingsScreen.tsx
  theme/themes.ts            # Color palettes
  utils/time.ts              # Time/date formatting helpers
```

---

## Home-screen widgets (Android)

The app ships **three Android home-screen widgets** (via
[`react-native-android-widget`](https://github.com/sAleksovski/react-native-android-widget)):

- **GoodForFree Clock** — digital clock + date, accent-colored
- **GoodForFree Article** — the latest article (image + title); tap opens that article
- **GoodForFree Clock + Article** — clock on top, latest article below (the "advertise our
  content" combo)

Widgets read the **same theme/accent/24h settings** you set in the app, and the article
widgets pull the latest post from the WordPress API. Code lives in
[`src/widgets/`](src/widgets/); they're registered in [`index.js`](index.js).

### ⚠️ Widgets require a development build (NOT Expo Go)

Native widgets can't run in Expo Go. Build a dev build on the laptop with Android Studio:

```bash
npx expo prebuild --platform android   # already run once; regenerates android/
npx expo run:android                   # builds the APK + installs on device/emulator
```

Then on the phone: **long-press the home screen → Widgets → GoodForFree → drag a widget out.**

### Notes / limitations
- **Clock refresh:** Android throttles widget updates to a **30-minute minimum**
  (`updatePeriodMillis`). So the widget clock is not a live second-ticking clock — it
  refreshes on the system schedule, when the app changes settings, and on tap. A true
  ticking widget needs a native `AlarmManager`/foreground-service module (a later add-on).
- Tapping the article widget deep-links via `goodforfree://article/<id>` into the app.
- The in-app screens still work in Expo Go exactly as before — the widget code is guarded
  so it's a no-op outside a real Android build.

## Roadmap (still phase 2)

- **iOS home-screen widgets (WidgetKit):** requires a **Mac + Xcode** (or Expo **EAS** cloud
  build + a paid Apple Developer account). Recommended approach:
  [`@bacons/apple-targets`](https://github.com/EvanBacon/expo-apple-targets) to add a
  WidgetKit extension, with SwiftUI mirroring the Android widget designs. Cannot be built
  on Windows.
- **Android launcher replacement** (app replaces the home screen) — separate heavy task,
  Android-only.
