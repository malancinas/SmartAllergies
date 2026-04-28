import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SettingsStackParamList } from '@/types/navigation';
import { SettingsScreen } from '@/features/settings/screens/SettingsScreen';
import { LanguageScreen } from '@/features/settings/screens/LanguageScreen';
import { AllergenProfileScreen } from '@/features/settings/screens/AllergenProfileScreen';
import SubscriptionScreen from '@/features/subscription/screens/SubscriptionScreen';
import ExportScreen from '@/features/export/screens/ExportScreen';
import AllergyProfileScreen from '@/features/insights/screens/AllergyProfileScreen';

const Stack = createNativeStackNavigator<SettingsStackParamList>();

export default function SettingsNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="SettingsMain" component={SettingsScreen} options={{ title: 'Settings' }} />
      <Stack.Screen name="Language" component={LanguageScreen} options={{ title: 'Language' }} />
      <Stack.Screen
        name="Subscription"
        component={SubscriptionScreen}
        options={{ title: 'Your Plan' }}
      />
      <Stack.Screen
        name="Export"
        component={ExportScreen}
        options={{ title: 'Allergist Report' }}
      />
      <Stack.Screen
        name="AllergenProfile"
        component={AllergenProfileScreen}
        options={{ title: 'My Allergens' }}
      />
      <Stack.Screen
        name="AllergyReport"
        component={AllergyProfileScreen}
        options={{ title: 'My Allergy Report' }}
      />
    </Stack.Navigator>
  );
}
