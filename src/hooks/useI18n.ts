import { useTranslation } from 'react-i18next';

type Namespace = 'common' | 'auth' | 'profile' | 'settings' | 'notifications';

export function useI18n(ns?: Namespace) {
  const { t, i18n } = useTranslation(ns);
  return { t, i18n };
}
