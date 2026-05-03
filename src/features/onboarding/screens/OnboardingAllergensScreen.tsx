import React from 'react';
import { View, Text, SafeAreaView, Switch } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { OnboardingStackParamList } from '@/types/navigation';
import { useSettingsStore } from '@/stores/persistent/settingsStore';
import { Button } from '@/components/ui';

type Nav = NativeStackNavigationProp<OnboardingStackParamList, 'OnboardingAllergens'>;

const ALLERGENS = [
  { key: 'tree', label: 'Tree pollen', emoji: '🌳', description: 'Birch, oak, ash — peaks spring' },
  { key: 'grass', label: 'Grass pollen', emoji: '🌾', description: 'Most common — peaks June–July' },
  { key: 'weed', label: 'Weed pollen', emoji: '🌿', description: 'Nettle, mugwort — late summer' },
] as const;

export default function OnboardingAllergensScreen() {
  const navigation = useNavigation<Nav>();
  const { allergenProfile, setAllergenProfile } = useSettingsStore();

  function toggle(key: string) {
    if (allergenProfile.includes(key)) {
      setAllergenProfile(allergenProfile.filter((k) => k !== key));
    } else {
      setAllergenProfile([...allergenProfile, key]);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-gray-900">
      <View className="flex-1 px-8 justify-between py-12">
        <View>
          <Text style={{ fontSize: 72, textAlign: 'center' }}>🌼</Text>
          <Text className="text-2xl font-bold text-gray-900 dark:text-white mt-6 text-center">
            Which pollens affect you?
          </Text>
          <Text className="text-base text-gray-500 dark:text-gray-400 mt-3 text-center leading-6">
            Your risk score and alerts are personalised to the allergens you select.
            You can change these any time in Settings.
          </Text>

          <View className="mt-8 gap-1">
            {ALLERGENS.map(({ key, label, emoji, description }) => (
              <View
                key={key}
                className="flex-row items-center justify-between py-4 border-b border-gray-100 dark:border-gray-800"
              >
                <View className="flex-row items-center gap-3 flex-1">
                  <Text style={{ fontSize: 28 }}>{emoji}</Text>
                  <View className="flex-1">
                    <Text className="text-base font-medium text-gray-900 dark:text-white">{label}</Text>
                    <Text className="text-xs text-gray-400 mt-0.5">{description}</Text>
                  </View>
                </View>
                <Switch
                  value={allergenProfile.includes(key)}
                  onValueChange={() => toggle(key)}
                />
              </View>
            ))}
          </View>

          {allergenProfile.length === 0 && (
            <View className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl">
              <Text className="text-sm text-amber-700 dark:text-amber-400 text-center">
                Select at least one allergen to personalise your experience.
              </Text>
            </View>
          )}

          <View className="mt-6 p-4 bg-violet-50 dark:bg-violet-900/20 rounded-2xl">
            <Text className="text-sm font-semibold text-violet-700 dark:text-violet-300 mb-1">
              🧬 With Pro
            </Text>
            <Text className="text-sm text-violet-600 dark:text-violet-400 leading-5">
              Local Allergies will learn exactly which allergens trigger your symptoms from your daily logs and keep your profile updated automatically.
            </Text>
          </View>
        </View>

        <Button
          label="Next"
          onPress={() => navigation.navigate('OnboardingNotifications')}
          disabled={allergenProfile.length === 0}
        />
      </View>
    </SafeAreaView>
  );
}
