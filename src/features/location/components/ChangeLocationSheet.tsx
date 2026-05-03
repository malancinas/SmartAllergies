import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, FlatList, ActivityIndicator, TextInput, ScrollView } from 'react-native';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { usePollenStore } from '@/features/pollen/store';
import { useSubscription } from '@/features/subscription/hooks/useSubscription';
import { useSettingsStore } from '@/stores/persistent/settingsStore';
import { isEurope } from '@/utils/regionDetection';

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

interface Props {
  visible: boolean;
  onClose: () => void;
  /** Called when a free user selects a location outside Europe — caller should show paywall */
  onNonEuropeBlocked?: () => void;
}

export function ChangeLocationSheet({ visible, onClose, onNonEuropeBlocked }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GeoResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTimeout, setSearchTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);

  const { setLocationWithLabel, clearCustomLocation, locationLabel } = usePollenStore();
  const { isPro } = useSubscription();
  const checkAndAddSlot = useSettingsStore((s) => s.checkAndAddSlot);
  const addRecentLocation = useSettingsStore((s) => s.addRecentLocation);
  const recentLocations = useSettingsStore((s) => s.recentLocations);

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

  function commitLocation(latitude: number, longitude: number, label: string) {
    addRecentLocation(latitude, longitude, label);
    setLocationWithLabel({ latitude, longitude }, label);
    setQuery('');
    setResults([]);
    onClose();
  }

  function handleSelect(result: GeoResult) {
    const label = displayLabel(result);
    if (!isEurope(result.latitude, result.longitude)) {
      if (!isPro) {
        onNonEuropeBlocked?.();
        handleClose();
        return;
      }
      const slotResult = checkAndAddSlot(result.latitude, result.longitude);
      if (slotResult === 'limit_reached') {
        setError("Daily limit reached — you can view up to 3 new locations outside Europe per day. Switch between your saved locations, try again tomorrow, or explore pollen on the Pro map.");
        return;
      }
    }
    commitLocation(result.latitude, result.longitude, label);
  }

  function handleSelectRecent(recent: { latitude: number; longitude: number; label: string }) {
    if (!isEurope(recent.latitude, recent.longitude)) {
      if (!isPro) {
        onNonEuropeBlocked?.();
        handleClose();
        return;
      }
      const slotResult = checkAndAddSlot(recent.latitude, recent.longitude);
      if (slotResult === 'limit_reached') {
        setError("Daily limit reached — you can view up to 3 new locations outside Europe per day. Switch between your saved locations, try again tomorrow, or explore pollen on the Pro map.");
        return;
      }
    }
    commitLocation(recent.latitude, recent.longitude, recent.label);
  }

  function handleUseGps() {
    clearCustomLocation();
    setQuery('');
    setResults([]);
    onClose();
  }

  function handleClose() {
    setQuery('');
    setResults([]);
    setError(null);
    onClose();
  }

  const showRecents = !query.trim() && recentLocations.length > 0;

  return (
    <BottomSheet visible={visible} onClose={handleClose} snapPoints={[0.75]}>
      <View className="flex-1">
        <Text className="text-lg font-bold text-neutral-900 dark:text-white mb-4">
          Change location
        </Text>

        {/* Search input */}
        <View
          className="flex-row items-center bg-neutral-100 dark:bg-neutral-700 rounded-xl px-3 mb-3"
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
            autoFocus
            style={{ flex: 1, fontSize: 15, color: '#111827' }}
          />
          {loading && <ActivityIndicator size="small" color="#6366f1" />}
        </View>

        {error && (
          <Text className="text-xs text-error-500 mb-2">{error}</Text>
        )}

        <ScrollView keyboardShouldPersistTaps="handled">
          {/* GPS reset — shown when a custom location is active */}
          {locationLabel && (
            <TouchableOpacity
              onPress={handleUseGps}
              className="flex-row items-center gap-2 py-3 border-b border-neutral-100 dark:border-neutral-700"
              activeOpacity={0.7}
            >
              <Text style={{ fontSize: 18 }}>📡</Text>
              <View className="flex-1">
                <Text className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                  Use my current GPS location
                </Text>
                <Text className="text-xs text-neutral-400 mt-0.5">Currently viewing: {locationLabel}</Text>
              </View>
            </TouchableOpacity>
          )}

          {/* Search results */}
          {results.map((item, i) => (
            <TouchableOpacity
              key={i}
              onPress={() => handleSelect(item)}
              activeOpacity={0.7}
              className="flex-row items-center gap-3 py-3 border-b border-neutral-100 dark:border-neutral-700"
            >
              <Text style={{ fontSize: 18 }}>📍</Text>
              <View className="flex-1">
                <Text className="text-sm font-medium text-neutral-900 dark:text-white">
                  {item.name}{item.admin1 && item.admin1 !== item.name ? `, ${item.admin1}` : ''}
                </Text>
                <Text className="text-xs text-neutral-400 mt-0.5">{item.country}</Text>
              </View>
            </TouchableOpacity>
          ))}

          {/* Recent locations — shown when search is empty */}
          {showRecents && (
            <>
              <Text className="text-xs font-semibold text-neutral-400 uppercase tracking-widest mt-2 mb-1">
                Recent
              </Text>
              {recentLocations.slice(0, 5).map((recent, i) => (
                <TouchableOpacity
                  key={i}
                  onPress={() => handleSelectRecent(recent)}
                  activeOpacity={0.7}
                  className="flex-row items-center gap-3 py-3 border-b border-neutral-100 dark:border-neutral-700"
                >
                  <Text style={{ fontSize: 18 }}>🕐</Text>
                  <Text className="text-sm text-neutral-700 dark:text-neutral-200 flex-1" numberOfLines={1}>
                    {recent.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </>
          )}
        </ScrollView>
      </View>
    </BottomSheet>
  );
}
