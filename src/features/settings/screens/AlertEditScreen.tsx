import React, { useState, useLayoutEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import type { SettingsStackParamList } from '@/types/navigation';
import { useSettingsStore } from '@/stores/persistent/settingsStore';
import type { AlertSchedule, AlertThreshold, AlertScheduleType } from '@/stores/persistent/settingsStore';
import { useSubscriptionStore } from '@/stores/persistent/subscriptionStore';
import { useProGate } from '@/features/subscription/hooks/useProGate';
import { PaywallSheet } from '@/features/subscription/components/PaywallSheet';

type Nav = NativeStackNavigationProp<SettingsStackParamList>;
type Route = NativeStackScreenProps<SettingsStackParamList, 'AlertEdit'>['route'];

// ─── Constants ───────────────────────────────────────────────────────────────

const DAYS = [
  { label: 'M', value: 1 },
  { label: 'T', value: 2 },
  { label: 'W', value: 3 },
  { label: 'T', value: 4 },
  { label: 'F', value: 5 },
  { label: 'S', value: 6 },
  { label: 'S', value: 0 },
];

const ALLERGEN_OPTIONS = [
  { key: 'tree', label: 'Tree' },
  { key: 'grass', label: 'Grass' },
  { key: 'weed', label: 'Weed' },
];

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatHour(h: number): string {
  if (h === 0) return '12am';
  if (h === 12) return '12pm';
  return h < 12 ? `${h}am` : `${h - 12}pm`;
}

function formatTimeLarge(hour: number, minute: number): string {
  const h = hour % 12 || 12;
  const m = minute.toString().padStart(2, '0');
  const suffix = hour < 12 ? 'AM' : 'PM';
  return `${h}:${m} ${suffix}`;
}

function isNightHour(hour: number): boolean {
  return hour >= 18 || hour < 5;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: string }) {
  return (
    <Text className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
      {children}
    </Text>
  );
}

function Chip({
  label,
  active,
  onPress,
  variant = 'default',
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  variant?: 'default' | 'round';
}) {
  const base = variant === 'round' ? 'w-9 h-9 rounded-full' : 'px-3 py-1.5 rounded-full';
  return (
    <Pressable
      onPress={onPress}
      className={`${base} border items-center justify-center ${
        active ? 'bg-primary-500 border-primary-500' : 'border-gray-300 dark:border-gray-600'
      }`}
    >
      <Text
        className={`text-sm font-medium ${
          active ? 'text-white' : 'text-gray-700 dark:text-gray-300'
        }`}
      >
        {label}
      </Text>
    </Pressable>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export function AlertEditScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const scheduleId = route.params?.scheduleId;

  const { alertSchedules, addAlertSchedule, updateAlertSchedule, removeAlertSchedule, allergenProfile } =
    useSettingsStore();
  const tier = useSubscriptionStore((s) => s.tier);
  const isPro = tier === 'pro';
  const { showPaywall, paywallProps } = useProGate();

  const existing = scheduleId ? alertSchedules.find((s) => s.id === scheduleId) : undefined;

  const [hour, setHour] = useState(existing?.hour ?? 7);
  const [minute, setMinute] = useState(existing?.minute ?? 0);
  const [days, setDays] = useState<number[]>(existing?.days ?? [0, 1, 2, 3, 4, 5, 6]);
  const [type, setType] = useState<AlertScheduleType>(existing?.type ?? 'threshold');
  const [threshold, setThreshold] = useState<AlertThreshold>(existing?.threshold ?? 'medium');
  const [allergens, setAllergens] = useState<string[]>(
    existing?.allergens ?? [...allergenProfile],
  );

  const night = isNightHour(hour);

  useLayoutEffect(() => {
    navigation.setOptions({ title: scheduleId ? 'Edit Alert' : 'New Alert' });
  }, [navigation, scheduleId]);

  function toggleDay(day: number) {
    setDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    );
  }

  function toggleAllergen(key: string) {
    setAllergens((prev) =>
      prev.includes(key) ? prev.filter((a) => a !== key) : [...prev, key],
    );
  }

  function handleSave() {
    const schedule: AlertSchedule = {
      id: scheduleId ?? generateId(),
      enabled: existing?.enabled ?? true,
      days,
      hour,
      minute,
      type,
      threshold,
      allergens,
    };

    if (scheduleId) {
      updateAlertSchedule(scheduleId, schedule);
    } else {
      addAlertSchedule(schedule);
    }
    navigation.goBack();
  }

  function handleDelete() {
    if (!scheduleId) return;
    Alert.alert('Delete Alert', 'Remove this alert?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          removeAlertSchedule(scheduleId);
          navigation.goBack();
        },
      },
    ]);
  }

  const AM_HOURS = Array.from({ length: 12 }, (_, i) => i);     // 0-11
  const PM_HOURS = Array.from({ length: 12 }, (_, i) => i + 12); // 12-23

  return (
    <>
      <ScrollView className="flex-1 bg-white dark:bg-gray-900" contentContainerStyle={{ paddingBottom: 40 }}>

        {/* Big time display */}
        <View className="items-center py-8 border-b border-gray-100 dark:border-gray-800">
          <Text className="text-5xl font-light text-gray-900 dark:text-white tracking-tight">
            {formatTimeLarge(hour, minute)}
          </Text>
          <View
            className={`mt-3 px-3 py-1 rounded-full ${
              night
                ? 'bg-indigo-100 dark:bg-indigo-900/40'
                : 'bg-amber-100 dark:bg-amber-900/40'
            }`}
          >
            <Text
              className={`text-xs font-semibold ${
                night
                  ? 'text-indigo-700 dark:text-indigo-300'
                  : 'text-amber-700 dark:text-amber-300'
              }`}
            >
              {night ? "Tomorrow's forecast" : "Today's real-time levels"}
            </Text>
          </View>
        </View>

        {/* Hour picker */}
        <View className="px-6 pt-6">
          <SectionLabel>Hour</SectionLabel>

          <Text className="text-xs text-gray-400 mb-2">AM</Text>
          <View className="flex-row flex-wrap gap-2 mb-4">
            {AM_HOURS.map((h) => (
              <Chip key={h} label={formatHour(h)} active={hour === h} onPress={() => setHour(h)} />
            ))}
          </View>

          <Text className="text-xs text-gray-400 mb-2">PM</Text>
          <View className="flex-row flex-wrap gap-2">
            {PM_HOURS.map((h) => (
              <Chip key={h} label={formatHour(h)} active={hour === h} onPress={() => setHour(h)} />
            ))}
          </View>
        </View>

        {/* Minute picker */}
        <View className="px-6 pt-6">
          <SectionLabel>Minute</SectionLabel>
          <View className="flex-row gap-2">
            {[0, 30].map((m) => (
              <Chip
                key={m}
                label={`:${m.toString().padStart(2, '0')}`}
                active={minute === m}
                onPress={() => setMinute(m)}
              />
            ))}
          </View>
        </View>

        {/* Day picker */}
        <View className="px-6 pt-6">
          <SectionLabel>Days</SectionLabel>
          <View className="flex-row gap-2">
            {DAYS.map((d) => (
              <Chip
                key={`${d.label}-${d.value}`}
                label={d.label}
                active={days.includes(d.value)}
                onPress={() => toggleDay(d.value)}
                variant="round"
              />
            ))}
          </View>
          {days.length === 0 && (
            <Text className="text-xs text-red-500 mt-2">Select at least one day.</Text>
          )}
        </View>

        {/* Alert type */}
        <View className="px-6 pt-6">
          <SectionLabel>Alert Type</SectionLabel>
          <View className="gap-2">

            {/* Threshold option */}
            <Pressable
              onPress={() => setType('threshold')}
              className={`flex-row items-center gap-3 p-4 rounded-xl border ${
                type === 'threshold'
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                  : 'border-gray-200 dark:border-gray-700'
              }`}
            >
              <View
                className={`w-5 h-5 rounded-full border-2 items-center justify-center ${
                  type === 'threshold' ? 'border-primary-500' : 'border-gray-400'
                }`}
              >
                {type === 'threshold' && (
                  <View className="w-2.5 h-2.5 rounded-full bg-primary-500" />
                )}
              </View>
              <View className="flex-1">
                <Text className="text-sm font-semibold text-gray-900 dark:text-white">
                  Threshold-based
                </Text>
                <Text className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Notify when overall pollen risk meets your threshold
                </Text>
              </View>
            </Pressable>

            {/* Custom option (Pro) */}
            <Pressable
              onPress={() => {
                if (!isPro) {
                  showPaywall('Custom Allergen Alerts');
                  return;
                }
                setType('custom');
              }}
              className={`flex-row items-center gap-3 p-4 rounded-xl border ${
                type === 'custom'
                  ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20'
                  : 'border-gray-200 dark:border-gray-700'
              }`}
            >
              <View
                className={`w-5 h-5 rounded-full border-2 items-center justify-center ${
                  type === 'custom' ? 'border-violet-500' : 'border-gray-400'
                }`}
              >
                {type === 'custom' && (
                  <View className="w-2.5 h-2.5 rounded-full bg-violet-500" />
                )}
              </View>
              <View className="flex-1">
                <View className="flex-row items-center gap-2">
                  <Text className="text-sm font-semibold text-gray-900 dark:text-white">
                    Custom allergens
                  </Text>
                  {!isPro && (
                    <View className="bg-violet-100 dark:bg-violet-900/40 px-2 py-0.5 rounded-full flex-row items-center gap-1">
                      <Text style={{ fontSize: 9 }}>🔒</Text>
                      <Text className="text-xs font-semibold text-violet-600 dark:text-violet-400">
                        Pro
                      </Text>
                    </View>
                  )}
                </View>
                <Text className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Get a per-allergen breakdown based on your predicted sensitivities
                </Text>
              </View>
            </Pressable>
          </View>
        </View>

        {/* Threshold selector (visible when type=threshold) */}
        {type === 'threshold' && (
          <View className="px-6 pt-5">
            <SectionLabel>Alert when risk is</SectionLabel>
            <View className="flex-row gap-2">
              {(['medium', 'high'] as AlertThreshold[]).map((t) => (
                <Chip
                  key={t}
                  label={`${t}+`}
                  active={threshold === t}
                  onPress={() => setThreshold(t)}
                />
              ))}
            </View>
          </View>
        )}

        {/* Allergen selector (visible when type=custom and Pro) */}
        {type === 'custom' && isPro && (
          <View className="px-6 pt-5">
            <SectionLabel>Notify about</SectionLabel>
            <View className="flex-row gap-2">
              {ALLERGEN_OPTIONS.map((opt) => (
                <Chip
                  key={opt.key}
                  label={opt.label}
                  active={allergens.includes(opt.key)}
                  onPress={() => toggleAllergen(opt.key)}
                />
              ))}
            </View>
            {allergens.length === 0 && (
              <Text className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                All allergens will be included when none are selected.
              </Text>
            )}
          </View>
        )}

        {/* Context info banner */}
        <View className="px-6 pt-6">
          <View
            className={`rounded-xl p-4 ${
              night
                ? 'bg-indigo-50 dark:bg-indigo-900/20'
                : 'bg-amber-50 dark:bg-amber-900/20'
            }`}
          >
            <Text
              className={`text-xs leading-relaxed ${
                night
                  ? 'text-indigo-700 dark:text-indigo-300'
                  : 'text-amber-700 dark:text-amber-300'
              }`}
            >
              {night
                ? `This is a night alert. It will show tomorrow's predicted pollen forecast at your GPS location, so you can plan ahead.`
                : `This is a morning or daytime alert. It will show today's real-time pollen levels at your GPS location.`}
            </Text>
          </View>
        </View>

        {/* Save button */}
        <View className="px-6 pt-6">
          <Pressable
            onPress={handleSave}
            disabled={days.length === 0}
            className={`py-4 rounded-xl items-center ${
              days.length === 0 ? 'bg-gray-200 dark:bg-gray-700' : 'bg-primary-500'
            }`}
          >
            <Text className="text-white font-semibold text-base">Save Alert</Text>
          </Pressable>
        </View>

        {/* Delete button (edit only) */}
        {scheduleId && (
          <View className="px-6 pt-4">
            <Pressable onPress={handleDelete} className="py-4 rounded-xl items-center">
              <Text className="text-red-500 font-semibold text-base">Delete Alert</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
      <PaywallSheet {...paywallProps} />
    </>
  );
}
