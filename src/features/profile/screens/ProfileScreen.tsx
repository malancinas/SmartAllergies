import React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useProfile } from '../hooks/useProfile';
import { useUploadAvatarMutation } from '../api';
import { AvatarUploader } from '../components/AvatarUploader';
import { useAuthStore } from '@/stores/persistent/authStore';
import type { ProfileStackParamList } from '@/types';

type ProfileNav = NativeStackNavigationProp<ProfileStackParamList>;

export function ProfileScreen() {
  const navigation = useNavigation<ProfileNav>();
  const { profile, isLoading } = useProfile();
  const uploadAvatarMutation = useUploadAvatarMutation();
  const clearAuth = useAuthStore((s) => s.clearAuth);

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white dark:bg-gray-900">
        <Text className="text-gray-500 dark:text-gray-400">Loading…</Text>
      </View>
    );
  }

  if (!profile) {
    return (
      <View className="flex-1 items-center justify-center bg-white dark:bg-gray-900 gap-4 px-6">
        <Text className="text-gray-500 dark:text-gray-400 text-center">
          Unable to load profile.
        </Text>
        <Pressable
          onPress={() => clearAuth()}
          className="py-3 px-6 rounded-xl border border-red-400 items-center"
        >
          <Text className="text-red-500 font-medium">Sign Out</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-white dark:bg-gray-900">
      <View className="items-center px-6 pt-8 pb-6 gap-4">
        <AvatarUploader
          uri={profile.avatarUrl}
          onUpload={(formData) => uploadAvatarMutation.mutate(formData)}
          isLoading={uploadAvatarMutation.isPending}
        />

        <Text className="text-xl font-semibold text-gray-900 dark:text-white">{profile.name}</Text>
        <Text className="text-sm text-gray-500 dark:text-gray-400">{profile.email}</Text>

        <Pressable
          onPress={() => navigation.navigate('EditProfile')}
          className="w-full mt-4 py-3 rounded-xl bg-primary-500 items-center"
        >
          <Text className="text-white font-medium">Edit Profile</Text>
        </Pressable>

        <Pressable
          onPress={() => clearAuth()}
          className="w-full py-3 rounded-xl border border-red-400 items-center"
        >
          <Text className="text-red-500 font-medium">Sign Out</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
