import React from 'react';
import { View, Text, Switch, Pressable, ScrollView, Linking } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type SettingsNavProp = NativeStackNavigationProp<{ Language: undefined }>;
import Constants from 'expo-constants';
import { useSettings } from '../hooks/useSettings';

export function SettingsScreen() {
  const navigation = useNavigation<SettingsNavProp>();
  const { theme, setTheme, language, notificationsEnabled, toggleNotifications } = useSettings();

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
