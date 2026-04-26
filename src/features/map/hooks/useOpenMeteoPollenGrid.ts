import { useState, useEffect, useRef } from 'react';
import type { LayerType, UpiCategory, PollenGridGeoJson, PollenGridFeature } from '../types';
import { UPI_COLORS } from '../types';
import type { Region } from 'react-native-maps';
import { getPollenCache, setPollenCache, getStalePollenCacheByPrefix } from '@/services/database';

// Precomputed admin region polygons with centroid + bbox metadata.
// Regenerate with: node scripts/precompute-admin-regions.js
// eslint-disable-next-line @typescript-eslint/no-var-requires
const ADMIN_REGIONS = require('../data/admin_regions.json') as AdminRegionCollection;

interface AdminRegionProperties {
  id: string;
  name: string;
  country_code: string;
  centroid: [number, number]; // [lon, lat]
  bbox: [number, number, number, number]; // [minLon, minLat, maxLon, maxLat]
}

interface AdminRegionFeature {
  type: 'Feature';
  properties: AdminRegionProperties;
  geometry: { type: 'Polygon'; coordinates: number[][][] };
}

interface AdminRegionCollection {
  type: 'FeatureCollection';
  features: AdminRegionFeature[];
}

export interface MapBounds {
  minLat: number;
  maxLat: number;
  minLon: number;
  maxLon: number;
}

type GridData = Record<LayerType, PollenGridGeoJson | null>;
const EMPTY: GridData = { grass: null, tree: null, weed: null };

const CHUNK_SIZE = 100;

// Default to a viewport large enough to cover the UK on first load
const UK_BOUNDS: MapBounds = { minLat: 49.5, maxLat: 61.0, minLon: -8.0, maxLon: 2.5 };

function regionToBounds(region: Region): MapBounds {
  return {
    minLat: region.latitude - region.latitudeDelta / 2,
    maxLat: region.latitude + region.latitudeDelta / 2,
    minLon: region.longitude - region.longitudeDelta / 2,
    maxLon: region.longitude + region.longitudeDelta / 2,
  };
}

function bboxOverlaps(fb: [number, number, number, number], bounds: MapBounds): boolean {
  return !(fb[2] < bounds.minLon || fb[0] > bounds.maxLon || fb[3] < bounds.minLat || fb[1] > bounds.maxLat);
}

function getVisibleFeatures(bounds: MapBounds): AdminRegionFeature[] {
  return ADMIN_REGIONS.features.filter((f) => bboxOverlaps(f.properties.bbox, bounds));
}

async function fetchPollenForCentroids(
  points: { lat: number; lon: number }[],
  todayStr: string,
): Promise<{ treeVals: number[]; grassVals: number[]; weedVals: number[] }> {
  const chunks: { lat: number; lon: number }[][] = [];
  for (let i = 0; i < points.length; i += CHUNK_SIZE) {
    chunks.push(points.slice(i, i + CHUNK_SIZE));
  }

  const chunkResults = await Promise.all(
    chunks.map(async (chunk) => {
      const lats = chunk.map((p) => p.lat).join(',');
      const lons = chunk.map((p) => p.lon).join(',');
      const url =
        `https://air-quality-api.open-meteo.com/v1/air-quality` +
        `?latitude=${lats}&longitude=${lons}` +
        `&hourly=alder_pollen,birch_pollen,grass_pollen,mugwort_pollen,olive_pollen,ragweed_pollen` +
        `&timezone=UTC&forecast_days=1`;

      console.log('[PollenGrid] fetching', chunk.length, 'points →', url.slice(0, 120) + '…');
      const res = await fetch(url);
      if (!res.ok) {
        const body = await res.text().catch(() => '');
        console.error('[PollenGrid] HTTP', res.status, body.slice(0, 200));
        throw new Error(`Open-Meteo error: ${res.status}`);
      }
      const json = await res.json();
      console.log('[PollenGrid] response type:', Array.isArray(json) ? `array[${json.length}]` : typeof json);
      return (Array.isArray(json) ? json : [json]) as any[];
    }),
  );

  const treeVals: number[] = [];
  const grassVals: number[] = [];
  const weedVals: number[] = [];

  for (const responses of chunkResults) {
    for (const r of responses) {
      const h = r.hourly ?? {};
      const times: string[] = h.time ?? [];
      const todayIdx = times
        .map((t: string, i: number) => (t.startsWith(todayStr) ? i : -1))
        .filter((i: number) => i >= 0);

      const peak = (arr: (number | null)[] | undefined) =>
        todayIdx.length && arr ? Math.max(...todayIdx.map((i) => arr[i] ?? 0)) : 0;

      treeVals.push(peak(h.alder_pollen) + peak(h.birch_pollen) + peak(h.olive_pollen));
      grassVals.push(peak(h.grass_pollen));
      weedVals.push(peak(h.mugwort_pollen) + peak(h.ragweed_pollen));
    }
  }

  return { treeVals, grassVals, weedVals };
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

function buildGeoJson(
  features: AdminRegionFeature[],
  values: number[],
  classify: (v: number) => UpiCategory,
): PollenGridGeoJson {
  const result: PollenGridFeature[] = features.map((f, i) => {
    const category = classify(values[i] ?? 0);
    return {
      type: 'Feature',
      geometry: f.geometry,
      properties: { category, color: UPI_COLORS[category], value: values[i] ?? 0 },
    };
  });
  return { type: 'FeatureCollection', features: result };
}

export function useOpenMeteoPollenGrid(enabled: boolean, region: Region | null) {
  const [gridData, setGridData] = useState<GridData>(EMPTY);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!enabled) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const todayStr = new Date().toISOString().slice(0, 10);
    const bounds = region ? regionToBounds(region) : UK_BOUNDS;
    const visibleFeatures = getVisibleFeatures(bounds);

    console.log('[PollenGrid] bounds', bounds, '→', visibleFeatures.length, 'features');

    if (visibleFeatures.length === 0) {
      setGridData(EMPTY);
      return;
    }

    const points = visibleFeatures.map((f) => ({
      lat: f.properties.centroid[1],
      lon: f.properties.centroid[0],
    }));

    // Round bounds to 1 dp so nearby pans/zooms share the same cache entry
    const boundsKey = `${bounds.minLat.toFixed(1)}_${bounds.maxLat.toFixed(1)}_${bounds.minLon.toFixed(1)}_${bounds.maxLon.toFixed(1)}`;
    const cacheKey = `open_meteo_grid_${todayStr}_${boundsKey}`;
    const cachePrefix = `open_meteo_grid_${todayStr}_`;

    setLoading(true);
    setError(null);

    async function load() {
      const cached = await getPollenCache<GridData>(cacheKey);
      if (controller.signal.aborted) return;
      if (cached) {
        console.log('[PollenGrid] cache hit', cacheKey);
        setGridData(cached);
        setLoading(false);
        return;
      }

      try {
        const { treeVals, grassVals, weedVals } = await fetchPollenForCentroids(points, todayStr);
        if (controller.signal.aborted) return;
        console.log('[PollenGrid] fetch OK — tree:', treeVals.slice(0, 3), 'grass:', grassVals.slice(0, 3), 'weed:', weedVals.slice(0, 3));
        const newGrid: GridData = {
          tree: buildGeoJson(visibleFeatures, treeVals, classifyTree),
          grass: buildGeoJson(visibleFeatures, grassVals, classifyGrass),
          weed: buildGeoJson(visibleFeatures, weedVals, classifyWeed),
        };
        await setPollenCache(cacheKey, newGrid);
        if (!controller.signal.aborted) setGridData(newGrid);
      } catch (e) {
        if (controller.signal.aborted) return;
        console.error('[PollenGrid] fetch error', e);
        const stale = await getStalePollenCacheByPrefix<GridData>(cachePrefix);
        if (stale && !controller.signal.aborted) {
          console.log('[PollenGrid] using stale cache from', stale.fetchedAt);
          setGridData(stale.data);
        } else {
          setError(String(e));
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    load();
    return () => controller.abort();
  }, [enabled, region]);

  return { gridData, loading, error };
}
