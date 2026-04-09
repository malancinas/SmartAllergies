import React from 'react';
import { Text, View } from 'react-native';
import { Screen, Stack } from '@/components/layout';
import { useAuth } from '@/features/auth/hooks/useAuth';

export default function HomeScreen() {
  const { user } = useAuth();

  return (
    <Screen>
      <Stack spacing={4}>
        <View className="pt-4">
          <Text className="text-2xl font-bold text-neutral-900 dark:text-white">
            Hello, {user?.name ?? 'there'} 👋
          </Text>
          <Text className="text-base text-neutral-500 mt-1">Welcome to App Template</Text>
        </View>
      </Stack>
    </Screen>
  );
}
