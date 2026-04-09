import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Pressable, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useProfile } from '../hooks/useProfile';
import { useUpdateProfileMutation } from '../api';

export function EditProfileScreen() {
  const navigation = useNavigation();
  const { profile } = useProfile();
  const updateProfileMutation = useUpdateProfileMutation();

  const [name, setName] = useState(profile?.name ?? '');
  const [bio, setBio] = useState(profile?.bio ?? '');

  useEffect(() => {
    if (profile) {
      setName(profile.name);
      setBio(profile.bio ?? '');
    }
  }, [profile]);

  function handleSave() {
    updateProfileMutation.mutate(
      { name, bio },
      {
        onSuccess: () => navigation.goBack(),
      },
    );
  }

  return (
    <ScrollView className="flex-1 bg-white dark:bg-gray-900">
      <View className="px-6 pt-6 gap-4">
        <Text className="text-sm font-medium text-gray-700 dark:text-gray-300">Name</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Your name"
          className="border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 text-gray-900 dark:text-white"
          placeholderTextColor="#9ca3af"
        />

        <Text className="text-sm font-medium text-gray-700 dark:text-gray-300">Bio</Text>
        <TextInput
          value={bio}
          onChangeText={setBio}
          placeholder="Tell us about yourself"
          multiline
          numberOfLines={4}
          className="border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 text-gray-900 dark:text-white"
          placeholderTextColor="#9ca3af"
          textAlignVertical="top"
        />

        <Pressable
          onPress={handleSave}
          disabled={updateProfileMutation.isPending}
          className="mt-4 py-3 rounded-xl bg-primary-500 items-center disabled:opacity-60"
        >
          <Text className="text-white font-medium">
            {updateProfileMutation.isPending ? 'Saving…' : 'Save'}
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
