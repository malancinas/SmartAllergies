import React from 'react';
import { View, Text, Switch, Pressable, ScrollView, Linking } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { SettingsStackParamList } from '@/types/navigation';

type SettingsNavProp = NativeStackNavigationProp<SettingsStackParamList>;
import Constants from 'expo-constants';
import { useSettings } from '../hooks/useSettings';
import { useSettingsStore } from '@/stores/persistent/settingsStore';
import type { AlertThreshold } from '@/stores/persistent/settingsStore';
import { useProGate } from '@/features/subscription/hooks/useProGate';
import { PaywallSheet } from '@/features/subscription/components/PaywallSheet';

const MORNING_HOURS = [5, 6, 7, 8, 9, 10];
const EVENING_HOURS = [18, 19, 20, 21, 22];

// Days in display order Mon–Sun, value is JS day (0=Sun…6=Sat)
const DAYS = [
  { label: 'M', value: 1 },
  { label: 'T', value: 2 },
  { label: 'W', value: 3 },
  { label: 'T', value: 4 },
  { label: 'F', value: 5 },
  { label: 'S', value: 6 },
  { label: 'S', value: 0 },
];

function hourLabel(h: number): string {
  if (h === 0) return '12am';
  if (h === 12) return '12pm';
  const suffix = h < 12 ? 'am' : 'pm';
  return `${h > 12 ? h - 12 : h}${suffix}`;
}

function HourPicker({
  hours,
  selected,
  onSelect,
}: {
  hours: number[];
  selected: number;
  onSelect: (h: number) => void;
}) {
  return (
    <View className="flex-row flex-wrap gap-2 mt-2">
      {hours.map((h) => (
        <Pressable
          key={h}
          onPress={() => onSelect(h)}
          className={`px-3 py-1.5 rounded-full border ${
            selected === h
              ? 'bg-primary-500 border-primary-500'
              : 'border-gray-300 dark:border-gray-600'
          }`}
        >
          <Text
            className={`text-sm font-medium ${
              selected === h ? 'text-white' : 'text-gray-700 dark:text-gray-300'
            }`}
          >
            {hourLabel(h)}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

export function SettingsScreen() {
  const navigation = useNavigation<SettingsNavProp>();
  const { theme, setTheme, language, notificationsEnabled, toggleNotifications } = useSettings();
  const {
    alertThreshold,
    morningAlertEnabled,
    morningAlertHour,
    eveningAlertEnabled,
    eveningAlertHour,
    alertDays,
    allergenProfile,
    setAlertThreshold,
    setMorningAlertEnabled,
    setMorningAlertHour,
    setEveningAlertEnabled,
    setEveningAlertHour,
    setAlertDays,
  } = useSettingsStore();
  const { isPro, showPaywall, paywallProps } = useProGate();

  const isDark = theme === 'dark';
  const appVersion = Constants.expoConfig?.version ?? '—';

  function toggleDay(day: number) {
    if (alertDays.includes(day)) {
      setAlertDays(alertDays.filter((d) => d !== day));
    } else {
      setAlertDays([...alertDays, day]);
    }
  }

  const anyAlertEnabled = morningAlertEnabled || eveningAlertEnabled;

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

        {/* Alert threshold */}
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

        {/* Morning alert */}
        <View className="py-3 border-b border-gray-100 dark:border-gray-800">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-base text-gray-900 dark:text-white">Morning alert</Text>
              <Text className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Today's pollen forecast
              </Text>
            </View>
            <Switch value={morningAlertEnabled} onValueChange={setMorningAlertEnabled} />
          </View>
          {morningAlertEnabled && (
            <HourPicker
              hours={MORNING_HOURS}
              selected={morningAlertHour}
              onSelect={setMorningAlertHour}
            />
          )}
        </View>

        {/* Evening alert */}
        <View className="py-3 border-b border-gray-100 dark:border-gray-800">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-base text-gray-900 dark:text-white">Evening alert</Text>
              <Text className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Tomorrow's forecast, night before
              </Text>
            </View>
            <Switch value={eveningAlertEnabled} onValueChange={setEveningAlertEnabled} />
          </View>
          {eveningAlertEnabled && (
            <HourPicker
              hours={EVENING_HOURS}
              selected={eveningAlertHour}
              onSelect={setEveningAlertHour}
            />
          )}
        </View>

        {/* Day picker */}
        {anyAlertEnabled && (
          <View className="py-3 border-b border-gray-100 dark:border-gray-800">
            <Text className="text-base text-gray-900 dark:text-white mb-2">Alert days</Text>
            <View className="flex-row gap-2">
              {DAYS.map((d) => {
                const active = alertDays.includes(d.value);
                return (
                  <Pressable
                    key={`${d.label}-${d.value}`}
                    onPress={() => toggleDay(d.value)}
                    className={`w-9 h-9 rounded-full border items-center justify-center ${
                      active
                        ? 'bg-primary-500 border-primary-500'
                        : 'border-gray-300 dark:border-gray-600'
                    }`}
                  >
                    <Text
                      className={`text-sm font-medium ${
                        active ? 'text-white' : 'text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {d.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            {alertDays.length === 0 && (
              <Text className="text-xs text-red-500 mt-2">Select at least one day.</Text>
            )}
          </View>
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
    <PaywallSheet {...paywallProps} />
    </>
  );
}
