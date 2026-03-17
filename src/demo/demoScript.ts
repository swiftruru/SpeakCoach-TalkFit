import { useSessionStore } from '../stores/sessionStore'
import { useHistoryStore } from '../stores/historyStore'
import { useReportStore } from '../stores/reportStore'
import { useNavigationStore } from '../stores/navigationStore'
import { usePhoneNotificationStore } from '../stores/phoneNotificationStore'
import { buildSessionSummary } from '../lib/speechAnalysis'
import { MOCK_SESSIONS } from '../lib/mockData'
import {
  SAMPLE_REPLAY_DURATION_SECONDS,
  SAMPLE_REPLAY_EVENTS,
  SAMPLE_REPLAY_TITLE,
} from './sampleReplayData'

export interface DemoStep {
  title: string
  description: string
  durationMs: number   // Infinity = stay until user closes
  onEnter: () => void
  onExit?: () => void
}

const SAMPLE_REPLAY_STEP_MS = SAMPLE_REPLAY_DURATION_SECONDS * 1000 + 1500
let cleanupSampleReplay: (() => void) | null = null

function stopSampleReplay() {
  cleanupSampleReplay?.()
  cleanupSampleReplay = null
}

function startSampleReplay() {
  stopSampleReplay()

  let didComplete = false
  const timeouts: ReturnType<typeof setTimeout>[] = []
  const replayStartedAt = Date.now()

  const session = useSessionStore.getState()
  const addHistory = useHistoryStore.getState().addSession
  const setReport = useReportStore.getState().setReport
  const setScreen = useNavigationStore.getState().setScreen
  const showNotification = usePhoneNotificationStore.getState().show

  useHistoryStore.setState({ sessions: MOCK_SESSIONS })
  setReport(MOCK_SESSIONS[0])
  session.reset()
  session.startRecording()
  setScreen('practice')

  showNotification({
    title: '開始示範',
    body: '先播放無麥克風 sample session，接著自動帶你看各頁分析',
  })

  const timer = setInterval(() => {
    const elapsedSeconds = Math.min(
      SAMPLE_REPLAY_DURATION_SECONDS,
      Math.floor((Date.now() - replayStartedAt) / 1000)
    )
    useSessionStore.setState({ elapsedSeconds })
  }, 1000)

  SAMPLE_REPLAY_EVENTS.forEach((event) => {
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
        SAMPLE_REPLAY_TITLE,
        SAMPLE_REPLAY_DURATION_SECONDS,
        liveSession.transcript,
        liveSession.speedHistory
      )

      setReport(report)
      addHistory(report)
      setScreen('report')
      showNotification({
        title: 'Sample 回放完成',
        body: '已接續進入示範導覽，接下來會依序介紹報告、首頁、歷史與設定',
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

export const DEMO_STEPS: DemoStep[] = [
  {
    title: '快速體驗回放',
    description: '先用一段 20 秒 sample session 模擬真實使用流程，不開麥克風也能直接看到逐字稿、語速表與贅字警示。',
    durationMs: SAMPLE_REPLAY_STEP_MS,
    onEnter: () => {
      startSampleReplay()
    },
    onExit: () => {
      stopSampleReplay()
    },
  },
  {
    title: '分析報告 — 評分',
    description: '三項評分：平均語速（字／分）、贅字總數、流暢度評分（A+ ～ D），綜合表現一目了然。',
    durationMs: 4000,
    onEnter: () => {
      useNavigationStore.getState().setScreen('report')
    },
  },
  {
    title: '分析報告 — 贅字排行',
    description: '贅字排行榜依出現次數排序，搭配比例長條，幫助使用者識別最需改進的詞彙。',
    durationMs: 3000,
    onEnter: () => {
      useNavigationStore.getState().setScreen('report')
    },
  },
  {
    title: '首頁總覽',
    description: '回到首頁查看本週練習次數、平均贅字與每日趨勢，讓使用者快速掌握近期進步狀態。',
    durationMs: 3000,
    onEnter: () => {
      useNavigationStore.getState().setScreen('home')
    },
  },
  {
    title: '歷史紀錄',
    description: '折線圖追蹤每次練習的贅字次數變化，長期進步趨勢一目了然。',
    durationMs: 3000,
    onEnter: () => {
      useNavigationStore.getState().setScreen('history')
    },
  },
  {
    title: '設定頁面',
    description: '可自訂贅字清單、調整語速閾值（預設 120–180 字/分）、選擇辨識語言與回饋方式。',
    durationMs: 3000,
    onEnter: () => {
      useNavigationStore.getState().setScreen('settings')
    },
  },
  {
    title: '示範完成 ✓',
    description: '完整流程展示結束。你可以自由操作各項功能，或重新點擊「開始示範」再跑一次完整流程。',
    durationMs: Infinity,
    onEnter: () => {
      useNavigationStore.getState().setScreen('home')
    },
  },
]
