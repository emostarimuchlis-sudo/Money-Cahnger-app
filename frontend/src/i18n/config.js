import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import id from './locales/id.json';
import en from './locales/en.json';
import zh from './locales/zh.json';

const resources = {
  id: { translation: id },
  en: { translation: en },
  zh: { translation: zh }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: localStorage.getItem('language') || 'id',
    fallbackLng: 'id',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;