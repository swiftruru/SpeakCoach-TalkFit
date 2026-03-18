import { useEffect } from 'react'
import i18n, { normalizeLanguage } from './index'
import { useSettingsStore } from '../stores/settingsStore'
import { useHistoryStore } from '../stores/historyStore'
import { useReportStore } from '../stores/reportStore'
import { localizeFillerWords } from '../lib/fillerWords'
import { getMockSessions } from '../lib/mockData'

function areFillerWordsEqual(
  current: ReturnType<typeof useSettingsStore.getState>['fillerWords'],
  next: ReturnType<typeof useSettingsStore.getState>['fillerWords']
) {
  if (current.length !== next.length) return false

  return current.every((item, index) => {
    const nextItem = next[index]
    return (
      item.word === nextItem.word &&
      item.enabled === nextItem.enabled &&
      item.category === nextItem.category &&
      item.builtinId === nextItem.builtinId
    )
  })
}

export function LanguageSync() {
  useEffect(() => {
    const syncLanguage = (language: string) => {
      const nextLanguage = normalizeLanguage(language)

      const currentSettings = useSettingsStore.getState()
      const localizedFillerWords = localizeFillerWords(currentSettings.fillerWords, nextLanguage)

      if (
        currentSettings.language !== nextLanguage ||
        !areFillerWordsEqual(currentSettings.fillerWords, localizedFillerWords)
      ) {
        useSettingsStore.setState({
          language: nextLanguage,
          fillerWords: localizedFillerWords,
        })
      }

      document.documentElement.lang = nextLanguage

      const currentSessions = useHistoryStore.getState().sessions
      const currentReport = useReportStore.getState().report
      const sessionsAreMock =
        currentSessions.length > 0 && currentSessions.every((session) => session.id.startsWith('mock-'))
      const reportIsMock = Boolean(currentReport?.id.startsWith('mock-'))

      if (sessionsAreMock || reportIsMock) {
        const localizedMockSessions = getMockSessions()

        if (sessionsAreMock) {
          useHistoryStore.setState({ sessions: localizedMockSessions })
        }

        if (reportIsMock) {
          const nextReport =
            localizedMockSessions.find((session) => session.id === currentReport?.id)
            ?? localizedMockSessions[0]

          if (nextReport) {
            useReportStore.getState().setReport(nextReport)
          }
        }
      }
    }

    syncLanguage(i18n.resolvedLanguage ?? i18n.language)
    i18n.on('languageChanged', syncLanguage)

    return () => {
      i18n.off('languageChanged', syncLanguage)
    }
  }, [])

  return null
}
