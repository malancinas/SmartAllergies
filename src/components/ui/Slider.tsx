import React from 'react';
import { View } from 'react-native';
import RNSlider from '@react-native-community/slider';
import { colors } from '@/theme/tokens';

export interface SliderProps {
  min: number;
  max: number;
  value: number;
  onChange: (value: number) => void;
  step?: number;
  disabled?: boolean;
  testID?: string;
}

export function Slider({
  min,
  max,
  value,
  onChange,
  step = 1,
  disabled = false,
  testID,
}: SliderProps) {
  return (
    <View testID={testID}>
      <RNSlider
        minimumValue={min}
        maximumValue={max}
        value={value}
        step={step}
        onValueChange={onChange}
        disabled={disabled}
        minimumTrackTintColor={colors.primary[500]}
        maximumTrackTintColor={colors.neutral[300]}
        thumbTintColor={colors.primary[500]}
      />
    </View>
  );
}
