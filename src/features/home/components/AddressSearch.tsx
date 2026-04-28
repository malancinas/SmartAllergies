import React, { useState, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { usePollenStore } from '@/features/pollen/store';

interface GeoResult {
  latitude: number;
  longitude: number;
  name: string;
  admin1?: string;
  country: string;
}

function displayLabel(r: GeoResult): string {
  const parts = [r.name];
  if (r.admin1 && r.admin1 !== r.name) parts.push(r.admin1);
  parts.push(r.country);
  return parts.join(', ');
}

async function searchLocations(query: string): Promise<GeoResult[]> {
  const url =
    `https://geocoding-api.open-meteo.com/v1/search` +
    `?name=${encodeURIComponent(query)}&count=6&language=en&format=json`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const json = await res.json();
  return (json.results ?? []) as GeoResult[];
}

export function AddressSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GeoResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTimeout, setSearchTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);

  const { setLocationWithLabel, setLocationPermissionDenied } = usePollenStore();

  const handleChangeText = useCallback(
    (text: string) => {
      setQuery(text);
      setError(null);
      if (searchTimeout) clearTimeout(searchTimeout);
      if (!text.trim()) {
        setResults([]);
        return;
      }
      const t = setTimeout(async () => {
        setLoading(true);
        try {
          const found = await searchLocations(text.trim());
          setResults(found);
          if (found.length === 0) setError('No places found — try a different search.');
        } catch {
          setError('Search failed. Check your connection.');
        } finally {
          setLoading(false);
        }
      }, 400);
      setSearchTimeout(t);
    },
    [searchTimeout],
  );

  function handleSelect(result: GeoResult) {
    setLocationWithLabel(
      { latitude: result.latitude, longitude: result.longitude },
      displayLabel(result),
    );
    setLocationPermissionDenied(false);
    setQuery('');
    setResults([]);
  }

  return (
    <View className="bg-neutral-100 dark:bg-neutral-800 rounded-xl p-4 gap-3">
      <Text className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
        Enter your location
      </Text>
      <Text className="text-xs text-neutral-500">
        Location access is off. Enter a town or postcode to get your local forecast.
      </Text>

      <View
        className="flex-row items-center bg-white dark:bg-neutral-700 rounded-xl px-3"
        style={{ height: 44 }}
      >
        <Text style={{ fontSize: 16, marginRight: 8 }}>🔍</Text>
        <TextInput
          value={query}
          onChangeText={handleChangeText}
          placeholder="Search city, town or postcode…"
          placeholderTextColor="#9ca3af"
          returnKeyType="search"
          autoCorrect={false}
          style={{ flex: 1, fontSize: 15, color: '#111827' }}
        />
        {loading && <ActivityIndicator size="small" color="#6366f1" />}
      </View>

      {error && (
        <Text className="text-xs text-red-500">{error}</Text>
      )}

      {results.length > 0 && (
        <FlatList
          data={results}
          keyExtractor={(_, i) => String(i)}
          keyboardShouldPersistTaps="handled"
          scrollEnabled={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => handleSelect(item)}
              activeOpacity={0.7}
              className="flex-row items-center gap-3 py-3 border-b border-neutral-200 dark:border-neutral-600"
            >
              <Text style={{ fontSize: 18 }}>📍</Text>
              <View className="flex-1">
                <Text className="text-sm font-medium text-neutral-900 dark:text-white">
                  {item.name}{item.admin1 && item.admin1 !== item.name ? `, ${item.admin1}` : ''}
                </Text>
                <Text className="text-xs text-neutral-400 mt-0.5">{item.country}</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}
