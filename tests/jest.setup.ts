import '@testing-library/react-native';

// Mock react-native-mmkv
jest.mock('react-native-mmkv', () => {
  const storage: Record<string, string> = {};
  return {
    MMKV: jest.fn().mockImplementation(() => ({
      getString: (key: string) => storage[key],
      set: (key: string, value: string) => {
        storage[key] = value;
      },
      delete: (key: string) => {
        delete storage[key];
      },
      clearAll: () => {
        Object.keys(storage).forEach((k) => delete storage[k]);
      },
    })),
  };
});

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

// Mock expo-notifications
jest.mock('expo-notifications', () => ({
  requestPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  scheduleNotificationAsync: jest.fn().mockResolvedValue('mock-notification-id'),
  cancelAllScheduledNotificationsAsync: jest.fn().mockResolvedValue(undefined),
}));

// Mock @react-native-google-signin/google-signin
jest.mock('@react-native-google-signin/google-signin', () => ({
  GoogleSignin: {
    hasPlayServices: jest.fn().mockResolvedValue(true),
    signIn: jest.fn().mockResolvedValue({ data: { idToken: 'mock-id-token' } }),
    configure: jest.fn(),
    isSignedIn: jest.fn().mockReturnValue(false),
    signOut: jest.fn().mockResolvedValue(undefined),
  },
}));

// Mock expo-apple-authentication
jest.mock('expo-apple-authentication', () => ({
  signInAsync: jest.fn().mockResolvedValue({ identityToken: 'mock-identity-token' }),
  AppleAuthenticationScope: {
    FULL_NAME: 0,
    EMAIL: 1,
  },
  isAvailableAsync: jest.fn().mockResolvedValue(true),
}));

// Mock react-native-reanimated
require('react-native-reanimated/mock');
