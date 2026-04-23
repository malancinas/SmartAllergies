# Next Steps

Everything in this file requires your manual input — credentials, accounts, or assets
that can't be committed to the repo. Work through section 1 first; the app will not
build without it.

---

## 1 — First run (hard blockers)

### 1.1 Choose your bundle identifier

The bundle ID is baked into the native build and hard to change later. Decide now.
Convention is `com.<yourname>.localallergies` — e.g. `com.noahalan.localallergies`.

Open [app.json](app.json) and replace both occurrences of `com.yourcompany.localallergies`:

```json
"ios": {
  "bundleIdentifier": "com.noahalan.localallergies"
},
"android": {
  "package": "com.noahalan.localallergies"
}
```

Use the exact same string in both places. This value is also what you register in
App Store Connect and Google Play Console later.

---

### 1.2 Get your Google OAuth reversed client ID

This is needed for Google Sign-In on iOS.

1. Go to [console.cloud.google.com](https://console.cloud.google.com) and open (or create) your project.
2. Go to **APIs & Services → Credentials**.
3. Click the OAuth 2.0 client ID that has **iOS** as the application type.
   - If one doesn't exist yet: click **Create Credentials → OAuth client ID → iOS**,
     enter your bundle ID from step 1.1, and save.
4. Click the client to open it. Copy the **iOS URL scheme** value — it looks like
   `com.googleusercontent.apps.123456789-abc123def456`.
5. Open [app.json](app.json) and replace `YOUR_REVERSED_CLIENT_ID`:

```json
["@react-native-google-signin/google-signin", {
  "iosUrlScheme": "com.googleusercontent.apps.123456789-abc123def456"
}]
```

Also note the **Client ID** from the same screen — you'll need it in step 1.5.

---

### 1.3 Get your Android Maps API key

This is needed to render the basemap on Android. It is free at normal usage volumes.

1. In the same **APIs & Services → Credentials** screen as above, click
   **Create Credentials → API key**.
2. Click **Edit API key** on the new key.
3. Under **Application restrictions**, choose **Android apps**.
4. Click **Add an item**, enter your package name from step 1.1
   (e.g. `com.noahalan.localallergies`) and the SHA-1 certificate fingerprint
   of your debug keystore:
   ```bash
   keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
   ```
   Copy the `SHA1:` line.
5. Under **API restrictions**, choose **Restrict key**, then select
   **Maps SDK for Android**.
6. Save the key. Open [app.json](app.json) and replace `YOUR_ANDROID_MAPS_KEY`:

```json
["react-native-maps", {
  "googleMapsApiKey": "AIzaSy..."
}]
```

---

### 1.4 Create the Google Sign-In web client ID

The app uses the **web** client ID (not iOS or Android) as the `GOOGLE_CLIENT_ID`
env var for the sign-in flow.

1. In **APIs & Services → Credentials**, click **Create Credentials → OAuth client ID**.
2. Choose **Web application** as the application type. Name it anything.
3. Save. Copy the **Client ID** — it ends in `.apps.googleusercontent.com`.

---

### 1.5 Fill in `.env.development`

```bash
cp .env.example .env.development
```

Open `.env.development` and fill in these three values at minimum:

```env
GOOGLE_CLIENT_ID=<web client ID from step 1.4>
APP_ENV=development

# Leave this blank for now if you have no backend yet:
API_BASE_URL=
```

The app validates these at startup — without `GOOGLE_CLIENT_ID` it will throw
before any screen renders.

Optional keys (app falls back gracefully if missing):
```env
GOOGLE_POLLEN_API_KEY=     # leave blank — get it in step 2.2
SUPABASE_URL=              # leave blank — get it in step 2.1
SUPABASE_ANON_KEY=         # leave blank — get it in step 2.1
REVENUECAT_IOS_KEY=        # leave blank — get it in step 2.3
REVENUECAT_ANDROID_KEY=    # leave blank — get it in step 2.3
```

---

### 1.6 Run prebuild and launch

`react-native-maps` and `react-native-purchases` are native modules that require a
dev build. Expo Go will crash.

```bash
# Generate the native ios/ and android/ folders:
npx expo prebuild --clean

# Then run on a simulator or connected device:
npx expo run:ios
# or
npx expo run:android
```

You must re-run `prebuild --clean` any time you change `app.json` plugins or add/remove
native dependencies.

**If you prefer a cloud build** instead of building locally, set up EAS first:
```bash
npm install -g eas-cli
eas login
eas build:configure
eas build --profile development --platform ios
```

---

## 2 — Before public release

Work through these in order — Supabase first so the community and map features work,
then Google Cloud, then RevenueCat, then the store submission steps.

---

### 2.1 Supabase setup

#### 2.1a Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and sign in.
2. Click **New project**. Choose a name (e.g. `localallergies`) and a region close
   to your users (e.g. `eu-west-2` for UK).
3. Save the database password somewhere safe.
4. Once the project is ready, go to **Settings → API**.
5. Copy **Project URL** and **anon public** key into `.env.development`:
   ```env
   SUPABASE_URL=https://xxxx.supabase.co
   SUPABASE_ANON_KEY=eyJh...
   ```

#### 2.1b Create the pollen grid table

1. In your Supabase project, go to **SQL Editor → New query**.
2. Paste and run:
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

#### 2.1c Create the community signals table and enable RLS

1. In **SQL Editor**, paste and run:
   ```sql
   CREATE TABLE IF NOT EXISTS community_signals (
     id           bigserial PRIMARY KEY,
     user_id_hash text NOT NULL,
     geohash      text NOT NULL,
     severity     integer NOT NULL,
     created_at   timestamptz NOT NULL DEFAULT now()
   );

   ALTER TABLE community_signals ENABLE ROW LEVEL SECURITY;

   -- Allow the app (anon key) to insert
   CREATE POLICY "anon insert" ON community_signals
     FOR INSERT TO anon WITH CHECK (true);

   -- Allow aggregate reads (app queries via group-by only)
   CREATE POLICY "anon select aggregate" ON community_signals
     FOR SELECT TO anon USING (true);
   ```

#### 2.1d Deploy the pollen Edge Function

This function fetches UK grid pollen data from Open-Meteo and upserts it to
`pollen_uk_grid`. It runs on a daily cron.

1. Install the Supabase CLI if you haven't:
   ```bash
   npm install -g supabase
   ```
2. Log in and link to your project:
   ```bash
   supabase login
   supabase link --project-ref YOUR_PROJECT_REF
   ```
   Your project ref is the ID in the URL of your Supabase dashboard
   (`https://supabase.com/dashboard/project/YOUR_PROJECT_REF`).
3. Deploy the function:
   ```bash
   supabase functions deploy pollen-uk-grid
   ```
4. In the Supabase dashboard, go to **Edge Functions → pollen-uk-grid → Secrets**.
   Add these two secrets:
   - `SUPABASE_URL` → your project URL (same as above)
   - `SUPABASE_SERVICE_ROLE_KEY` → from **Settings → API → service_role** (keep this secret)
5. Go to **Edge Functions → pollen-uk-grid → Schedule**. Set the cron to:
   ```
   0 6 * * *
   ```
   This refreshes the map data every morning at 6am UTC.
6. Trigger the function once manually to populate today's data:
   In the dashboard, click **Invoke** on the function page, or:
   ```bash
   supabase functions invoke pollen-uk-grid
   ```

---

### 2.2 Google Cloud — Pollen API key

The Pollen API key is separate from the Maps key (step 1.3). It powers the Pro-tier
pollen tile overlay and the merged pollen confidence score.

1. In **APIs & Services → Library**, search for **Pollen API** and click **Enable**.
2. Go to **APIs & Services → Credentials → Create Credentials → API key**.
3. Click **Edit API key**:
   - Under **API restrictions**, choose **Restrict key → Pollen API**.
   - Under **Application restrictions**, you can restrict to your iOS bundle ID and
     Android package name for production, but leave it unrestricted for development.
4. Copy the key into `.env.development`:
   ```env
   GOOGLE_POLLEN_API_KEY=AIzaSy...
   ```
5. Also create a **production** `.env.production` file (or set the key in EAS secrets)
   for your App Store build:
   ```bash
   eas secret:create --scope project --name GOOGLE_POLLEN_API_KEY --value AIzaSy...
   ```

---

### 2.3 RevenueCat — subscriptions

#### 2.3a Create app store products first

**App Store Connect (iOS):**
1. Sign in at [appstoreconnect.apple.com](https://appstoreconnect.apple.com).
2. Go to your app (create it if needed — use your bundle ID from step 1.1).
3. Go to **Subscriptions → Create subscription group** (name: `Local Allergies Pro`).
4. Add a subscription. Set:
   - Reference Name: `Local Allergies Pro Monthly`
   - Product ID: `com.noahalan.localallergies.pro.monthly` (use your bundle ID prefix)
   - Duration: 1 month
   - Price: set a price tier
5. Submit the subscription for review (Apple requires this before RevenueCat can use it).

**Google Play Console (Android):**
1. Go to [play.google.com/console](https://play.google.com/console).
2. Create the app if needed (use your package name from step 1.1).
3. Go to **Monetize → Subscriptions → Create subscription**.
4. Product ID: `localallergies_pro_monthly` (Play uses a different format).
5. Set the base plan and price, then activate.

#### 2.3b Set up RevenueCat

1. Create an account at [app.revenuecat.com](https://app.revenuecat.com).
2. Create a new project called `Local Allergies`.
3. Add an **iOS app**:
   - Bundle ID: the one from step 1.1
   - App Store Connect API key: generate one at App Store Connect → Users & Access → Integrations → App Store Connect API
4. Add an **Android app**:
   - Package name: the one from step 1.1
   - Google Service Account credentials: follow [RevenueCat's guide](https://www.revenuecat.com/docs/android) to create a service account in Google Play Console
5. Go to **Entitlements → Create entitlement**. Name it exactly `pro` (this string is
   hardcoded in `src/features/subscription/types.ts`).
6. Go to **Products**. Add the App Store and Play Store product IDs from above.
7. Attach both products to the `pro` entitlement.
8. Go to **API keys** in your RevenueCat project settings. Copy:
   - **iOS public SDK key** (starts with `appl_`)
   - **Android public SDK key** (starts with `goog_`)
9. Add to `.env.development`:
   ```env
   REVENUECAT_IOS_KEY=appl_xxxx
   REVENUECAT_ANDROID_KEY=goog_xxxx
   ```

---

### 2.4 Push notifications

#### iOS

1. Sign in at [developer.apple.com](https://developer.apple.com).
2. Go to **Certificates, Identifiers & Profiles → Keys → Create a Key**.
3. Enable **Apple Push Notifications service (APNs)**. Download the `.p8` file —
   you can only download it once.
4. Note your **Key ID** and your **Team ID** (shown in the top-right of the portal).
5. Run:
   ```bash
   eas credentials
   ```
   Choose **iOS → Push Notifications → Upload an APNs key**, then provide the `.p8`
   file path, Key ID, and Team ID when prompted.

#### Android

1. Go to [console.firebase.google.com](https://console.firebase.google.com).
2. Create a new project (or use an existing one). Name it `Local Allergies`.
3. Click **Add app → Android**.
4. Enter your Android package name from step 1.1. Leave SHA-1 blank for now.
5. Download `google-services.json`.
6. After you run `npx expo prebuild --clean`, place the file at:
   ```
   android/app/google-services.json
   ```
   EAS picks it up automatically for FCM.

---

### 2.5 App icon and splash screen

The template placeholders must be replaced before your first TestFlight or internal
testing build — the icon is baked into the native binary.

1. Create or commission your artwork:
   - **`icon.png`** — 1024×1024px, PNG, no transparency (Apple rejects transparent icons)
   - **`adaptive-icon.png`** — 1024×1024px, PNG, with transparent background (Android adaptive icon foreground)
   - **`splash.png`** — 2048×2048px, PNG (the loading screen)
2. Replace the files in [assets/images/](assets/images/) and [assets/splash/](assets/splash/).
3. Run `npx expo prebuild --clean` again so the new images are picked up by the native build.

A quick free option: use Figma or Adobe Express with your logo to export at the right sizes.
Make sure `icon.png` has no transparency — iOS will reject it at upload time.

---

### 2.6 Privacy policy

Apple and Google both require a publicly hosted privacy policy URL before approving
an app that collects location or health data. Local Allergies collects both.

1. Write your policy covering at minimum:
   - What data is collected (GPS location, symptom logs, anonymised community data)
   - How it is stored (on-device SQLite, Supabase for community aggregates only)
   - How to request deletion
   - No data is sold to third parties
2. Host it at a stable URL (GitHub Pages, Notion public page, or your own domain all work).
3. Open [src/features/settings/screens/SettingsScreen.tsx](src/features/settings/screens/SettingsScreen.tsx)
   and replace the two placeholder URLs:
   ```tsx
   Linking.openURL('https://example.com/privacy')  →  your real URL
   Linking.openURL('https://example.com/terms')    →  your real URL (can be same page)
   ```
4. Complete Apple's **Data Nutrition Label** in App Store Connect:
   - Under your app, go to **App Privacy**.
   - Declare: Location (precise, linked to usage), Health & Fitness (symptoms, not linked to identity).

---

## 3 — Product backlog (not yet built)

### 3.1 Home screen widget (iOS / Android)

A glanceable widget showing today's overall pollen level and colour.

- **iOS**: Expo SDK 54 ships `expo-widgets` in preview. Install it, create a
  `Local AllergiesWidget` target in Xcode, and read today's pollen level from a
  shared App Group UserDefaults key written by the main app.
- **Android**: Requires a custom `AppWidgetProvider` in the native layer. Either eject
  to a bare workflow, or add a custom plugin in `plugins/` that generates the widget
  XML at prebuild time.

### 3.2 Species breakdown detail view (Pro)

The Google Pollen API response includes species-level counts (e.g. birch, oak, olive
within the Tree category). The current merger in [src/features/pollen/pollenMerger.ts](src/features/pollen/pollenMerger.ts)
discards species data and collapses to one Tree index.

To implement:
1. Extend `PollenTypeData` with an optional `species?: Record<string, number>` field.
2. Populate it in `googlePollenApi.ts` from the `plantDescription.plantInfo` array.
3. Build a `SpeciesBreakdownSheet` bottom sheet shown when a user taps a pollen pill.
4. Gate it behind `useProGate()` — free users see the sheet with an upgrade prompt.
