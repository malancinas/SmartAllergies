import React from 'react';
import { View, TouchableOpacity, ViewStyle } from 'react-native';

export type CardVariant = 'elevated' | 'outlined' | 'filled';

export interface CardProps {
  children: React.ReactNode;
  variant?: CardVariant;
  onPress?: () => void;
  style?: ViewStyle;
  testID?: string;
}

const variantClasses: Record<CardVariant, string> = {
  elevated: 'bg-white dark:bg-neutral-800 shadow shadow-neutral-200 dark:shadow-neutral-900 rounded-xl',
  outlined: 'bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl',
  filled: 'bg-neutral-50 dark:bg-neutral-800 rounded-xl',
};

export function Card({ children, variant = 'elevated', onPress, style, testID }: CardProps) {
  const className = `p-4 ${variantClasses[variant]}`;

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} className={className} style={style} testID={testID}>
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View className={className} style={style} testID={testID}>
      {children}
    </View>
  );
}
