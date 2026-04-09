import React from 'react';
import { View, Modal } from 'react-native';
import { useUIStore } from '@/stores/session/uiStore';
import { Spinner } from './Spinner';

export function Loader() {
  const isLoading = useUIStore((s) => s.isLoading);

  return (
    <Modal visible={isLoading} transparent animationType="none">
      <View className="flex-1 bg-black/40 items-center justify-center">
        <View className="bg-white dark:bg-neutral-800 rounded-2xl p-6 shadow-xl">
          <Spinner size="lg" />
        </View>
      </View>
    </Modal>
  );
}
