import React from 'react';
import { ActivityIndicator } from 'react-native';
import { colors } from '@/theme/tokens';

export interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  testID?: string;
}

const sizeMap = {
  sm: 'small' as const,
  md: 'large' as const,
  lg: 'large' as const,
};

export function Spinner({ size = 'md', color = colors.primary[500], testID }: SpinnerProps) {
  return (
    <ActivityIndicator
      size={sizeMap[size]}
      color={color}
      testID={testID}
    />
  );
}
