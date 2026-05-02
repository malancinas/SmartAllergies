import React, { useState } from 'react';
import { View, Text, Switch, Pressable, ScrollView, Linking, Alert } from 'react-native';
import { seedTestLogs10, seedTestLogs15, seedTestLogs20, seedTestLogs30, seedTestLogs40, clearTestLogs } from '@/dev/seedTestData';
import { fireScenario, ALL_SCENARIOS } from '@/dev/alertDebug';
import type { AlertScenario } from '@/dev/alertDebug';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { SettingsStackParamList } from '@/types/navigation';

type SettingsNavProp = NativeStackNavigationProp<SettingsStackParamList>;
import Constants from 'expo-constants';
import { useSettings } from '../hooks/useSettings';
import { useSettingsStore } from '@/stores/persistent/settingsStore';
import { useProGate } from '@/features/subscription/hooks/useProGate';
import { PaywallSheet } from '@/features/subscription/components/PaywallSheet';
import { useSubscriptionStore } from '@/stores/persistent/subscriptionStore';
import { useQueryClient } from '@tanstack/react-query';
import { useAllergyProfileStore } from '@/stores/persistent/allergyProfileStore';

export function SettingsScreen() {
  const navigation = useNavigation<SettingsNavProp>();
  const { theme, setTheme, language, notificationsEnabled, toggleNotifications } = useSettings();
  const { allergenProfile } = useSettingsStore();
  const { isPro, showPaywall, paywallProps } = useProGate();

  const { tier, setTier } = useSubscriptionStore();
  const queryClient = useQueryClient();
  const { clearCommittedProfile } = useAllergyProfileStore();
  const [seeding, setSeeding] = useState(false);
  const [alertDebugExpanded, setAlertDebugExpanded] = useState(false);
  const isDark = theme === 'dark';
  const appVersion = Constants.expoConfig?.version ?? '—';

  return (
    <>
    <ScrollView className="flex-1 bg-white dark:bg-gray-900">
      {/* Plan */}
      <View className="px-6 pt-6">
        <Text className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
          Plan
        </Text>
        <Pressable
          onPress={() => navigation.navigate('Subscription')}
          className="flex-row items-center justify-between py-3 border-b border-gray-100 dark:border-gray-800"
        >
          <Text className="text-base text-gray-900 dark:text-white">Your plan</Text>
          <View className="flex-row items-center gap-2">
            <View
              className={`px-2 py-0.5 rounded-full ${isPro ? 'bg-primary-100' : 'bg-neutral-100'}`}
            >
              <Text
                className={`text-xs font-semibold ${isPro ? 'text-primary-600' : 'text-neutral-500'}`}
              >
                {isPro ? 'Pro' : 'Free'}
              </Text>
            </View>
            <Text className="text-gray-400">›</Text>
          </View>
        </Pressable>
        <Pressable
          onPress={() => navigation.navigate('Export')}
          className="flex-row items-center justify-between py-3 border-b border-gray-100 dark:border-gray-800"
        >
          <Text className={`text-base ${isPro ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}>
            Export allergy report {!isPro ? '🔒' : ''}
          </Text>
          <Text className="text-gray-400">›</Text>
        </Pressable>
      </View>

      {/* My Allergens */}
      <View className="px-6 pt-6">
        <Text className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
          My Allergens
        </Text>
        <Pressable
          onPress={() => navigation.navigate('AllergenProfile')}
          className="flex-row items-center justify-between py-3 border-b border-gray-100 dark:border-gray-800"
        >
          <Text className="text-base text-gray-900 dark:text-white">Allergen profile</Text>
          <View className="flex-row items-center gap-2">
            <Text className="text-sm text-gray-500 dark:text-gray-400 capitalize">
              {allergenProfile.length === 0 ? 'None selected' : allergenProfile.join(', ')}
            </Text>
            <Text className="text-gray-400">›</Text>
          </View>
        </Pressable>

        <Pressable
          onPress={isPro ? () => navigation.navigate('AllergyReport') : () => showPaywall('Allergy Report')}
          className="flex-row items-center justify-between py-3 border-b border-gray-100 dark:border-gray-800"
          style={!isPro ? { opacity: 0.5 } : undefined}
        >
          <Text className={`text-base ${isPro ? 'text-gray-900 dark:text-white' : 'text-gray-500'}`}>
            My allergy report
          </Text>
          <View className="flex-row items-center gap-2">
            {!isPro && (
              <View className="bg-violet-100 dark:bg-violet-900/40 px-2 py-0.5 rounded-full flex-row items-center gap-1">
                <Text style={{ fontSize: 10 }}>🔒</Text>
                <Text className="text-xs font-semibold text-violet-600 dark:text-violet-400">Pro</Text>
              </View>
            )}
            <Text className="text-gray-400">›</Text>
          </View>
        </Pressable>
      </View>

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
        <Pressable
          onPress={() => navigation.navigate('AlertSchedules')}
          className="flex-row items-center justify-between py-3 border-b border-gray-100 dark:border-gray-800"
        >
          <View>
            <Text className="text-base text-gray-900 dark:text-white">Smart Alerts</Text>
            <Text className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Choose when and how to be notified
            </Text>
          </View>
          <Text className="text-gray-400">›</Text>
        </Pressable>
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

      {/* Developer (dev builds only) */}
      {__DEV__ && (
        <View className="px-6 pt-6">
          <Text className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
            Developer
          </Text>
          {([
            { label: '10 days', fn: seedTestLogs10 },
            { label: '15 days', fn: seedTestLogs15 },
            { label: '20 days', fn: seedTestLogs20 },
            { label: '30 days', fn: seedTestLogs30 },
            { label: '40 days', fn: seedTestLogs40 },
          ] as const).map(({ label, fn }) => (
            <Pressable
              key={label}
              onPress={async () => {
                if (seeding) return;
                setSeeding(true);
                try {
                  await fn();
                  await queryClient.invalidateQueries({ queryKey: ['symptom-history'] });
                  await queryClient.invalidateQueries({ queryKey: ['allergy-profile'] });
                  Alert.alert('Done', `${label} of test logs added.`);
                } catch (e) {
                  Alert.alert('Error', String(e));
                } finally {
                  setSeeding(false);
                }
              }}
              className="flex-row items-center justify-between py-3 border-b border-gray-100 dark:border-gray-800"
            >
              <Text className="text-base text-gray-900 dark:text-white">
                {seeding ? 'Seeding…' : `Seed ${label} of test logs`}
              </Text>
            </Pressable>
          ))}
          <Pressable
            onPress={() =>
              Alert.alert('Clear test logs?', 'This removes all seeded test entries.', [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Clear',
                  style: 'destructive',
                  onPress: async () => {
                    await clearTestLogs();
                    clearCommittedProfile();
                    await queryClient.invalidateQueries({ queryKey: ['symptom-history'] });
                    await queryClient.invalidateQueries({ queryKey: ['allergy-profile'] });
                    Alert.alert('Done', 'Test logs cleared.');
                  },
                },
              ])
            }
            className="flex-row items-center justify-between py-3 border-b border-gray-100 dark:border-gray-800"
          >
            <Text className="text-base text-red-500">Clear test logs</Text>
          </Pressable>
          <Pressable
            onPress={() => {
              const next = tier === 'pro' ? 'free' : 'pro';
              setTier(next);
              Alert.alert('Dev', `Subscription tier set to ${next}.`);
            }}
            className="flex-row items-center justify-between py-3 border-b border-gray-100 dark:border-gray-800"
          >
            <Text className="text-base text-gray-900 dark:text-white">
              Toggle pro (currently: {tier})
            </Text>
          </Pressable>

          {/* Alert scenario tester */}
          <Pressable
            onPress={() => setAlertDebugExpanded((v) => !v)}
            className="flex-row items-center justify-between py-3 border-b border-gray-100 dark:border-gray-800"
          >
            <View>
              <Text className="text-base text-gray-900 dark:text-white">
                Alert scenarios {alertDebugExpanded ? '▲' : '▼'}
              </Text>
              <Text className="text-xs text-gray-400 mt-0.5">Each fires in 3s — navigate away first</Text>
            </View>
          </Pressable>

          {alertDebugExpanded && ALL_SCENARIOS.map((scenario: AlertScenario) => (
            <Pressable
              key={scenario}
              onPress={async () => {
                try {
                  await fireScenario(scenario);
                  Alert.alert('Scheduled', `"${scenario}" fires in 3s`);
                } catch (e) {
                  Alert.alert('Error', String(e));
                }
              }}
              className="flex-row items-center justify-between py-2 pl-4 border-b border-gray-100 dark:border-gray-800"
            >
              <Text className="text-sm text-gray-700 dark:text-gray-300 font-mono">{scenario}</Text>
              <Text className="text-gray-400 text-xs">Fire</Text>
            </Pressable>
          ))}
        </View>
      )}

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
    <PaywallSheet {...paywallProps} />
    </>
  );
}
