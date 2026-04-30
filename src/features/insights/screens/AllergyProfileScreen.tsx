import React, { useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, Pressable } from 'react-native';
import { Screen, Stack } from '@/components/layout';
import { Card } from '@/components/ui';
import { useAllergyProfile } from '../hooks/useAllergyProfile';
import { correlationStrength, type CorrelationResult } from '../correlationEngine';
import type { AdvancedAllergyProfile, TriggerResult, MedicationEffect } from '../types';

// ─── Shared sub-components ────────────────────────────────────────────────────

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

function ModelLearningCard({ currentRSquared }: { currentRSquared: number }) {
  const pct = Math.min(Math.round((currentRSquared / 0.15) * 100), 99);

  const getMessage = () => {
    if (currentRSquared < 0.05) {
      return 'Your personalised ML model is just getting started — keep logging to help it learn your patterns.';
    }
    if (currentRSquared < 0.10) {
      return "The model is picking up on your symptom patterns. It's getting clearer with every log.";
    }
    return "Almost there — the model has a strong signal and your full trigger breakdown is nearly ready.";
  };

  return (
    <Card variant="outlined">
      <View className="flex-row items-center justify-between mb-1">
        <Text className="text-base font-semibold text-neutral-800 dark:text-neutral-200">
          ML model training
        </Text>
        <View className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900">
          <Text className="text-xs font-semibold text-blue-700 dark:text-blue-300">
            Pearson active
          </Text>
        </View>
      </View>
      <Text className="text-sm text-neutral-500 dark:text-neutral-400 mb-4">
        {getMessage()}
      </Text>
      <View className="h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
        <View
          className="h-full bg-primary-500 rounded-full"
          style={{ width: `${pct}%` }}
        />
      </View>
      <Text className="text-xs text-neutral-400 mt-1 text-right">
        {pct}% of the way there
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

function CorrelationSection({ title, subtitle, results }: { title: string; subtitle?: string; results: CorrelationResult[] }) {
  const visible = results.filter((r) => r.dataPoints > 0);
  if (visible.length === 0) return null;

  return (
    <Card variant="outlined">
      <View className="flex-row items-center justify-between mb-4">
        <Text className="text-base font-semibold text-neutral-800 dark:text-neutral-200">
          {title}
        </Text>
        {subtitle && (
          <Text className="text-xs text-neutral-400">{subtitle}</Text>
        )}
      </View>
      {visible.map((r) => (
        <CorrelationBar key={r.key} result={r} />
      ))}
    </Card>
  );
}

// ─── Phase 2 sub-components ───────────────────────────────────────────────────

function confidenceLevel(profile: AdvancedAllergyProfile): 'low' | 'moderate' | 'high' {
  if (!profile.regressionStable) return 'moderate';
  let score = 0;
  if (profile.dataPoints >= 45) score += 2;
  else if (profile.dataPoints >= 30) score += 1;
  if (profile.rSquared >= 0.40) score += 2;
  else if (profile.rSquared >= 0.15) score += 1;
  if (score >= 4) return 'high';
  if (score >= 2) return 'moderate';
  return 'low';
}

function ModelStatusChip({ data }: { data: AllergyProfileData }) {
  if (!data.ready) return null;

  if (data.advancedReady && data.advancedProfile) {
    const level = confidenceLevel(data.advancedProfile);
    const r2 = (data.advancedProfile.rSquared * 100).toFixed(0);
    const configs = {
      high:     { label: `ML model · R²=${r2}%`, bg: 'bg-green-100 dark:bg-green-900', text: 'text-green-700 dark:text-green-300' },
      moderate: { label: `ML model · R²=${r2}%`, bg: 'bg-amber-100 dark:bg-amber-900', text: 'text-amber-700 dark:text-amber-300' },
      low:      { label: `ML model · R²=${r2}%`, bg: 'bg-neutral-100 dark:bg-neutral-800', text: 'text-neutral-500' },
    };
    const c = configs[level];
    return (
      <View className={`self-start px-2.5 py-1 rounded-full ${c.bg}`}>
        <Text className={`text-xs font-semibold ${c.text}`}>{c.label}</Text>
      </View>
    );
  }

  if (data.daysWithData >= data.advancedDaysNeeded) {
    const pct = Math.min(Math.round((data.currentRSquared / 0.15) * 100), 99);
    return (
      <View className="self-start px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-900">
        <Text className="text-xs font-semibold text-amber-700 dark:text-amber-300">
          ML training · {pct}%
        </Text>
      </View>
    );
  }

  return (
    <View className="self-start px-2.5 py-1 rounded-full bg-blue-100 dark:bg-blue-900">
      <Text className="text-xs font-semibold text-blue-700 dark:text-blue-300">
        Pearson · {data.daysWithData} days
      </Text>
    </View>
  );
}

function TriggerBar({ trigger, maxBeta }: { trigger: TriggerResult; maxBeta: number }) {
  const pct = maxBeta === 0 ? 0 : Math.min(100, Math.max(0, (trigger.partialBeta / maxBeta)) * 100);
  const color = trigger.isPrimary ? '#ef4444' : '#94a3b8';

  return (
    <View className="mb-3">
      <View className="flex-row items-center justify-between mb-1">
        <Text className="text-sm font-medium text-neutral-800 dark:text-neutral-200 flex-1 mr-2">
          {trigger.label}
          {trigger.isPrimary ? (
            <Text className="text-xs text-red-500"> · Primary trigger</Text>
          ) : null}
        </Text>
      </View>
      <View className="h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
        <View className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
      </View>
    </View>
  );
}

function TriggerCard({ profile }: { profile: AdvancedAllergyProfile }) {
  const maxBeta = Math.max(...profile.triggers.map((t) => Math.abs(t.partialBeta)), 0.01);
  const r2Pct = Math.round(profile.rSquared * 100);

  return (
    <Card variant="outlined">
      <Text className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-3">
        Your main triggers
      </Text>
      {profile.triggers.map((t) => (
        <TriggerBar key={t.key} trigger={t} maxBeta={maxBeta} />
      ))}
      <View className="mt-3 pt-3 border-t border-neutral-100 dark:border-neutral-800">
        <Text className="text-xs text-neutral-400">
          Pollen pattern explains {r2Pct}% of your symptom variation
          {!profile.regressionStable
            ? ' · Breakdown will sharpen as more seasons are captured'
            : ''}
        </Text>
        <Text className="text-xs text-neutral-400 mt-1">
          Ranked by unique contribution — a pollen ranked lower may still have a high individual
          correlation if it moves closely in step with your primary trigger.
        </Text>
      </View>
    </Card>
  );
}

function AggravatorCard({ profile }: { profile: AdvancedAllergyProfile }) {
  if (!profile.topAggravator?.isSignificant) return null;

  const secondary = profile.aggravators.filter((a) => a.isSignificant).slice(1);

  return (
    <Card variant="filled">
      <Text className="text-sm font-semibold text-primary-700 dark:text-primary-300 mb-2">
        What makes it worse
      </Text>
      <Text className="text-sm text-neutral-700 dark:text-neutral-300 mb-2">
        {profile.insightSentence}
      </Text>
      {secondary.map((a) => (
        <Text key={a.key} className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
          · {a.label} also tends to amplify your symptoms
        </Text>
      ))}
    </Card>
  );
}

function MedicationCard({ effect }: { effect: MedicationEffect }) {
  if (!effect.hasEnoughData) {
    return (
      <Card variant="outlined">
        <Text className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
          Medication effectiveness
        </Text>
        <Text className="text-sm text-neutral-500 dark:text-neutral-400">
          {effect.nudgeMessage}
        </Text>
      </Card>
    );
  }

  const reductionPct = Math.round(effect.reductionPercent);
  const reductionPts = Math.abs(effect.reductionPoints).toFixed(1);
  const lagLabel = effect.lagDays === 1 ? 'next-day pollen' : 'same-day pollen';

  return (
    <Card variant="outlined">
      <Text className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-3">
        Medication effectiveness
      </Text>
      <Text className="text-sm text-neutral-700 dark:text-neutral-300 mb-3">
        On high {effect.primaryTriggerLabel.toLowerCase()} days, taking medication is associated
        with a{' '}
        <Text className="font-semibold text-green-600 dark:text-green-400">
          ~{reductionPct}% reduction
        </Text>{' '}
        in symptom severity ({reductionPts} points lower on average).
      </Text>

      <View className="flex-row gap-3 mb-3">
        <View className="flex-1 bg-green-50 dark:bg-green-900/30 rounded-lg p-3">
          <Text className="text-xs text-green-600 dark:text-green-400 font-semibold mb-1">
            With medication
          </Text>
          <Text className="text-lg font-bold text-green-700 dark:text-green-300">
            {effect.meanSeverityMedicated.toFixed(1)}
          </Text>
          <Text className="text-xs text-neutral-400">avg severity</Text>
          <Text className="text-xs text-neutral-400">{effect.medicatedDays} days</Text>
        </View>
        <View className="flex-1 bg-red-50 dark:bg-red-900/30 rounded-lg p-3">
          <Text className="text-xs text-red-600 dark:text-red-400 font-semibold mb-1">
            Without medication
          </Text>
          <Text className="text-lg font-bold text-red-700 dark:text-red-300">
            {effect.meanSeverityUnmedicated.toFixed(1)}
          </Text>
          <Text className="text-xs text-neutral-400">avg severity</Text>
          <Text className="text-xs text-neutral-400">{effect.unmedicatedDays} days</Text>
        </View>
      </View>

      <Text className="text-xs text-neutral-400">
        Compared within high {effect.primaryTriggerLabel.toLowerCase()} days only (≥{effect.pollenThreshold} grains/m³) · based on {lagLabel}
      </Text>
    </Card>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function AllergyProfileScreen() {
  const { data, loading, error } = useAllergyProfile();
  const modelLearning = data && !data.advancedReady && data.daysWithData >= data.advancedDaysNeeded;
  const [showPearson, setShowPearson] = useState(false);

  const pollenResults = data?.correlations.filter((r) => r.category === 'pollen') ?? [];
  const aqResults = data?.correlations.filter((r) => r.category === 'air_quality') ?? [];


  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Stack spacing={4} className="py-4">

          {/* Header */}
          <View>
            <View className="flex-row items-center gap-3 flex-wrap">
              <Text className="text-2xl font-bold text-neutral-900 dark:text-white">
                Allergy profile
              </Text>
              {data && <ModelStatusChip data={data} />}
            </View>
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
              {/* Empty state */}
              {data.daysWithData === 0 && (
                <Card variant="outlined">
                  <Text className="text-sm text-neutral-500 dark:text-neutral-400 text-center">
                    Start logging your symptoms daily to build your allergy profile.
                  </Text>
                </Card>
              )}

              {/* Building Phase 1 — day count progress */}
              {!data.ready && data.daysWithData > 0 && (
                <ProgressCard daysWithData={data.daysWithData} daysNeeded={data.daysNeeded} />
              )}

              {/* Phase 1 → Phase 2 — model quality progress */}
              {modelLearning && (
                <ModelLearningCard currentRSquared={data.currentRSquared} />
              )}

              {/* ── Phase 2 ── */}
              {data.advancedReady && data.advancedProfile && (
                <>
                  <TriggerCard profile={data.advancedProfile} />
                  <AggravatorCard profile={data.advancedProfile} />

                  {aqResults.length > 0 && (
                    <>
                      <Pressable
                        onPress={() => setShowPearson((v) => !v)}
                        className="flex-row items-center justify-between py-2"
                      >
                        <Text className="text-sm text-primary-600 dark:text-primary-400 font-medium">
                          {showPearson ? 'Hide' : 'View'} air quality correlations
                        </Text>
                        <Text className="text-sm text-neutral-400">{showPearson ? '▲' : '▼'}</Text>
                      </Pressable>

                      {showPearson && (
                        <CorrelationSection title="Air quality" results={aqResults} />
                      )}
                    </>
                  )}
                </>
              )}

              {/* ── Phase 1 ── */}
              {data.ready && !data.advancedReady && (
                <>
                  {data.correlations.filter((r) => Math.abs(r.correlation) >= 0.4).length > 0 && (
                    <Card variant="filled">
                      <Text className="text-sm font-semibold text-primary-700 dark:text-primary-300 mb-1">
                        Your allergy pattern
                      </Text>
                      <Text className="text-sm text-neutral-700 dark:text-neutral-300">
                        Your symptoms correlate most strongly with{' '}
                        {data.correlations
                          .filter((r) => Math.abs(r.correlation) >= 0.4)
                          .slice(0, 3)
                          .map((r) => r.label.toLowerCase())
                          .join(', ')}
                        .
                      </Text>
                    </Card>
                  )}

                  <CorrelationSection title="Pollen" subtitle="Pearson correlation" results={pollenResults} />
                  <CorrelationSection title="Air quality" subtitle="Pearson correlation" results={aqResults} />

                </>
              )}
            </>
          )}
        </Stack>
      </ScrollView>
    </Screen>
  );
}
