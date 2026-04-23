import React from 'react';
import { View, Text, SafeAreaView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { OnboardingStackParamList } from '@/types/navigation';
import { Button } from '@/components/ui';

type Nav = NativeStackNavigationProp<OnboardingStackParamList, 'OnboardingWelcome'>;

export default function OnboardingWelcomeScreen() {
  const navigation = useNavigation<Nav>();

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-gray-900">
      <View className="flex-1 px-8 justify-between py-12">
        <View className="items-center mt-8">
          <Text style={{ fontSize: 72 }}>🌿</Text>
          <Text className="text-3xl font-bold text-gray-900 dark:text-white mt-6 text-center">
            SmartAllergies
          </Text>
          <Text className="text-base text-gray-500 dark:text-gray-400 mt-3 text-center leading-6">
            Your personal pollen tracker. Know your risk before you step outside.
          </Text>
        </View>

        <View className="gap-5">
          <FeatureRow icon="📍" text="Local pollen levels updated throughout the day" />
          <FeatureRow icon="📊" text="Personalised risk score based on your symptom history" />
          <FeatureRow icon="🔔" text="Morning alerts when pollen is high for your allergens" />
          <FeatureRow icon="🗺️" text="UK-wide pollen heatmap" />
        </View>

        <Button label="Get started" onPress={() => navigation.navigate('OnboardingLocation')} />
      </View>
    </SafeAreaView>
  );
}

function FeatureRow({ icon, text }: { icon: string; text: string }) {
  return (
    <View className="flex-row items-center gap-4">
      <Text style={{ fontSize: 24 }}>{icon}</Text>
      <Text className="flex-1 text-sm text-gray-700 dark:text-gray-300 leading-5">{text}</Text>
    </View>
  );
}
