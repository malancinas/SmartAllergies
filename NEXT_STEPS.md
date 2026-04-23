# Next Steps

Everything in this file requires your manual input — credentials, accounts, or assets
that can't be committed to the repo.

---

## Resuming work — how to get back to where you are

All of Section 1 is complete. The app builds and runs on the Android emulator.

To pick up where you left off:

1. Start the emulator: **Android Studio → Virtual Device Manager → ▶**
2. Wait for Android to fully boot
3. In your project terminal:
   ```powershell
   $env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
   npx expo run:android
   ```

**What's done:**
- Bundle ID, Google OAuth (iOS + web), `.env.development`, prebuild, JAVA_HOME, Android emulator build
- Android Maps API key injected via `app.config.js` from `ANDROID_MAPS_API_KEY` in `.env.development`

**What's next:** Section 2 — Supabase setup (2.1), then Pollen API key (2.2), RevenueCat (2.3).

---

## 1 — First run

### ✅ 1.1 Bundle ID
`com.malancinas.localallergies` — set in app.json.

### ✅ 1.2 Google OAuth iOS client
`iosUrlScheme` set in app.json using client `356012542328-bhc46uh02rl7tpmf0m2qhm24g8rhoe3v`.

### ✅ 1.3 Google OAuth web client ID
`GOOGLE_CLIENT_ID` set in `.env.development`.

### ✅ 1.4 `.env.development` created

### ✅ 1.5 Prebuild run
`npx expo prebuild --clean` completed successfully.

### ✅ 1.6 JAVA_HOME configured
Android Studio's bundled JDK is at `C:\Program Files\Android\Android Studio\jbr`.
This was added to System environment variables. If you ever open a new terminal and
the Android build fails with `JAVA_HOME is not set`, run this in your terminal first:

```powershell
$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
```

Then retry `npx expo run:android`. You only need this if the system variable hasn't
taken effect in that terminal session.

### 👉 1.7 Android emulator — currently compiling

Once compilation finishes the app will install on the emulator automatically.
To run it again in future:

1. Open Android Studio → **Virtual Device Manager** → press ▶ to start the emulator
2. Wait for Android to fully boot
3. In your project terminal:
   ```powershell
   $env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
   npx expo run:android
   ```

### ✅ 1.8 Android Maps API key

Key stored in `.env.development` as `ANDROID_MAPS_API_KEY`.
`app.config.js` injects it into `android.config.googleMaps.apiKey` at prebuild time —
no manual edits to `AndroidManifest.xml` needed. Run `npx expo prebuild --clean` to
regenerate the manifest with the key baked in.

---

## 2 — Before public release

Work through these after you have the app running on the emulator.

---

### 2.1 Supabase setup

#### 2.1a Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and sign in.
2. Click **New project**. Name it `localallergies`, region `eu-west-2` (UK).
3. Save the database password somewhere safe.
4. Once ready, go to **Settings → API**.
5. Copy **Project URL** and **anon public** key into `.env.development`:
   ```env
   SUPABASE_URL=https://xxxx.supabase.co
   SUPABASE_ANON_KEY=eyJh...
   ```

#### 2.1b Create the pollen grid table

In **SQL Editor → New query**, run:
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

In **SQL Editor**, run:
```sql
CREATE TABLE IF NOT EXISTS community_signals (
  id           bigserial PRIMARY KEY,
  user_id_hash text NOT NULL,
  geohash      text NOT NULL,
  severity     integer NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE community_signals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon insert" ON community_signals
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "anon select aggregate" ON community_signals
  FOR SELECT TO anon USING (true);
```

#### 2.1d Deploy the pollen Edge Function

1. Install the Supabase CLI:
   ```bash
   npm install -g supabase
   ```
2. Log in and link:
   ```bash
   supabase login
   supabase link --project-ref YOUR_PROJECT_REF
   ```
   Project ref is the ID in your Supabase dashboard URL.
3. Deploy:
   ```bash
   supabase functions deploy pollen-uk-grid
   ```
4. In the dashboard → **Edge Functions → pollen-uk-grid → Secrets**, add:
   - `SUPABASE_URL` → your project URL
   - `SUPABASE_SERVICE_ROLE_KEY` → from **Settings → API → service_role**
5. Set schedule to `0 6 * * *` under **Edge Functions → pollen-uk-grid → Schedule**.
6. Trigger once manually to populate today's data:
   ```bash
   supabase functions invoke pollen-uk-grid
   ```

---

### 2.2 Google Cloud — Pollen API key

1. **APIs & Services → Library** → search **Pollen API** → Enable.
2. **Credentials → Create Credentials → API key**.
3. Edit the key → restrict to **Pollen API** only.
4. Add to `.env.development`:
   ```env
   GOOGLE_POLLEN_API_KEY=AIzaSy...
   ```

---

### 2.3 RevenueCat — subscriptions

#### 2.3a Create products in the app stores first

**App Store Connect:**
1. Sign in at [appstoreconnect.apple.com](https://appstoreconnect.apple.com).
2. Create your app using bundle ID `com.malancinas.localallergies`.
3. **Subscriptions → Create subscription group** → name: `Local Allergies Pro`.
4. Add subscription:
   - Product ID: `com.malancinas.localallergies.pro.monthly`
   - Duration: 1 month, set a price tier.
5. Submit for review.

**Google Play Console:**
1. Go to [play.google.com/console](https://play.google.com/console).
2. Create app with package `com.malancinas.localallergies`.
3. **Monetize → Subscriptions → Create subscription**.
4. Product ID: `localallergies_pro_monthly`.

#### 2.3b Configure RevenueCat

1. Create account at [app.revenuecat.com](https://app.revenuecat.com).
2. New project → `Local Allergies`.
3. Add iOS app (bundle ID `com.malancinas.localallergies`) and Android app.
4. **Entitlements → Create** → name exactly `pro`.
5. Add your product IDs under **Products**, attach both to the `pro` entitlement.
6. Copy SDK keys from **API keys** into `.env.development`:
   ```env
   REVENUECAT_IOS_KEY=appl_xxxx
   REVENUECAT_ANDROID_KEY=goog_xxxx
   ```

---

### 2.4 Push notifications

**iOS:**
1. [developer.apple.com](https://developer.apple.com) → **Keys → Create a Key** → enable APNs.
2. Download the `.p8` file (one-time download). Note your Key ID and Team ID.
3. Run `eas credentials` and upload the `.p8` when prompted.

**Android:**
1. [console.firebase.google.com](https://console.firebase.google.com) → create project.
2. **Add app → Android** → enter `com.malancinas.localallergies`.
3. Download `google-services.json`.
4. After prebuild, place at `android/app/google-services.json`.

---

### 2.5 App icon and splash screen

Replace before first TestFlight / Play Store build — icons are baked into the binary.

| File | Size | Notes |
|---|---|---|
| `assets/images/icon.png` | 1024×1024px | No transparency — Apple rejects it |
| `assets/images/adaptive-icon.png` | 1024×1024px | Transparent background (Android) |
| `assets/splash/splash.png` | 2048×2048px | Loading screen |

After replacing, run `npx expo prebuild --clean` again.

---

### 2.6 Privacy policy

1. Write a policy covering: GPS location, symptom logs, anonymised community data,
   no data sold, how to request deletion.
2. Host at a public URL (GitHub Pages, Notion, your own domain).
3. Update the placeholder URLs in
   [src/features/settings/screens/SettingsScreen.tsx](src/features/settings/screens/SettingsScreen.tsx):
   ```
   https://example.com/privacy  →  your real URL
   https://example.com/terms    →  your real URL
   ```
4. In App Store Connect → **App Privacy**, declare location and health data collection.

---

## 3 — Product backlog (not yet built)

### 3.1 Home screen widget (iOS / Android)

- **iOS**: Use `expo-widgets` (SDK 54 preview). Write today's pollen level to a shared
  App Group UserDefaults key from the main app, read it in the widget target.
- **Android**: Requires a custom `AppWidgetProvider`. Add as a custom Expo plugin in
  `plugins/` that generates the widget XML at prebuild time.

### 3.2 Species breakdown detail view (Pro)

The Google Pollen API returns species-level data (birch, oak within Tree). Currently
collapsed to a single index in [src/features/pollen/pollenMerger.ts](src/features/pollen/pollenMerger.ts).

To implement:
1. Add `species?: Record<string, number>` to `PollenTypeData` in `types.ts`.
2. Populate from `plantDescription.plantInfo` in `googlePollenApi.ts`.
3. Build a `SpeciesBreakdownSheet` bottom sheet shown on pollen pill tap.
4. Gate behind `useProGate()`.
