import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen, Stack } from '@/components/layout';
import { Card } from '@/components/ui';
import { useSymptomHistory } from '../hooks/useSymptomHistory';
import { isEditable, timeSlotFromLoggedAt } from '../hooks/useSymptomEditor';
import { shareSymptomSnapshot } from '../snapshotService';
import { TIME_SLOTS } from '../types';
import type { SymptomLog, SymptomType } from '../types';
import type { HistoryStackParamList } from '@/types/navigation';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const SYMPTOM_LABEL: Record<SymptomType, string> = {
  sneezing: 'Sneezing',
  itchy_eyes: 'Itchy eyes',
  runny_nose: 'Runny nose',
  congestion: 'Congestion',
  skin_reaction: 'Skin reaction',
  headache: 'Headache',
};

const TIME_SLOT_LABEL: Record<string, string> = Object.fromEntries(
  TIME_SLOTS.map((s) => [s.key, s.label]),
);

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });
}

function severityLabel(s: number): string {
  if (s <= 3) return 'Mild';
  if (s <= 6) return 'Moderate';
  return 'Severe';
}

function severityColor(s: number): string {
  if (s <= 3) return '#22c55e';
  if (s <= 6) return '#f59e0b';
  return '#ef4444';
}

function groupByDate(logs: SymptomLog[]): Map<string, SymptomLog[]> {
  const map = new Map<string, SymptomLog[]>();
  for (const log of logs) {
    const date = log.loggedAt.slice(0, 10);
    if (!map.has(date)) map.set(date, []);
    map.get(date)!.push(log);
  }
  return map;
}

function computeTriggers(logs: SymptomLog[]): { symptom: SymptomType; count: number }[] {
  const counts: Partial<Record<SymptomType, number>> = {};
  for (const log of logs) {
    for (const s of log.symptoms) {
      counts[s] = (counts[s] ?? 0) + 1;
    }
  }
  return (Object.entries(counts) as [SymptomType, number][])
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([symptom, count]) => ({ symptom, count }));
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function TriggersCard({ logs }: { logs: SymptomLog[] }) {
  const triggers = useMemo(() => computeTriggers(logs), [logs]);
  if (triggers.length === 0) return null;

  return (
    <Card variant="outlined">
      <Text className="text-base font-semibold text-neutral-800 dark:text-neutral-200 mb-3">
        Your most common symptoms
      </Text>
      {triggers.map(({ symptom, count }) => (
        <View key={symptom} className="flex-row items-center mb-2">
          <Text className="text-sm text-neutral-700 dark:text-neutral-300 flex-1">
            {SYMPTOM_LABEL[symptom]}
          </Text>
          <Text className="text-sm text-neutral-400">{count} times</Text>
        </View>
      ))}
    </Card>
  );
}

type HistoryNavProp = NativeStackNavigationProp<HistoryStackParamList, 'HistoryMain'>;

function LogRow({ log }: { log: SymptomLog }) {
  const navigation = useNavigation<HistoryNavProp>();
  const editable = isEditable(log);
  const slotLabel = TIME_SLOT_LABEL[timeSlotFromLoggedAt(log.loggedAt)] ?? 'Unknown';
  const symptomText = log.symptoms.map((s) => SYMPTOM_LABEL[s as SymptomType] ?? s).join(', ');

  return (
    <View className="pt-3 mt-3 border-t border-neutral-100 dark:border-neutral-700">
      <View className="flex-row justify-between items-center mb-1">
        <Text className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
          {slotLabel}
        </Text>
        <View className="flex-row items-center gap-3">
          <Text className="text-sm font-medium" style={{ color: severityColor(log.severity) }}>
            {severityLabel(log.severity)} ({log.severity}/10)
          </Text>
          {editable && (
            <TouchableOpacity
              onPress={() => navigation.navigate('EditLog', { logId: log.id })}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text className="text-sm font-medium text-primary-600">Edit</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
      <Text className="text-sm text-neutral-500 dark:text-neutral-400">{symptomText}</Text>
      {log.notes ? (
        <Text className="text-xs text-neutral-400 mt-1 italic">{log.notes}</Text>
      ) : null}
    </View>
  );
}

function DayCard({ date, logs }: { date: string; logs: SymptomLog[] }) {
  const maxSeverity = Math.max(...logs.map((l) => l.severity));
  const [sharing, setSharing] = useState(false);

  async function handleShare() {
    setSharing(true);
    try {
      await shareSymptomSnapshot(date, logs);
    } finally {
      setSharing(false);
    }
  }

  return (
    <Card variant="outlined">
      <View className="flex-row justify-between items-center">
        <Text className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 flex-1 mr-2">
          {formatDate(date)}
        </Text>
        <View className="flex-row items-center gap-3">
          <Text className="text-xs font-medium" style={{ color: severityColor(maxSeverity) }}>
            Worst: {severityLabel(maxSeverity)}
          </Text>
          <TouchableOpacity onPress={handleShare} disabled={sharing}>
            <Text
              className="text-sm font-medium text-neutral-400"
              style={{ opacity: sharing ? 0.4 : 1 }}
            >
              Share
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {logs.map((log) => (
        <LogRow key={log.id} log={log} />
      ))}
    </Card>
  );
}

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function HistoryScreen() {
  const { data: logs, isLoading } = useSymptomHistory(30);

  const grouped = useMemo(() => (logs ? groupByDate(logs) : new Map()), [logs]);
  const hasEnoughData = (logs?.length ?? 0) >= 7;

  if (isLoading) {
    return (
      <Screen>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator />
        </View>
      </Screen>
    );
  }

  if (!logs || logs.length === 0) {
    return (
      <Screen>
        <Stack spacing={4} className="py-4">
          <Text className="text-2xl font-bold text-neutral-900 dark:text-white">History</Text>
          <View className="flex-1 items-center justify-center py-20">
            <Text className="text-4xl mb-4">📋</Text>
            <Text className="text-base text-neutral-500 text-center">
              No logs yet. Use the Log tab to start tracking your symptoms.
            </Text>
          </View>
        </Stack>
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Stack spacing={4} className="py-4">
          <Text className="text-2xl font-bold text-neutral-900 dark:text-white">History</Text>

          {hasEnoughData ? (
            <TriggersCard logs={logs} />
          ) : (
            <Card variant="filled">
              <Text className="text-sm text-neutral-500 text-center">
                Log {7 - logs.length} more{' '}
                {7 - logs.length === 1 ? 'entry' : 'entries'} to unlock your top triggers.
              </Text>
            </Card>
          )}

          {Array.from(grouped.entries()).map(([date, dayLogs]) => (
            <DayCard key={date} date={date} logs={dayLogs} />
          ))}
        </Stack>
      </ScrollView>
    </Screen>
  );
}
