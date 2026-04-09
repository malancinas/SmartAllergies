import { useColorScheme as useRNColorScheme } from 'react-native';
import { useSettingsStore } from '@/stores/persistent/settingsStore';

export function useColorScheme(): 'light' | 'dark' | null | undefined {
  const theme = useSettingsStore((s) => s.theme);
  const systemScheme = useRNColorScheme();

  if (theme === 'system') {
    return systemScheme;
  }

  return theme;
}
