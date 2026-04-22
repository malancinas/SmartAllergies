import { useState, useEffect } from 'react';
import { supabase } from '@/services/supabase';
import { getPollenCache, setPollenCache } from '@/services/database';
import type { LayerType, PollenGridGeoJson } from '../types';

type GridData = Record<LayerType, PollenGridGeoJson | null>;

const EMPTY: GridData = { grass: null, tree: null, weed: null };

export function usePollenMapData(enabled: boolean) {
  const [gridData, setGridData] = useState<GridData>(EMPTY);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;
    const today = new Date().toISOString().slice(0, 10);

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const types: LayerType[] = ['grass', 'tree', 'weed'];
        const result: GridData = { grass: null, tree: null, weed: null };

        for (const layerType of types) {
          const cacheKey = `pollen_grid_${today}_${layerType}`;

          const cached = await getPollenCache<PollenGridGeoJson>(cacheKey);
          if (cached) {
            result[layerType] = cached;
            continue;
          }

          if (!supabase) {
            setError('Supabase not configured');
            continue;
          }

          const { data, error: sbErr } = await supabase
            .from('pollen_uk_grid')
            .select('geojson')
            .eq('date', today)
            .eq('pollen_type', layerType)
            .single();

          if (sbErr || !data) continue;

          const geojson = data.geojson as PollenGridGeoJson;
          result[layerType] = geojson;
          await setPollenCache(cacheKey, geojson);
        }

        if (!cancelled) setGridData(result);
      } catch (e) {
        if (!cancelled) setError(String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [enabled]);

  return { gridData, loading, error };
}
