import i18n from '../i18n'
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

const PRACTICE_GOAL_IDS: PracticeGoalId[] = [
  'reduce-fillers',
  'steady-speed',
  'cut-top-filler',
]

export function getPracticeGoal(goalId: PracticeGoalId): PracticeGoalDefinition {
  return {
    id: goalId,
    label: i18n.t(`practice:goals.${goalId}.label`),
    description: i18n.t(`practice:goals.${goalId}.description`),
    coachHint: i18n.t(`practice:goals.${goalId}.coachHint`),
  }
}

export function getPracticeGoalList(): PracticeGoalDefinition[] {
  return PRACTICE_GOAL_IDS.map(getPracticeGoal)
}

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
      progressLabel: i18n.t('practice:goalEvaluation.steadySpeed.progress', {
        inRange: speedStats.inRangeCount,
        total: Math.max(speedStats.totalCount, 1),
      }),
      statusText: success
        ? i18n.t('practice:goalEvaluation.steadySpeed.successStatus', {
            low: speedRange.low,
            high: speedRange.high,
          })
        : i18n.t('practice:goalEvaluation.steadySpeed.failureStatus', {
            count: speedStats.fastCount + speedStats.slowCount,
          }),
      nextAction: speedStats.fastCount >= speedStats.slowCount
        ? i18n.t('practice:goalEvaluation.steadySpeed.nextFast')
        : i18n.t('practice:goalEvaluation.steadySpeed.nextSlow'),
    }
  }

  if (goalId === 'cut-top-filler') {
    const allowed = getAllowedTopFillerCount(input.durationSeconds)
    const success = topFillerCount <= allowed
    const topWord = input.topFiller ?? i18n.t('practice:goalEvaluation.cutTopFiller.noneTopWord')
    return {
      success,
      progressLabel: input.topFiller
        ? i18n.t('practice:goalEvaluation.cutTopFiller.progress', {
            word: topWord,
            count: topFillerCount,
            allowed,
          })
        : i18n.t('practice:goalEvaluation.cutTopFiller.noProgress'),
      statusText: input.topFiller
        ? success
          ? i18n.t('practice:goalEvaluation.cutTopFiller.successStatus', { word: topWord })
          : i18n.t('practice:goalEvaluation.cutTopFiller.failureStatus', { word: topWord })
        : i18n.t('practice:goalEvaluation.cutTopFiller.noneStatus'),
      nextAction: input.topFiller
        ? i18n.t('practice:goalEvaluation.cutTopFiller.nextWithWord', { word: topWord })
        : i18n.t('practice:goalEvaluation.cutTopFiller.nextWithoutWord'),
    }
  }

  const allowed = getAllowedFillerCount(input.durationSeconds)
  const success = input.fillerCount <= allowed
  return {
    success,
    progressLabel: i18n.t('practice:goalEvaluation.reduceFillers.progress', {
      count: input.fillerCount,
      allowed,
    }),
    statusText: success
      ? i18n.t('practice:goalEvaluation.reduceFillers.successStatus')
      : i18n.t('practice:goalEvaluation.reduceFillers.failureStatus', {
          difference: input.fillerCount - allowed,
        }),
    nextAction: input.topFiller
      ? i18n.t('practice:goalEvaluation.reduceFillers.nextWithWord', { word: input.topFiller })
      : i18n.t('practice:goalEvaluation.reduceFillers.nextWithoutWord'),
  }
}
