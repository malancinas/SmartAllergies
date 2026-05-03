import React, { useState } from 'react';
import { View, Text, SafeAreaView, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Notifications from 'expo-notifications';
import type { OnboardingStackParamList } from '@/types/navigation';
import { useSettingsStore } from '@/stores/persistent/settingsStore';
import { Button } from '@/components/ui';

type Nav = NativeStackNavigationProp<OnboardingStackParamList, 'OnboardingNotifications'>;

function NotificationCard({
  title,
  body,
  time = '7:00 AM',
  isPro = false,
}: {
  title: string;
  body: string;
  time?: string;
  isPro?: boolean;
}) {
  return (
    <View
      className="w-full bg-white dark:bg-gray-800 rounded-2xl overflow-hidden"
      style={{
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
      }}
    >
      {isPro && <View className="h-0.5 bg-violet-500" />}
      <View className="px-4 pt-3 pb-4 gap-1.5">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-1.5">
            <Text style={{ fontSize: 13 }}>🌿</Text>
            <Text className="text-xs text-gray-400 dark:text-gray-500 font-medium">
              Local Allergies
            </Text>
            {isPro && (
              <View className="bg-violet-100 dark:bg-violet-900/50 px-1.5 py-0.5 rounded-md">
                <Text className="text-xs text-violet-600 dark:text-violet-400 font-semibold">
                  Pro
                </Text>
              </View>
            )}
          </View>
          <Text className="text-xs text-gray-400 dark:text-gray-500">{time}</Text>
        </View>
        <Text className="text-sm font-semibold text-gray-900 dark:text-white leading-5">
          {title}
        </Text>
        <Text className="text-sm text-gray-500 dark:text-gray-400 leading-5">{body}</Text>
      </View>
    </View>
  );
}

export default function OnboardingNotificationsScreen() {
  const navigation = useNavigation<Nav>();
  const { setNotificationsEnabled } = useSettingsStore();
  const [requesting, setRequesting] = useState(false);

  async function enableNotifications() {
    setRequesting(true);
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      setNotificationsEnabled(status === 'granted');
    } finally {
      setRequesting(false);
      navigation.navigate('OnboardingPro');
    }
  }

  function skip() {
    setNotificationsEnabled(false);
    navigation.navigate('OnboardingPro');
  }

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-gray-900">
      <View className="flex-1 px-8 justify-between py-12">
        <View className="items-center mt-8 gap-5">
          <Text style={{ fontSize: 72 }}>🔔</Text>
          <Text className="text-2xl font-bold text-gray-900 dark:text-white text-center">
            Custom pollen alerts
          </Text>
          <Text className="text-base text-gray-500 dark:text-gray-400 text-center leading-7">
            Get a heads-up before you head out. We'll only alert you when it matters.
          </Text>

          <NotificationCard
            title="Tomorrow looks clear for you 🌿"
            body="Pollen levels are forecast to be low all day. A good day to get outside."
          />

          <NotificationCard
            isPro
            title="Grass pollen: Very High 🌾 — Peak risk window"
            body="Worst hours 11am–3pm. UV index is also high today. Take antihistamines before heading out."
          />
        </View>

        <View className="gap-3">
          <Button
            onPress={enableNotifications}
            disabled={requesting}
            leftIcon={requesting ? <ActivityIndicator size="small" color="#fff" /> : undefined}
          >
            {requesting ? 'Requesting…' : 'Enable notifications'}
          </Button>
          <Button variant="ghost" onPress={skip}>
            Not now
          </Button>
        </View>
      </View>
    </SafeAreaView>
  );
}
