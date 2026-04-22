import React from 'react';
import { View, Text, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { Screen, Stack } from '@/components/layout';
import { Button, Card } from '@/components/ui';
import { useSubscription } from '../hooks/useSubscription';
import { useOfferings } from '../hooks/useOfferings';
import { usePurchase } from '../hooks/usePurchase';
import { PRO_FEATURES, FREE_LIMITS } from '../types';

export default function SubscriptionScreen() {
  const { tier, isPro } = useSubscription();
  const { data: offerings, isLoading: offeringsLoading } = useOfferings();
  const { purchase, restorePurchases, isLoading: purchasing } = usePurchase();

  const monthlyPackage = offerings?.current?.monthly ?? null;

  async function handleUpgrade() {
    if (!monthlyPackage) {
      Alert.alert('Unavailable', 'Could not load subscription options. Please try again.');
      return;
    }
    const success = await purchase(monthlyPackage);
    if (!success) {
      Alert.alert('Purchase cancelled', 'Your subscription was not activated.');
    }
  }

  async function handleRestore() {
    const success = await restorePurchases();
    if (!success) {
      Alert.alert('No purchases found', 'No active Pro subscription was found to restore.');
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
                `Symptom logging (up to ${FREE_LIMITS.MAX_SYMPTOM_LOGS} entries)`,
                `${FREE_LIMITS.HISTORY_DAYS}-day history`,
                `Community signal (read-only)`,
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
            <View>
              {offeringsLoading ? (
                <ActivityIndicator />
              ) : monthlyPackage ? (
                <Text className="text-center text-sm text-neutral-500 mb-3">
                  {monthlyPackage.product.priceString} / month · Cancel anytime
                </Text>
              ) : null}

              <Button
                label={purchasing ? 'Processing…' : 'Upgrade to Pro'}
                onPress={handleUpgrade}
                disabled={purchasing || offeringsLoading || !monthlyPackage}
              />
              <View className="mt-2">
                <Button
                  label="Restore purchases"
                  variant="ghost"
                  onPress={handleRestore}
                  disabled={purchasing}
                />
              </View>
            </View>
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
