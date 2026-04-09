import React, { useEffect } from 'react';
import { TouchableOpacity, View, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';

export interface CheckboxProps {
  checked: boolean;
  onToggle: () => void;
  label?: string;
  indeterminate?: boolean;
  disabled?: boolean;
  testID?: string;
}

export function Checkbox({
  checked,
  onToggle,
  label,
  indeterminate = false,
  disabled = false,
  testID,
}: CheckboxProps) {
  const active = checked || indeterminate;
  const scale = useSharedValue(active ? 1 : 0);
  const opacity = useSharedValue(active ? 1 : 0);

  useEffect(() => {
    const target = active ? 1 : 0;
    scale.value = withSpring(target, { damping: 15, stiffness: 250 });
    opacity.value = withSpring(target, { damping: 15, stiffness: 250 });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  const animatedIndicator = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <TouchableOpacity
      onPress={onToggle}
      disabled={disabled}
      className={`flex-row items-center ${disabled ? 'opacity-50' : ''}`}
      testID={testID}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: indeterminate ? 'mixed' : checked }}
    >
      <View
        className={`w-5 h-5 rounded border-2 items-center justify-center mr-3 ${
          active
            ? 'bg-primary-500 border-primary-500'
            : 'bg-white dark:bg-neutral-800 border-neutral-300 dark:border-neutral-600'
        }`}
      >
        <Animated.View style={animatedIndicator}>
          {indeterminate ? (
            <View className="w-2 h-0.5 bg-white rounded" />
          ) : (
            <Text className="text-white text-xs font-bold">✓</Text>
          )}
        </Animated.View>
      </View>
      {label ? (
        <Text className="text-base text-neutral-900 dark:text-white">{label}</Text>
      ) : null}
    </TouchableOpacity>
  );
}
