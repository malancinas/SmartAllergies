import React, { useState } from 'react';
import { View, Text, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { Screen, Stack } from '@/components/layout';
import { Button, Card } from '@/components/ui';
import { useProGate } from '@/features/subscription/hooks/useProGate';
import { PaywallSheet } from '@/features/subscription/components/PaywallSheet';
import { useExportData } from '../hooks/useExportData';
import { generateAndSharePdf } from '../exportService';

const DATE_RANGES = [
  { label: '30 days', days: 30 },
  { label: '90 days', days: 90 },
  { label: '180 days', days: 180 },
  { label: 'All time', days: 3650 },
] as const;

export default function ExportScreen() {
  const { isPro, showPaywall, paywallProps } = useProGate();
  const [selectedDays, setSelectedDays] = useState(30);
  const [generating, setGenerating] = useState(false);

  const { exportLogs, summary, isLoading } = useExportData(isPro ? selectedDays : 7);

  async function handleGenerate() {
    if (exportLogs.length === 0) {
      Alert.alert('No data', 'Log some symptoms first before generating a report.');
      return;
    }
    setGenerating(true);
    try {
      await generateAndSharePdf(exportLogs, summary);
    } catch (err: unknown) {
      const e = err as { message?: string };
      Alert.alert('Export failed', e.message ?? 'Could not generate the PDF. Please try again.');
    } finally {
      setGenerating(false);
    }
  }

  // Show paywall for free users
  if (!isPro) {
    return (
      <Screen>
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-4xl mb-4">📄</Text>
          <Text className="text-xl font-bold text-neutral-900 dark:text-white text-center mb-2">
            Allergist Report
          </Text>
          <Text className="text-sm text-neutral-500 dark:text-neutral-400 text-center mb-6">
            Generate a clean PDF of your symptom diary to share with your doctor. This is a Pro feature.
          </Text>
          <Button
            label="Upgrade to Pro"
            onPress={() => showPaywall('Allergist export (PDF)')}
          />
        </View>
        <PaywallSheet {...paywallProps} featureName="Allergist export (PDF)" />
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Stack spacing={5} className="py-4">
          {/* Header description */}
          <View>
            <Text className="text-sm text-neutral-500 dark:text-neutral-400">
              Generate a clean PDF of your symptom diary to share with your allergist or doctor.
            </Text>
          </View>

          {/* Summary stats */}
          {!isLoading && (
            <Card variant="filled">
              <View className="flex-row justify-around">
                <View className="items-center">
                  <Text className="text-2xl font-bold text-neutral-900 dark:text-white">
                    {summary.totalLogs}
                  </Text>
                  <Text className="text-xs text-neutral-400 mt-0.5">Entries</Text>
                </View>
                <View className="items-center">
                  <Text className="text-2xl font-bold text-neutral-900 dark:text-white">
                    {summary.worstDays[0]?.maxSeverity ?? '—'}
                  </Text>
                  <Text className="text-xs text-neutral-400 mt-0.5">Worst severity</Text>
                </View>
                <View className="items-center">
                  <Text className="text-2xl font-bold text-neutral-900 dark:text-white">
                    {summary.mostCommonSymptoms.length}
                  </Text>
                  <Text className="text-xs text-neutral-400 mt-0.5">Symptoms</Text>
                </View>
              </View>
            </Card>
          )}

          {/* Date range selector */}
          <View>
            <Text className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-3">
              Date range
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {DATE_RANGES.map((r) => {
                const active = selectedDays === r.days;
                return (
                  <TouchableOpacity
                    key={r.days}
                    onPress={() => setSelectedDays(r.days)}
                    className={`px-4 py-2 rounded-full border ${
                      active
                        ? 'bg-primary-500 border-primary-500'
                        : 'bg-white border-neutral-300 dark:bg-neutral-800 dark:border-neutral-600'
                    }`}
                  >
                    <Text
                      className={`text-sm font-medium ${
                        active ? 'text-white' : 'text-neutral-700 dark:text-neutral-300'
                      }`}
                    >
                      {r.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Generate button */}
          <Button
            label={generating ? 'Generating PDF…' : 'Generate & Share PDF'}
            onPress={handleGenerate}
            disabled={generating || isLoading || summary.totalLogs === 0}
          />

          {/* Disclaimer */}
          <Text className="text-xs text-neutral-400 text-center px-4">
            This report is for informational purposes. Always consult your doctor or allergist for medical advice.
          </Text>
        </Stack>
      </ScrollView>
    </Screen>
  );
}
