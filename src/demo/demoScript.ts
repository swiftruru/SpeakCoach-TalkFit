import { useSessionStore } from '../stores/sessionStore'
import { useHistoryStore } from '../stores/historyStore'
import { useReportStore } from '../stores/reportStore'
import { useNavigationStore } from '../stores/navigationStore'
import { usePhoneNotificationStore } from '../stores/phoneNotificationStore'
import { useSettingsStore } from '../stores/settingsStore'
import { useAnnotationGuideStore } from '../stores/annotationGuideStore'
import { buildSessionSummary } from '../lib/speechAnalysis'
import { MOCK_SESSIONS } from '../lib/mockData'
import {
  SAMPLE_REPLAY_DURATION_SECONDS,
  SAMPLE_REPLAY_EVENTS,
  SAMPLE_REPLAY_TITLE,
} from './sampleReplayData'
import type { DemoMode } from './demoStore'
import type { Screen } from '../types'

export interface DemoStep {
  title: string
  description: string
  durationMs: number   // Infinity = stay until user closes
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

  const session = useSessionStore.getState()
  const addHistory = useHistoryStore.getState().addSession
  const setReport = useReportStore.getState().setReport
  const setScreen = useNavigationStore.getState().setScreen
  const showNotification = usePhoneNotificationStore.getState().show
  const settings = useSettingsStore.getState()

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

const FULL_DEMO_STEPS: DemoStep[] = [
  {
    title: '快速體驗回放',
    description: '先用一段 10 秒 sample session 模擬真實使用流程，不開麥克風也能直接看到逐字稿、語速表與贅字警示。',
    durationMs: SAMPLE_REPLAY_STEP_MS,
    onEnter: () => {
      startSampleReplay()
    },
    onExit: () => {
      stopSampleReplay()
    },
  },
  createFocusedStep({
    title: '分析報告 — 評分',
    description: '先看本次目標是否達標，再用平均語速、贅字總數與流暢度評分，快速掌握整體表現。',
    durationMs: 2400,
    screen: 'report',
    targetId: 'report-goal-summary',
  }),
  createFocusedStep({
    title: '分析報告 — 核心指標',
    description: '三張核心評分卡把這次練習濃縮成最重要的數據，適合第一眼快速判斷表現。',
    durationMs: 2200,
    screen: 'report',
    targetId: 'report-score-section',
  }),
  createFocusedStep({
    title: '分析報告 — 教練建議',
    description: '不是只給數據，而是直接整理出下一輪最值得優先修正的 3 件事。',
    durationMs: 2200,
    screen: 'report',
    targetId: 'report-coaching-next-steps',
  }),
  createFocusedStep({
    title: '分析報告 — 贅字排行',
    description: '贅字排行榜會把最常出現的詞直接排出優先順序，讓使用者知道先改哪一個最有效。',
    durationMs: 2200,
    screen: 'report',
    targetId: 'filler-ranking',
  }),
  createFocusedStep({
    title: '分析報告 — 語速曲線',
    description: '語速曲線會凸顯偏快或偏慢的片段，讓問題不是只有總結，而是能定位到時間點。',
    durationMs: 2200,
    screen: 'report',
    targetId: 'speed-curve-chart',
  }),
  createFocusedStep({
    title: '分析報告 — 逐字稿定位',
    description: '逐字稿會把贅字與語速異常直接標出，方便從問題位置往回看完整上下文。',
    durationMs: 2400,
    screen: 'report',
    targetId: 'annotated-transcript',
  }),
  createFocusedStep({
    title: '分析報告 — 分享卡預覽',
    description: '專用分享卡會整理評分、Top 贅字與語速節奏，適合直接貼到作品集與 hackathon 成果頁。',
    durationMs: 2200,
    screen: 'report',
    targetId: 'report-share-preview',
  }),
  createFocusedStep({
    title: '分析報告 — 匯出 PNG / SVG',
    description: '示範會聚焦分享卡匯出按鈕，實際產品可輸出 PNG 與 SVG；自動示範不會真的下載檔案。',
    durationMs: 2200,
    screen: 'report',
    targetId: 'report-share-row',
    notification: {
      title: '分享卡匯出',
      body: '支援 PNG 與 SVG；示範模式僅展示流程，不會真的下載檔案。',
    },
  }),
  createFocusedStep({
    title: '歷史紀錄 — 整體回顧',
    description: '歷史頁先用累計練習次數、總時長與最常出現的贅字，快速回顧整體訓練成果。',
    durationMs: 2200,
    screen: 'history',
    targetId: 'history-summary-cards',
  }),
  createFocusedStep({
    title: '歷史紀錄 — 趨勢與列表',
    description: '再往下看贅字趨勢圖與練習紀錄列表，確認自己是持續進步，還是卡在固定壞習慣。',
    durationMs: 2400,
    screen: 'history',
    targetId: 'history-trend-chart',
  }),
  createFocusedStep({
    title: '設定頁面 — 偵測開關',
    description: '可分別控制贅字偵測、語速監控與重複連接詞，示範產品不是只有固定規則。',
    durationMs: 2200,
    screen: 'settings',
    targetId: 'settings-detection-toggles',
  }),
  createFocusedStep({
    title: '設定頁面 — 練習情境',
    description: '透過情境 preset，一鍵切換面試自介、專題簡報或 Demo Pitch 的預設語速與贅字清單。',
    durationMs: 2200,
    screen: 'settings',
    targetId: 'settings-practice-presets',
  }),
  createFocusedStep({
    title: '設定頁面 — 練習目標',
    description: '每次練習前可以先指定一個單一目標，讓練習中與報告頁都圍繞同一個焦點。',
    durationMs: 2200,
    screen: 'settings',
    targetId: 'settings-practice-goal',
  }),
  createFocusedStep({
    title: '設定頁面 — 語速與贅字',
    description: '語速範圍可手動調整，贅字清單也能自由啟用、停用或增減，讓偵測規則更貼近個人習慣。',
    durationMs: 2400,
    screen: 'settings',
    targetId: 'speed-range-slider',
  }),
  createFocusedStep({
    title: '設定頁面 — 贅字清單',
    description: '預設清單與自訂清單分開管理，方便留下常用詞，同時保留個人化調整的彈性。',
    durationMs: 2200,
    screen: 'settings',
    targetId: 'filler-chip-editor',
  }),
  createFocusedStep({
    title: '設定頁面 — 回饋方式',
    description: '可切換觸覺震動與音效提示，讓即時提醒更符合不同練習情境與個人偏好。',
    durationMs: 2200,
    screen: 'settings',
    targetId: 'settings-feedback',
  }),
  createFocusedStep({
    title: '設定頁面 — 辨識語言',
    description: '最後示範語言切換設定，完整帶過偵測規則、目標、回饋與語言等主要自訂能力。',
    durationMs: 2200,
    screen: 'settings',
    targetId: 'settings-language',
  }),
  createFocusedStep({
    title: '回到首頁 — 週期總覽',
    description: '示範收尾前回到首頁，重新看到本週次數、平均贅字與近期變化，對照整體練習成果。',
    durationMs: 2200,
    screen: 'home',
    targetId: 'home-stat-cards',
  }),
  createFocusedStep({
    title: '示範完成 ✓',
    description: '完整流程展示結束，已回到首頁。接下來可以改用自由探索，手動查看每個畫面細節。',
    durationMs: 1800,
    screen: 'home',
    targetId: 'home-record-btn',
    notification: {
      title: '示範完成',
      body: '可切換為自由探索，或再次點擊「開始示範」重新播放完整流程。',
    },
  }),
]

export function getDemoSteps(mode: DemoMode): DemoStep[] {
  if (mode === 'demo') return FULL_DEMO_STEPS
  return []
}

export const DEMO_STEPS = FULL_DEMO_STEPS
