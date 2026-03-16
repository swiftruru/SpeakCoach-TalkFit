import type { TranscriptSegment, FillerWord, SpeedDataPoint } from '../types'
import { gradeSession } from './grading'

export function detectFillers(
  text: string,
  fillerWords: FillerWord[]
): { isFiller: boolean; fillerWord?: string } {
  const enabled = fillerWords.filter((f) => f.enabled)
  // Sort by length desc so longer phrases match first (e.g. "你懂我意思嗎" before "嗯")
  const sorted = [...enabled].sort((a, b) => b.word.length - a.word.length)
  for (const fw of sorted) {
    if (text.includes(fw.word)) {
      return { isFiller: true, fillerWord: fw.word }
    }
  }
  return { isFiller: false }
}

export function calculateAvgWpm(segments: TranscriptSegment[], durationSeconds: number): number {
  if (durationSeconds <= 0) return 0
  const totalChars = segments.reduce((sum, s) => sum + s.text.length, 0)
  // Chinese: roughly 1 char ≈ 1 word for wpm purposes
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
  speedHistory: SpeedDataPoint[]
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
  if (diffDays === 0) {
    const h = d.getHours().toString().padStart(2, '0')
    const m = d.getMinutes().toString().padStart(2, '0')
    return `今天 ${h}:${m}`
  }
  if (diffDays === 1) {
    const h = d.getHours().toString().padStart(2, '0')
    const m = d.getMinutes().toString().padStart(2, '0')
    return `昨天 ${h}:${m}`
  }
  return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours().toString().padStart(2, '0')}:${d
    .getMinutes()
    .toString()
    .padStart(2, '0')}`
}
