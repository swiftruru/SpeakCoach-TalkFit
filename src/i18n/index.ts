import i18n from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import { initReactI18next } from 'react-i18next'
import { DEFAULT_LANGUAGE, normalizeLanguage, SUPPORTED_LANGUAGES } from './config'
import zhAnnotation from './locales/zh-TW/annotation.json'
import zhApp from './locales/zh-TW/app.json'
import zhCapture from './locales/zh-TW/capture.json'
import zhCommandPalette from './locales/zh-TW/commandPalette.json'
import zhCommon from './locales/zh-TW/common.json'
import zhDesign from './locales/zh-TW/design.json'
import zhDemo from './locales/zh-TW/demo.json'
import zhHistory from './locales/zh-TW/history.json'
import zhHome from './locales/zh-TW/home.json'
import zhGuidedTour from './locales/zh-TW/guidedTour.json'
import zhLaunch from './locales/zh-TW/launch.json'
import zhNavigator from './locales/zh-TW/navigator.json'
import zhPractice from './locales/zh-TW/practice.json'
import zhReport from './locales/zh-TW/report.json'
import zhSettings from './locales/zh-TW/settings.json'
import zhShortcuts from './locales/zh-TW/shortcuts.json'
import enAnnotation from './locales/en/annotation.json'
import enApp from './locales/en/app.json'
import enCapture from './locales/en/capture.json'
import enCommandPalette from './locales/en/commandPalette.json'
import enCommon from './locales/en/common.json'
import enDesign from './locales/en/design.json'
import enDemo from './locales/en/demo.json'
import enHistory from './locales/en/history.json'
import enHome from './locales/en/home.json'
import enGuidedTour from './locales/en/guidedTour.json'
import enLaunch from './locales/en/launch.json'
import enNavigator from './locales/en/navigator.json'
import enPractice from './locales/en/practice.json'
import enReport from './locales/en/report.json'
import enSettings from './locales/en/settings.json'
import enShortcuts from './locales/en/shortcuts.json'

function readPersistedSettingsLanguage() {
  if (typeof window === 'undefined') return undefined

  try {
    const raw = window.localStorage.getItem('talkfit-settings')
    if (!raw) return undefined

    const parsed = JSON.parse(raw) as { state?: { language?: string } }
    return parsed.state?.language ? normalizeLanguage(parsed.state.language) : undefined
  } catch {
    return undefined
  }
}

const zhResources = {
  common: zhCommon,
  app: zhApp,
  navigator: zhNavigator,
  annotation: zhAnnotation,
  capture: zhCapture,
  commandPalette: zhCommandPalette,
  shortcuts: zhShortcuts,
  launch: zhLaunch,
  home: zhHome,
  guidedTour: zhGuidedTour,
  demo: zhDemo,
  history: zhHistory,
  practice: zhPractice,
  report: zhReport,
  settings: zhSettings,
  design: zhDesign,
} as const

const enResources = {
  common: enCommon,
  app: enApp,
  navigator: enNavigator,
  annotation: enAnnotation,
  capture: enCapture,
  commandPalette: enCommandPalette,
  shortcuts: enShortcuts,
  launch: enLaunch,
  home: enHome,
  guidedTour: enGuidedTour,
  demo: enDemo,
  history: enHistory,
  practice: enPractice,
  report: enReport,
  settings: enSettings,
  design: enDesign,
} as const

const resources = {
  'zh-TW': zhResources,
  'zh-tw': zhResources,
  zh: zhResources,
  en: enResources,
} as const

const persistedLanguage = readPersistedSettingsLanguage()

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    ...(persistedLanguage ? { lng: persistedLanguage } : {}),
    fallbackLng: DEFAULT_LANGUAGE,
    supportedLngs: [...SUPPORTED_LANGUAGES, 'zh', 'zh-tw'],
    nonExplicitSupportedLngs: true,
    defaultNS: 'common',
    ns: [
      'common',
      'app',
      'navigator',
      'annotation',
      'capture',
      'commandPalette',
      'shortcuts',
      'launch',
      'home',
      'guidedTour',
      'demo',
      'history',
      'practice',
      'report',
      'settings',
      'design',
    ],
    detection: {
      order: ['querystring', 'localStorage', 'navigator'],
      lookupQuerystring: 'lang',
      lookupLocalStorage: 'talkfit-language',
      caches: ['localStorage'],
      convertDetectedLanguage: (language: string) => normalizeLanguage(language),
    },
    interpolation: {
      escapeValue: false,
    },
    returnNull: false,
  })
  .then(() => {
    const detectedLanguage = i18n.resolvedLanguage ?? i18n.language
    const normalizedLanguage = normalizeLanguage(detectedLanguage)

    if (detectedLanguage !== normalizedLanguage) {
      return i18n.changeLanguage(normalizedLanguage)
    }

    return undefined
  })

export { normalizeLanguage }
export default i18n
