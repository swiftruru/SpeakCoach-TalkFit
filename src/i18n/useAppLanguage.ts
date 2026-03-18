import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { normalizeLanguage, type AppLanguage } from './config'

export function useAppLanguage() {
  const { i18n } = useTranslation()
  const currentLanguage = normalizeLanguage(i18n.resolvedLanguage ?? i18n.language)

  const setLanguage = useCallback(
    (language: AppLanguage) => {
      void i18n.changeLanguage(language)
    },
    [i18n]
  )

  return {
    currentLanguage,
    setLanguage,
  }
}
