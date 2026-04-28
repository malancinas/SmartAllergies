import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { HistoryStackParamList } from '@/types/navigation';
import HistoryScreen from '@/features/symptoms/screens/HistoryScreen';
import EditSymptomLogScreen from '@/features/symptoms/screens/EditSymptomLogScreen';

const Stack = createNativeStackNavigator<HistoryStackParamList>();

export default function HistoryNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="HistoryMain" component={HistoryScreen} options={{ headerShown: false }} />
      <Stack.Screen name="EditLog" component={EditSymptomLogScreen} options={{ title: 'Edit log' }} />
    </Stack.Navigator>
  );
}
