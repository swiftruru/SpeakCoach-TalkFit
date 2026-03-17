import type { PracticeGoalId, SpeedDataPoint, SpeedRange } from '../types'

export interface PracticeGoalDefinition {
  id: PracticeGoalId
  label: string
  description: string
  coachHint: string
}

export interface GoalEvaluationInput {
  durationSeconds: number
  fillerCount: number
  fillerCounts: Record<string, number>
  topFiller: string | null
  speedHistory: SpeedDataPoint[]
}

export interface PracticeGoalEvaluation {
  success: boolean
  progressLabel: string
  statusText: string
  nextAction: string
}

export const DEFAULT_PRACTICE_GOAL_ID: PracticeGoalId = 'reduce-fillers'

export const PRACTICE_GOAL_LIST: PracticeGoalDefinition[] = [
  {
    id: 'reduce-fillers',
    label: '少講贅字',
    description: '先把整體口頭禪數量壓低，練出更乾淨的表達。',
    coachHint: '優先盯住贅字總數與排行榜第一名。',
  },
  {
    id: 'steady-speed',
    label: '穩住語速',
    description: '讓大部分時間都落在建議語速區間，不要忽快忽慢。',
    coachHint: '注意異常語速點，先把節奏穩下來。',
  },
  {
    id: 'cut-top-filler',
    label: '抓掉口頭禪',
    description: '先挑一個最常出現的詞，把它壓到可控制的範圍。',
    coachHint: '先修正同一個詞，比一次改全部更有效。',
  },
]

export const PRACTICE_GOALS = Object.fromEntries(
  PRACTICE_GOAL_LIST.map((goal) => [goal.id, goal])
) as Record<PracticeGoalId, PracticeGoalDefinition>

function getAllowedFillerCount(durationSeconds: number) {
  return Math.max(2, Math.ceil(durationSeconds / 20))
}

function getAllowedTopFillerCount(durationSeconds: number) {
  return Math.max(1, Math.ceil(durationSeconds / 45))
}

function getSpeedStats(speedHistory: SpeedDataPoint[], speedRange: SpeedRange) {
  const fastCount = speedHistory.filter((point) => point.wpm > speedRange.high).length
  const slowCount = speedHistory.filter((point) => point.wpm < speedRange.low).length
  const totalCount = speedHistory.length
  const inRangeCount = Math.max(0, totalCount - fastCount - slowCount)
  const inRangeRatio = totalCount > 0 ? inRangeCount / totalCount : 1

  return {
    fastCount,
    slowCount,
    totalCount,
    inRangeCount,
    inRangeRatio,
  }
}

export function evaluatePracticeGoal(
  input: GoalEvaluationInput,
  goalId: PracticeGoalId,
  speedRange: SpeedRange
): PracticeGoalEvaluation {
  const speedStats = getSpeedStats(input.speedHistory, speedRange)
  const topFillerCount = input.topFiller ? input.fillerCounts[input.topFiller] ?? 0 : 0

  if (goalId === 'steady-speed') {
    const success = speedStats.inRangeRatio >= 0.75 && speedStats.fastCount + speedStats.slowCount <= 2
    return {
      success,
      progressLabel: `${speedStats.inRangeCount}/${Math.max(speedStats.totalCount, 1)} 點在範圍內`,
      statusText: success
        ? `大部分語速點都落在 ${speedRange.low}–${speedRange.high} 字/分內。`
        : `目前有 ${speedStats.fastCount + speedStats.slowCount} 個異常語速點，節奏還不夠穩。`,
      nextAction: speedStats.fastCount >= speedStats.slowCount
        ? '先從偏快點開始，句尾多留半拍再進下一句。'
        : '先把偏慢段落推進一點，避免句子尾端拖太長。',
    }
  }

  if (goalId === 'cut-top-filler') {
    const allowed = getAllowedTopFillerCount(input.durationSeconds)
    const success = topFillerCount <= allowed
    const topWord = input.topFiller ?? '目前沒有明顯口頭禪'
    return {
      success,
      progressLabel: input.topFiller ? `${topWord} ${topFillerCount}/${allowed} 次` : '尚未出現明顯口頭禪',
      statusText: input.topFiller
        ? success
          ? `最常出現的「${topWord}」已壓在可控制範圍內。`
          : `最常出現的「${topWord}」還有點明顯，建議先集中處理它。`
        : '這次沒有單一詞特別突出，控制得不錯。',
      nextAction: input.topFiller
        ? `下一輪先點排行榜中的「${topWord}」，逐段重講最有效。`
        : '可以換成更高挑戰的目標，例如穩住語速。',
    }
  }

  const allowed = getAllowedFillerCount(input.durationSeconds)
  const success = input.fillerCount <= allowed
  return {
    success,
    progressLabel: `${input.fillerCount}/${allowed} 次`,
    statusText: success
      ? '整體贅字量已控制在這次練習目標內。'
      : `這次贅字還有點多，距離目標上限差 ${input.fillerCount - allowed} 次。`,
    nextAction: input.topFiller
      ? `先從最常出現的「${input.topFiller}」開始壓低，效果最快。`
      : '下一輪維持現在的節奏，盡量讓每句結尾更乾淨。',
  }
}
