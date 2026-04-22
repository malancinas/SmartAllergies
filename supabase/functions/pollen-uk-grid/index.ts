import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ─── UK grid: ~1.4° lat × 1.5° lng spacing ≈ 80km ─────────────────────────

function buildUkGrid(): Array<{ lat: number; lng: number }> {
  const points: Array<{ lat: number; lng: number }> = [];
  for (let lat = 50.0; lat <= 58.9; lat += 1.4) {
    for (let lng = -7.5; lng <= 1.5; lng += 1.5) {
      points.push({ lat: +lat.toFixed(1), lng: +lng.toFixed(1) });
    }
  }
  return points;
}

// ─── UPI thresholds ─────────────────────────────────────────────────────────

type UpiCategory = 'none' | 'very_low' | 'low' | 'moderate' | 'high' | 'very_high';

function toCategory(value: number): UpiCategory {
  if (value <= 0) return 'none';
  if (value <= 10) return 'very_low';
  if (value <= 30) return 'low';
  if (value <= 80) return 'moderate';
  if (value <= 200) return 'high';
  return 'very_high';
}

const COLORS: Record<UpiCategory, string> = {
  none: '#A8D5A2',
  very_low: '#C8E6A0',
  low: '#F9E07A',
  moderate: '#F4A336',
  high: '#E05C2E',
  very_high: '#C0392B',
};

// ─── Open-Meteo fetch ────────────────────────────────────────────────────────

interface OpenMeteoHourly {
  time: string[];
  alder_pollen: (number | null)[];
  birch_pollen: (number | null)[];
  grass_pollen: (number | null)[];
  mugwort_pollen: (number | null)[];
  olive_pollen: (number | null)[];
  ragweed_pollen: (number | null)[];
}

async function fetchPoint(lat: number, lng: number): Promise<{
  tree: number;
  grass: number;
  weed: number;
}> {
  const url =
    `https://air-quality-api.open-meteo.com/v1/air-quality` +
    `?latitude=${lat}&longitude=${lng}` +
    `&hourly=alder_pollen,birch_pollen,grass_pollen,mugwort_pollen,olive_pollen,ragweed_pollen` +
    `&forecast_days=1`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Open-Meteo error for ${lat},${lng}: ${res.status}`);
  const json: { hourly: OpenMeteoHourly } = await res.json();
  const h = json.hourly;

  const dayMax = (arr: (number | null)[]): number =>
    arr.reduce((m, v) => Math.max(m, v ?? 0), 0);

  return {
    tree: Math.max(dayMax(h.alder_pollen), dayMax(h.birch_pollen), dayMax(h.olive_pollen)),
    grass: dayMax(h.grass_pollen),
    weed: Math.max(dayMax(h.mugwort_pollen), dayMax(h.ragweed_pollen)),
  };
}

// ─── GeoJSON builder (bounding-box Voronoi approximation) ───────────────────

const LAT_HALF = 0.7; // ~0.7° ≈ half of 1.4° grid spacing
const LNG_HALF = 0.75; // ~0.75° ≈ half of 1.5° grid spacing

function buildGeoJson(
  points: Array<{ lat: number; lng: number; value: number }>,
): object {
  return {
    type: 'FeatureCollection',
    features: points.map(({ lat, lng, value }) => {
      const category = toCategory(value);
      return {
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [
            [
              [lng - LNG_HALF, lat - LAT_HALF],
              [lng + LNG_HALF, lat - LAT_HALF],
              [lng + LNG_HALF, lat + LAT_HALF],
              [lng - LNG_HALF, lat + LAT_HALF],
              [lng - LNG_HALF, lat - LAT_HALF],
            ],
          ],
        },
        properties: { category, color: COLORS[category], value },
      };
    }),
  };
}

// ─── Edge Function handler ───────────────────────────────────────────────────

Deno.serve(async () => {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const grid = buildUkGrid();
    const today = new Date().toISOString().slice(0, 10);

    // Fetch all grid points — batch in groups of 10 to avoid overwhelming Open-Meteo
    const results: Array<{ lat: number; lng: number; tree: number; grass: number; weed: number }> = [];
    for (let i = 0; i < grid.length; i += 10) {
      const batch = grid.slice(i, i + 10);
      const settled = await Promise.allSettled(
        batch.map(async (p) => {
          const vals = await fetchPoint(p.lat, p.lng);
          return { ...p, ...vals };
        }),
      );
      for (const r of settled) {
        if (r.status === 'fulfilled') results.push(r.value);
      }
    }

    // Build one GeoJSON row per pollen type
    const types: Array<{ key: 'tree' | 'grass' | 'weed'; label: string }> = [
      { key: 'tree', label: 'tree' },
      { key: 'grass', label: 'grass' },
      { key: 'weed', label: 'weed' },
    ];

    const rows = types.map(({ key, label }) => ({
      date: today,
      pollen_type: label,
      geojson: buildGeoJson(results.map((r) => ({ lat: r.lat, lng: r.lng, value: r[key] }))),
      updated_at: new Date().toISOString(),
    }));

    const { error } = await supabase
      .from('pollen_uk_grid')
      .upsert(rows, { onConflict: 'date,pollen_type' });

    if (error) throw error;

    return new Response(
      JSON.stringify({ ok: true, date: today, points: results.length }),
      { headers: { 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ ok: false, error: String(err) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
});
