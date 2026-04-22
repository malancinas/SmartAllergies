# SmartAllergies

A React Native / Expo app for personal allergy tracking — pollen forecasting, symptom logging, personalised risk scoring, and a freemium business model.

## Prerequisites

- **Node.js** 18+
- **Expo CLI** — `npm install -g expo-cli`
- **EAS CLI** — `npm install -g eas-cli`
- **Supabase CLI** — `npm install -g supabase` (for Edge Functions)

## Quick Start

```bash
git clone <repo-url> SmartAllergies
cd SmartAllergies
npm install
cp .env.example .env.development
# Fill in your values — see Environment Setup below
npx expo prebuild        # required: app has native modules
npm run ios              # or: npm run android
```

> **Note:** This app uses native modules (`react-native-maps`, `react-native-purchases`) and will not run in Expo Go. You need a dev build or `npx expo run:ios` / `npx expo run:android`.

---

## Environment Setup

Copy `.env.example` to `.env.development` and fill in your values.

| Variable | Required | Purpose |
|---|---|---|
| `API_BASE_URL` | Yes | Base URL for your backend API |
| `GOOGLE_CLIENT_ID` | Yes | Google OAuth client ID |
| `APP_ENV` | Yes | `development` / `staging` / `production` |
| `POSTHOG_API_KEY` | No | Analytics (omit to disable) |
| `GOOGLE_POLLEN_API_KEY` | No | Google Pollen API — Pro tier map tiles + forecast endpoint |
| `SUPABASE_URL` | No | Supabase project URL |
| `SUPABASE_ANON_KEY` | No | Supabase anon key |
| `REVENUECAT_IOS_KEY` | No | RevenueCat iOS API key |
| `REVENUECAT_ANDROID_KEY` | No | RevenueCat Android API key |

Optional keys degrade gracefully — the app runs without them but the corresponding features are disabled.

---

## Map Feature Setup

The Map screen (🗺️ tab) has two tiers. Both require some one-time setup before the map displays data.

### Free tier — Open-Meteo GeoJSON overlay

The free tier shows regional pollen zones sourced from Open-Meteo, pre-processed by a Supabase Edge Function that runs daily.

**Step 1 — Create the Supabase table**

Run this in the Supabase dashboard SQL editor (Database → SQL Editor):

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

**Step 2 — Deploy the Edge Function**

```bash
supabase login
supabase link --project-ref <your-project-ref>
supabase functions deploy pollen-uk-grid
```

**Step 3 — Add Edge Function secrets**

In the Supabase dashboard → Edge Functions → pollen-uk-grid → Secrets, add:

| Secret | Value |
|---|---|
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Your service role key (Settings → API) |

**Step 4 — Schedule the function**

In the Supabase dashboard → Edge Functions → pollen-uk-grid → Schedule:

```
0 6 * * *
```

This runs at 06:00 UTC daily. You can also trigger it manually from the dashboard to pre-populate data before launch.

### Pro tier — Google Pollen tile overlay

The Pro tier streams live heatmap tiles directly from Google to the user's device.

**Step 1 — Enable the Google Pollen API**

In the [Google Cloud Console](https://console.cloud.google.com):
1. Enable the **Pollen API** for your project
2. Create an API key and restrict it to your iOS bundle ID and Android package name
3. Add the key to `.env.development` as `GOOGLE_POLLEN_API_KEY`

**Step 2 — Add the Android Maps API key**

`react-native-maps` requires a Google Maps API key for Android (separate from the Pollen key). In `app.json`:

```json
{
  "expo": {
    "android": {
      "config": {
        "googleMaps": {
          "apiKey": "YOUR_ANDROID_MAPS_KEY"
        }
      }
    }
  }
}
```

This key is for map rendering only. Restrict it in Google Cloud Console to your Android package name. On iOS, MapKit is used by default and needs no key.

After editing `app.json`, run `npx expo prebuild` again to apply the change.

---

## Available Scripts

| Script | Description |
|---|---|
| `npm run start` | Start Expo dev server |
| `npm run android` | Start on Android emulator |
| `npm run ios` | Start on iOS simulator |
| `npm run lint` | Run ESLint |
| `npm run test` | Run Jest |
| `npm run build:preview` | EAS preview build |

---

## Features

| Feature | Free | Pro |
|---|---|---|
| Pollen forecast (Open-Meteo) | Today only | 5-day merged |
| Pollen forecast (Google Pollen API) | — | Included (multi-source merge) |
| Data quality / confidence indicator | — | Included |
| Symptom logging | 30 logs max | Unlimited |
| Symptom history | 7 days | Full history |
| Community pollen signal (read) | Included | Included |
| Community pollen signal (contribute) | — | Included |
| Allergist export (PDF) | — | Included |
| Map — regional pollen zones | Included | — |
| Map — live Google heatmap tiles | — | Included |
| Map — tap to explore | — | Included |

---

## Tech Stack

| Layer | Library |
|---|---|
| Framework | React Native 0.81 + Expo SDK 54 |
| Language | TypeScript 5 |
| Styling | NativeWind v4 (Tailwind CSS) |
| Navigation | React Navigation v6 |
| State | Zustand v4 |
| Server State | TanStack Query v5 |
| HTTP | Axios |
| Local DB | expo-sqlite |
| Location | expo-location |
| Maps | react-native-maps |
| Subscriptions | react-native-purchases (RevenueCat) |
| Backend | Supabase (Postgres + Edge Functions) |
| i18n | i18next + react-i18next |
| Testing | Jest + React Native Testing Library |

---

## Architecture

```
src/
├── components/          # Shared UI — Button, Input, BottomSheet, etc.
├── config/              # env.ts — typed, validated environment variables
├── features/
│   ├── auth/            # Email + Google + Apple sign-in
│   ├── community/       # Supabase community pollen signal
│   ├── export/          # Allergist PDF export (Pro)
│   ├── forecasting/     # Pearson correlation risk engine
│   ├── home/            # Dashboard, data quality indicator
│   ├── map/             # Pollen heatmap map screen (Free + Pro)
│   ├── notifications/   # Daily allergy alerts
│   ├── pollen/          # Open-Meteo + Google Pollen API, data merge
│   ├── settings/        # Preferences, language, subscription nav
│   ├── subscription/    # RevenueCat hooks, PaywallSheet
│   └── symptoms/        # Logging + history
├── navigation/          # Tab + stack navigators
├── services/            # database.ts (SQLite), supabase.ts
├── stores/              # Zustand persistent (auth, settings, subscription)
├── theme/               # Design tokens
└── types/               # Navigation param lists
supabase/
└── functions/
    └── pollen-uk-grid/  # Daily Open-Meteo → GeoJSON edge function
```

### Storage layers

| Layer | Used for |
|---|---|
| SQLite (`smartallergies.db`) | Symptom logs, pollen cache |
| AsyncStorage | Zustand persistent stores |
| Supabase Postgres | Community signals, pollen grid GeoJSON |

---

## Cost notes (production)

| Service | Free tier | At 1k DAU |
|---|---|---|
| Open-Meteo | Unlimited | £0 |
| Supabase | Generous free tier | £0–£25/month |
| Google Pollen API (Pro tiles) | — | ~£45–55/month |
| Google Maps SDK (Android basemap) | Free for normal volumes | £0 |
| RevenueCat | Free up to $2.5k MRR | % of revenue |

The Google Pollen tile cost is controlled by the `maxZoom={8}` cap on the Pro map. Do not remove this — zooming to level 9+ quadruples tile requests.
