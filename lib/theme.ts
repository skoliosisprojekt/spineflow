import { useColorScheme } from 'react-native';
import { useSettingsStore } from '../stores/settingsStore';

export const lightTheme = {
  bg: '#F2F2F7', card: '#FFFFFF', text: '#1C1C1E', text2: '#3C3C43',
  text3: '#8E8E93', text4: '#AEAEB2', sep: '#E5E5EA', sepLight: '#F0F0F5',
  accent: '#00B894', accentLight: '#E8FAF5', accentDark: '#009B7D',
  orange: '#FF9500', orangeLight: '#FFF3E0', red: '#FF3B30', redLight: '#FFF0EF',
  blue: '#007AFF', purple: '#AF52DE',
};

export const darkTheme = {
  bg: '#000000', card: '#1C1C1E', text: '#FFFFFF', text2: '#EBEBF5',
  text3: '#8E8E93', text4: '#636366', sep: '#38383A', sepLight: '#2C2C2E',
  accent: '#00D9A6', accentLight: '#0D3D30', accentDark: '#00FFBF',
  orange: '#FF9F0A', orangeLight: '#3D2E00', red: '#FF453A', redLight: '#3D1512',
  blue: '#0A84FF', purple: '#BF5AF2',
};

export type ThemeColors = typeof lightTheme;

export function useIsDark(): boolean {
  const systemScheme = useColorScheme();
  const theme = useSettingsStore((s) => s.theme);
  return theme === 'dark' || (theme === 'system' && systemScheme === 'dark');
}

export function useTheme(): ThemeColors {
  return useIsDark() ? darkTheme : lightTheme;
}
