import { DEFAULT_FILLER_WORDS } from './fillerWords'
import { MOCK_SESSIONS } from './mockData'
import { DEFAULT_PRACTICE_GOAL_ID } from './practiceGoals'
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
import type { Screen } from '../types'

export function seedPrototypeData() {
  useHistoryStore.setState({ sessions: MOCK_SESSIONS })
  useReportStore.getState().setReport(MOCK_SESSIONS[0])
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
  useDemoStore.getState().stopDemo()
  useSessionStore.getState().reset()
  useRetryPracticeStore.getState().clearRetryPractice()
  usePhoneNotificationStore.getState().dismiss()
  useHistoryStore.setState({ sessions: [] })
  useReportStore.getState().clearReport()

  useSettingsStore.setState({
    preset: DEFAULT_PRACTICE_PRESET_ID,
    practiceGoalId: DEFAULT_PRACTICE_GOAL_ID,
    fillerWords: applyPresetToFillerWords(DEFAULT_FILLER_WORDS, DEFAULT_PRACTICE_PRESET_ID),
    speedRange: { ...PRACTICE_PRESETS[DEFAULT_PRACTICE_PRESET_ID].speedRange },
    fillerDetectionEnabled: true,
    speedMonitoringEnabled: true,
    repeatConnectorEnabled: true,
    hapticEnabled: true,
    soundEnabled: false,
    language: 'zh-TW',
    micDeviceId: 'default',
  })

  useNavigationStore.setState({
    screen: 'home',
    pendingScreen: null,
    isRecordingExitConfirmOpen: false,
  })
}
