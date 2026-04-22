import React from 'react';
import { View, Text, Switch, Pressable, ScrollView, Linking } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type SettingsNavProp = NativeStackNavigationProp<{ Language: undefined }>;
import Constants from 'expo-constants';
import { useSettings } from '../hooks/useSettings';
import { useSettingsStore } from '@/stores/persistent/settingsStore';
import type { AlertThreshold } from '@/stores/persistent/settingsStore';

const HOURS = [5, 6, 7, 8, 9, 10];
function hourLabel(h: number): string {
  const suffix = h < 12 ? 'am' : 'pm';
  const display = h > 12 ? h - 12 : h;
  return `${display}${suffix}`;
}

export function SettingsScreen() {
  const navigation = useNavigation<SettingsNavProp>();
  const { theme, setTheme, language, notificationsEnabled, toggleNotifications } = useSettings();
  const {
    allergyAlertEnabled,
    alertThreshold,
    alertHour,
    setAllergyAlertEnabled,
    setAlertThreshold,
    setAlertHour,
  } = useSettingsStore();

  const isDark = theme === 'dark';
  const appVersion = Constants.expoConfig?.version ?? '—';

  return (
    <ScrollView className="flex-1 bg-white dark:bg-gray-900">
      {/* Appearance */}
      <View className="px-6 pt-6">
        <Text className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
          Appearance
        </Text>
        <View className="flex-row items-center justify-between py-3 border-b border-gray-100 dark:border-gray-800">
          <Text className="text-base text-gray-900 dark:text-white">Dark Mode</Text>
          <Switch
            value={isDark}
            onValueChange={(value) => setTheme(value ? 'dark' : 'light')}
          />
        </View>
      </View>

      {/* Language */}
      <View className="px-6 pt-6">
        <Text className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
          Language
        </Text>
        <Pressable
          onPress={() => navigation.navigate('Language')}
          className="flex-row items-center justify-between py-3 border-b border-gray-100 dark:border-gray-800"
        >
          <Text className="text-base text-gray-900 dark:text-white">Language</Text>
          <Text className="text-sm text-gray-500 dark:text-gray-400">{language.toUpperCase()}</Text>
        </Pressable>
      </View>

      {/* Notifications */}
      <View className="px-6 pt-6">
        <Text className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
          Notifications
        </Text>
        <View className="flex-row items-center justify-between py-3 border-b border-gray-100 dark:border-gray-800">
          <Text className="text-base text-gray-900 dark:text-white">Push Notifications</Text>
          <Switch value={notificationsEnabled} onValueChange={toggleNotifications} />
        </View>
      </View>

      {/* Allergy Alerts */}
      <View className="px-6 pt-6">
        <Text className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
          Allergy Alerts
        </Text>
        <View className="flex-row items-center justify-between py-3 border-b border-gray-100 dark:border-gray-800">
          <Text className="text-base text-gray-900 dark:text-white">Daily allergy alert</Text>
          <Switch value={allergyAlertEnabled} onValueChange={setAllergyAlertEnabled} />
        </View>

        {allergyAlertEnabled && (
          <>
            <View className="py-3 border-b border-gray-100 dark:border-gray-800">
              <Text className="text-base text-gray-900 dark:text-white mb-2">Alert when risk is</Text>
              <View className="flex-row gap-2">
                {(['medium', 'high'] as AlertThreshold[]).map((t) => (
                  <Pressable
                    key={t}
                    onPress={() => setAlertThreshold(t)}
                    className={`px-4 py-2 rounded-full border ${
                      alertThreshold === t
                        ? 'bg-primary-500 border-primary-500'
                        : 'border-gray-300 dark:border-gray-600'
                    }`}
                  >
                    <Text
                      className={`text-sm font-medium capitalize ${
                        alertThreshold === t ? 'text-white' : 'text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {t}+
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View className="py-3 border-b border-gray-100 dark:border-gray-800">
              <Text className="text-base text-gray-900 dark:text-white mb-2">Alert time</Text>
              <View className="flex-row flex-wrap gap-2">
                {HOURS.map((h) => (
                  <Pressable
                    key={h}
                    onPress={() => setAlertHour(h)}
                    className={`px-3 py-1.5 rounded-full border ${
                      alertHour === h
                        ? 'bg-primary-500 border-primary-500'
                        : 'border-gray-300 dark:border-gray-600'
                    }`}
                  >
                    <Text
                      className={`text-sm font-medium ${
                        alertHour === h ? 'text-white' : 'text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {hourLabel(h)}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </>
        )}
      </View>

      {/* Privacy */}
      <View className="px-6 pt-6">
        <Text className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
          Privacy
        </Text>
        <Pressable
          onPress={() => Linking.openURL('https://example.com/privacy')}
          className="py-3 border-b border-gray-100 dark:border-gray-800"
        >
          <Text className="text-base text-gray-900 dark:text-white">Privacy Policy</Text>
        </Pressable>
        <Pressable
          onPress={() => Linking.openURL('https://example.com/terms')}
          className="py-3 border-b border-gray-100 dark:border-gray-800"
        >
          <Text className="text-base text-gray-900 dark:text-white">Terms of Service</Text>
        </Pressable>
      </View>

      {/* About */}
      <View className="px-6 pt-6 pb-10">
        <Text className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
          About
        </Text>
        <View className="flex-row items-center justify-between py-3">
          <Text className="text-base text-gray-900 dark:text-white">Version</Text>
          <Text className="text-sm text-gray-500 dark:text-gray-400">{appVersion}</Text>
        </View>
      </View>
    </ScrollView>
  );
}
