import React from 'react';
import { View, Text, ActivityIndicator, Alert } from 'react-native';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui';
import { useOfferings } from '../hooks/useOfferings';
import { usePurchase } from '../hooks/usePurchase';
import { PRO_FEATURES } from '../types';

interface PaywallSheetProps {
  visible: boolean;
  onClose: () => void;
  featureName: string;
  onUpgraded?: () => void;
}

export function PaywallSheet({ visible, onClose, featureName, onUpgraded }: PaywallSheetProps) {
  const { data: offerings, isLoading: offeringsLoading } = useOfferings();
  const { purchase, restorePurchases, isLoading: purchasing } = usePurchase();

  const monthlyPackage = offerings?.current?.monthly ?? null;

  async function handleUpgrade() {
    if (!monthlyPackage) {
      Alert.alert('Unavailable', 'Could not load subscription options. Please try again.');
      return;
    }
    const success = await purchase(monthlyPackage);
    if (success) {
      onClose();
      onUpgraded?.();
    }
  }

  async function handleRestore() {
    const success = await restorePurchases();
    if (success) {
      onClose();
      onUpgraded?.();
    } else {
      Alert.alert('No purchases found', 'No active Pro subscription was found to restore.');
    }
  }

  return (
    <BottomSheet visible={visible} onClose={onClose} snapPoints={[0.72]}>
      <View className="flex-1">
        {/* Lock icon + header */}
        <View className="items-center mb-4">
          <Text className="text-4xl mb-2">🔒</Text>
          <Text className="text-xl font-bold text-neutral-900 dark:text-white text-center">
            Upgrade to Pro
          </Text>
          <Text className="text-sm text-neutral-500 dark:text-neutral-400 text-center mt-1">
            {featureName} is a Pro feature
          </Text>
        </View>

        {/* Benefits list */}
        <View className="mb-5">
          {PRO_FEATURES.map((f) => (
            <View key={f} className="flex-row items-start mb-2">
              <Text className="text-success-600 mr-2 text-base">✓</Text>
              <Text className="text-sm text-neutral-700 dark:text-neutral-300 flex-1">{f}</Text>
            </View>
          ))}
        </View>

        {/* Price info */}
        {offeringsLoading ? (
          <ActivityIndicator className="mb-4" />
        ) : monthlyPackage ? (
          <Text className="text-center text-sm text-neutral-500 mb-4">
            {monthlyPackage.product.priceString} / month · Cancel anytime
          </Text>
        ) : null}

        {/* CTAs */}
        <Button
          label={purchasing ? 'Processing…' : 'Upgrade to Pro'}
          onPress={handleUpgrade}
          disabled={purchasing || offeringsLoading || !monthlyPackage}
        />
        <Button
          label="Restore purchases"
          variant="ghost"
          onPress={handleRestore}
          disabled={purchasing}
        />
        <Button label="Maybe later" variant="ghost" onPress={onClose} disabled={purchasing} />
      </View>
    </BottomSheet>
  );
}
