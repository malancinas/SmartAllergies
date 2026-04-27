# Personal Allergy Profile — Technical Reference

## What this feature does

When a Pro user logs symptoms daily, the app captures the pollen and air quality readings for that day alongside the log. After 7 days of captured data it computes a Pearson correlation between each environmental factor and the user's symptom severity. This produces a ranked list of their personal allergen triggers and a personalised risk score on the home screen.

Free users always see a generic risk score derived from the API's worst-of-three pollen level. Pro users with fewer than 7 days see the same generic score plus a progress nudge. Pro users with 7+ days get a personalised score and a "See your personal allergy profile" CTA on the banner that navigates to the full breakdown screen.

---

## Architecture overview

```
LogSymptomsScreen
  └─ useCurrentPollen()         ← captures today's pollen + AQ snapshot
  └─ useSymptomLogger()
       └─ insertSymptomLog()    ← SQLite: symptom_logs
       └─ insertLogEnvironment() ← SQLite: log_environment  (NEW)
       └─ invalidates ['allergy-profile'] query key

useAllergyProfile()             ← TanStack Query, key: ['allergy-profile']
  └─ getCorrelationData()       ← SQL GROUP BY date, MAX severity, AVG env values
  └─ computeCorrelations()      ← pure Pearson engine
  └─ returns: { correlations, daysWithData, daysNeeded, ready }

useForecast()                   ← used by HomeScreen
  └─ useAllergyProfile()        ← shared cache, no extra DB call
  ├─ isPro + ready  → correlationsToWeights()   ← accurate personalised path
  ├─ isPro + building → buildCorrelationWeights() ← proxy fallback
  └─ free           → GENERIC_WEIGHTS (0.33/0.33/0.33)

computeRiskScore()
  ├─ personalised=true  → weighted sum of tree/grass/weed × personal weights
  └─ personalised=false → classifyRiskFromOverall(forecast.overallLevel)
                          ← uses API's worst-of-three directly, avoids dilution

HomeScreen
  └─ RiskBanner
       ├─ free                      → generic label + upgrade nudge (tappable)
       ├─ pro + building            → generic label + "X more days" message
       └─ pro + ready               → personalised label + trigger pill (if |r|≥0.4)
                                      + "See your personal allergy profile ›" button
                                           └─ navigation.navigate('AllergyProfile')
                                                └─ AllergyProfileScreen (HomeStack)
```

---

## Database

### New table: `log_environment`

```sql
CREATE TABLE IF NOT EXISTS log_environment (
  log_id   TEXT PRIMARY KEY,
  date     TEXT NOT NULL,          -- YYYY-MM-DD, indexed by GROUP BY queries
  grass_pollen REAL,               -- grains/m³ from Open-Meteo
  tree_pollen  REAL,
  weed_pollen  REAL,
  pm25     REAL,                   -- µg/m³
  pm10     REAL,
  ozone    REAL,                   -- µg/m³
  no2      REAL,
  so2      REAL,
  uv_index REAL,
  dust     REAL,
  FOREIGN KEY (log_id) REFERENCES symptom_logs(id) ON DELETE CASCADE
);
```

Values are captured at the moment the user submits a log from the Open-Meteo API response already in memory (`today` from `useCurrentPollen()`). All fields are nullable — if pollen data wasn't available that day (e.g. no network, outside coverage area) the row is still written with nulls and excluded from correlation calculation for that factor.

### Key query: `getCorrelationData()`

```sql
SELECT
  DATE(sl.logged_at) AS date,
  MAX(sl.severity)   AS max_severity,    -- worst episode of the day
  AVG(le.grass_pollen) AS grass_pollen,  -- average in case of multiple logs/day
  AVG(le.tree_pollen)  AS tree_pollen,
  AVG(le.weed_pollen)  AS weed_pollen,
  AVG(le.pm25)  AS pm25,
  AVG(le.pm10)  AS pm10,
  AVG(le.ozone) AS ozone,
  AVG(le.no2)   AS no2,
  AVG(le.so2)   AS so2,
  AVG(le.uv_index) AS uv_index,
  AVG(le.dust)  AS dust
FROM symptom_logs sl
JOIN log_environment le ON le.log_id = sl.id
GROUP BY DATE(sl.logged_at)
ORDER BY date ASC
```

Returns one row per calendar day. Severity is the maximum across all logs that day (most impactful episode). Env values are averaged so multiple logs on the same day don't skew the data.

---

## Correlation engine

**File:** `src/features/insights/correlationEngine.ts`

### `computeCorrelations(rows: CorrelationDataRow[]): CorrelationResult[]`

- Requires ≥ `MIN_DAYS_FOR_RESULTS` (7) rows to return results; returns `[]` otherwise
- For each of the 10 factors, filters to only rows where that factor is non-null, then requires ≥ 7 paired days for that factor specifically
- Calls `pearson(envValues, severities)` and stores the raw r value (not clamped — negative correlations are preserved)
- Results sorted by `Math.abs(correlation)` descending so the strongest signal (positive or negative) ranks first
- Factors: `grassPollen`, `treePollen`, `weedPollen`, `pm25`, `pm10`, `ozone`, `no2`, `so2`, `uvIndex`, `dust`

### `pearson(x, y): number`

Standard Pearson r. Returns 0 if either array has zero variance (constant values carry no signal). Handles the edge case of n < 2 by returning 0.

### `correlationStrength(r): { label, color }`

| |r| range | Label | Colour |
|---|---|---|---|
| ≥ 0.7 | Strong | `#ef4444` (red) |
| ≥ 0.4 | Moderate | `#f97316` (orange) |
| ≥ 0.2 | Weak | `#eab308` (yellow) |
| < 0.2 | Little to none | `#94a3b8` (grey) |

### `MIN_DAYS_FOR_RESULTS = 7`

Applied at two levels: the overall row count, and per-factor paired count. A factor with sparse data (e.g. AQ only captured on 5 of 10 days) gets `correlation: 0, dataPoints: 5` rather than a spurious result.

---

## Forecasting engine integration

**File:** `src/features/forecasting/engine.ts`

### `correlationsToWeights(correlations: CorrelationResult[]): CorrelationWeights`

Converts the allergy profile output into the `{ tree, grass, weed, personalised }` weights shape used by `computeRiskScore`. Only uses pollen factors (grass/tree/weed), clamps negatives to 0, normalises to sum to 1.

```
weights.grass = max(0, r_grass) / (max(0, r_grass) + max(0, r_tree) + max(0, r_weed))
```

If all three pollen correlations are ≤ 0 (unusual — would mean pollen makes them better), falls back to `personalised: false` with equal weights.

### `computeRiskScore(forecast, weights): DailyRiskScore`

- **Personalised path** (`weights.personalised = true`): weighted sum `tree×w.tree + grass×w.grass + weed×w.weed`, then `classifyRisk(score)` using thresholds `< 0.3 = low`, `< 0.6 = medium`, `≥ 0.6 = high`
- **Generic path** (`weights.personalised = false`): uses `classifyRiskFromOverall(forecast.overallLevel)` — maps the API's pre-computed worst-of-three level directly. This avoids the dilution bug where `medium tree + none grass + none weed` would average to `low` with equal weights.

### `classifyRiskFromOverall(level: PollenLevel): RiskLevel`

```
none | low   → 'low'
medium        → 'medium'
high | very_high → 'high'
```

---

## `useForecast` branching logic

```
tier = 'free'                   → GENERIC_WEIGHTS, personalised: false
tier = 'pro', profileData.ready → correlationsToWeights(profileData.correlations)
tier = 'pro', not ready yet     → buildCorrelationWeights(logs, forecast)  ← proxy fallback
```

The proxy fallback (`buildCorrelationWeights`) correlates symptom logs against the 5-day pollen forecast as a rough stand-in for historical data. It is only used during the Pro onboarding window (< 7 days logged). Once the profile is ready it is never used again.

`useAllergyProfile()` is called inside `useForecast` — React Query deduplicates the `['allergy-profile']` cache key so `HomeScreen` calling it separately does not trigger a second DB query.

---

## Navigation

`AllergyProfileScreen` lives inside a `HomeStack` navigator:

```
TabNavigator
  └─ Home tab → HomeStackNavigator
       ├─ HomeMain (HomeScreen)
       └─ AllergyProfile (AllergyProfileScreen)   ← pushed by banner CTA
```

The profile screen is no longer a tab. It is accessed only via the "See your personal allergy profile ›" button in the `RiskBanner`, which calls `navigation.navigate('AllergyProfile')` typed to `HomeStackParamList`.

---

## RiskBanner states

**Props:** `level`, `personalised`, `isPro`, `daysNeeded?`, `topTrigger?`, `onUpgradePress?`, `onProfilePress?`

| User state | Banner label | Footer |
|---|---|---|
| Free | "Low / Moderate / High risk today" | Upgrade nudge (tappable → paywall) |
| Pro, < 7 days | Same generic label | "🧬 X more days of logging to personalise" |
| Pro, ≥ 7 days, |r| < 0.4 | "Low / Moderate / High risk **for you** today" | "See your personal allergy profile ›" |
| Pro, ≥ 7 days, |r| ≥ 0.4 | "…for you today" | Trigger pill + "See your personal allergy profile ›" |

The trigger pill only renders when the top-ranked factor has `Math.abs(correlation) >= 0.4`. Below that the correlation is too weak to be worth surfacing.

---

## AllergyProfileScreen

**File:** `src/features/insights/screens/AllergyProfileScreen.tsx`

Sections:
- **Progress card** — shown when `!data.ready`. Progress bar filling `daysWithData / daysNeeded`.
- **InsightCallout** — shown when ready. Prose sentence: "Your symptoms correlate most strongly with grass pollen, ozone." Only lists factors where |r| ≥ 0.4.
- **CorrelationSection "Pollen"** — grass, tree, weed rows.
- **CorrelationSection "Air quality"** — pm25, pm10, ozone, no2, so2, uvIndex, dust rows.

Each `CorrelationBar` shows: factor name · strength label (coloured) · r value · "Based on N days of data" · filled bar scaled to `|r| × 100%`.

---

## Key files summary

| File | Role |
|---|---|
| `src/services/database.ts` | `log_environment` table, `insertLogEnvironment()`, `getCorrelationData()` |
| `src/features/insights/correlationEngine.ts` | Pure Pearson math, `computeCorrelations()`, `correlationStrength()` |
| `src/features/insights/hooks/useAllergyProfile.ts` | TanStack Query wrapper, `['allergy-profile']` key |
| `src/features/insights/screens/AllergyProfileScreen.tsx` | Full breakdown UI |
| `src/features/insights/__tests__/correlationEngine.test.ts` | 27 unit + simulation tests |
| `src/features/forecasting/engine.ts` | `correlationsToWeights()`, `classifyRiskFromOverall()`, updated `computeRiskScore()` |
| `src/features/forecasting/hooks/useForecast.ts` | Free/Pro/building branching, uses `useAllergyProfile` |
| `src/features/home/components/RiskBanner.tsx` | 4-state banner (free / building / ready no trigger / ready with trigger) |
| `src/features/home/screens/HomeScreen.tsx` | Wires `profileData` + navigation into banner |
| `src/features/symptoms/types.ts` | `EnvironmentSnapshot` interface, added to `CreateSymptomLogInput` |
| `src/features/symptoms/hooks/useSymptomLogger.ts` | Persists env snapshot, invalidates `['allergy-profile']` |
| `src/features/symptoms/screens/LogSymptomsScreen.tsx` | Captures `today` from `useCurrentPollen()`, passes as `environment` |
| `src/navigation/HomeStackNavigator.tsx` | HomeMain + AllergyProfile stack |
| `src/types/navigation.ts` | `HomeStackParamList` added |

---

## Extending this feature

### Adding ML (planned)

The `log_environment` table already stores all the features you'd need: 3 pollen types + 7 AQ metrics as continuous values per day. The Pearson engine is a drop-in baseline — to replace or augment it:

1. **Feature engineering ideas:** lagged features (yesterday's pollen vs today's severity), rolling 3-day pollen average, pollen × humidity interaction terms, season encoding. All can be derived from `log_environment` rows before fitting.

2. **On-device ML options:** `@tensorflow/tfjs-react-native` supports linear regression and small neural nets. A simple linear regression (`severity ~ β₁·grass + β₂·tree + β₃·pm25 + ...`) would be a natural next step — coefficients play the same role as the current Pearson weights.

3. **Where to plug in:** `computeCorrelations()` in `correlationEngine.ts` returns `CorrelationResult[]`. You can replace or augment this function with an ML-derived result in the same shape — the rest of the pipeline (`useAllergyProfile`, `correlationsToWeights`, `AllergyProfileScreen`) will work unchanged.

4. **Server-side option:** `getCorrelationData()` could instead call a Supabase edge function that runs sklearn on the server, returning the same `CorrelationResult[]` JSON. The client side would need no changes.

### Customising the profile page

- **Symptom-level breakdown:** the current model uses overall daily severity. `log_symptoms` records individual symptom types (sneezing, itchy_eyes, etc.). You could run separate correlations per symptom type and show "Grass pollen → sneezing (r=0.87), itchy eyes (r=0.72)" — requires adding `symptom` as a group-by dimension in `getCorrelationData` or a new query.
- **Seasonal view:** filter `getCorrelationData()` by date range and show how correlations shift between spring/summer/autumn.
- **Time-of-day sensitivity:** `log_symptoms.logged_at` has a time-slot hour. Could correlate morning vs evening logs separately against AQ (ozone peaks afternoon, pollen peaks morning).
- **Medication effect:** `symptom_logs.medications` is stored. Could split logs into medicated/unmedicated days and show "without medication your grass pollen correlation is 0.87; with loratadine it drops to 0.41."
- **Trend over time:** compare the last 30-day correlation window vs the previous 30-day window to detect seasonal shifts.

### Data quality improvements

- **Historical pollen backfill:** `buildCorrelationWeights` (the Pro building-phase proxy) uses the 5-day forecast as a stand-in for history. The Open-Meteo historical air quality API (`https://air-quality-api.open-meteo.com/v1/air-quality?past_days=90`) could backfill `log_environment` for logs made before the feature shipped, improving correlation accuracy for existing users.
- **Species-level pollen:** `DailyPollenForecast.species[]` contains individual species (birch, alder, olive, etc.) when available from Open-Meteo. These could be stored as additional columns in `log_environment` and added as extra factors in `FACTORS` in `correlationEngine.ts`.
