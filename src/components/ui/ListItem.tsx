import React from 'react';
import { TouchableOpacity, View, Text } from 'react-native';

export interface ListItemProps {
  title: string;
  subtitle?: string;
  leftElement?: React.ReactNode;
  rightElement?: React.ReactNode;
  onPress?: () => void;
  divider?: boolean;
  testID?: string;
}

export function ListItem({
  title,
  subtitle,
  leftElement,
  rightElement,
  onPress,
  divider = true,
  testID,
}: ListItemProps) {
  const Container = onPress ? TouchableOpacity : View;

  return (
    <Container
      onPress={onPress}
      className={`flex-row items-center py-3 ${divider ? 'border-b border-neutral-100 dark:border-neutral-800' : ''}`}
      testID={testID}
    >
      {leftElement ? <View className="mr-3">{leftElement}</View> : null}

      <View className="flex-1">
        <Text className="text-base text-neutral-900 dark:text-white">{title}</Text>
        {subtitle ? (
          <Text className="text-sm text-neutral-500 mt-0.5">{subtitle}</Text>
        ) : null}
      </View>

      {rightElement ? <View className="ml-3">{rightElement}</View> : null}
    </Container>
  );
}
