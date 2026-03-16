import { useSessionStore } from '../stores/sessionStore'
import { useHistoryStore } from '../stores/historyStore'
import { useReportStore } from '../stores/reportStore'
import { useNavigationStore } from '../stores/navigationStore'
import { buildSessionSummary } from '../lib/speechAnalysis'
import { MOCK_SESSIONS } from '../lib/mockData'
import type { TranscriptSegment } from '../types'

export interface DemoStep {
  title: string
  description: string
  durationMs: number   // Infinity = stay until user closes
  onEnter: () => void
}

// Simulated transcript for the demo practice session
const demoTranscript: TranscriptSegment[] = [
  { text: '大家好，今天我要和大家分享一個關於溝通技巧的主題。', isFiller: false, timestamp: 3 },
  { text: '嗯', isFiller: true, fillerWord: '嗯', timestamp: 5 },
  { text: '首先，我想先談談語速的重要性。', isFiller: false, timestamp: 7 },
  { text: '然後', isFiller: true, fillerWord: '然後', timestamp: 9 },
  { text: '在正式場合演講時，語速太快會讓聽眾跟不上，', isFiller: false, isSpeedFast: true, timestamp: 11 },
  { text: '太慢又會讓人失去興趣。', isFiller: false, timestamp: 14 },
  { text: '那個', isFiller: true, fillerWord: '那個', timestamp: 16 },
  { text: '最理想的語速大約是每分鐘一百二十到一百八十個字。', isFiller: false, timestamp: 18 },
  { text: '然後', isFiller: true, fillerWord: '然後', timestamp: 20 },
  { text: '我們今天就來練習如何控制語速、減少贅字的出現頻率。', isFiller: false, timestamp: 22 },
]

export const DEMO_STEPS: DemoStep[] = [
  {
    title: '首頁',
    description: '顯示本週練習次數、平均贅字、每日趨勢長條圖，讓使用者一眼掌握訓練進度。',
    durationMs: 3000,
    onEnter: () => {
      useHistoryStore.setState({ sessions: MOCK_SESSIONS })
      useReportStore.getState().setReport(MOCK_SESSIONS[0])
      useNavigationStore.getState().setScreen('home')
    },
  },
  {
    title: '進入練習畫面',
    description: '點擊「開始練習」按鈕，進入即時錄音模式，系統開始分析語音。',
    durationMs: 1500,
    onEnter: () => {
      useSessionStore.getState().reset()
      useNavigationStore.getState().setScreen('practice')
    },
  },
  {
    title: '語速儀表盤',
    description: '圓弧儀表板即時顯示每分鐘字數。目前語速適中，顯示綠色。',
    durationMs: 3000,
    onEnter: () => {
      useSessionStore.getState().startRecording()
      useSessionStore.setState({ elapsedSeconds: 3, currentWpm: 145 })
      useSessionStore.getState().addSpeedPoint({ time: 3, wpm: 145 })
    },
  },
  {
    title: '贅字即時偵測',
    description: '說出「嗯」「然後」等贅字時，系統立即以紅色標記並累計計數，提醒使用者注意。',
    durationMs: 3000,
    onEnter: () => {
      const s = useSessionStore.getState()
      s.addSegment(demoTranscript[0])
      s.addSegment(demoTranscript[1]) // 嗯
      s.addSegment(demoTranscript[2])
      s.addSegment(demoTranscript[3]) // 然後
      s.flashFiller('然後')
      s.updateCurrentWpm(152)
      s.addSpeedPoint({ time: 9, wpm: 152 })
      useSessionStore.setState({ elapsedSeconds: 11 })
    },
  },
  {
    title: '即時逐字稿',
    description: '語音持續轉錄顯示。語速過快的段落自動加底線，贅字持續以紅色高亮標記。',
    durationMs: 3000,
    onEnter: () => {
      const s = useSessionStore.getState()
      s.addSegment(demoTranscript[4]) // isSpeedFast
      s.addSegment(demoTranscript[5])
      s.addSegment(demoTranscript[6]) // 那個
      s.addSegment(demoTranscript[7])
      s.addSegment(demoTranscript[8]) // 然後
      s.addSegment(demoTranscript[9])
      s.flashFiller('那個')
      s.updateCurrentWpm(173)
      s.addSpeedPoint({ time: 16, wpm: 173 })
      s.addSpeedPoint({ time: 22, wpm: 165 })
      useSessionStore.setState({ elapsedSeconds: 23 })
    },
  },
  {
    title: '生成分析報告',
    description: '結束練習後，系統自動彙整語速、贅字、流暢度等資料，生成完整練習報告。',
    durationMs: 1500,
    onEnter: () => {
      const sess = useSessionStore.getState()
      sess.stopRecording()
      const report = buildSessionSummary(
        'demo-' + Date.now(),
        'Live Demo 練習',
        sess.elapsedSeconds,
        sess.transcript,
        sess.speedHistory
      )
      useReportStore.getState().setReport(report)
      useHistoryStore.getState().addSession(report)
      useNavigationStore.getState().setScreen('report')
    },
  },
  {
    title: '分析報告 — 評分',
    description: '三項評分：平均語速（字／分）、贅字總數、流暢度評分（A+ ～ D），綜合表現一目了然。',
    durationMs: 4000,
    onEnter: () => {},
  },
  {
    title: '分析報告 — 贅字排行',
    description: '贅字排行榜依出現次數排序，搭配比例長條，幫助使用者識別最需改進的詞彙。',
    durationMs: 3000,
    onEnter: () => {},
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
    description: '完整流程展示結束。可自由操作各項功能，或點擊「✕ 停止示範」關閉此說明欄。',
    durationMs: Infinity,
    onEnter: () => {
      useNavigationStore.getState().setScreen('home')
    },
  },
]
