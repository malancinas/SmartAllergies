import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/types/navigation';
import { useAuthStore } from '@/stores/persistent/authStore';
import { useSettingsStore } from '@/stores/persistent/settingsStore';
import AuthNavigator from './AuthNavigator';
import TabNavigator from './TabNavigator';
import OnboardingNavigator from './OnboardingNavigator';

const Stack = createNativeStackNavigator<RootStackParamList>();

const linking = {
  prefixes: ['localallergies://'],
  config: {
    screens: {
      Auth: 'auth/*',
      Main: 'main/*',
    },
  },
};

// ⚠️ DEV FLAGS — set both to false before shipping
const BYPASS_AUTH = false;
const FORCE_ONBOARDING = false;

export default function RootNavigator() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const hasOnboarded = useSettingsStore((s) => s.hasOnboarded);

  const showMain = BYPASS_AUTH || isAuthenticated;
  const showOnboarding = FORCE_ONBOARDING || (!BYPASS_AUTH && !hasOnboarded);

  return (
    <NavigationContainer linking={linking}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {showOnboarding ? (
          <Stack.Screen name="Onboarding" component={OnboardingNavigator} />
        ) : showMain ? (
          <Stack.Screen name="Main" component={TabNavigator} />
        ) : (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
