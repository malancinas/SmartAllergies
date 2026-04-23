import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Screen, Stack } from '@/components/layout';
import { Card } from '@/components/ui';
import { useSymptomHistory } from '../hooks/useSymptomHistory';
import { shareSymptomSnapshot } from '../snapshotService';
import type { SymptomLog, SymptomType } from '../types';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const SYMPTOM_EMOJI: Record<SymptomType, string> = {
  sneezing: '🤧',
  itchy_eyes: '👁️',
  runny_nose: '💧',
  congestion: '😤',
  skin_reaction: '🔴',
  headache: '🤕',
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

function severityColor(s: number): string {
  if (s <= 3) return '#22c55e'; // green
  if (s <= 6) return '#f59e0b'; // amber
  return '#ef4444'; // red
}

// Group logs by calendar date (YYYY-MM-DD)
function groupByDate(logs: SymptomLog[]): Map<string, SymptomLog[]> {
  const map = new Map<string, SymptomLog[]>();
  for (const log of logs) {
    const date = log.loggedAt.slice(0, 10);
    if (!map.has(date)) map.set(date, []);
    map.get(date)!.push(log);
  }
  return map;
}

// Count how often each symptom appeared and find the top triggers
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
          <Text className="text-xl mr-2">{SYMPTOM_EMOJI[symptom]}</Text>
          <Text className="text-sm text-neutral-700 dark:text-neutral-300 flex-1 capitalize">
            {symptom.replace('_', ' ')}
          </Text>
          <Text className="text-sm text-neutral-400">{count}×</Text>
        </View>
      ))}
    </Card>
  );
}

function DayCard({ date, logs }: { date: string; logs: SymptomLog[] }) {
  const maxSeverity = Math.max(...logs.map((l) => l.severity));
  const allSymptoms = Array.from(new Set(logs.flatMap((l) => l.symptoms)));
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
      <View className="flex-row justify-between items-center mb-2">
        <Text className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
          {formatDate(date)}
        </Text>
        <View className="flex-row items-center gap-2">
          <TouchableOpacity onPress={handleShare} disabled={sharing} className="p-1">
            <Text style={{ fontSize: 16, opacity: sharing ? 0.4 : 1 }}>↗️</Text>
          </TouchableOpacity>
          <View
            className="w-8 h-8 rounded-full items-center justify-center"
            style={{ backgroundColor: severityColor(maxSeverity) + '33' }}
          >
            <Text
              className="text-sm font-bold"
              style={{ color: severityColor(maxSeverity) }}
            >
              {maxSeverity}
            </Text>
          </View>
        </View>
      </View>

      <View className="flex-row flex-wrap gap-1">
        {allSymptoms.map((s) => (
          <Text key={s} className="text-base">
            {SYMPTOM_EMOJI[s as SymptomType] ?? '•'}
          </Text>
        ))}
      </View>

      {logs.length > 1 && (
        <Text className="text-xs text-neutral-400 mt-2">{logs.length} entries</Text>
      )}
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
                Log {7 - logs.length} more {7 - logs.length === 1 ? 'entry' : 'entries'} to unlock your personal trigger analysis.
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
