import React, { useState } from 'react';
import { View, Text } from 'react-native';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { usePollenStore } from '@/features/pollen/store';
import { getPollenCache, setPollenCache } from '@/services/database';

const GEOCODE_TTL_MS = 24 * 60 * 60 * 1000;

async function geocodeAddress(query: string): Promise<{ latitude: number; longitude: number }> {
  const cacheKey = `geocode_${query.toLowerCase().trim()}`;
  const cached = await getPollenCache<{ latitude: number; longitude: number }>(cacheKey, GEOCODE_TTL_MS);
  if (cached) return cached;

  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1&language=en&format=json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Geocoding request failed (${res.status})`);
  const json = await res.json();
  if (!json.results?.length) throw new Error('not_found');
  const { latitude, longitude } = json.results[0];
  const result = { latitude, longitude };
  await setPollenCache(cacheKey, result);
  return result;
}

export function AddressSearch() {
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { setLocation, setLocationPermissionDenied } = usePollenStore();

  async function handleSearch() {
    const trimmed = address.trim();
    if (!trimmed) return;

    setLoading(true);
    setError(null);

    try {
      const coords = await geocodeAddress(trimmed);
      setLocation(coords);
      setLocationPermissionDenied(false);
    } catch (err) {
      const isNotFound = err instanceof Error && err.message === 'not_found';
      setError(
        isNotFound
          ? 'Place not found. Try a town name or postcode, e.g. "Bristol" or "SW1A".'
          : 'Could not look up that address. Check your connection and try again.',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <View className="bg-neutral-100 dark:bg-neutral-800 rounded-xl p-4 gap-3">
      <Text className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
        Enter your location
      </Text>
      <Text className="text-xs text-neutral-500">
        Location access is off. Enter a town or postcode to get your local forecast.
      </Text>
      <Input
        placeholder="e.g. Bristol, BS1 or SW1A 1AA"
        value={address}
        onChangeText={(t) => { setAddress(t); setError(null); }}
        onSubmitEditing={handleSearch}
        returnKeyType="search"
        autoCorrect={false}
        error={error ?? undefined}
      />
      <Button
        onPress={handleSearch}
        loading={loading}
        disabled={!address.trim()}
        size="sm"
      >
        Search
      </Button>
    </View>
  );
}
