import { useState, useEffect, useRef } from 'react';
import type { LayerType, UpiCategory, PollenGridGeoJson, PollenGridFeature } from '../types';
import { UPI_COLORS, AQ_COLORS, pollenLevelToAqLevel } from '../types';
import type { Region } from 'react-native-maps';
import { getPollenCache, setPollenCache, getStalePollenCacheByPrefix } from '@/services/database';
import type { PollenLevel } from '@/features/pollen/types';

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

const EMPTY: GridData = {
  grass: null, tree: null, weed: null,
  aqi: null, pm25: null, pm10: null, no2: null, ozone: null, so2: null, dust: null,
};

// Module-level cache survives component remounts without SQLite round-trips.
const memoryCache = new Map<string, GridData>();

const CHUNK_SIZE = 100;

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

// ─── Pollen Classifiers (grains/m³) ──────────────────────────────────────────

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

// ─── Air Quality Classifiers (µg/m³) ─────────────────────────────────────────

const LEVEL_ORDER: PollenLevel[] = ['none', 'low', 'medium', 'high', 'very_high'];

function maxAqLevel(...levels: PollenLevel[]): PollenLevel {
  return levels.reduce((best, l) =>
    LEVEL_ORDER.indexOf(l) > LEVEL_ORDER.indexOf(best) ? l : best,
  );
}

function classifyPm25(v: number): PollenLevel {
  if (v <= 0) return 'none';
  if (v < 12) return 'low';
  if (v < 35) return 'medium';
  if (v < 55) return 'high';
  return 'very_high';
}

function classifyPm10(v: number): PollenLevel {
  if (v <= 0) return 'none';
  if (v < 25) return 'low';
  if (v < 50) return 'medium';
  if (v < 90) return 'high';
  return 'very_high';
}

function classifyNo2(v: number): PollenLevel {
  if (v <= 0) return 'none';
  if (v < 25) return 'low';
  if (v < 50) return 'medium';
  if (v < 100) return 'high';
  return 'very_high';
}

function classifyOzone(v: number): PollenLevel {
  if (v <= 0) return 'none';
  if (v < 60) return 'low';
  if (v < 100) return 'medium';
  if (v < 140) return 'high';
  return 'very_high';
}

function classifySo2(v: number): PollenLevel {
  if (v <= 0) return 'none';
  if (v < 20) return 'low';
  if (v < 50) return 'medium';
  if (v < 100) return 'high';
  return 'very_high';
}

function classifyDust(v: number): PollenLevel {
  if (v <= 0) return 'none';
  if (v < 25) return 'low';
  if (v < 50) return 'medium';
  if (v < 90) return 'high';
  return 'very_high';
}

function aqLevelColor(level: PollenLevel): string {
  return AQ_COLORS[pollenLevelToAqLevel(level)];
}

// ─── GeoJSON Builders ─────────────────────────────────────────────────────────

function buildPollenGeoJson(
  features: AdminRegionFeature[],
  values: number[],
  classify: (v: number) => UpiCategory,
): PollenGridGeoJson {
  return {
    type: 'FeatureCollection',
    features: features.map((f, i) => {
      const category = classify(values[i] ?? 0);
      return {
        type: 'Feature',
        geometry: f.geometry,
        properties: { category, color: UPI_COLORS[category], value: values[i] ?? 0 },
      };
    }),
  };
}

function buildAqLayer(
  features: AdminRegionFeature[],
  values: number[],
  classify: (v: number) => PollenLevel,
): PollenGridGeoJson {
  return {
    type: 'FeatureCollection',
    features: features.map((f, i) => {
      const level = classify(values[i] ?? 0);
      return {
        type: 'Feature',
        geometry: f.geometry,
        properties: {
          category: 'none' as UpiCategory, // category unused for AQ layers
          color: aqLevelColor(level),
          value: values[i] ?? 0,
        },
      };
    }),
  };
}

// AQI = dominant pollutant across PM2.5, PM10, NO₂, O₃, SO₂. Dust excluded per spec.
function buildAqiLayer(
  features: AdminRegionFeature[],
  pm25: number[], pm10: number[], no2: number[], ozone: number[], so2: number[],
): PollenGridGeoJson {
  return {
    type: 'FeatureCollection',
    features: features.map((f, i) => {
      const level = maxAqLevel(
        classifyPm25(pm25[i] ?? 0),
        classifyPm10(pm10[i] ?? 0),
        classifyNo2(no2[i] ?? 0),
        classifyOzone(ozone[i] ?? 0),
        classifySo2(so2[i] ?? 0),
      );
      return {
        type: 'Feature',
        geometry: f.geometry,
        properties: {
          category: 'none' as UpiCategory,
          color: aqLevelColor(level),
          value: LEVEL_ORDER.indexOf(level),
        },
      };
    }),
  };
}

// ─── Fetch ────────────────────────────────────────────────────────────────────

type FetchResult = {
  treeVals: number[];
  grassVals: number[];
  weedVals: number[];
  pm25Vals: number[];
  pm10Vals: number[];
  no2Vals: number[];
  ozoneVals: number[];
  so2Vals: number[];
  dustVals: number[];
};

async function fetchPollenForCentroids(
  points: { lat: number; lon: number }[],
  todayStr: string,
): Promise<FetchResult> {
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
        `,pm10,pm2_5,ozone,nitrogen_dioxide,sulphur_dioxide,dust` +
        `&timezone=UTC&forecast_days=1`;

      console.log('[PollenGrid] fetching', chunk.length, 'points →', url.slice(0, 120) + '…');
      const res = await fetch(url);
      if (!res.ok) {
        const body = await res.text().catch(() => '');
        console.error('[PollenGrid] HTTP', res.status, body.slice(0, 200));
        throw new Error(`Open-Meteo error: ${res.status}`);
      }
      const json = await res.json();
      return (Array.isArray(json) ? json : [json]) as any[];
    }),
  );

  const treeVals: number[] = [];
  const grassVals: number[] = [];
  const weedVals: number[] = [];
  const pm25Vals: number[] = [];
  const pm10Vals: number[] = [];
  const no2Vals: number[] = [];
  const ozoneVals: number[] = [];
  const so2Vals: number[] = [];
  const dustVals: number[] = [];

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
      pm25Vals.push(peak(h.pm2_5));
      pm10Vals.push(peak(h.pm10));
      no2Vals.push(peak(h.nitrogen_dioxide));
      ozoneVals.push(peak(h.ozone));
      so2Vals.push(peak(h.sulphur_dioxide));
      dustVals.push(peak(h.dust));
    }
  }

  return { treeVals, grassVals, weedVals, pm25Vals, pm10Vals, no2Vals, ozoneVals, so2Vals, dustVals };
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useOpenMeteoPollenGrid(
  enabled: boolean,
  region: Region | null,
  cacheBucketHours: 3 | 6 = 6,
) {
  const [gridData, setGridData] = useState<GridData>(EMPTY);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!enabled) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    const bucket = Math.floor(now.getHours() / cacheBucketHours);
    const bounds = region ? regionToBounds(region) : UK_BOUNDS;
    const visibleFeatures = getVisibleFeatures(bounds);

    console.log('[PollenGrid] bounds', bounds, '→', visibleFeatures.length, 'features, bucket', bucket);

    if (visibleFeatures.length === 0) {
      setGridData(EMPTY);
      return;
    }

    const points = visibleFeatures.map((f) => ({
      lat: f.properties.centroid[1],
      lon: f.properties.centroid[0],
    }));

    const boundsKey = `${bounds.minLat.toFixed(1)}_${bounds.maxLat.toFixed(1)}_${bounds.minLon.toFixed(1)}_${bounds.maxLon.toFixed(1)}`;
    const cacheKey = `open_meteo_grid_v2_${todayStr}_b${bucket}_${boundsKey}`;
    const cachePrefix = `open_meteo_grid_v2_${todayStr}_`;

    const memHit = memoryCache.get(cacheKey);
    if (memHit) {
      setGridData(memHit);
      return;
    }

    setLoading(true);
    setError(null);

    async function load() {
      const cached = await getPollenCache<GridData>(cacheKey, cacheBucketHours * 60 * 60 * 1000);
      if (controller.signal.aborted) return;
      if (cached) {
        console.log('[PollenGrid] sqlite cache hit', cacheKey);
        memoryCache.set(cacheKey, cached);
        setGridData(cached);
        setLoading(false);
        return;
      }

      try {
        const {
          treeVals, grassVals, weedVals,
          pm25Vals, pm10Vals, no2Vals, ozoneVals, so2Vals, dustVals,
        } = await fetchPollenForCentroids(points, todayStr);

        if (controller.signal.aborted) return;

        const newGrid: GridData = {
          tree:   buildPollenGeoJson(visibleFeatures, treeVals,  classifyTree),
          grass:  buildPollenGeoJson(visibleFeatures, grassVals, classifyGrass),
          weed:   buildPollenGeoJson(visibleFeatures, weedVals,  classifyWeed),
          aqi:    buildAqiLayer(visibleFeatures, pm25Vals, pm10Vals, no2Vals, ozoneVals, so2Vals),
          pm25:   buildAqLayer(visibleFeatures, pm25Vals,  classifyPm25),
          pm10:   buildAqLayer(visibleFeatures, pm10Vals,  classifyPm10),
          no2:    buildAqLayer(visibleFeatures, no2Vals,   classifyNo2),
          ozone:  buildAqLayer(visibleFeatures, ozoneVals, classifyOzone),
          so2:    buildAqLayer(visibleFeatures, so2Vals,   classifySo2),
          dust:   buildAqLayer(visibleFeatures, dustVals,  classifyDust),
        };

        memoryCache.set(cacheKey, newGrid);
        await setPollenCache(cacheKey, newGrid);
        if (!controller.signal.aborted) setGridData(newGrid);
      } catch (e) {
        if (controller.signal.aborted) return;
        console.error('[PollenGrid] fetch error', e);
        const stale = await getStalePollenCacheByPrefix<GridData>(cachePrefix);
        if (stale && !controller.signal.aborted) {
          console.log('[PollenGrid] using stale cache from', stale.fetchedAt);
          memoryCache.set(cacheKey, stale.data);
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
  }, [enabled, region, cacheBucketHours]);

  return { gridData, loading, error };
}
