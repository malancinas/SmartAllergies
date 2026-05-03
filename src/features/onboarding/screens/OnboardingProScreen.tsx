import React, { useState } from 'react';
import { View, Text, SafeAreaView } from 'react-native';
import { useSettingsStore } from '@/stores/persistent/settingsStore';
import { Button } from '@/components/ui';
import { PaywallSheet } from '@/features/subscription/components/PaywallSheet';

const OTHER_HIGHLIGHTS = [
  { emoji: '🗺️', label: 'Worldwide map coverage — live pollen data anywhere on the planet' },
  { emoji: '🌬️', label: 'Full air quality metrics — PM2.5, PM10, ozone, NO₂, SO₂ and more' },
  { emoji: '🔔', label: 'Custom alerts tailored to your personal trigger model' },
  { emoji: '📄', label: 'Allergist-ready PDF export' },
];

export default function OnboardingProScreen() {
  const { setHasOnboarded } = useSettingsStore();
  const [paywallVisible, setPaywallVisible] = useState(false);

  function finish() {
    setHasOnboarded(true);
  }

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-gray-900">
      <View className="flex-1 px-8 justify-between py-12">
        <View className="mt-8 gap-5">
          <Text style={{ fontSize: 72, textAlign: 'center' }}>🧬</Text>

          <View className="gap-1">
            <Text className="text-3xl font-bold text-gray-900 dark:text-white text-center">
              You're all set.
            </Text>
            <Text className="text-3xl font-bold text-violet-500 text-center">
              Want smarter predictions?
            </Text>
          </View>

          <View className="bg-violet-50 dark:bg-violet-900/20 rounded-2xl p-5 gap-2">
            <Text className="text-sm font-bold text-violet-700 dark:text-violet-300">
              The more you log, the smarter it gets.
            </Text>
            <Text className="text-sm text-violet-600 dark:text-violet-400 leading-6">
              Pro builds a personal model from your daily symptom logs. After just a week, it
              starts recognising which specific pollens and conditions trigger your reactions —
              updating your allergen profile automatically so your risk scores and alerts get
              more accurate over time. No manual tweaks needed.
            </Text>
          </View>

          <View className="gap-4">
            {OTHER_HIGHLIGHTS.map((item) => (
              <View key={item.label} className="flex-row items-start gap-4">
                <Text style={{ fontSize: 22 }}>{item.emoji}</Text>
                <Text className="flex-1 text-sm text-gray-700 dark:text-gray-300 leading-5 mt-0.5">
                  {item.label}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View className="gap-3">
          <Button onPress={() => setPaywallVisible(true)}>
            Upgrade to Pro
          </Button>
          <Button variant="ghost" onPress={finish}>
            Start free
          </Button>
        </View>
      </View>

      <PaywallSheet
        visible={paywallVisible}
        onClose={() => setPaywallVisible(false)}
        featureName="Smart allergen learning"
        onUpgraded={finish}
      />
    </SafeAreaView>
  );
}
