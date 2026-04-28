import React, { useLayoutEffect } from 'react';
import {
  View,
  Text,
  Switch,
  Pressable,
  FlatList,
  ListRenderItem,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { SettingsStackParamList } from '@/types/navigation';
import { useSettingsStore } from '@/stores/persistent/settingsStore';
import type { AlertSchedule } from '@/stores/persistent/settingsStore';

type Nav = NativeStackNavigationProp<SettingsStackParamList>;

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function formatTime(hour: number, minute: number): string {
  const h = hour % 12 || 12;
  const m = minute.toString().padStart(2, '0');
  const suffix = hour < 12 ? 'AM' : 'PM';
  return `${h}:${m} ${suffix}`;
}

function formatDays(days: number[]): string {
  if (days.length === 0) return 'No days';
  if (days.length === 7) return 'Every day';
  const sorted = [...days].sort((a, b) => a - b);
  const weekdays = [1, 2, 3, 4, 5];
  const weekend = [0, 6];
  if (weekdays.every((d) => sorted.includes(d)) && !weekend.some((d) => sorted.includes(d)))
    return 'Weekdays';
  if (weekend.every((d) => sorted.includes(d)) && !weekdays.some((d) => sorted.includes(d)))
    return 'Weekends';
  return sorted.map((d) => DAY_NAMES[d]).join(', ');
}

function isNightHour(hour: number): boolean {
  return hour >= 18 || hour < 5;
}

function ScheduleRow({
  schedule,
  onToggle,
  onPress,
}: {
  schedule: AlertSchedule;
  onToggle: (enabled: boolean) => void;
  onPress: () => void;
}) {
  const night = isNightHour(schedule.hour);
  const context = night ? "Tomorrow's forecast" : "Today's levels";

  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center px-6 py-4 border-b border-gray-100 dark:border-gray-800"
    >
      <View className="flex-1">
        <Text className="text-3xl font-light text-gray-900 dark:text-white tracking-tight">
          {formatTime(schedule.hour, schedule.minute)}
        </Text>
        <View className="flex-row items-center gap-2 mt-1">
          <Text className="text-sm text-gray-500 dark:text-gray-400">
            {formatDays(schedule.days)}
          </Text>
          <Text className="text-gray-300 dark:text-gray-600">·</Text>
          {schedule.type === 'custom' ? (
            <View className="bg-violet-100 dark:bg-violet-900/40 px-2 py-0.5 rounded-full">
              <Text className="text-xs font-semibold text-violet-600 dark:text-violet-400">
                Custom
              </Text>
            </View>
          ) : (
            <View className="bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">
              <Text className="text-xs font-medium text-gray-600 dark:text-gray-400">
                {schedule.threshold}+
              </Text>
            </View>
          )}
        </View>
        <Text className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{context}</Text>
      </View>
      <Switch
        value={schedule.enabled}
        onValueChange={onToggle}
        onStartShouldSetResponder={() => true}
      />
    </Pressable>
  );
}

export function AlertSchedulesScreen() {
  const navigation = useNavigation<Nav>();
  const { alertSchedules, updateAlertSchedule } = useSettingsStore();

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Pressable
          onPress={() => navigation.navigate('AlertEdit', {})}
          hitSlop={12}
        >
          <Text className="text-primary-500 text-2xl font-light leading-none">+</Text>
        </Pressable>
      ),
    });
  }, [navigation]);

  const renderItem: ListRenderItem<AlertSchedule> = ({ item }) => (
    <ScheduleRow
      schedule={item}
      onToggle={(enabled) => updateAlertSchedule(item.id, { enabled })}
      onPress={() => navigation.navigate('AlertEdit', { scheduleId: item.id })}
    />
  );

  return (
    <View className="flex-1 bg-white dark:bg-gray-900">
      <FlatList
        data={alertSchedules}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center px-8 pt-24">
            <Text className="text-4xl mb-4">🔔</Text>
            <Text className="text-lg font-semibold text-gray-900 dark:text-white text-center">
              No alerts yet
            </Text>
            <Text className="text-sm text-gray-500 dark:text-gray-400 text-center mt-2">
              Tap + to add your first smart alert.
            </Text>
          </View>
        }
        ListFooterComponent={
          alertSchedules.length > 0 ? (
            <View className="px-6 pt-5 pb-10">
              <View className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
                <Text className="text-xs font-semibold text-blue-700 dark:text-blue-400 mb-1">
                  How smart alerts work
                </Text>
                <Text className="text-xs text-blue-600 dark:text-blue-300 leading-relaxed">
                  Alerts set after 6 PM or before 5 AM will show{' '}
                  <Text className="font-semibold">tomorrow's predicted</Text> pollen forecast at
                  your location.{'\n\n'}
                  Morning and daytime alerts show{' '}
                  <Text className="font-semibold">today's real-time</Text> pollen levels.
                </Text>
              </View>
            </View>
          ) : null
        }
      />
    </View>
  );
}
