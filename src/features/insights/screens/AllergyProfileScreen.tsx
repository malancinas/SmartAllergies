import React, { useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, Pressable } from 'react-native';
import { Screen, Stack } from '@/components/layout';
import { Card, Modal } from '@/components/ui';
import { useAllergyProfile, type AllergyProfileData } from '../hooks/useAllergyProfile';
import { correlationStrength, type CorrelationResult } from '../correlationEngine';
import type { AdvancedAllergyProfile, AggravatorResult, TriggerResult, MedicationEffect } from '../types';

// ─── Building / learning phase cards ─────────────────────────────────────────

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

// ─── Phase 1 correlation components ──────────────────────────────────────────

function CorrelationBar({ result, category }: { result: CorrelationResult; category?: string }) {
  const displayValue = Math.max(0, result.correlation);
  const strength = category === 'air_quality'
    ? aqStrengthFromCorrelation(displayValue)
    : correlationStrength(displayValue);
  const pct = displayValue * 100;

  return (
    <View className="mb-4">
      <View className="flex-row items-center justify-between mb-1">
        <Text className="text-sm font-medium text-neutral-800 dark:text-neutral-200 flex-1 mr-2">
          {result.label}
        </Text>
        <Text className="text-xs font-semibold" style={{ color: strength.color }}>
          {strength.label}
        </Text>
      </View>
      <View className="h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
        <View
          className="h-full rounded-full"
          style={{ width: `${pct}%`, backgroundColor: strength.color }}
        />
      </View>
    </View>
  );
}

function CorrelationSection({ title, subtitle, results, category }: {
  title: string;
  subtitle?: string;
  results: CorrelationResult[];
  category?: string;
}) {
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
        <CorrelationBar key={r.key} result={r} category={category} />
      ))}
    </Card>
  );
}

// ─── Phase 2 helpers ──────────────────────────────────────────────────────────

function aqStrengthFromCorrelation(abs: number): { label: string; color: string } {
  if (abs >= 0.7) return { label: 'Strong effect',      color: '#ef4444' };
  if (abs >= 0.4) return { label: 'Likely affects you', color: '#f97316' };
  if (abs >= 0.2) return { label: 'May affect you',     color: '#eab308' };
  return                  { label: 'No clear effect',   color: '#94a3b8' };
}

type ConfidenceBucket = {
  chip: string;
  chipBg: string;
  chipText: string;
  dotColor: string;
  cardLabel: string;
  cardMessage: string;
};

function getConfidenceBucket(r2: number): ConfidenceBucket {
  if (r2 >= 0.50) return {
    chip: 'Very Confident',
    chipBg: 'bg-teal-50 dark:bg-teal-900/40',
    chipText: 'text-teal-700 dark:text-teal-300',
    dotColor: '#14b8a6',
    cardLabel: 'Highly predictable allergy profile',
    cardMessage: 'Your symptoms are strongly driven by identifiable triggers.',
  };
  if (r2 >= 0.40) return {
    chip: 'Confident',
    chipBg: 'bg-teal-50 dark:bg-teal-900/40',
    chipText: 'text-teal-700 dark:text-teal-300',
    dotColor: '#14b8a6',
    cardLabel: 'Clear patterns detected',
    cardMessage: 'Your allergy triggers are clear and your symptoms are becoming predictable.',
  };
  if (r2 >= 0.30) return {
    chip: 'Moderate confidence',
    chipBg: 'bg-green-50 dark:bg-green-900/40',
    chipText: 'text-green-700 dark:text-green-300',
    dotColor: '#22c55e',
    cardLabel: 'Patterns starting to emerge',
    cardMessage: 'Your symptoms are consistently linked to certain environmental triggers.',
  };
  return {
    chip: 'Still Learning',
    chipBg: 'bg-amber-50 dark:bg-amber-900/40',
    chipText: 'text-amber-700 dark:text-amber-300',
    dotColor: '#f59e0b',
    cardLabel: 'Patterns starting to emerge',
    cardMessage: "We're beginning to see some links between your symptoms and environmental factors.",
  };
}

// ─── Phase 2 components ───────────────────────────────────────────────────────

function ConfidenceChip({ data }: { data: AllergyProfileData }) {
  if (data.advancedReady && data.advancedProfile) {
    const bucket = getConfidenceBucket(data.advancedProfile.rSquared);
    return (
      <View className={`flex-row items-center gap-1.5 px-2.5 py-1 rounded-full ${bucket.chipBg}`}>
        <View className="w-2 h-2 rounded-full" style={{ backgroundColor: bucket.dotColor }} />
        <Text className={`text-xs font-semibold ${bucket.chipText}`}>{bucket.chip}</Text>
      </View>
    );
  }

  if (data.daysWithData >= data.advancedDaysNeeded) {
    const pct = Math.min(Math.round((data.currentRSquared / 0.15) * 100), 99);
    return (
      <View className="flex-row items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-900/40">
        <View className="w-2 h-2 rounded-full bg-amber-400" />
        <Text className="text-xs font-semibold text-amber-700 dark:text-amber-300">
          Training · {pct}%
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-row items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-900/40">
      <View className="w-2 h-2 rounded-full bg-blue-400" />
      <Text className="text-xs font-semibold text-blue-700 dark:text-blue-300">
        {data.daysWithData} days logged
      </Text>
    </View>
  );
}

function StatsRow({ daysWithData, rSquared }: { daysWithData: number; rSquared: number }) {
  const accuracy = Math.round(rSquared * 100);
  const [showInfo, setShowInfo] = useState(false);

  return (
    <>
      <View className="flex-row gap-3">
        <View className="flex-1 bg-neutral-100 dark:bg-neutral-800 rounded-xl p-3">
          <Text className="text-2xl font-bold text-neutral-900 dark:text-white">{daysWithData}</Text>
          <Text className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">days logged</Text>
        </View>
        <View className="flex-1 bg-neutral-100 dark:bg-neutral-800 rounded-xl p-3">
          <View className="flex-row items-center gap-1.5">
            <Text className="text-2xl font-bold text-neutral-900 dark:text-white">{accuracy}%</Text>
            <Pressable
              onPress={() => setShowInfo(true)}
              hitSlop={8}
              className="w-5 h-5 rounded-full border border-neutral-400 dark:border-neutral-500 items-center justify-center"
            >
              <Text className="text-xs font-semibold text-neutral-400 dark:text-neutral-500" style={{ lineHeight: 14 }}>i</Text>
            </Pressable>
          </View>
          <Text className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">profile accuracy</Text>
        </View>
      </View>

      <Modal visible={showInfo} onClose={() => setShowInfo(false)} title="Profile accuracy">
        <Text className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 mb-2">
          What does this number mean?
        </Text>
        <Text className="text-sm text-neutral-600 dark:text-neutral-400 mb-4 leading-relaxed">
          This is R² — the share of your day-to-day symptom variation that your identified triggers (pollen, air quality) can explain. A score of {accuracy}% means the model accounts for {accuracy}% of what drives your symptoms.
        </Text>

        <Text className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 mb-2">
          Why is {accuracy}% actually good?
        </Text>
        <Text className="text-sm text-neutral-600 dark:text-neutral-400 mb-4 leading-relaxed">
          Human symptoms are noisy by nature. Sleep quality, stress, hydration, illness, and dozens of other factors the app doesn't track all contribute. In clinical environmental health research, an R² of 0.15–0.30 is considered a meaningful result. Anything above 0.40 is strong. You're above that bar.
        </Text>

        <Text className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 mb-2">
          What about the rest?
        </Text>
        <Text className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
          The remaining {100 - accuracy}% isn't error — it's normal biological variability. Even the best models in academic allergy studies leave a large portion unexplained for the same reason.
        </Text>
      </Modal>
    </>
  );
}

function TriggerBar({ trigger, maxBeta }: {
  trigger: TriggerResult;
  maxBeta: number;
}) {
  const pct = maxBeta === 0 ? 0 : Math.round(Math.min(100, Math.max(0, (trigger.partialBeta / maxBeta) * 100)));
  const color = trigger.isPrimary ? '#ef4444' : trigger.isSecondary ? '#f97316' : '#94a3b8';
  const tagColor = trigger.isPrimary ? 'text-red-500' : trigger.isSecondary ? 'text-orange-500' : null;
  const tagLabel = trigger.isPrimary ? 'Primary trigger' : trigger.isSecondary ? 'Secondary trigger' : null;

  return (
    <View className="mb-4">
      <View className="flex-row items-center gap-2 mb-1.5 flex-wrap">
        <Text className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
          {trigger.label}
        </Text>
        {tagLabel && (
          <Text className={`text-xs font-medium ${tagColor}`}>{tagLabel}</Text>
        )}
      </View>
      <View className="h-2.5 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden mb-1">
        <View className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
      </View>
      <Text className="text-xs text-neutral-400">Correlation strength: {pct}%</Text>
    </View>
  );
}

function TriggerCard({ profile }: { profile: AdvancedAllergyProfile }) {
  const sorted = [...profile.triggers].sort((a, b) => b.partialBeta - a.partialBeta);
  const maxBeta = Math.max(...sorted.map((t) => Math.abs(t.partialBeta)), 0.01);

  return (
    <Card variant="outlined">
      <Text className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-4">
        Your main triggers
      </Text>
      {sorted.map((t) => (
        <TriggerBar key={t.key} trigger={t} maxBeta={maxBeta} />
      ))}
    </Card>
  );
}

function PatternsSection({ profile }: { profile: AdvancedAllergyProfile }) {
  const bucket = getConfidenceBucket(profile.rSquared);
  const secondaryTriggers = profile.triggers.filter((t) => t.isSecondary);

  return (
    <>
      <Card variant="outlined">
        <View className="flex-row items-start gap-3">
          <View className="w-8 h-8 rounded-full bg-teal-50 dark:bg-teal-900/40 items-center justify-center mt-0.5">
            <Text className="text-teal-600 dark:text-teal-400 text-sm font-bold">✓</Text>
          </View>
          <View className="flex-1">
            <Text className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 mb-1">
              {bucket.cardLabel}
            </Text>
            <Text className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
              {bucket.cardMessage}
              {!profile.regressionStable ? ' Your breakdown will sharpen as more seasons are captured.' : ''}
            </Text>
          </View>
        </View>
      </Card>

      {secondaryTriggers.length > 0 && (
        <Card variant="outlined">
          <View className="flex-row items-start gap-3">
            <View className="w-8 h-8 rounded-full bg-orange-50 dark:bg-orange-900/40 items-center justify-center mt-0.5">
              <Text className="text-orange-500 text-sm font-bold">!</Text>
            </View>
            <View className="flex-1">
              <View className="flex-row items-center gap-2 mb-1 flex-wrap">
                <Text className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
                  Second trigger forming
                </Text>
                <Text className="text-xs font-medium text-orange-500">needs more data</Text>
              </View>
              <Text className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                We're detecting a potential second trigger alongside your primary one. Keep logging on{' '}
                {secondaryTriggers.map((t) => t.label.toLowerCase()).join(' and ')} days to confirm
                whether it's independently affecting your symptoms.
              </Text>
            </View>
          </View>
        </Card>
      )}
    </>
  );
}

function AggravatorCard({ profile }: { profile: AdvancedAllergyProfile }) {
  if (!profile.topAggravator?.isSignificant) return null;

  const secondary = profile.aggravators.filter((a) => a.isSignificant).slice(1);

  return (
    <View className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-2xl p-4">
      <Text className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-2">
        What makes it worse
      </Text>
      <Text className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">
        {profile.insightSentence}
      </Text>
      {secondary.map((a) => (
        <Text key={a.key} className="text-xs text-neutral-500 dark:text-neutral-400 mt-2">
          · {a.label} also tends to amplify your symptoms
        </Text>
      ))}
    </View>
  );
}

type AQTier = { label: string; color: string; bgColor: string; subtitle: string };

function aqTier(rc: number): AQTier & { show: boolean } {
  const abs = Math.abs(rc);
  const pct = Math.round(abs * 100);
  if (abs >= 0.5) return { show: true, label: 'Strong effect',      color: '#ef4444', bgColor: '#fef2f2', subtitle: `${pct}% correlation` };
  if (abs >= 0.3) return { show: true, label: 'Likely affects you', color: '#f97316', bgColor: '#fff7ed', subtitle: `${pct}% correlation · still being confirmed` };
  if (abs >= 0.15) return { show: true, label: 'Possible link',     color: '#22c55e', bgColor: '#f0fdf4', subtitle: `${pct}% correlation · needs more data` };
  return               { show: false, label: 'No link found',       color: '#94a3b8', bgColor: 'transparent', subtitle: '' };
}

function AirQualityCard({ aggravators }: { aggravators: AggravatorResult[] }) {
  if (aggravators.length === 0) return null;

  const shown = aggravators.filter((a) => aqTier(a.residualCorrelation).show);
  const hidden = aggravators.filter((a) => !aqTier(a.residualCorrelation).show);

  const shortLabel = (label: string) => {
    const map: Record<string, string> = {
      'PM2.5 (fine particles)': 'PM2.5',
      'PM10 (coarse particles)': 'PM10',
      'Nitrogen dioxide': 'NO₂',
      'Sulphur dioxide': 'SO₂',
      'Ozone': 'O₃',
      'Dust': 'Dust',
    };
    return map[label] ?? label;
  };

  return (
    <Card variant="outlined">
      <Text className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-4">
        Air quality correlations
      </Text>

      {shown.map((a) => {
        const tier = aqTier(a.residualCorrelation);
        const barPct = Math.min(100, Math.abs(a.residualCorrelation) * 100);
        return (
          <View key={a.key} className="mb-4">
            <View className="flex-row items-center justify-between mb-1.5">
              <Text className="text-sm font-medium text-neutral-800 dark:text-neutral-200 flex-1 mr-2">
                {a.label}
              </Text>
              <View className="px-2 py-0.5 rounded-full" style={{ backgroundColor: tier.bgColor }}>
                <Text className="text-xs font-semibold" style={{ color: tier.color }}>
                  {tier.label}
                </Text>
              </View>
            </View>
            <View className="h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden mb-1">
              <View className="h-full rounded-full" style={{ width: `${barPct}%`, backgroundColor: tier.color }} />
            </View>
            <Text className="text-xs text-neutral-400">{tier.subtitle}</Text>
          </View>
        );
      })}

      {hidden.length > 0 && (
        <View className="flex-row items-center gap-2 mt-1">
          <Text className="text-xs text-neutral-400">ⓘ</Text>
          <Text className="text-xs text-neutral-400">
            No link found for{' '}
            <Text className="font-semibold">{hidden.map((a) => shortLabel(a.label)).join(', ')}</Text>
          </Text>
        </View>
      )}
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
              {data && <ConfidenceChip data={data} />}
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

              {/* Building Phase 1 */}
              {!data.ready && data.daysWithData > 0 && (
                <ProgressCard daysWithData={data.daysWithData} daysNeeded={data.daysNeeded} />
              )}

              {/* Phase 1 → Phase 2 model quality */}
              {modelLearning && (
                <ModelLearningCard currentRSquared={data.currentRSquared} />
              )}

              {/* ── Phase 2 ── */}
              {data.advancedReady && data.advancedProfile && (
                <>
                  <StatsRow
                    daysWithData={data.daysWithData}
                    rSquared={data.advancedProfile.rSquared}
                  />
                  <TriggerCard profile={data.advancedProfile} />
                  <PatternsSection profile={data.advancedProfile} />
                  <AggravatorCard profile={data.advancedProfile} />
                  <AirQualityCard aggravators={data.advancedProfile.aggravators} />
                  {data.advancedProfile.medicationEffect && (
                    <MedicationCard effect={data.advancedProfile.medicationEffect} />
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
                  <CorrelationSection title="Air quality" subtitle="Pearson correlation" results={aqResults} category="air_quality" />
                </>
              )}
            </>
          )}
        </Stack>
      </ScrollView>
    </Screen>
  );
}
