import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { fetchGooglePollenForecast, QuotaExceededError } from '@/features/pollen/googlePollenApi';
import type { Coordinates } from '@/features/pollen/types';
import type { PollenLevel } from '@/features/pollen/types';

interface Props {
  visible: boolean;
  onClose: () => void;
  coordinate: Coordinates | null;
  userLocation: Coordinates | null;
  onQuotaExceeded?: () => void;
}

function levelEmoji(level: PollenLevel): string {
  switch (level) {
    case 'none': return '🟢';
    case 'low': return '🟡';
    case 'medium': return '🟠';
    case 'high': return '🔴';
    case 'very_high': return '🔴';
    default: return '⚪';
  }
}

function levelLabel(level: PollenLevel): string {
  switch (level) {
    case 'none': return 'None';
    case 'low': return 'Low';
    case 'medium': return 'Moderate';
    case 'high': return 'High';
    case 'very_high': return 'Very High';
    default: return '—';
  }
}

function distanceKm(a: Coordinates, b: Coordinates): number {
  const R = 6371;
  const dLat = ((b.latitude - a.latitude) * Math.PI) / 180;
  const dLng = ((b.longitude - a.longitude) * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.latitude * Math.PI) / 180) *
      Math.cos((b.latitude * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.asin(Math.sqrt(h));
}

interface LevelRow { label: string; level: PollenLevel }

export function LocationInfoSheet({ visible, onClose, coordinate, userLocation, onQuotaExceeded }: Props) {
  const [rows, setRows] = useState<LevelRow[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState(false);
  const [quotaLimitReached, setQuotaLimitReached] = useState(false);

  useEffect(() => {
    if (!visible || !coordinate) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      setFetchError(false);
      setQuotaLimitReached(false);
      setRows(null);
      try {
        const today = new Date().toISOString().slice(0, 10);
        const data = await fetchGooglePollenForecast(coordinate!.latitude, coordinate!.longitude);
        const day = data.find((d) => d.date === today) ?? data[0];
        if (!cancelled && day) {
          setRows([
            { label: '🌳 Trees', level: day.tree.level },
            { label: '🌿 Grass', level: day.grass.level },
            { label: '🌾 Weeds', level: day.weed.level },
          ]);
        }
      } catch (err) {
        if (!cancelled) {
          if (err instanceof QuotaExceededError) {
            setQuotaLimitReached(true);
            onQuotaExceeded?.();
          } else {
            setFetchError(true);
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [visible, coordinate]);

  const distanceMi =
    userLocation && coordinate
      ? (distanceKm(userLocation, coordinate) * 0.621371).toFixed(1)
      : null;

  return (
    <BottomSheet visible={visible} onClose={onClose} snapPoints={[0.42]}>
      <View className="flex-1 px-2">
        <Text className="text-base font-bold text-neutral-900 dark:text-white mb-1">
          Pollen at this location
        </Text>
        {distanceMi && (
          <Text className="text-xs text-neutral-400 mb-4">{distanceMi} miles from your location</Text>
        )}

        {loading && <ActivityIndicator className="mt-4" />}

        {fetchError && (
          <Text className="text-sm text-neutral-500 text-center mt-4">
            Could not load pollen data for this location.
          </Text>
        )}

        {quotaLimitReached && (
          <View style={{ alignItems: 'center', paddingTop: 16, paddingHorizontal: 8 }}>
            <Text style={{ fontSize: 28, marginBottom: 10 }}>📊</Text>
            <Text style={{ fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 6, textAlign: 'center' }}>
              Daily limit reached
            </Text>
            <Text style={{ fontSize: 13, color: '#6b7280', textAlign: 'center', lineHeight: 20 }}>
              You've used all 150 location lookups for today.{'\n'}Your quota resets at midnight — cached locations are still available.
            </Text>
          </View>
        )}

        {rows && (
          <>
            {rows.map(({ label, level }) => (
              <View key={label} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' }}>
                <Text className="text-sm text-neutral-700 dark:text-neutral-300 font-medium">{label}</Text>
                <Text className="text-sm text-neutral-600 dark:text-neutral-400">
                  {levelEmoji(level)} {levelLabel(level)}
                </Text>
              </View>
            ))}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10, gap: 6 }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#22C55E' }} />
              <Text className="text-xs text-neutral-400">High confidence · Google Pollen API</Text>
            </View>
          </>
        )}
      </View>
    </BottomSheet>
  );
}
