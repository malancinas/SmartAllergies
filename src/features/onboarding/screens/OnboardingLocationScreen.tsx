import React, { useState } from 'react';
import { View, Text, SafeAreaView, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Location from 'expo-location';
import type { OnboardingStackParamList } from '@/types/navigation';
import { Button } from '@/components/ui';
import { usePollenStore } from '@/features/pollen/store';

type Nav = NativeStackNavigationProp<OnboardingStackParamList, 'OnboardingLocation'>;

export default function OnboardingLocationScreen() {
  const navigation = useNavigation<Nav>();
  const { setLocation, setLocationPermissionDenied } = usePollenStore();
  const [requesting, setRequesting] = useState(false);
  const [denied, setDenied] = useState(false);

  async function requestLocation() {
    setRequesting(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setDenied(true);
        setLocationPermissionDenied(true);
      } else {
        try {
          const pos = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          setLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
        } catch {
          setLocationPermissionDenied(true);
        }
      }
    } finally {
      setRequesting(false);
      navigation.navigate('OnboardingAllergens');
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-gray-900">
      <View className="flex-1 px-8 justify-between py-12">
        <View className="items-center mt-8">
          <Text style={{ fontSize: 72 }}>📍</Text>
          <Text className="text-2xl font-bold text-gray-900 dark:text-white mt-6 text-center">
            Allow location access
          </Text>
          <Text className="text-base text-gray-500 dark:text-gray-400 mt-3 text-center leading-6">
            Local Allergies uses your location to fetch the pollen forecast for your exact area.
            Your location is never stored on our servers.
          </Text>

          {denied && (
            <View className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl w-full">
              <Text className="text-sm text-amber-700 dark:text-amber-400 text-center">
                Location denied — you can enable it later in device Settings.
              </Text>
            </View>
          )}
        </View>

        <View className="gap-3">
          <Button
            label={requesting ? 'Requesting…' : 'Allow location'}
            onPress={requestLocation}
            disabled={requesting}
            leftIcon={requesting ? <ActivityIndicator size="small" color="#fff" /> : undefined}
          />
          <Button
            label="Skip for now"
            variant="ghost"
            onPress={() => navigation.navigate('OnboardingAllergens')}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}
