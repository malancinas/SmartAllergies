import React from 'react';
import { View, Text } from 'react-native';

export type BadgeVariant = 'dot' | 'count';

export interface BadgeProps {
  count?: number;
  variant?: BadgeVariant;
  color?: string;
  children?: React.ReactNode;
  testID?: string;
}

export function Badge({ count = 0, variant = 'count', color, children, testID }: BadgeProps) {
  const showBadge = variant === 'dot' || count > 0;

  return (
    <View className="relative" testID={testID}>
      {children}
      {showBadge && (
        <View
          className={`absolute -top-1 -right-1 bg-error-500 items-center justify-center rounded-full ${
            variant === 'dot' ? 'w-2.5 h-2.5' : 'min-w-[18px] h-[18px] px-1'
          }`}
          style={color ? { backgroundColor: color } : undefined}
        >
          {variant === 'count' && count > 0 && (
            <Text className="text-white text-[10px] font-bold leading-none">
              {count > 99 ? '99+' : String(count)}
            </Text>
          )}
        </View>
      )}
    </View>
  );
}
