import { supabase } from '@/services/supabase';
import { latLonToCell } from './geohash';
import type { CommunityAggregate } from './types';

async function hashUserId(userId: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(userId);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function upsertSignal(params: {
  userId: string;
  lat: number;
  lon: number;
  severity: number;
}): Promise<void> {
  if (!supabase) return; // Supabase not configured

  const userIdHash = await hashUserId(params.userId);
  const geohash = latLonToCell(params.lat, params.lon);

  const { error } = await supabase.from('community_signals').insert({
    user_id_hash: userIdHash,
    geohash,
    severity: params.severity,
  });

  if (error) {
    throw new Error(`Community signal insert failed: ${error.message}`);
  }
}

export async function fetchAggregate(
  lat: number,
  lon: number,
): Promise<CommunityAggregate> {
  const geohash = latLonToCell(lat, lon);
  const empty: CommunityAggregate = { count: 0, avgSeverity: 0, geohash };

  if (!supabase) return empty;

  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from('community_signals')
    .select('severity')
    .eq('geohash', geohash)
    .gte('created_at', oneDayAgo);

  if (error || !data || data.length === 0) return empty;

  const count = data.length;
  const avgSeverity = data.reduce((sum, r) => sum + r.severity, 0) / count;
  return { count, avgSeverity, geohash };
}
