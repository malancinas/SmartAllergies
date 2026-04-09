import { useSettingsStore } from '@/stores/persistent/settingsStore';

export function useSettings() {
  const theme = useSettingsStore((s) => s.theme);
  const setTheme = useSettingsStore((s) => s.setTheme);
  const language = useSettingsStore((s) => s.language);
  const setLanguage = useSettingsStore((s) => s.setLanguage);
  const notificationsEnabled = useSettingsStore((s) => s.notificationsEnabled);
  const setNotificationsEnabled = useSettingsStore((s) => s.setNotificationsEnabled);

  function toggleNotifications() {
    setNotificationsEnabled(!notificationsEnabled);
  }

  return { theme, setTheme, language, setLanguage, notificationsEnabled, toggleNotifications, setNotificationsEnabled };
}
