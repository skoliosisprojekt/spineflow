import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import en from './en.json';
import de from './de.json';

const resources = {
  en: { translation: en },
  de: { translation: de },
};

// Get device locale, fallback to 'en'
const getDeviceLocale = () => {
  try {
    const locale = Localization.locale || 'en';
    return locale.split('-')[0];
  } catch (error) {
    console.warn('Error getting device locale:', error);
    return 'en';
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: getDeviceLocale(), // Auto-detect device language
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
