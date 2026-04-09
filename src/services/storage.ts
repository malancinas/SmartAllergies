import AsyncStorage from '@react-native-async-storage/async-storage';

export interface StorageInterface {
  get<T>(key: string): Promise<T | null>;
  set(key: string, value: unknown): Promise<void>;
  remove(key: string): Promise<void>;
  clear(): Promise<void>;
}

export const Storage: StorageInterface = {
  async get<T>(key: string): Promise<T | null> {
    try {
      const raw = await AsyncStorage.getItem(key);
      if (raw === null || raw === undefined) return null;
      try {
        return JSON.parse(raw) as T;
      } catch {
        return raw as unknown as T;
      }
    } catch {
      return null;
    }
  },

  async set(key: string, value: unknown): Promise<void> {
    await AsyncStorage.setItem(
      key,
      typeof value === 'string' ? value : JSON.stringify(value),
    ).catch(() => {});
  },

  async remove(key: string): Promise<void> {
    await AsyncStorage.removeItem(key).catch(() => {});
  },

  async clear(): Promise<void> {
    await AsyncStorage.clear().catch(() => {});
  },
};
