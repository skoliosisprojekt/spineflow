import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';
import en from './en.json';
import de from './de.json';

const resources = {
  en: { translation: en },
  de: { translation: de },
};

export const SUPPORTED_LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'de', label: 'Deutsch' },
];

// Get device locale, fallback to 'en'
const getDeviceLocale = (): string => {
  try {
    const locales = getLocales();
    const lang = locales[0]?.languageCode || 'en';
    // Only return supported languages
    return resources[lang as keyof typeof resources] ? lang : 'en';
  } catch {
    return 'en';
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: getDeviceLocale(),
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

// Load saved language preference (call on app start)
export async function loadSavedLanguage() {
  try {
    const saved = await AsyncStorage.getItem('language');
    if (saved && resources[saved as keyof typeof resources]) {
      await i18n.changeLanguage(saved);
    }
  } catch {}
}

// Change language and persist
export async function setAppLanguage(lang: string) {
  await i18n.changeLanguage(lang);
  await AsyncStorage.setItem('language', lang);
}

export default i18n;
