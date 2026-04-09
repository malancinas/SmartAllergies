import React from 'react';
import { View, Pressable, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Avatar } from '@/components/ui/Avatar';

interface AvatarUploaderProps {
  uri?: string;
  onUpload: (formData: FormData) => void;
  isLoading?: boolean;
}

export function AvatarUploader({ uri, onUpload, isLoading = false }: AvatarUploaderProps) {
  async function handlePress() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const formData = new FormData();
      formData.append('avatar', {
        uri: asset.uri,
        type: asset.mimeType ?? 'image/jpeg',
        name: asset.fileName ?? 'avatar.jpg',
      } as unknown as Blob);
      onUpload(formData);
    }
  }

  return (
    <Pressable onPress={handlePress} disabled={isLoading} className="relative self-center">
      <Avatar uri={uri} size="xl" />
      {isLoading && (
        <View className="absolute inset-0 items-center justify-center bg-black/30 rounded-full">
          <ActivityIndicator color="white" />
        </View>
      )}
      <View className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary-500 items-center justify-center">
        <View className="w-4 h-4 bg-white rounded-sm" />
      </View>
    </Pressable>
  );
}
