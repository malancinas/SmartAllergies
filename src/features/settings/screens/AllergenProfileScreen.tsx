import React from 'react';
import { View, Text, Switch, ScrollView, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { SettingsStackParamList } from '@/types/navigation';
import { useSettingsStore } from '@/stores/persistent/settingsStore';
import { useSubscription } from '@/features/subscription/hooks/useSubscription';
import { useAllergyProfile } from '@/features/insights/hooks/useAllergyProfile';
import { correlationsToWeights, weightsToAllergenProfile } from '@/features/forecasting/engine';

type Nav = NativeStackNavigationProp<SettingsStackParamList>;

const ALLERGENS = [
  { key: 'tree', label: 'Tree pollen', description: 'Birch, oak, ash, alder — peaks spring' },
  { key: 'grass', label: 'Grass pollen', description: 'Most common trigger — peaks June–July' },
  { key: 'weed', label: 'Weed pollen', description: 'Nettle, mugwort — peaks late summer' },
] as const;

function formatAutoUpdatedDate(isoDate: string): string {
  const date = new Date(isoDate);
  const diffDays = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'today';
  if (diffDays === 1) return 'yesterday';
  return `${diffDays} days ago`;
}

export function AllergenProfileScreen() {
  const navigation = useNavigation<Nav>();
  const {
    allergenProfile,
    allergenProfileLastAutoUpdated,
    setAllergenProfile,
    setAllergenProfileLastAutoUpdated,
  } = useSettingsStore();
  const { isPro } = useSubscription();
  const { data: profileData } = useAllergyProfile();

  function toggle(key: string) {
    if (allergenProfile.includes(key)) {
      setAllergenProfile(allergenProfile.filter((k) => k !== key));
    } else {
      setAllergenProfile([...allergenProfile, key]);
    }
  }

  function resetToDetected() {
    if (!profileData?.ready) return;
    const learnedWeights = correlationsToWeights(profileData.correlations);
    setAllergenProfile(weightsToAllergenProfile(learnedWeights));
    setAllergenProfileLastAutoUpdated(new Date().toISOString().slice(0, 10));
  }

  const canReset = isPro && profileData?.ready;

  return (
    <ScrollView className="flex-1 bg-white dark:bg-gray-900">
      <View className="px-6 pt-6 pb-4">
        <Text className="text-sm text-gray-500 dark:text-gray-400">
          Select which allergens affect you. Your home dashboard and risk score emphasise these types.
        </Text>

        {/* Pro auto-update badge */}
        {isPro && allergenProfileLastAutoUpdated && (
          <View className="mt-3 flex-row items-center justify-between">
            <Text className="text-xs text-violet-500 dark:text-violet-400">
              🧬 Auto-updated {formatAutoUpdatedDate(allergenProfileLastAutoUpdated)}
            </Text>
            {canReset && (
              <Pressable onPress={resetToDetected}>
                <Text className="text-xs font-semibold text-violet-600 dark:text-violet-400">
                  Reset to detected
                </Text>
              </Pressable>
            )}
          </View>
        )}
      </View>

      <View className="px-6">
        {ALLERGENS.map(({ key, label, description }) => (
          <View
            key={key}
            className="flex-row items-center justify-between py-4 border-b border-gray-100 dark:border-gray-800"
          >
            <View className="flex-1 mr-4">
              <Text className="text-base text-gray-900 dark:text-white font-medium">{label}</Text>
              <Text className="text-xs text-gray-400 mt-0.5">{description}</Text>
            </View>
            <Switch
              value={allergenProfile.includes(key)}
              onValueChange={() => toggle(key)}
            />
          </View>
        ))}
      </View>

      {allergenProfile.length === 0 && (
        <View className="mx-6 mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl">
          <Text className="text-sm text-amber-700 dark:text-amber-400">
            Enable at least one allergen type so the app can personalise your risk score.
          </Text>
        </View>
      )}

      {/* View allergy report */}
      <View className="px-6 mt-6 mb-10">
        {isPro ? (
          <Pressable
            onPress={() => navigation.navigate('AllergyReport')}
            className="flex-row items-center justify-between py-4 px-4 bg-violet-50 dark:bg-violet-900/20 rounded-2xl"
          >
            <View>
              <Text className="text-base font-semibold text-violet-700 dark:text-violet-300">
                My allergy report
              </Text>
              <Text className="text-xs text-violet-500 dark:text-violet-400 mt-0.5">
                See which allergens trigger your symptoms
              </Text>
            </View>
            <Text className="text-violet-500 text-lg">›</Text>
          </Pressable>
        ) : (
          <View style={{ opacity: 0.45 }} className="flex-row items-center justify-between py-4 px-4 bg-gray-100 dark:bg-gray-800 rounded-2xl">
            <View className="flex-1">
              <Text className="text-base font-semibold text-gray-700 dark:text-gray-300">
                My allergy report
              </Text>
              <Text className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                See which allergens trigger your symptoms
              </Text>
            </View>
            <View className="bg-violet-100 dark:bg-violet-900/40 px-2.5 py-1 rounded-full flex-row items-center gap-1">
              <Text style={{ fontSize: 11 }}>🔒</Text>
              <Text className="text-xs font-semibold text-violet-600 dark:text-violet-400">Pro</Text>
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );
}
