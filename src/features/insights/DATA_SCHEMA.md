# SmartAllergies — Logged Data Schema

This document describes every field captured per symptom log entry, what it means,
and which fields are currently used by the analytics models vs. available for future use.

---

## symptom_logs

One row per user log submission.

| Field | Type | Notes |
|---|---|---|
| `id` | TEXT | `{timestamp}-{random}` |
| `logged_at` | TEXT | ISO8601 — user-selected time slot midpoint (e.g. "morning" → 09:00) |
| `created_at` | TEXT | Actual wall-clock insertion time; anchors the 48-hour edit window |
| `severity` | INTEGER | 1–10 scale ("Barely noticeable" → "Worst ever") |
| `latitude` | REAL | Device location at log time, if permission granted |
| `longitude` | REAL | Device location at log time, if permission granted |
| `notes` | TEXT | Free-text; only writable via the Edit screen (within 48h window) |
| `medications` | TEXT | Comma-separated medication names as entered by the user |

---

## log_symptoms

Junction table — one row per symptom per log.

| Field | Notes |
|---|---|
| `log_id` | FK → symptom_logs |
| `symptom` | One of: `none`, `sneezing`, `itchy_eyes`, `runny_nose`, `congestion`, `skin_reaction`, `headache` |

---

## log_environment

Environmental snapshot at the time of logging. One row per log entry.
All numeric fields are `REAL` and nullable (null when data was unavailable at log time).

### Aggregated Pollen (grains/m³)

| Field | Source | Notes |
|---|---|---|
| `grass_pollen` | Open-Meteo | Daily max hourly value |
| `tree_pollen` | Open-Meteo | Sum of alder + birch + olive |
| `weed_pollen` | Open-Meteo | Sum of mugwort + ragweed |

### Individual Pollen Species (grains/m³)
*Available from Open-Meteo. Null for logs created before this schema version.*

| Field | Species | Season (Northern Hemisphere) |
|---|---|---|
| `alder_pollen` | Alder (*Alnus*) | Jan–Apr |
| `birch_pollen` | Birch (*Betula*) | Mar–May |
| `olive_pollen` | Olive (*Olea europaea*) | Apr–Jun |
| `mugwort_pollen` | Mugwort (*Artemisia*) | Jul–Sep |
| `ragweed_pollen` | Ragweed (*Ambrosia*) | Aug–Oct |

### Air Quality (µg/m³ unless noted)

| Field | Pollutant | Relevance |
|---|---|---|
| `pm25` | PM2.5 fine particles | Respiratory irritant, amplifies pollen response |
| `pm10` | PM10 coarse particles | Respiratory irritant |
| `ozone` | Ozone (O₃) | Damages airway lining, increases allergen uptake |
| `no2` | Nitrogen dioxide | Traffic-related; sensitises airways |
| `so2` | Sulphur dioxide | Industrial; triggers bronchoconstriction |
| `dust` | Mineral dust (µg/m³) | Saharan dust events, etc. |
| `uv_index` | UV index (dimensionless) | **Legacy — no longer used in models.** Retained for historical data. |

### Weather
*Sourced from Open-Meteo weather forecast API at the current hour.*

| Field | Unit | Notes |
|---|---|---|
| `temperature` | °C | Affects pollen release and dispersal |
| `humidity` | % | High humidity suppresses airborne pollen; rain washes it out |
| `wind_speed` | km/h | Higher wind = higher pollen dispersal |
| `precipitation_probability` | % | Proxy for rain wash-out effect |

---

## What the models currently use

### Phase 1 — Pearson correlation (`correlationEngine.ts`)
Uses: `grass_pollen`, `tree_pollen`, `weed_pollen`, `pm25`, `pm10`, `ozone`, `no2`, `so2`, `dust`

### Phase 2 — OLS regression + aggravator analysis (`advancedEngine.ts`)
- **Main regression:** `grass_pollen`, `tree_pollen`, `weed_pollen` → symptom severity
- **Aggravator pass:** residual correlation of `pm25`, `pm10`, `ozone`, `no2`, `so2`, `dust` against OLS residuals

---

## Available for future models (stored, not yet used)

| Field(s) | Potential insight |
|---|---|
| `alder_pollen`, `birch_pollen`, `olive_pollen` | Which tree species specifically drives symptoms — currently all lumped into `tree_pollen` |
| `mugwort_pollen`, `ragweed_pollen` | Which weed species is the culprit |
| `temperature`, `humidity`, `wind_speed` | Weather-adjusted pollen risk; explain symptom variance on days with identical pollen counts |
| `precipitation_probability` | Thunderstorm asthma risk; pollen wash-out modelling |
| Species + seasons | Identify which pollen season the user is most affected by; personalise seasonal forecast |
| Species × AQ interactions | E.g. birch pollen + high ozone = disproportionate reaction |

---

## Future data worth adding

These are **not yet captured** but would meaningfully improve the models:

| Data | How to add |
|---|---|
| Barometric pressure | Add `pressure_msl` to Open-Meteo weather API request |
| Wind direction | Add `wind_direction_10m` to Open-Meteo weather API request |
| Time-of-day symptom patterns | Currently coarsened to 6 slots; storing the exact hour would allow hourly pollen peak analysis |
| Symptom breakdown (eyes/nose/throat) | Separate symptom sub-types in `log_symptoms` |
| Outdoor/indoor flag | Self-reported at log time; explains outlier days |
| Exercise flag | Self-reported; increases allergen inhalation significantly |
