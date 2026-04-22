# Next Steps

Work is organised into three horizons: things blocking a first run on device, things
blocking a public release, and the product backlog for future phases.

---

## 1 — Before you can run the app at all

These are hard blockers. The app will not build or launch without them.

### 1.1 Rename everything in `app.json`

Every identifier is still the template placeholder. Update before running `prebuild`,
otherwise your bundle ID and package name will be wrong in all native artefacts.

```json
{
  "expo": {
    "name": "SmartAllergies",
    "slug": "smartallergies",
    "scheme": "smartallergies",
    "ios": {
      "bundleIdentifier": "com.yourcompany.smartallergies"
    },
    "android": {
      "package": "com.yourcompany.smartallergies"
    }
  }
}
```

### 1.2 Add missing plugins and the Android Maps key to `app.json`

`react-native-maps`, `expo-apple-authentication`, and `@react-native-google-signin/google-signin`
are all installed but have no plugin entries. The Google Maps key is also missing.
Add these to the `plugins` array:

```json
"plugins": [
  "expo-sqlite",
  ["expo-location", {
    "locationWhenInUsePermission": "SmartAllergies uses your location to fetch local pollen and weather data."
  }],
  ["expo-notifications", {
    "icon": "./assets/images/icon.png",
    "color": "#ffffff"
  }],
  ["react-native-maps", {
    "googleMapsApiKey": "YOUR_ANDROID_MAPS_KEY"
  }],
  "expo-apple-authentication",
  ["@react-native-google-signin/google-signin", {
    "iosUrlScheme": "com.googleusercontent.apps.YOUR_REVERSED_CLIENT_ID"
  }]
]
```

The Android Maps key is for rendering the basemap (free tier usage costs nothing).
It is separate from `GOOGLE_POLLEN_API_KEY`. Get it from Google Cloud Console →
APIs & Services → Credentials — create a key restricted to your Android package name.

The `iosUrlScheme` is the reversed client ID from your Google OAuth `GoogleService-Info.plist`
(looks like `com.googleusercontent.apps.123456-abc`).

### 1.3 Run prebuild

`react-native-maps` and `react-native-purchases` are native modules. Expo Go will crash.
You need a dev build:

```bash
npx expo prebuild --clean
npx expo run:ios      # or: npx expo run:android
```

Run `prebuild --clean` any time you change `app.json` plugins or native dependencies.

### 1.4 Create an EAS config

There is no `eas.json` in the repo. You need it for dev builds and production builds.
Create it at the root:

```json
{
  "cli": { "version": ">= 10.0.0" },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {}
  },
  "submit": {
    "production": {}
  }
}
```

Then link your project:

```bash
eas login
eas build:configure
```

### 1.5 Fill in `.env.development`

Copy `.env.example` and fill in at minimum the three required keys:

```env
API_BASE_URL=https://api.example.com   # or your local tunnel URL
GOOGLE_CLIENT_ID=your-web-client-id
APP_ENV=development
```

Without `API_BASE_URL` and `GOOGLE_CLIENT_ID` the app throws on startup before
any screen renders (they are validated at import time in `src/config/env.ts`).

---

## 2 — Before public release

These won't block a local dev run but will block a working, shippable app.

### 2.1 Configure Supabase

**Create the pollen grid table** (SQL editor in Supabase dashboard):

```sql
CREATE TABLE pollen_uk_grid (
  id          bigserial PRIMARY KEY,
  date        date NOT NULL,
  pollen_type text NOT NULL,
  geojson     jsonb NOT NULL,
  updated_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (date, pollen_type)
);
```

**Enable Row Level Security on community_signals:**

The `community_signals` table stores user-contributed pollen severity data. It needs
RLS so anonymous users can only insert (not read individual rows) and the aggregate
query is the only read path:

```sql
ALTER TABLE community_signals ENABLE ROW LEVEL SECURITY;

-- Allow anon inserts (the app uses the anon key)
CREATE POLICY "anon insert" ON community_signals
  FOR INSERT TO anon WITH CHECK (true);

-- Allow reading aggregates only (app queries via group-by, no individual rows needed)
CREATE POLICY "anon select aggregate" ON community_signals
  FOR SELECT TO anon USING (true);
```

**Deploy and schedule the Edge Function:**

```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase functions deploy pollen-uk-grid
```

In the Supabase dashboard → Edge Functions → pollen-uk-grid → Secrets, add:

| Key | Value |
|---|---|
| `SUPABASE_URL` | Your project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Settings → API → service_role key |

In Supabase dashboard → Edge Functions → pollen-uk-grid → Schedule:
```
0 6 * * *
```

Trigger it manually once to pre-populate today's data before your first test.

### 2.2 Configure Google Cloud

1. Enable **Pollen API** in Google Cloud Console
2. Enable **Maps SDK for Android** and **Maps SDK for iOS**
3. Create two API keys:
   - `GOOGLE_POLLEN_API_KEY` — restrict to your iOS bundle ID and Android package name;
     enable Pollen API only
   - Android Maps key — restrict to Android package name; enable Maps SDK for Android only
4. Add `GOOGLE_POLLEN_API_KEY` to your `.env` files
5. Add the Android Maps key to `app.json` (see 1.2 above)

### 2.3 Configure RevenueCat

1. Create a RevenueCat project at [app.revenuecat.com](https://app.revenuecat.com)
2. Create an entitlement named exactly `pro` (matches the `PRO_ENTITLEMENT` constant
   in `src/features/subscription/types.ts`)
3. Create a monthly subscription product in App Store Connect and Google Play Console,
   then attach it to the `pro` entitlement in RevenueCat
4. Add your API keys to `.env`:
   ```env
   REVENUECAT_IOS_KEY=appl_xxxx
   REVENUECAT_ANDROID_KEY=goog_xxxx
   ```

Without RevenueCat keys the app runs in "always free" mode — `isPro` will always be
`false`. That is intentional and safe for development.

### 2.4 Configure push notifications

**iOS:** Register an APNS key or certificate in Apple Developer Portal and upload it
to Expo / EAS under your project credentials. Run:
```bash
eas credentials
```
and follow the prompts.

**Android:** Create a Firebase project, add your Android app, download
`google-services.json`, and place it at `android/app/google-services.json` after
`prebuild`. EAS handles FCM automatically if the file is present.

### 2.5 Add a real icon and splash screen

`assets/images/icon.png` and `assets/splash/splash.png` are still the template
placeholders. Replace them before building for TestFlight / internal testing — the
icon is baked into the native build and cannot be updated without a new build.

Required sizes:
- `icon.png` — 1024×1024px, no transparency (iOS requirement)
- `adaptive-icon.png` — 1024×1024px with transparent background (Android)
- `splash.png` — 2048×2048px

### 2.6 Write a privacy policy

The app collects GPS location, health symptoms, and (optionally) contributes anonymised
community data. Both Apple and Google require a privacy policy URL before App Store
approval. You will also need to complete Apple's Data Nutrition Label in App Store Connect.

---

## 3 — Product backlog

Features listed in `PRO_FEATURES` that are promised to subscribers but not yet built,
plus natural next additions.

### 3.1 Personalised allergen profile (Pro — promised but missing)

Listed in `PRO_FEATURES` in `src/features/subscription/types.ts` but not implemented.
Users should be able to mark which allergens affect them (tree / grass / weed / specific
species) and have the home dashboard and notifications personalised to those types.

Suggested scope:
- Settings screen section: "My Allergens" with toggles per type
- `settingsStore` field: `allergenProfile: string[]`
- `HomeScreen` and `NotificationsScreen` filter/emphasise the selected types
- Pollen detail view shows only the relevant species breakdown

### 3.2 Onboarding flow

There is no onboarding. First-time users land directly on the Home screen with empty
state and no explanation of what the app does or why location permission is needed.
A 3–4 screen onboarding covering location permission, allergen selection, and the
freemium model would significantly improve activation.

### 3.3 Widget (iOS / Android)

A home screen widget showing today's overall pollen level and a colour indicator is
the most-requested feature for weather/environment apps. Expo SDK 54 supports iOS
widgets via `expo-widgets` (currently in preview). Android widgets require a bare
workflow or EAS build customisation.

### 3.4 Species breakdown (Pro)

The Google Pollen API returns species-level data (e.g. birch, oak, olive within Tree).
The current implementation collapses these to a single Tree index. Showing the
species breakdown in the detail view would be a meaningful Pro differentiator —
especially useful during birch season when tree pollen is high but the user is only
allergic to grass.

### 3.5 Shareable symptom snapshot

Allow users to export a single-day summary as an image (symptom severity + pollen
level + weather) shareable to social/messaging apps. This is a free feature that
drives organic growth. `expo-sharing` is already installed.

### 3.6 Offline mode hardening

Currently if the user has no connectivity: Open-Meteo fails silently, the home screen
shows empty state, and the map shows no data. The app should show the last cached
pollen reading with a "Last updated X hours ago" badge rather than an empty screen.
The SQLite `pollen_cache` table already holds the data — it just needs to be surfaced
when the network fetch fails.

---

## Known code issues to fix before v1.0

| Location | Issue |
|---|---|
| `src/components/ui/Button.tsx` | Accepts a `label` prop at runtime but the TypeScript type only declares `children`. All callers pass `label` — fix the type or refactor callers to use `children`. |
| `src/components/layout/Stack.tsx` | `className` prop not typed, causing TS errors on every NativeWind usage. Add `className?: string` to the component props. |
| `app.json` | `scheme: "apptemplate"` used in deep link config in `RootNavigator.tsx` — must match after renaming (see 1.1). |
| `src/features/map/screens/MapScreen.tsx` | Lock CTA `top: 170` is a hardcoded pixel offset below the legend. If the legend grows (e.g. font scaling) they will overlap. Consider using `onLayout` to position dynamically. |
