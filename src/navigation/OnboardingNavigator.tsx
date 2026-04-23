import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { OnboardingStackParamList } from '@/types/navigation';
import OnboardingWelcomeScreen from '@/features/onboarding/screens/OnboardingWelcomeScreen';
import OnboardingLocationScreen from '@/features/onboarding/screens/OnboardingLocationScreen';
import OnboardingAllergensScreen from '@/features/onboarding/screens/OnboardingAllergensScreen';

const Stack = createNativeStackNavigator<OnboardingStackParamList>();

export default function OnboardingNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="OnboardingWelcome" component={OnboardingWelcomeScreen} />
      <Stack.Screen name="OnboardingLocation" component={OnboardingLocationScreen} />
      <Stack.Screen name="OnboardingAllergens" component={OnboardingAllergensScreen} />
    </Stack.Navigator>
  );
}
