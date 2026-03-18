export const SUPPORTED_LANGUAGES = ['zh-TW', 'en'] as const

export type AppLanguage = (typeof SUPPORTED_LANGUAGES)[number]

export const DEFAULT_LANGUAGE: AppLanguage = 'zh-TW'

export const LANGUAGE_OPTIONS: Array<{ code: AppLanguage; shortLabel: string }> = [
  { code: 'zh-TW', shortLabel: '中文' },
  { code: 'en', shortLabel: 'EN' },
]

export function normalizeLanguage(language?: string | null): AppLanguage {
  if (!language) return DEFAULT_LANGUAGE
  return language.toLowerCase().startsWith('en') ? 'en' : 'zh-TW'
}
