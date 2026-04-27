import React from 'react';
import { View, Text, ScrollView, ActivityIndicator } from 'react-native';
import { Screen, Stack } from '@/components/layout';
import { Card } from '@/components/ui';
import { useAllergyProfile } from '../hooks/useAllergyProfile';
import { correlationStrength, type CorrelationResult } from '../correlationEngine';

// ─── Sub-components ──────────────────────────────────────────────────────────

function ProgressCard({ daysWithData, daysNeeded }: { daysWithData: number; daysNeeded: number }) {
  const pct = Math.min(daysWithData / daysNeeded, 1);
  const remaining = daysNeeded - daysWithData;

  return (
    <Card variant="outlined">
      <Text className="text-base font-semibold text-neutral-800 dark:text-neutral-200 mb-1">
        Building your profile
      </Text>
      <Text className="text-sm text-neutral-500 dark:text-neutral-400 mb-4">
        Log symptoms daily to reveal which allergens affect you most.{' '}
        {remaining > 0 ? `${remaining} more day${remaining === 1 ? '' : 's'} needed.` : ''}
      </Text>
      <View className="h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
        <View
          className="h-full bg-primary-500 rounded-full"
          style={{ width: `${Math.round(pct * 100)}%` }}
        />
      </View>
      <Text className="text-xs text-neutral-400 mt-1 text-right">
        {daysWithData} / {daysNeeded} days
      </Text>
    </Card>
  );
}

function CorrelationBar({ result }: { result: CorrelationResult }) {
  const strength = correlationStrength(result.correlation);
  const pct = Math.abs(result.correlation) * 100;
  const isPositive = result.correlation >= 0;

  return (
    <View className="mb-4">
      <View className="flex-row items-center justify-between mb-1">
        <Text className="text-sm font-medium text-neutral-800 dark:text-neutral-200 flex-1 mr-2">
          {result.label}
        </Text>
        <View className="flex-row items-center gap-2">
          <Text className="text-xs font-semibold" style={{ color: strength.color }}>
            {strength.label}
          </Text>
          <Text className="text-xs text-neutral-400">
            {isPositive ? '+' : '−'}{Math.abs(result.correlation).toFixed(2)}
          </Text>
        </View>
      </View>
      <View className="h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
        <View
          className="h-full rounded-full"
          style={{ width: `${pct}%`, backgroundColor: strength.color }}
        />
      </View>
      <Text className="text-xs text-neutral-400 mt-0.5">
        Based on {result.dataPoints} day{result.dataPoints === 1 ? '' : 's'} of data
      </Text>
    </View>
  );
}

function CorrelationSection({
  title,
  results,
}: {
  title: string;
  results: CorrelationResult[];
}) {
  const visible = results.filter((r) => r.dataPoints > 0);
  if (visible.length === 0) return null;

  return (
    <Card variant="outlined">
      <Text className="text-base font-semibold text-neutral-800 dark:text-neutral-200 mb-4">
        {title}
      </Text>
      {visible.map((r) => (
        <CorrelationBar key={r.key} result={r} />
      ))}
    </Card>
  );
}

function InsightCallout({ correlations }: { correlations: CorrelationResult[] }) {
  const top = correlations.filter((r) => Math.abs(r.correlation) >= 0.4).slice(0, 3);
  if (top.length === 0) return null;

  const topLabels = top.map((r) => r.label.toLowerCase()).join(', ');

  return (
    <Card variant="filled">
      <Text className="text-sm font-semibold text-primary-700 dark:text-primary-300 mb-1">
        Your allergy pattern
      </Text>
      <Text className="text-sm text-neutral-700 dark:text-neutral-300">
        Your symptoms correlate most strongly with {topLabels}.
      </Text>
    </Card>
  );
}

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function AllergyProfileScreen() {
  const { data, loading, error } = useAllergyProfile();

  const pollenResults = data?.correlations.filter((r) => r.category === 'pollen') ?? [];
  const aqResults = data?.correlations.filter((r) => r.category === 'air_quality') ?? [];

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Stack spacing={4} className="py-4">
          <View>
            <Text className="text-2xl font-bold text-neutral-900 dark:text-white">
              Allergy profile
            </Text>
            <Text className="text-sm text-neutral-500 mt-1">
              How your environment affects your symptoms
            </Text>
          </View>

          {loading && (
            <View className="items-center py-8">
              <ActivityIndicator />
            </View>
          )}

          {error && (
            <Card variant="outlined">
              <Text className="text-sm text-red-500">Could not load profile data.</Text>
            </Card>
          )}

          {!loading && !error && data && (
            <>
              {!data.ready && (
                <ProgressCard
                  daysWithData={data.daysWithData}
                  daysNeeded={data.daysNeeded}
                />
              )}

              {data.ready && (
                <>
                  <InsightCallout correlations={data.correlations} />
                  <CorrelationSection title="Pollen" results={pollenResults} />
                  <CorrelationSection title="Air quality" results={aqResults} />
                </>
              )}

              {data.daysWithData === 0 && (
                <Card variant="outlined">
                  <Text className="text-sm text-neutral-500 dark:text-neutral-400 text-center">
                    Start logging your symptoms daily to build your allergy profile.
                  </Text>
                </Card>
              )}
            </>
          )}
        </Stack>
      </ScrollView>
    </Screen>
  );
}
