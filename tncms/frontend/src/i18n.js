import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import ta from './locales/ta/translation.json'
import en from './locales/en/translation.json'

i18n.use(initReactI18next).init({
  resources: {
    ta: { translation: ta },
    en: { translation: en },
  },
  lng: localStorage.getItem('lang') || 'ta',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
})

export default i18n
