import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { HomeStackParamList } from '@/types/navigation';
import HomeScreen from '@/features/home/screens/HomeScreen';
import AllergyProfileScreen from '@/features/insights/screens/AllergyProfileScreen';

const Stack = createNativeStackNavigator<HomeStackParamList>();

export default function HomeStackNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="HomeMain" component={HomeScreen} options={{ headerShown: false }} />
      <Stack.Screen
        name="AllergyProfile"
        component={AllergyProfileScreen}
        options={{ title: 'My Allergy Profile' }}
      />
    </Stack.Navigator>
  );
}
