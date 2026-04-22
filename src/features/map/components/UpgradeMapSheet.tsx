import React from 'react';
import { View, Text } from 'react-native';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui';

interface Props {
  visible: boolean;
  onClose: () => void;
  onUpgrade: () => void;
}

export function UpgradeMapSheet({ visible, onClose, onUpgrade }: Props) {
  return (
    <BottomSheet visible={visible} onClose={onClose} snapPoints={[0.42]}>
      <View className="flex-1 items-center justify-center px-2">
        <Text style={{ fontSize: 36, marginBottom: 10 }}>🗺️</Text>
        <Text className="text-lg font-bold text-neutral-900 dark:text-white text-center mb-2">
          Explore Anywhere with Pro
        </Text>
        <Text className="text-sm text-neutral-500 dark:text-neutral-400 text-center mb-6">
          Tap any point on the map to see live hyperlocal pollen levels — tree, grass and weed — at
          1 km resolution.
        </Text>
        <Button label="Unlock Pro" onPress={onUpgrade} />
        <Button label="Maybe later" variant="ghost" onPress={onClose} />
      </View>
    </BottomSheet>
  );
}
