import { useSettingsStore } from '../../storage/settingsStorage';
import { getTheme, Theme } from '../theme';

/**
 * Hook that returns the current theme based on user settings.
 */
export function useTheme(): Theme {
  const themeName = useSettingsStore((state) => state.theme);
  return getTheme(themeName);
}
