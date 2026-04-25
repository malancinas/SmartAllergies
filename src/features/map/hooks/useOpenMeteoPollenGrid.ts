import { useState, useEffect } from 'react';
import type { LayerType, UpiCategory, PollenGridGeoJson, PollenGridFeature } from '../types';
import { UPI_COLORS } from '../types';

type GridData = Record<LayerType, PollenGridGeoJson | null>;
const EMPTY: GridData = { grass: null, tree: null, weed: null };

// UK bounding box — 1.5° cells
const STEP = 1.5;
const LAT_MIN = 49.5;
const LAT_MAX = 61.0;
const LON_MIN = -8.0;
const LON_MAX = 2.5;

function generateGrid(): { lat: number; lon: number }[] {
  const pts: { lat: number; lon: number }[] = [];
  for (let lat = LAT_MIN + STEP / 2; lat < LAT_MAX; lat += STEP) {
    for (let lon = LON_MIN + STEP / 2; lon < LON_MAX; lon += STEP) {
      pts.push({ lat: +lat.toFixed(2), lon: +lon.toFixed(2) });
    }
  }
  return pts;
}

function classifyTree(v: number): UpiCategory {
  if (v === 0) return 'none';
  if (v < 5)   return 'very_low';
  if (v < 15)  return 'low';
  if (v < 90)  return 'moderate';
  if (v < 250) return 'high';
  return 'very_high';
}

function classifyGrass(v: number): UpiCategory {
  if (v === 0)  return 'none';
  if (v < 5)   return 'very_low';
  if (v < 30)  return 'low';
  if (v < 100) return 'moderate';
  if (v < 200) return 'high';
  return 'very_high';
}

function classifyWeed(v: number): UpiCategory {
  if (v === 0)  return 'none';
  if (v < 5)   return 'very_low';
  if (v < 50)  return 'low';
  if (v < 150) return 'moderate';
  if (v < 300) return 'high';
  return 'very_high';
}

function cellPolygon(lat: number, lon: number, half: number): number[][][] {
  return [[
    [lon - half, lat - half],
    [lon + half, lat - half],
    [lon + half, lat + half],
    [lon - half, lat + half],
    [lon - half, lat - half],
  ]];
}

function buildGeoJson(
  points: { lat: number; lon: number }[],
  values: number[],
  classify: (v: number) => UpiCategory,
): PollenGridGeoJson {
  const features: PollenGridFeature[] = points.map((pt, i) => {
    const category = classify(values[i] ?? 0);
    return {
      type: 'Feature',
      geometry: { type: 'Polygon', coordinates: cellPolygon(pt.lat, pt.lon, STEP / 2) },
      properties: { category, color: UPI_COLORS[category], value: values[i] ?? 0 },
    };
  });
  return { type: 'FeatureCollection', features };
}

function maxForIndices(arr: (number | null)[] | undefined, indices: number[]): number {
  if (!arr || indices.length === 0) return 0;
  return Math.max(...indices.map((i) => arr[i] ?? 0), 0);
}

export function useOpenMeteoPollenGrid(enabled: boolean) {
  const [gridData, setGridData] = useState<GridData>(EMPTY);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;
    const todayStr = new Date().toISOString().slice(0, 10);

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const points = generateGrid();
        const lats = points.map((p) => p.lat).join(',');
        const lons = points.map((p) => p.lon).join(',');

        const url =
          `https://air-quality-api.open-meteo.com/v1/air-quality` +
          `?latitude=${lats}&longitude=${lons}` +
          `&hourly=alder_pollen,birch_pollen,grass_pollen,mugwort_pollen,olive_pollen,ragweed_pollen` +
          `&timezone=UTC&forecast_days=1`;

        const res = await fetch(url);
        if (!res.ok) throw new Error(`Open-Meteo grid error: ${res.status}`);
        const json = await res.json();

        // Batch response is an array; single-point fallback is an object
        const responses: any[] = Array.isArray(json) ? json : [json];

        const treeVals: number[] = [];
        const grassVals: number[] = [];
        const weedVals: number[] = [];

        for (const r of responses) {
          const h = r.hourly ?? {};
          const times: string[] = h.time ?? [];
          const todayIdx = times
            .map((t, i) => (t.startsWith(todayStr) ? i : -1))
            .filter((i) => i >= 0);

          // Sum species at each hour, then take the daily max
          const treeByHour = todayIdx.map(
            (i) => (h.alder_pollen?.[i] ?? 0) + (h.birch_pollen?.[i] ?? 0) + (h.olive_pollen?.[i] ?? 0),
          );
          const grassByHour = todayIdx.map((i) => h.grass_pollen?.[i] ?? 0);
          const weedByHour = todayIdx.map(
            (i) => (h.mugwort_pollen?.[i] ?? 0) + (h.ragweed_pollen?.[i] ?? 0),
          );

          treeVals.push(treeByHour.length ? Math.max(...treeByHour) : 0);
          grassVals.push(grassByHour.length ? Math.max(...grassByHour) : 0);
          weedVals.push(weedByHour.length ? Math.max(...weedByHour) : 0);
        }

        if (!cancelled) {
          setGridData({
            tree: buildGeoJson(points, treeVals, classifyTree),
            grass: buildGeoJson(points, grassVals, classifyGrass),
            weed: buildGeoJson(points, weedVals, classifyWeed),
          });
        }
      } catch (e) {
        if (!cancelled) setError(String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  return { gridData, loading, error };
}
