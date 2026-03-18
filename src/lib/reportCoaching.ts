import i18n from '../i18n'
import { evaluatePracticeGoal, getPracticeGoal } from './practiceGoals'
import type { PracticeGoalId, SessionSummary, SpeedRange } from '../types'

export interface ReportCoachingTip {
  id: string
  title: string
  detail: string
  tone: 'red' | 'amber' | 'blue' | 'green'
}

function getSpeedStats(report: SessionSummary, speedRange: SpeedRange) {
  const fastCount = report.speedHistory.filter((point) => point.wpm > speedRange.high).length
  const slowCount = report.speedHistory.filter((point) => point.wpm < speedRange.low).length
  return {
    fastCount,
    slowCount,
  }
}

export function buildReportCoachingTips(
  report: SessionSummary,
  speedRange: SpeedRange,
  goalId: PracticeGoalId
): ReportCoachingTip[] {
  const tips: ReportCoachingTip[] = []
  const topFillerCount = report.topFiller ? report.fillerCounts[report.topFiller] ?? 0 : 0
  const speedStats = getSpeedStats(report, speedRange)
  const goal = getPracticeGoal(goalId)
  const goalEvaluation = evaluatePracticeGoal(report, goalId, speedRange)

  if (report.topFiller && topFillerCount > 0) {
    tips.push({
      id: 'top-filler',
      title: i18n.t('report:coachingTips.topFillerTitle', { word: report.topFiller }),
      detail: i18n.t('report:coachingTips.topFillerDetail', { count: topFillerCount }),
      tone: 'red',
    })
  }

  if (speedStats.fastCount > 0) {
    tips.push({
      id: 'speed-fast',
      title: i18n.t('report:coachingTips.speedFastTitle'),
      detail: i18n.t('report:coachingTips.speedFastDetail', {
        count: speedStats.fastCount,
        high: speedRange.high,
      }),
      tone: 'amber',
    })
  }

  if (speedStats.slowCount > 0) {
    tips.push({
      id: 'speed-slow',
      title: i18n.t('report:coachingTips.speedSlowTitle'),
      detail: i18n.t('report:coachingTips.speedSlowDetail', {
        count: speedStats.slowCount,
        low: speedRange.low,
      }),
      tone: 'blue',
    })
  }

  tips.push({
    id: 'goal-focus',
    title: i18n.t('report:coachingTips.goalFocusTitle', { goal: goal.label }),
    detail: goalEvaluation.success
      ? i18n.t('report:coachingTips.goalFocusSuccess')
      : goalEvaluation.nextAction,
    tone: goalEvaluation.success ? 'green' : 'blue',
  })

  while (tips.length < 3) {
    tips.push({
      id: `fallback-${tips.length}`,
      title: i18n.t('report:coachingTips.fallbackTitle'),
      detail: i18n.t('report:coachingTips.fallbackDetail'),
      tone: 'blue',
    })
  }

  return tips.slice(0, 3)
}
