import i18n from '../i18n'
import { useSessionStore } from '../stores/sessionStore'
import { useHistoryStore } from '../stores/historyStore'
import { useReportStore } from '../stores/reportStore'
import { useNavigationStore } from '../stores/navigationStore'
import { usePhoneNotificationStore } from '../stores/phoneNotificationStore'
import { useSettingsStore } from '../stores/settingsStore'
import { useAnnotationGuideStore } from '../stores/annotationGuideStore'
import { buildSessionSummary } from '../lib/speechAnalysis'
import { getMockSessions } from '../lib/mockData'
import {
  getSampleReplayEvents,
  SAMPLE_REPLAY_DURATION_SECONDS,
  getSampleReplayTitle,
} from './sampleReplayData'
import type { DemoMode } from './demoStore'
import type { Screen } from '../types'

export interface DemoStep {
  title: string
  description: string
  durationMs: number
  onEnter: () => void
  onExit?: () => void
}

const SAMPLE_REPLAY_STEP_MS = SAMPLE_REPLAY_DURATION_SECONDS * 1000 + 1500
const DEMO_FOCUS_DELAY_MS = 260
let cleanupSampleReplay: (() => void) | null = null
let cleanupFocusedSection: (() => void) | null = null

function stopSampleReplay() {
  cleanupSampleReplay?.()
  cleanupSampleReplay = null
}

function stopFocusedSection() {
  cleanupFocusedSection?.()
  cleanupFocusedSection = null
}

function focusScreenSection(
  screen: Screen,
  targetId?: string,
  notification?: { title: string; body: string }
) {
  stopFocusedSection()

  const { setScreen } = useNavigationStore.getState()
  const { pin, clear } = useAnnotationGuideStore.getState()
  const showNotification = usePhoneNotificationStore.getState().show
  const timeouts: ReturnType<typeof setTimeout>[] = []

  clear()
  setScreen(screen)

  if (targetId) {
    timeouts.push(
      setTimeout(() => {
        pin(targetId, 'demo')
      }, DEMO_FOCUS_DELAY_MS)
    )
  }

  if (notification) {
    timeouts.push(
      setTimeout(() => {
        showNotification(notification)
      }, targetId ? DEMO_FOCUS_DELAY_MS + 120 : 120)
    )
  }

  cleanupFocusedSection = () => {
    timeouts.forEach((timeout) => clearTimeout(timeout))
    clear()
  }
}

function createFocusedStep({
  title,
  description,
  durationMs,
  screen,
  targetId,
  notification,
}: {
  title: string
  description: string
  durationMs: number
  screen: Screen
  targetId?: string
  notification?: { title: string; body: string }
}): DemoStep {
  return {
    title,
    description,
    durationMs,
    onEnter: () => {
      focusScreenSection(screen, targetId, notification)
    },
    onExit: () => {
      stopFocusedSection()
    },
  }
}

function startSampleReplay() {
  stopSampleReplay()
  stopFocusedSection()

  let didComplete = false
  const timeouts: ReturnType<typeof setTimeout>[] = []
  const replayStartedAt = Date.now()
  const sampleReplayEvents = getSampleReplayEvents()

  const session = useSessionStore.getState()
  const addHistory = useHistoryStore.getState().addSession
  const setReport = useReportStore.getState().setReport
  const setScreen = useNavigationStore.getState().setScreen
  const showNotification = usePhoneNotificationStore.getState().show
  const settings = useSettingsStore.getState()
  const mockSessions = getMockSessions()

  useHistoryStore.setState({ sessions: mockSessions })
  setReport(mockSessions[0])
  session.reset()
  session.startRecording()
  setScreen('practice')

  showNotification({
    title: i18n.t('demo:sampleReplay.startNotification.title'),
    body: i18n.t('demo:sampleReplay.startNotification.body'),
  })

  const timer = setInterval(() => {
    const elapsedSeconds = Math.min(
      SAMPLE_REPLAY_DURATION_SECONDS,
      Math.floor((Date.now() - replayStartedAt) / 1000)
    )
    useSessionStore.setState({ elapsedSeconds })
  }, 1000)

  sampleReplayEvents.forEach((event) => {
    timeouts.push(
      setTimeout(() => {
        const liveSession = useSessionStore.getState()
        liveSession.updateCurrentWpm(event.wpm)
        liveSession.addSegment(event.segment)
        liveSession.addSpeedPoint({ time: event.elapsedSeconds, wpm: event.wpm })
        useSessionStore.setState({ elapsedSeconds: event.elapsedSeconds })

        if (event.segment.isFiller && event.segment.fillerWord) {
          liveSession.flashFiller(event.segment.fillerWord)
        }
      }, event.atMs)
    )
  })

  timeouts.push(
    setTimeout(() => {
      const liveSession = useSessionStore.getState()
      clearInterval(timer)
      liveSession.stopRecording()
      useSessionStore.setState({ elapsedSeconds: SAMPLE_REPLAY_DURATION_SECONDS })

      const report = buildSessionSummary(
        `sample-replay-${Date.now()}`,
        getSampleReplayTitle(),
        SAMPLE_REPLAY_DURATION_SECONDS,
        liveSession.transcript,
        liveSession.speedHistory,
        {
          practiceGoalId: settings.practiceGoalId,
          speedRangeSnapshot: settings.speedRange,
        }
      )

      setReport(report)
      addHistory(report)
      setScreen('report')
      showNotification({
        title: i18n.t('demo:sampleReplay.completeNotification.title'),
        body: i18n.t('demo:sampleReplay.completeNotification.body'),
      })

      didComplete = true
    }, SAMPLE_REPLAY_DURATION_SECONDS * 1000 + 900)
  )

  cleanupSampleReplay = () => {
    clearInterval(timer)
    timeouts.forEach((timeout) => clearTimeout(timeout))

    if (!didComplete) {
      const liveSession = useSessionStore.getState()
      liveSession.stopRecording()
      liveSession.reset()
      useNavigationStore.getState().setScreen('home')
    }
  }
}

function buildFullDemoSteps(): DemoStep[] {
  return [
    {
      title: i18n.t('demo:steps.sampleReplay.title'),
      description: i18n.t('demo:steps.sampleReplay.description'),
      durationMs: SAMPLE_REPLAY_STEP_MS,
      onEnter: () => {
        startSampleReplay()
      },
      onExit: () => {
        stopSampleReplay()
      },
    },
    createFocusedStep({
      title: i18n.t('demo:steps.reportGoal.title'),
      description: i18n.t('demo:steps.reportGoal.description'),
      durationMs: 2400,
      screen: 'report',
      targetId: 'report-goal-summary',
    }),
    createFocusedStep({
      title: i18n.t('demo:steps.reportScore.title'),
      description: i18n.t('demo:steps.reportScore.description'),
      durationMs: 2200,
      screen: 'report',
      targetId: 'report-score-section',
    }),
    createFocusedStep({
      title: i18n.t('demo:steps.reportCoaching.title'),
      description: i18n.t('demo:steps.reportCoaching.description'),
      durationMs: 2200,
      screen: 'report',
      targetId: 'report-coaching-next-steps',
    }),
    createFocusedStep({
      title: i18n.t('demo:steps.reportFiller.title'),
      description: i18n.t('demo:steps.reportFiller.description'),
      durationMs: 2200,
      screen: 'report',
      targetId: 'filler-ranking',
    }),
    createFocusedStep({
      title: i18n.t('demo:steps.reportSpeed.title'),
      description: i18n.t('demo:steps.reportSpeed.description'),
      durationMs: 2200,
      screen: 'report',
      targetId: 'speed-curve-chart',
    }),
    createFocusedStep({
      title: i18n.t('demo:steps.reportTranscript.title'),
      description: i18n.t('demo:steps.reportTranscript.description'),
      durationMs: 2400,
      screen: 'report',
      targetId: 'annotated-transcript',
    }),
    createFocusedStep({
      title: i18n.t('demo:steps.reportSharePreview.title'),
      description: i18n.t('demo:steps.reportSharePreview.description'),
      durationMs: 2200,
      screen: 'report',
      targetId: 'report-share-preview',
    }),
    createFocusedStep({
      title: i18n.t('demo:steps.reportExport.title'),
      description: i18n.t('demo:steps.reportExport.description'),
      durationMs: 2200,
      screen: 'report',
      targetId: 'report-share-row',
      notification: {
        title: i18n.t('demo:notifications.shareExport.title'),
        body: i18n.t('demo:notifications.shareExport.body'),
      },
    }),
    createFocusedStep({
      title: i18n.t('demo:steps.historySummary.title'),
      description: i18n.t('demo:steps.historySummary.description'),
      durationMs: 2200,
      screen: 'history',
      targetId: 'history-summary-cards',
    }),
    createFocusedStep({
      title: i18n.t('demo:steps.historyTrend.title'),
      description: i18n.t('demo:steps.historyTrend.description'),
      durationMs: 2400,
      screen: 'history',
      targetId: 'history-trend-chart',
    }),
    createFocusedStep({
      title: i18n.t('demo:steps.settingsDetection.title'),
      description: i18n.t('demo:steps.settingsDetection.description'),
      durationMs: 2200,
      screen: 'settings',
      targetId: 'settings-detection-toggles',
    }),
    createFocusedStep({
      title: i18n.t('demo:steps.settingsPreset.title'),
      description: i18n.t('demo:steps.settingsPreset.description'),
      durationMs: 2200,
      screen: 'settings',
      targetId: 'settings-practice-presets',
    }),
    createFocusedStep({
      title: i18n.t('demo:steps.settingsGoal.title'),
      description: i18n.t('demo:steps.settingsGoal.description'),
      durationMs: 2200,
      screen: 'settings',
      targetId: 'settings-practice-goal',
    }),
    createFocusedStep({
      title: i18n.t('demo:steps.settingsSpeed.title'),
      description: i18n.t('demo:steps.settingsSpeed.description'),
      durationMs: 2400,
      screen: 'settings',
      targetId: 'speed-range-slider',
    }),
    createFocusedStep({
      title: i18n.t('demo:steps.settingsFillerList.title'),
      description: i18n.t('demo:steps.settingsFillerList.description'),
      durationMs: 2200,
      screen: 'settings',
      targetId: 'filler-chip-editor',
    }),
    createFocusedStep({
      title: i18n.t('demo:steps.settingsFeedback.title'),
      description: i18n.t('demo:steps.settingsFeedback.description'),
      durationMs: 2200,
      screen: 'settings',
      targetId: 'settings-feedback',
    }),
    createFocusedStep({
      title: i18n.t('demo:steps.settingsLanguage.title'),
      description: i18n.t('demo:steps.settingsLanguage.description'),
      durationMs: 2200,
      screen: 'settings',
      targetId: 'settings-language',
    }),
    createFocusedStep({
      title: i18n.t('demo:steps.homeSummary.title'),
      description: i18n.t('demo:steps.homeSummary.description'),
      durationMs: 2200,
      screen: 'home',
      targetId: 'home-stat-cards',
    }),
    createFocusedStep({
      title: i18n.t('demo:steps.complete.title'),
      description: i18n.t('demo:steps.complete.description'),
      durationMs: 1800,
      screen: 'home',
      targetId: 'home-record-btn',
      notification: {
        title: i18n.t('demo:notifications.complete.title'),
        body: i18n.t('demo:notifications.complete.body'),
      },
    }),
  ]
}

export function getDemoSteps(mode: DemoMode): DemoStep[] {
  if (mode === 'demo') return buildFullDemoSteps()
  return []
}
