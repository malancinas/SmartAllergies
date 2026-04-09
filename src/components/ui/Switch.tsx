import React from 'react';
import { View, Text, Switch as RNSwitch } from 'react-native';

export interface SwitchProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  label?: string;
  disabled?: boolean;
  testID?: string;
}

export function Switch({ value, onValueChange, label, disabled = false, testID }: SwitchProps) {
  return (
    <View className="flex-row items-center justify-between" testID={testID}>
      {label ? (
        <Text className="text-base text-neutral-900 dark:text-white flex-1 mr-3">{label}</Text>
      ) : null}
      <RNSwitch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        trackColor={{ false: '#d1d5db', true: '#3b82f6' }}
        thumbColor="#ffffff"
      />
    </View>
  );
}
