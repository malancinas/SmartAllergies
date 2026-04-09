import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  runOnJS,
} from 'react-native-reanimated';
import { useModalStore } from '@/stores/session/modalStore';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastOptions {
  message: string;
  type?: ToastType;
  duration?: number;
}

const TOAST_MODAL_KEY = '__toast__';

// Imperative API
const Toast = {
  show(options: ToastOptions) {
    useModalStore.getState().openModal(TOAST_MODAL_KEY, options as Record<string, unknown>);
  },
};

export { Toast };

const typeClasses: Record<ToastType, string> = {
  success: 'bg-success-500',
  error: 'bg-error-500',
  warning: 'bg-warning-500',
  info: 'bg-primary-500',
};

export function ToastContainer() {
  const { activeModal, modalProps, closeModal } = useModalStore();
  const isVisible = activeModal === TOAST_MODAL_KEY;

  const opacity = useSharedValue(0);

  function hide() {
    closeModal();
  }

  useEffect(() => {
    if (isVisible) {
      const duration = (modalProps.duration as number) ?? 3000;
      opacity.value = withSequence(
        withTiming(1, { duration: 200 }),
        withTiming(1, { duration }),
        withTiming(0, { duration: 200 }, (finished) => {
          if (finished) runOnJS(hide)();
        }),
      );
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVisible]);

  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  if (!isVisible) return null;

  const type = (modalProps.type as ToastType) ?? 'info';
  const message = (modalProps.message as string) ?? '';

  return (
    <Animated.View
      style={[{ position: 'absolute', top: 60, left: 16, right: 16, zIndex: 999 }, animStyle]}
    >
      <View className={`${typeClasses[type]} px-4 py-3 rounded-xl shadow-lg`}>
        <Text className="text-white font-medium">{message}</Text>
      </View>
    </Animated.View>
  );
}
