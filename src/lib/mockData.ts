import i18n, { normalizeLanguage } from '../i18n'
import type { SessionSummary, SpeedDataPoint, TranscriptSegment } from '../types'

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

function seg(
  text: string,
  isFiller = false,
  fillerWord?: string,
  isSpeedFast = false,
  isSpeedSlow = false
): TranscriptSegment {
  return { text, isFiller, fillerWord, timestamp: 0, isSpeedFast, isSpeedSlow }
}

type LocaleContent = {
  title: string
  transcript: TranscriptSegment[]
  fillerCounts: Record<string, number>
  topFiller: string
}

type SessionKey =
  | 'hackathon'
  | 'today'
  | 'interview'
  | 'reading2'
  | 'intro'
  | 'draft'
  | 'product'
  | 'reading1'

const ZH_CONTENT: Record<SessionKey, LocaleContent> = {
  hackathon: {
    title: 'Hackathon Demo',
    fillerCounts: { 然後: 18, 嗯: 12, 其實: 8, 對: 5, 那個: 4 },
    topFiller: '然後',
    transcript: [
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
    ],
  },
  today: {
    title: '期末專題簡報',
    fillerCounts: { 然後: 8, 嗯: 5, 對: 4, 其實: 3, 這個: 3 },
    topFiller: '然後',
    transcript: [
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
    ],
  },
  interview: {
    title: '面試模擬練習',
    fillerCounts: { 然後: 5, 嗯: 4, 那個: 3, 其實: 3 },
    topFiller: '然後',
    transcript: [
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
    ],
  },
  reading2: {
    title: '讀書會第二次',
    fillerCounts: { 嗯: 5, 然後: 4, 對: 3 },
    topFiller: '嗯',
    transcript: [
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
    ],
  },
  intro: {
    title: '自我介紹精修',
    fillerCounts: { 然後: 6, 嗯: 4, 其實: 4, 這個: 4 },
    topFiller: '然後',
    transcript: [
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
    ],
  },
  draft: {
    title: '期末報告草稿',
    fillerCounts: { 然後: 8, 嗯: 5, 其實: 5, 對不對: 4 },
    topFiller: '然後',
    transcript: [
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
    ],
  },
  product: {
    title: '產品發表練習',
    fillerCounts: { 然後: 10, 嗯: 7, 其實: 6, 這個: 5 },
    topFiller: '然後',
    transcript: [
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
    ],
  },
  reading1: {
    title: '讀書會報告',
    fillerCounts: { 然後: 13, 嗯: 9, 其實: 7, 對: 6 },
    topFiller: '然後',
    transcript: [
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
    ],
  },
}

const EN_CONTENT: Record<SessionKey, LocaleContent> = {
  hackathon: {
    title: 'Hackathon Demo',
    fillerCounts: { 'and then': 18, um: 12, actually: 8, 'you know': 5, 'right?': 4 },
    topFiller: 'and then',
    transcript: [
      seg('Hi everyone,'),
      seg('um', true, 'um'),
      seg('today I want to introduce our project.'),
      seg('and then', true, 'and then'),
      seg('we built a speech analysis tool,'),
      seg('and then', true, 'and then'),
      seg('that helps detect too many filler words during a presentation.'),
      seg('actually', true, 'actually'),
      seg('this idea came from how nervous I get every time I present,', false, undefined, true),
      seg('and then', true, 'and then'),
      seg('and I keep saying “and then” over and over.'),
      seg('you know', true, 'you know'),
      seg('so that is why we decided to build this tool.'),
      seg('um', true, 'um'),
      seg('Its core features include live pace detection and filler tagging,'),
      seg('and then', true, 'and then'),
      seg('plus a post-session analysis report.'),
      seg('actually', true, 'actually'),
      seg('the whole flow feels pretty intuitive.'),
      seg('right?', true, 'right?'),
      seg('and we are still refining a few parts. Thank you.'),
    ],
  },
  today: {
    title: 'Final Project Presentation',
    fillerCounts: { 'and then': 8, um: 5, 'right?': 4, actually: 3, 'you know': 3 },
    topFiller: 'and then',
    transcript: [
      seg('Hello judges,'),
      seg('our team is presenting third today.'),
      seg('um', true, 'um'),
      seg('our semester project is TalkFit,'),
      seg('and then', true, 'and then'),
      seg('a tool that helps people practice speaking.', false, undefined, true),
      seg('actually', true, 'actually'),
      seg('we found that many people overuse fillers on stage,'),
      seg('and then', true, 'and then'),
      seg('without even noticing it themselves.'),
      seg('So we designed subtle haptic feedback,'),
      seg('um', true, 'um'),
      seg('so you can feel it right when a filler slips out.'),
      seg('you know', true, 'you know'),
      seg('that is one of our core highlights.'),
      seg('and then', true, 'and then'),
      seg('we also keep a full history,'),
      seg('so you can see weekly and monthly improvement over time.'),
      seg('right?', true, 'right?'),
      seg('That concludes our presentation. Thank you.'),
    ],
  },
  interview: {
    title: 'Interview Practice',
    fillerCounts: { 'and then': 5, um: 4, 'you know': 3, actually: 3 },
    topFiller: 'and then',
    transcript: [
      seg('Hello, I am Alex Chen,'),
      seg('and I graduated in computer science.'),
      seg('um', true, 'um'),
      seg('I have three years of frontend development experience,'),
      seg('and then', true, 'and then'),
      seg('with React and TypeScript as my main stack.'),
      seg('actually', true, 'actually'),
      seg('I am very interested in your product direction,', false, undefined, false, true),
      seg('you know', true, 'you know'),
      seg('especially the AI-related work your team is doing.'),
      seg('um', true, 'um'),
      seg('I believe my background fits the role well.'),
      seg('and then', true, 'and then'),
      seg('Several past projects also involved similar challenges. Thank you.'),
    ],
  },
  reading2: {
    title: 'Book Club Session Two',
    fillerCounts: { um: 5, 'and then': 4, 'right?': 3 },
    topFiller: 'um',
    transcript: [
      seg('Today I want to share the book Atomic Habits.'),
      seg('Its core idea is'),
      seg('um', true, 'um'),
      seg('that improving by one percent every day compounds dramatically over a year.'),
      seg('actually', true, 'actually'),
      seg('the concept sounds simple,'),
      seg('but applying it well still takes some technique.', false, undefined, false, true),
      seg('and then', true, 'and then'),
      seg('The author describes four stages: cue, craving, response, and reward.'),
      seg('right?', true, 'right?'),
      seg('Each of those stages matters. Thank you.'),
    ],
  },
  intro: {
    title: 'Self-Intro Polish',
    fillerCounts: { 'and then': 6, um: 4, actually: 4, 'you know': 4 },
    topFiller: 'and then',
    transcript: [
      seg('Hi, I am Alex,'),
      seg('and I am currently a senior student.'),
      seg('um', true, 'um'),
      seg('My interests are programming and reading.'),
      seg('actually', true, 'actually'),
      seg('I started learning to code in high school,'),
      seg('and then', true, 'and then'),
      seg('and Python was the first language I picked up.'),
      seg('you know', true, 'you know'),
      seg('it was genuinely easy to start with.'),
      seg('I hope to work in the tech industry in the future. Thank you.'),
    ],
  },
  draft: {
    title: 'Final Report Draft',
    fillerCounts: { 'and then': 8, um: 5, actually: 5, 'right?': 4 },
    topFiller: 'and then',
    transcript: [
      seg('Hello everyone,'),
      seg('today the topic is machine learning in healthcare.'),
      seg('um', true, 'um'),
      seg('First, let us review a few basic concepts.'),
      seg('and then', true, 'and then'),
      seg('Machine learning basically means letting computers learn from data.'),
      seg('actually', true, 'actually'),
      seg('the field is moving very quickly,'),
      seg('and then', true, 'and then'),
      seg('and it already has several breakthrough uses in diagnosis,', false, undefined, true),
      seg('right?', true, 'right?'),
      seg('such as cancer screening. Thank you.'),
    ],
  },
  product: {
    title: 'Product Launch Practice',
    fillerCounts: { 'and then': 10, um: 7, actually: 6, 'you know': 5 },
    topFiller: 'and then',
    transcript: [
      seg('Hi everyone,'),
      seg('today I am introducing our new product.'),
      seg('um', true, 'um'),
      seg('The main problem it solves is'),
      seg('and then', true, 'and then'),
      seg('a daily pain point for general users.'),
      seg('actually', true, 'actually'),
      seg('we ran a lot of user interviews,'),
      seg('and then', true, 'and then'),
      seg('and learned that speed and usability mattered most.'),
      seg('you know', true, 'you know'),
      seg('this version mainly improves those two things. Thank you.'),
    ],
  },
  reading1: {
    title: 'Book Club Report',
    fillerCounts: { 'and then': 13, um: 9, actually: 7, 'right?': 6 },
    topFiller: 'and then',
    transcript: [
      seg('Today I want to share Sapiens.'),
      seg('um', true, 'um'),
      seg('The book looks at human history from a macro perspective'),
      seg('and then', true, 'and then'),
      seg('and revisits the development of civilization over thousands of years.'),
      seg('actually', true, 'actually'),
      seg('many of the arguments are surprisingly subversive,'),
      seg('and then', true, 'and then'),
      seg('such as the idea that the agricultural revolution made humans less happy.'),
      seg('um', true, 'um'),
      seg('The writing is fascinating, and I really recommend it. Thank you.'),
    ],
  },
}

const SESSION_BLUEPRINTS = [
  { id: 'mock-8', key: 'today' as const, days: 0, durationSeconds: 272, avgWpm: 156, fillerCount: 23, grade: 'B', variance: 35 },
  { id: 'mock-7', key: 'interview' as const, days: 1, durationSeconds: 185, avgWpm: 150, fillerCount: 15, grade: 'B+', variance: 25 },
  { id: 'mock-6', key: 'reading2' as const, days: 4, durationSeconds: 198, avgWpm: 142, fillerCount: 12, grade: 'A-', variance: 20 },
  { id: 'mock-5', key: 'intro' as const, days: 8, durationSeconds: 130, avgWpm: 145, fillerCount: 18, grade: 'B+', variance: 25 },
  { id: 'mock-4', key: 'draft' as const, days: 12, durationSeconds: 318, avgWpm: 148, fillerCount: 22, grade: 'B', variance: 30 },
  { id: 'mock-3', key: 'product' as const, days: 17, durationSeconds: 245, avgWpm: 152, fillerCount: 28, grade: 'B-', variance: 35 },
  { id: 'mock-2', key: 'reading1' as const, days: 21, durationSeconds: 280, avgWpm: 165, fillerCount: 35, grade: 'C+', variance: 40 },
  { id: 'mock-1', key: 'hackathon' as const, days: 28, durationSeconds: 225, avgWpm: 178, fillerCount: 47, grade: 'C', variance: 45 },
]

function getLocaleContent(): Record<SessionKey, LocaleContent> {
  return normalizeLanguage(i18n.resolvedLanguage ?? i18n.language) === 'en' ? EN_CONTENT : ZH_CONTENT
}

export function getMockSessions(): SessionSummary[] {
  const content = getLocaleContent()

  return SESSION_BLUEPRINTS.map((session) => ({
    id: session.id,
    title: content[session.key].title,
    date: daysAgo(session.days),
    durationSeconds: session.durationSeconds,
    avgWpm: session.avgWpm,
    fillerCount: session.fillerCount,
    fillerCounts: content[session.key].fillerCounts,
    topFiller: content[session.key].topFiller,
    grade: session.grade,
    speedHistory: makeSpeedHistory(session.durationSeconds, session.avgWpm, session.variance),
    transcript: content[session.key].transcript,
  }))
}

export const MOCK_SESSIONS: SessionSummary[] = getMockSessions()

export function seedMockDataIfEmpty(): void {
  try {
    const existing = localStorage.getItem('talkfit-history')
    const parsed = existing ? JSON.parse(existing) : null
    const hasSessions = parsed?.state?.sessions?.length > 0
    if (!hasSessions) {
      localStorage.setItem(
        'talkfit-history',
        JSON.stringify({ state: { sessions: getMockSessions() }, version: 0 })
      )
    }
  } catch {
    // ignore parse errors; store will re-initialize itself
  }
}
