import i18n from '../i18n'
import type {
  TranscriptSegment,
  FillerWord,
  PracticeGoalId,
  PracticePresetId,
  SpeedDataPoint,
  SpeedRange,
} from '../types'
import { gradeSession } from './grading'

export function detectFillers(
  text: string,
  fillerWords: FillerWord[]
): { isFiller: boolean; fillerWord?: string } {
  const enabled = fillerWords.filter((f) => f.enabled)
  const sorted = [...enabled].sort((a, b) => b.word.length - a.word.length)

  const matchesFiller = (sourceText: string, word: string) => {
    if (!word.trim()) return false

    // Latin phrases need boundary matching so common substrings such as "right"
    // or "like" do not trigger inside unrelated words.
    if (/[A-Za-z]/.test(word)) {
      const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const pattern = new RegExp(`(^|[^\\p{L}\\p{N}])${escaped}(?=$|[^\\p{L}\\p{N}])`, 'iu')
      return pattern.test(sourceText)
    }

    return sourceText.includes(word)
  }

  for (const fw of sorted) {
    if (matchesFiller(text, fw.word)) {
      return { isFiller: true, fillerWord: fw.word }
    }
  }
  return { isFiller: false }
}

export function calculateAvgWpm(segments: TranscriptSegment[], durationSeconds: number): number {
  if (durationSeconds <= 0) return 0
  const totalChars = segments.reduce((sum, s) => sum + s.text.length, 0)
  return Math.round((totalChars / durationSeconds) * 60)
}

export function buildFillerCounts(segments: TranscriptSegment[]): Record<string, number> {
  const counts: Record<string, number> = {}
  for (const seg of segments) {
    if (seg.isFiller && seg.fillerWord) {
      counts[seg.fillerWord] = (counts[seg.fillerWord] ?? 0) + 1
    }
  }
  return counts
}

export function topFiller(counts: Record<string, number>): string | null {
  const entries = Object.entries(counts)
  if (entries.length === 0) return null
  return entries.sort((a, b) => b[1] - a[1])[0][0]
}

export function buildSessionSummary(
  id: string,
  title: string,
  durationSeconds: number,
  segments: TranscriptSegment[],
  speedHistory: SpeedDataPoint[],
  options?: {
    presetSnapshot?: PracticePresetId
    practiceGoalId?: PracticeGoalId
    speedRangeSnapshot?: SpeedRange
  }
) {
  const fillerCounts = buildFillerCounts(segments)
  const fillerCount = Object.values(fillerCounts).reduce((s, v) => s + v, 0)
  const avgWpm = calculateAvgWpm(segments, durationSeconds)
  const grade = gradeSession(fillerCount, avgWpm, durationSeconds)
  return {
    id,
    title,
    date: new Date().toISOString(),
    durationSeconds,
    avgWpm,
    fillerCount,
    fillerCounts,
    topFiller: topFiller(fillerCounts),
    grade,
    presetSnapshot: options?.presetSnapshot,
    practiceGoalId: options?.practiceGoalId,
    speedRangeSnapshot: options?.speedRangeSnapshot,
    speedHistory,
    transcript: segments,
  }
}

export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

export function formatDate(isoString: string): string {
  const d = new Date(isoString)
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24))
  const time = `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`

  if (diffDays === 0) {
    return i18n.t('common:dates.todayAt', { time })
  }

  if (diffDays === 1) {
    return i18n.t('common:dates.yesterdayAt', { time })
  }

  const locale = i18n.resolvedLanguage === 'en' ? 'en-US' : 'zh-TW'
  const datePart = new Intl.DateTimeFormat(locale, {
    month: 'numeric',
    day: 'numeric',
  }).format(d)

  return `${datePart} ${time}`
}
