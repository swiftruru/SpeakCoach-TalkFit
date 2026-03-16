import type { SessionSummary, SpeedDataPoint, TranscriptSegment } from '../types'

// ── helpers ──────────────────────────────────────────────────────────────────

function daysAgo(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  d.setHours(14 + Math.floor(Math.random() * 6), Math.floor(Math.random() * 60), 0, 0)
  return d.toISOString()
}

function makeSpeedHistory(
  durationSeconds: number,
  baseWpm: number,
  variance = 30
): SpeedDataPoint[] {
  const points: SpeedDataPoint[] = []
  const step = Math.max(10, Math.floor(durationSeconds / 15))
  for (let t = 0; t <= durationSeconds; t += step) {
    const noise = (Math.random() - 0.5) * variance * 2
    points.push({ time: t, wpm: Math.round(Math.max(80, baseWpm + noise)) })
  }
  return points
}

// ── transcripts ───────────────────────────────────────────────────────────────

function seg(text: string, isFiller = false, fillerWord?: string, isSpeedFast = false, isSpeedSlow = false): TranscriptSegment {
  return { text, isFiller, fillerWord, timestamp: 0, isSpeedFast, isSpeedSlow }
}

const transcript_hackathon: TranscriptSegment[] = [
  seg('大家好，'),
  seg('嗯', true, '嗯'),
  seg('今天要跟大家介紹我們的專題。'),
  seg('然後', true, '然後'),
  seg('我們做的是一個語音分析工具，'),
  seg('然後', true, '然後'),
  seg('它可以幫你偵測演講的時候有沒有太多贅字。'),
  seg('其實', true, '其實'),
  seg('這個想法是因為我自己每次上台報告都會很緊張，', false, undefined, true),
  seg('然後', true, '然後'),
  seg('就會一直講「然後」。'),
  seg('對', true, '對'),
  seg('所以我們就決定做這個工具。'),
  seg('嗯', true, '嗯'),
  seg('它的核心功能包含即時語速偵測、贅字標記，'),
  seg('然後', true, '然後'),
  seg('還有事後的分析報告。'),
  seg('其實', true, '其實'),
  seg('用起來蠻直覺的。'),
  seg('那個', true, '那個'),
  seg('功能我們還在優化當中。謝謝大家。'),
]

const transcript_today: TranscriptSegment[] = [
  seg('各位評審好，'),
  seg('我是今天報告的第三組。'),
  seg('嗯', true, '嗯'),
  seg('我們這學期做的專題是說來話長 TalkFit，'),
  seg('然後', true, '然後'),
  seg('它是一個幫助大家練習演講的工具。', false, undefined, true),
  seg('其實', true, '其實'),
  seg('我們發現很多人上台都有贅字的問題，'),
  seg('然後', true, '然後'),
  seg('但自己卻不自覺。'),
  seg('所以我們設計了即時震動提示，'),
  seg('嗯', true, '嗯'),
  seg('讓你在說贅字的當下就能感受到。'),
  seg('這個', true, '這個'),
  seg('功能是我們的核心亮點。'),
  seg('然後', true, '然後'),
  seg('我們也有完整的歷史紀錄，'),
  seg('讓你看到自己一週、一個月的進步幅度。'),
  seg('對', true, '對'),
  seg('以上就是我們的報告，謝謝！'),
]

const transcript_interview: TranscriptSegment[] = [
  seg('您好，我是陳小明，'),
  seg('畢業於台灣大學資訊工程學系。'),
  seg('嗯', true, '嗯'),
  seg('我有三年的前端開發經驗，'),
  seg('然後', true, '然後'),
  seg('主要技術棧是 React 跟 TypeScript。'),
  seg('其實', true, '其實'),
  seg('我對貴公司的產品非常有興趣，', false, undefined, false, true),
  seg('那個', true, '那個'),
  seg('特別是你們的 AI 應用方向。'),
  seg('嗯', true, '嗯'),
  seg('我覺得我的背景跟這個職位非常契合。'),
  seg('然後', true, '然後'),
  seg('我之前的專案也有類似的挑戰。謝謝。'),
]

const transcript_reading2: TranscriptSegment[] = [
  seg('今天我要分享的書是《原子習慣》。'),
  seg('這本書的核心概念是'),
  seg('嗯', true, '嗯'),
  seg('每天只要進步 1%，一年後你就會進步 37 倍。'),
  seg('其實', true, '其實'),
  seg('這個概念聽起來很簡單，'),
  seg('但執行起來需要一些技巧。', false, undefined, false, true),
  seg('然後', true, '然後'),
  seg('作者提到了四個習慣迴路：提示、渴望、回應、獎勵。'),
  seg('對', true, '對'),
  seg('這四個步驟缺一不可。謝謝大家。'),
]

const transcript_intro: TranscriptSegment[] = [
  seg('大家好，我叫小明，'),
  seg('目前是大四學生。'),
  seg('嗯', true, '嗯'),
  seg('我的興趣是寫程式和閱讀。'),
  seg('其實', true, '其實'),
  seg('我從高中就開始學程式了，'),
  seg('然後', true, '然後'),
  seg('一開始學的是 Python。'),
  seg('這個', true, '這個'),
  seg('語言真的很容易上手。'),
  seg('我希望未來能進入科技公司工作，謝謝。'),
]

const transcript_draft: TranscriptSegment[] = [
  seg('各位同學好，'),
  seg('今天的主題是機器學習在醫療的應用。'),
  seg('嗯', true, '嗯'),
  seg('首先，我們來看一些基本概念。'),
  seg('然後', true, '然後'),
  seg('機器學習簡單來說就是讓電腦從資料中學習。'),
  seg('其實', true, '其實'),
  seg('這個領域發展非常快速，'),
  seg('然後', true, '然後'),
  seg('在醫療診斷上已經有很多突破性的應用了，', false, undefined, true),
  seg('對不對', true, '對不對'),
  seg('比如說癌症篩檢。謝謝大家。'),
]

const transcript_product: TranscriptSegment[] = [
  seg('大家好，'),
  seg('今天要介紹的是我們的新產品。'),
  seg('嗯', true, '嗯'),
  seg('這個產品主要解決的是'),
  seg('然後', true, '然後'),
  seg('一般使用者在日常生活中遇到的痛點。'),
  seg('其實', true, '其實'),
  seg('我們做了很多使用者訪談，'),
  seg('然後', true, '然後'),
  seg('發現大家最在意的是速度和易用性。'),
  seg('這個', true, '這個'),
  seg('版本我們主要優化了這兩點。謝謝。'),
]

const transcript_reading1: TranscriptSegment[] = [
  seg('今天我要分享的是《人類大歷史》。'),
  seg('嗯', true, '嗯'),
  seg('這本書從宏觀的角度'),
  seg('然後', true, '然後'),
  seg('回顧了人類幾萬年的發展歷程。'),
  seg('其實', true, '其實'),
  seg('裡面很多論點都蠻顛覆性的，'),
  seg('然後', true, '然後'),
  seg('比如說農業革命讓人類變得更不快樂。'),
  seg('嗯', true, '嗯'),
  seg('作者的論述很有趣，我個人很推薦。謝謝。'),
]

// ── 8 mock sessions (newest first) ────────────────────────────────────────────

export const MOCK_SESSIONS: SessionSummary[] = [
  {
    id: 'mock-8',
    title: '期末專題簡報',
    date: daysAgo(0),
    durationSeconds: 272,
    avgWpm: 156,
    fillerCount: 23,
    fillerCounts: { 然後: 8, 嗯: 5, 對: 4, 其實: 3, 這個: 3 },
    topFiller: '然後',
    grade: 'B',
    speedHistory: makeSpeedHistory(272, 156, 35),
    transcript: transcript_today,
  },
  {
    id: 'mock-7',
    title: '面試模擬練習',
    date: daysAgo(1),
    durationSeconds: 185,
    avgWpm: 150,
    fillerCount: 15,
    fillerCounts: { 然後: 5, 嗯: 4, 那個: 3, 其實: 3 },
    topFiller: '然後',
    grade: 'B+',
    speedHistory: makeSpeedHistory(185, 150, 25),
    transcript: transcript_interview,
  },
  {
    id: 'mock-6',
    title: '讀書會第二次',
    date: daysAgo(4),
    durationSeconds: 198,
    avgWpm: 142,
    fillerCount: 12,
    fillerCounts: { 嗯: 5, 然後: 4, 對: 3 },
    topFiller: '嗯',
    grade: 'A-',
    speedHistory: makeSpeedHistory(198, 142, 20),
    transcript: transcript_reading2,
  },
  {
    id: 'mock-5',
    title: '自我介紹精修',
    date: daysAgo(8),
    durationSeconds: 130,
    avgWpm: 145,
    fillerCount: 18,
    fillerCounts: { 然後: 6, 嗯: 4, 其實: 4, 這個: 4 },
    topFiller: '然後',
    grade: 'B+',
    speedHistory: makeSpeedHistory(130, 145, 25),
    transcript: transcript_intro,
  },
  {
    id: 'mock-4',
    title: '期末報告草稿',
    date: daysAgo(12),
    durationSeconds: 318,
    avgWpm: 148,
    fillerCount: 22,
    fillerCounts: { 然後: 8, 嗯: 5, 其實: 5, 對不對: 4 },
    topFiller: '然後',
    grade: 'B',
    speedHistory: makeSpeedHistory(318, 148, 30),
    transcript: transcript_draft,
  },
  {
    id: 'mock-3',
    title: '產品發表練習',
    date: daysAgo(17),
    durationSeconds: 245,
    avgWpm: 152,
    fillerCount: 28,
    fillerCounts: { 然後: 10, 嗯: 7, 其實: 6, 這個: 5 },
    topFiller: '然後',
    grade: 'B-',
    speedHistory: makeSpeedHistory(245, 152, 35),
    transcript: transcript_product,
  },
  {
    id: 'mock-2',
    title: '讀書會報告',
    date: daysAgo(21),
    durationSeconds: 280,
    avgWpm: 165,
    fillerCount: 35,
    fillerCounts: { 然後: 13, 嗯: 9, 其實: 7, 對: 6 },
    topFiller: '然後',
    grade: 'C+',
    speedHistory: makeSpeedHistory(280, 165, 40),
    transcript: transcript_reading1,
  },
  {
    id: 'mock-1',
    title: 'Hackathon Demo',
    date: daysAgo(28),
    durationSeconds: 225,
    avgWpm: 178,
    fillerCount: 47,
    fillerCounts: { 然後: 18, 嗯: 12, 其實: 8, 對: 5, 那個: 4 },
    topFiller: '然後',
    grade: 'C',
    speedHistory: makeSpeedHistory(225, 178, 45),
    transcript: transcript_hackathon,
  },
]

// ── seed function ─────────────────────────────────────────────────────────────

export function seedMockDataIfEmpty(): void {
  try {
    const existing = localStorage.getItem('talkfit-history')
    const parsed = existing ? JSON.parse(existing) : null
    const hasSessions = parsed?.state?.sessions?.length > 0
    if (!hasSessions) {
      localStorage.setItem(
        'talkfit-history',
        JSON.stringify({ state: { sessions: MOCK_SESSIONS }, version: 0 })
      )
    }
  } catch {
    // ignore parse errors; store will re-initialize itself
  }
}
