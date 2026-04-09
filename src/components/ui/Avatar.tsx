import React from 'react';
import { View, Text, Image } from 'react-native';

export type AvatarSize = 'sm' | 'md' | 'lg' | 'xl';

export interface AvatarProps {
  uri?: string;
  name?: string;
  size?: AvatarSize;
  badge?: boolean;
  testID?: string;
}

const sizeMap: Record<AvatarSize, { container: number; text: number }> = {
  sm: { container: 32, text: 14 },
  md: { container: 40, text: 16 },
  lg: { container: 56, text: 20 },
  xl: { container: 80, text: 28 },
};

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function Avatar({ uri, name, size = 'md', badge = false, testID }: AvatarProps) {
  const dim = sizeMap[size];

  return (
    <View style={{ width: dim.container, height: dim.container }} testID={testID}>
      {uri ? (
        <Image
          source={{ uri }}
          style={{ width: dim.container, height: dim.container, borderRadius: dim.container / 2 }}
        />
      ) : (
        <View
          className="bg-primary-100 dark:bg-primary-900 items-center justify-center"
          style={{ width: dim.container, height: dim.container, borderRadius: dim.container / 2 }}
        >
          <Text
            className="text-primary-700 dark:text-primary-300 font-semibold"
            style={{ fontSize: dim.text }}
          >
            {name ? getInitials(name) : '?'}
          </Text>
        </View>
      )}

      {badge && (
        <View
          className="absolute bottom-0 right-0 w-3 h-3 bg-success-500 border-2 border-white dark:border-neutral-900 rounded-full"
        />
      )}
    </View>
  );
}
