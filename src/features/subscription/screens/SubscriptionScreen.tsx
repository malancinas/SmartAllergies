import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import RevenueCatUI, { PAYWALL_RESULT } from 'react-native-purchases-ui';
import { Screen, Stack } from '@/components/layout';
import { Button, Card } from '@/components/ui';
import { useSubscription } from '../hooks/useSubscription';
import { syncEntitlement } from '../service';
import { PRO_FEATURES, FREE_LIMITS } from '../types';

export default function SubscriptionScreen() {
  const { tier, isPro } = useSubscription();

  async function handleSeePlans() {
    const result = await RevenueCatUI.presentPaywall();
    if (result === PAYWALL_RESULT.PURCHASED || result === PAYWALL_RESULT.RESTORED) {
      await syncEntitlement();
    }
  }

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Stack spacing={5} className="py-4">
          {/* Current plan badge */}
          <Card variant="filled">
            <View className="items-center py-2">
              <View
                className={`px-4 py-1.5 rounded-full mb-2 ${
                  isPro ? 'bg-primary-500' : 'bg-neutral-200 dark:bg-neutral-700'
                }`}
              >
                <Text
                  className={`text-sm font-bold ${isPro ? 'text-white' : 'text-neutral-600 dark:text-neutral-300'}`}
                >
                  {isPro ? '⭐ Pro' : 'Free'}
                </Text>
              </View>
              <Text className="text-sm text-neutral-500 dark:text-neutral-400">
                {isPro ? 'You have access to all Pro features.' : 'Upgrade to unlock everything.'}
              </Text>
            </View>
          </Card>

          {/* Feature comparison */}
          <View>
            <Text className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-3">
              What's included
            </Text>
            <Card variant="outlined">
              {/* Free features */}
              <Text className="text-xs font-semibold text-neutral-500 mb-2">FREE</Text>
              {[
                `Regional pollen index`,
                `Symptom logging (up to ${FREE_LIMITS.MAX_LOG_DAYS} days)`,
                `${FREE_LIMITS.HISTORY_DAYS}-day history`,
              ].map((f) => (
                <View key={f} className="flex-row items-start mb-1.5">
                  <Text className="text-neutral-400 mr-2">–</Text>
                  <Text className="text-sm text-neutral-600 dark:text-neutral-400 flex-1">{f}</Text>
                </View>
              ))}

              <View className="border-t border-neutral-100 dark:border-neutral-700 my-3" />

              {/* Pro features */}
              <Text className="text-xs font-semibold text-primary-500 mb-2">PRO</Text>
              {PRO_FEATURES.map((f) => (
                <View key={f} className="flex-row items-start mb-1.5">
                  <Text className="text-success-600 mr-2">✓</Text>
                  <Text className="text-sm text-neutral-700 dark:text-neutral-300 flex-1">{f}</Text>
                </View>
              ))}
            </Card>
          </View>

          {/* Upgrade CTA (shown only for free users) */}
          {!isPro && (
            <Button label="See Plans" onPress={handleSeePlans} />
          )}

          {/* Current plan — already Pro */}
          {isPro && (
            <View className="items-center py-2">
              <Text className="text-sm text-neutral-500 dark:text-neutral-400">
                Manage your subscription in the App Store / Google Play.
              </Text>
            </View>
          )}
        </Stack>
      </ScrollView>
    </Screen>
  );
}
