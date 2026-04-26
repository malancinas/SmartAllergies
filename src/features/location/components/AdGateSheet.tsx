import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { BottomSheet } from '@/components/ui/BottomSheet';

interface Props {
  visible: boolean;
  onClose: () => void;
  /** Called when the ad has been "watched" and user may proceed */
  onAdComplete: () => void;
}

// TODO: Replace simulateAd with your actual ad SDK call (e.g. AdMob rewarded ad).
// Call onAdComplete once the rewarded ad finishes or is dismissed after completion.
async function simulateAd(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

export function AdGateSheet({ visible, onClose, onAdComplete }: Props) {
  const [watching, setWatching] = useState(false);
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    if (!watching) return;
    if (countdown === 0) {
      setWatching(false);
      setCountdown(5);
      onAdComplete();
      return;
    }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [watching, countdown, onAdComplete]);

  function handleWatch() {
    setWatching(true);
    simulateAd();
  }

  function handleClose() {
    setWatching(false);
    setCountdown(5);
    onClose();
  }

  return (
    <BottomSheet visible={visible} onClose={handleClose} snapPoints={[0.4]}>
      <View className="flex-1 items-center justify-center gap-4">
        <Text style={{ fontSize: 40 }}>📺</Text>

        <View className="items-center gap-1">
          <Text className="text-lg font-bold text-neutral-900 dark:text-white text-center">
            Change location
          </Text>
          <Text className="text-sm text-neutral-500 dark:text-neutral-400 text-center">
            Watch a short ad to unlock location search.{'\n'}
            Upgrade to Pro to skip ads entirely.
          </Text>
        </View>

        {watching ? (
          <View className="items-center gap-2">
            <View
              className="w-16 h-16 rounded-full bg-neutral-100 dark:bg-neutral-700 items-center justify-center"
            >
              <Text className="text-2xl font-bold text-neutral-800 dark:text-white">{countdown}</Text>
            </View>
            <Text className="text-xs text-neutral-400">Ad playing…</Text>
          </View>
        ) : (
          <TouchableOpacity
            onPress={handleWatch}
            activeOpacity={0.85}
            className="bg-indigo-600 rounded-xl px-8 py-3"
          >
            <Text className="text-white font-semibold text-sm">Watch Ad</Text>
          </TouchableOpacity>
        )}
      </View>
    </BottomSheet>
  );
}
