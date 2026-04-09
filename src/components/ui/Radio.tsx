import React from 'react';
import { TouchableOpacity, View, Text } from 'react-native';

export interface RadioOption {
  value: string;
  label: string;
}

export interface RadioProps {
  options: RadioOption[];
  selected: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  testID?: string;
}

export function Radio({ options, selected, onChange, disabled = false, testID }: RadioProps) {
  return (
    <View testID={testID}>
      {options.map((option) => {
        const isSelected = option.value === selected;
        return (
          <TouchableOpacity
            key={option.value}
            onPress={() => onChange(option.value)}
            disabled={disabled}
            className={`flex-row items-center py-2 ${disabled ? 'opacity-50' : ''}`}
            accessibilityRole="radio"
            accessibilityState={{ selected: isSelected }}
          >
            <View
              className={`w-5 h-5 rounded-full border-2 items-center justify-center mr-3 ${
                isSelected ? 'border-primary-500' : 'border-neutral-300 dark:border-neutral-600'
              }`}
            >
              {isSelected && <View className="w-2.5 h-2.5 rounded-full bg-primary-500" />}
            </View>
            <Text className="text-base text-neutral-900 dark:text-white">{option.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
