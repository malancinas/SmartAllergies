import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SettingsStackParamList } from '@/types/navigation';
import { SettingsScreen } from '@/features/settings/screens/SettingsScreen';
import { LanguageScreen } from '@/features/settings/screens/LanguageScreen';

const Stack = createNativeStackNavigator<SettingsStackParamList>();

export default function SettingsNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="SettingsMain" component={SettingsScreen} options={{ title: 'Settings' }} />
      <Stack.Screen name="Language" component={LanguageScreen} options={{ title: 'Language' }} />
    </Stack.Navigator>
  );
}
