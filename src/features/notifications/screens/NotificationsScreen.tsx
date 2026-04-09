import React from 'react';
import { View, Text, FlatList, RefreshControl, Pressable } from 'react-native';
import { useNotifications } from '../hooks/useNotifications';
import type { AppNotification } from '../types';

function NotificationItem({
  item,
  onPress,
}: {
  item: AppNotification;
  onPress: (id: string) => void;
}) {
  return (
    <Pressable
      onPress={() => onPress(item.id)}
      className={`px-6 py-4 border-b border-gray-100 dark:border-gray-800 ${
        !item.read ? 'bg-primary-50 dark:bg-primary-900' : 'bg-white dark:bg-gray-900'
      }`}
    >
      <Text className="text-sm font-semibold text-gray-900 dark:text-white">{item.title}</Text>
      <Text className="text-sm text-gray-500 dark:text-gray-400 mt-1">{item.body}</Text>
    </Pressable>
  );
}

function EmptyState() {
  return (
    <View className="flex-1 items-center justify-center py-20">
      <Text className="text-4xl mb-4">🔔</Text>
      <Text className="text-base font-semibold text-gray-700 dark:text-gray-300">
        No notifications yet
      </Text>
      <Text className="text-sm text-gray-400 dark:text-gray-500 mt-1 text-center px-8">
        When you receive notifications, they'll show up here.
      </Text>
    </View>
  );
}

export function NotificationsScreen() {
  const { notifications, markRead, isLoading, refetch } = useNotifications();

  return (
    <FlatList
      className="flex-1 bg-white dark:bg-gray-900"
      data={notifications}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <NotificationItem item={item} onPress={markRead} />}
      ListEmptyComponent={isLoading ? null : EmptyState}
      refreshControl={
        <RefreshControl refreshing={isLoading} onRefresh={refetch} />
      }
    />
  );
}
