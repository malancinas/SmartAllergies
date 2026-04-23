import React from 'react';
import { View, Text, Switch, ScrollView } from 'react-native';
import { useSettingsStore } from '@/stores/persistent/settingsStore';

const ALLERGENS = [
  { key: 'tree', label: 'Tree pollen', description: 'Birch, oak, ash, alder — peaks spring' },
  { key: 'grass', label: 'Grass pollen', description: 'Most common trigger — peaks June–July' },
  { key: 'weed', label: 'Weed pollen', description: 'Nettle, mugwort — peaks late summer' },
] as const;

export function AllergenProfileScreen() {
  const { allergenProfile, setAllergenProfile } = useSettingsStore();

  function toggle(key: string) {
    if (allergenProfile.includes(key)) {
      setAllergenProfile(allergenProfile.filter((k) => k !== key));
    } else {
      setAllergenProfile([...allergenProfile, key]);
    }
  }

  return (
    <ScrollView className="flex-1 bg-white dark:bg-gray-900">
      <View className="px-6 pt-6 pb-4">
        <Text className="text-sm text-gray-500 dark:text-gray-400">
          Select which allergens affect you. Your home dashboard and risk score will
          emphasise these types.
        </Text>
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
    </ScrollView>
  );
}
