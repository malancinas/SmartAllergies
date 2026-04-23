# Next Steps

Everything in this file requires your manual input — credentials, accounts, or assets
that can't be committed to the repo.

---

## 1 — First run

### ✅ 1.1 Bundle ID
`com.malancinas.localallergies` — set in app.json.

### ✅ 1.2 Google OAuth iOS client
`iosUrlScheme` set in app.json.

### ✅ 1.3 Google OAuth web client ID
`GOOGLE_CLIENT_ID` set in `.env.development`.

### ✅ 1.4 `.env.development` created

---

### 👉 1.5 Run prebuild and launch — DO THIS NOW

The `react-native-maps` plugin issue has been fixed. Run:

```bash
npx expo prebuild --clean
```

Once that finishes without errors, launch on the iOS simulator:

```bash
npx expo run:ios
```

If you don't have Xcode installed yet, install it from the Mac App Store first
(it is large — allow 30–60 min). The simulator is included with Xcode.

You must re-run `prebuild --clean` any time you change `app.json` plugins or
add/remove native dependencies.

---

### 1.6 Android Maps API key (skip until you need Android)

The Android map basemap needs a Google Maps API key injected into the native
manifest. This was removed from `app.json` (the plugin wasn't compatible) and
must be added manually after prebuild generates the `android/` folder.

After `npx expo prebuild --clean` has run, open
`android/app/src/main/AndroidManifest.xml` and add inside the `<application>` tag:

```xml
<meta-data
  android:name="com.google.android.geo.API_KEY"
  android:value="YOUR_ANDROID_MAPS_KEY" />
```

To get the key:
1. Go to **Google Cloud Console → APIs & Services → Credentials → Create Credentials → API key**.
2. Restrict it: **Application restrictions → Android apps**, add package
   `com.malancinas.localallergies` + your debug keystore SHA-1:
   ```bash
   keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
   ```
3. **API restrictions → Maps SDK for Android**.

---

## 2 — Before public release

Work through these after you have the app running locally.

---

### 2.1 Supabase setup

#### 2.1a Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and sign in.
2. Click **New project**. Name it `localallergies`, pick a region close to your
   users (`eu-west-2` for UK).
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
2. Log in and link to your project:
   ```bash
   supabase login
   supabase link --project-ref YOUR_PROJECT_REF
   ```
   Your project ref is the ID in the Supabase dashboard URL:
   `https://supabase.com/dashboard/project/YOUR_PROJECT_REF`
3. Deploy the function:
   ```bash
   supabase functions deploy pollen-uk-grid
   ```
4. In the dashboard go to **Edge Functions → pollen-uk-grid → Secrets**, add:
   - `SUPABASE_URL` → your project URL
   - `SUPABASE_SERVICE_ROLE_KEY` → from **Settings → API → service_role**
5. Go to **Edge Functions → pollen-uk-grid → Schedule**, set cron to `0 6 * * *`.
6. Trigger once manually to populate today's data:
   ```bash
   supabase functions invoke pollen-uk-grid
   ```

---

### 2.2 Google Cloud — Pollen API key

1. In **APIs & Services → Library**, search for **Pollen API** and enable it.
2. **Credentials → Create Credentials → API key**.
3. Edit the key: restrict to **Pollen API** only (leave app restrictions open for dev).
4. Add to `.env.development`:
   ```env
   GOOGLE_POLLEN_API_KEY=AIzaSy...
   ```

---

### 2.3 RevenueCat — subscriptions

#### 2.3a Create app store products first

**App Store Connect (iOS):**
1. Sign in at [appstoreconnect.apple.com](https://appstoreconnect.apple.com).
2. Go to your app → **Subscriptions → Create subscription group** (name: `Local Allergies Pro`).
3. Add a subscription:
   - Product ID: `com.malancinas.localallergies.pro.monthly`
   - Duration: 1 month, set a price tier.
4. Submit for review.

**Google Play Console (Android):**
1. Go to [play.google.com/console](https://play.google.com/console).
2. Go to **Monetize → Subscriptions → Create subscription**.
3. Product ID: `localallergies_pro_monthly`.

#### 2.3b Set up RevenueCat

1. Create an account at [app.revenuecat.com](https://app.revenuecat.com).
2. Create a project called `Local Allergies`.
3. Add iOS app (bundle ID `com.malancinas.localallergies`) and Android app.
4. **Entitlements → Create entitlement** — name it exactly `pro`.
5. Add your product IDs under **Products** and attach both to the `pro` entitlement.
6. Copy the SDK keys from **API keys**:
   ```env
   REVENUECAT_IOS_KEY=appl_xxxx
   REVENUECAT_ANDROID_KEY=goog_xxxx
   ```

---

### 2.4 Push notifications

**iOS:**
1. At [developer.apple.com](https://developer.apple.com) → **Keys → Create a Key**, enable **APNs**. Download the `.p8` file once.
2. Note your **Key ID** and **Team ID** (top-right of the portal).
3. Run `eas credentials` and upload the `.p8` when prompted.

**Android:**
1. At [console.firebase.google.com](https://console.firebase.google.com), create a project.
2. **Add app → Android**, enter `com.malancinas.localallergies`.
3. Download `google-services.json`.
4. After `prebuild`, place it at `android/app/google-services.json`.

---

### 2.5 App icon and splash screen

Replace the placeholder images before your first TestFlight build.

| File | Size | Notes |
|---|---|---|
| `assets/images/icon.png` | 1024×1024px | No transparency — Apple rejects it |
| `assets/images/adaptive-icon.png` | 1024×1024px | Transparent background for Android |
| `assets/splash/splash.png` | 2048×2048px | Loading screen |

After replacing, run `npx expo prebuild --clean` again.

---

### 2.6 Privacy policy

1. Write a policy covering: GPS location, symptom logs, anonymised community data,
   no data sold to third parties, how to request deletion.
2. Host it at a public URL (GitHub Pages, Notion, your own domain).
3. Update the two placeholder URLs in
   [src/features/settings/screens/SettingsScreen.tsx](src/features/settings/screens/SettingsScreen.tsx):
   ```
   https://example.com/privacy  →  your URL
   https://example.com/terms    →  your URL
   ```
4. Complete Apple's **App Privacy** section in App Store Connect (declare location and health data).

---

## 3 — Product backlog (not yet built)

### 3.1 Home screen widget (iOS / Android)

- **iOS**: Use `expo-widgets` (SDK 54 preview). Read today's pollen level from a
  shared App Group UserDefaults key written by the main app.
- **Android**: Requires a custom `AppWidgetProvider`. Add as a custom plugin in
  `plugins/` that generates the widget XML at prebuild time.

### 3.2 Species breakdown detail view (Pro)

The Google Pollen API returns species-level data (birch, oak within Tree). Currently
collapsed to a single index in [src/features/pollen/pollenMerger.ts](src/features/pollen/pollenMerger.ts).

To implement:
1. Add `species?: Record<string, number>` to `PollenTypeData` in `types.ts`.
2. Populate it in `googlePollenApi.ts` from `plantDescription.plantInfo`.
3. Build a `SpeciesBreakdownSheet` bottom sheet on pollen pill tap.
4. Gate behind `useProGate()`.
