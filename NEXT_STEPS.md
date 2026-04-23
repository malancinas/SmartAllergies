# Next Steps

Work still requiring your manual intervention. Everything else has been implemented.

---

## 1 — Before you can run the app at all

### 1.1 Run prebuild

`react-native-maps` and `react-native-purchases` are native modules. Expo Go will crash.
You need a dev build:

```bash
npx expo prebuild --clean
npx expo run:ios      # or: npx expo run:android
```

Run `prebuild --clean` any time you change `app.json` plugins or native dependencies.

### 1.2 Configure EAS and fill in real credentials

`eas.json` has been created. Link your project:

```bash
eas login
eas build:configure
```

Then fill in the placeholder values in `app.json`:

| Placeholder | Where to get it |
|---|---|
| `com.yourcompany.smartallergies` | Your chosen bundle ID — update both iOS and Android entries |
| `YOUR_ANDROID_MAPS_KEY` | Google Cloud Console → APIs & Services → Credentials |
| `YOUR_REVERSED_CLIENT_ID` | `GoogleService-Info.plist` → `REVERSED_CLIENT_ID` field |

### 1.3 Fill in `.env.development`

Copy `.env.example` and fill in at minimum:

```env
API_BASE_URL=https://api.example.com   # or your local tunnel URL
GOOGLE_CLIENT_ID=your-web-client-id
APP_ENV=development
```

Without `API_BASE_URL` and `GOOGLE_CLIENT_ID` the app throws on startup.

---

## 2 — Before public release

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

```sql
ALTER TABLE community_signals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon insert" ON community_signals
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "anon select aggregate" ON community_signals
  FOR SELECT TO anon USING (true);
```

**Deploy and schedule the Edge Function:**

```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase functions deploy pollen-uk-grid
```

In Supabase dashboard → Edge Functions → pollen-uk-grid → Secrets, add:

| Key | Value |
|---|---|
| `SUPABASE_URL` | Your project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Settings → API → service_role key |

Schedule: `0 6 * * *` — and trigger manually once to pre-populate today's data.

### 2.2 Configure Google Cloud

1. Enable **Pollen API**, **Maps SDK for Android**, **Maps SDK for iOS**
2. Create two API keys:
   - `GOOGLE_POLLEN_API_KEY` — Pollen API only, restricted to your bundle IDs
   - Android Maps key — Maps SDK for Android only, restricted to Android package
3. Add `GOOGLE_POLLEN_API_KEY` to `.env` files
4. Replace `YOUR_ANDROID_MAPS_KEY` in `app.json`

### 2.3 Configure RevenueCat

1. Create a RevenueCat project at [app.revenuecat.com](https://app.revenuecat.com)
2. Create an entitlement named exactly `pro`
3. Create monthly subscription products in App Store Connect and Google Play Console,
   then attach to the `pro` entitlement
4. Add to `.env`:
   ```env
   REVENUECAT_IOS_KEY=appl_xxxx
   REVENUECAT_ANDROID_KEY=goog_xxxx
   ```

### 2.4 Configure push notifications

**iOS:** Run `eas credentials` and follow prompts to register APNS key.

**Android:** Create a Firebase project, add your Android app, download
`google-services.json`, place at `android/app/google-services.json` after `prebuild`.

### 2.5 Replace icon and splash screen

`assets/images/icon.png` and `assets/splash/splash.png` are template placeholders.
Replace before your first TestFlight build.

Required sizes:
- `icon.png` — 1024×1024px, no transparency
- `adaptive-icon.png` — 1024×1024px, transparent background
- `splash.png` — 2048×2048px

### 2.6 Write a privacy policy

The app collects GPS location and health symptoms. Both Apple and Google require a
privacy policy URL before App Store approval. Update the placeholder URLs in
`SettingsScreen.tsx` (currently `https://example.com/privacy` and `/terms`).

---

## 3 — Product backlog (remaining)

### 3.1 Widget (iOS / Android)

A home screen widget showing today's overall pollen level. Expo SDK 54 supports iOS
widgets via `expo-widgets` (currently in preview). Android widgets require bare
workflow or EAS build customisation.

### 3.2 Species breakdown (Pro)

The Google Pollen API returns species-level data (birch, oak within Tree). The current
implementation collapses to a single Tree index. Showing species breakdown in the
detail view is a meaningful Pro differentiator.
