import { getDefaultFillerWords } from './fillerWords'
import { getMockSessions } from './mockData'
import { DEFAULT_PRACTICE_GOAL_ID } from './practiceGoals'
import { DEFAULT_LANGUAGE } from '../i18n/config'
import {
  applyPresetToFillerWords,
  DEFAULT_PRACTICE_PRESET_ID,
  PRACTICE_PRESETS,
} from './practicePresets'
import { useDemoStore } from '../demo/demoStore'
import { useNavigationStore } from '../stores/navigationStore'
import { usePhoneNotificationStore } from '../stores/phoneNotificationStore'
import { useHistoryStore } from '../stores/historyStore'
import { useReportStore } from '../stores/reportStore'
import { useRetryPracticeStore } from '../stores/retryPracticeStore'
import { useSessionStore } from '../stores/sessionStore'
import { useSettingsStore } from '../stores/settingsStore'
import { useAnnotationGuideStore } from '../stores/annotationGuideStore'
import type { Screen } from '../types'

export function seedPrototypeData() {
  const mockSessions = getMockSessions()
  useHistoryStore.setState({ sessions: mockSessions })
  useReportStore.getState().setReport(mockSessions[0])
}

export function ensurePrototypeDataForScreen(screen: Screen) {
  const sessions = useHistoryStore.getState().sessions
  const report = useReportStore.getState().report

  if (screen === 'report') {
    if (report) return
    if (sessions.length > 0) {
      useReportStore.getState().setReport(sessions[0])
      return
    }
    seedPrototypeData()
    return
  }

  if (screen === 'history' && sessions.length === 0) {
    seedPrototypeData()
  }
}

export function resetPrototypeState() {
  const preservedLanguage = useSettingsStore.getState().language ?? DEFAULT_LANGUAGE

  useDemoStore.getState().stopDemo()
  useSessionStore.getState().reset()
  useRetryPracticeStore.getState().clearRetryPractice()
  useAnnotationGuideStore.getState().clear()
  usePhoneNotificationStore.getState().dismiss()
  useHistoryStore.setState({ sessions: [] })
  useReportStore.getState().clearReport()

  useSettingsStore.setState({
    preset: DEFAULT_PRACTICE_PRESET_ID,
    practiceGoalId: DEFAULT_PRACTICE_GOAL_ID,
    fillerWords: applyPresetToFillerWords(
      getDefaultFillerWords(preservedLanguage),
      DEFAULT_PRACTICE_PRESET_ID,
      preservedLanguage
    ),
    speedRange: { ...PRACTICE_PRESETS[DEFAULT_PRACTICE_PRESET_ID].speedRange },
    fillerDetectionEnabled: true,
    speedMonitoringEnabled: true,
    repeatConnectorEnabled: true,
    hapticEnabled: true,
    soundEnabled: false,
    language: preservedLanguage,
    micDeviceId: 'default',
  })

  useNavigationStore.setState({
    screen: 'home',
    pendingScreen: null,
    isRecordingExitConfirmOpen: false,
  })
}
