import { PRACTICE_GOALS, evaluatePracticeGoal } from './practiceGoals'
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
  const goal = PRACTICE_GOALS[goalId]
  const goalEvaluation = evaluatePracticeGoal(report, goalId, speedRange)

  if (report.topFiller && topFillerCount > 0) {
    tips.push({
      id: 'top-filler',
      title: `先壓低「${report.topFiller}」`,
      detail: `這次共出現 ${topFillerCount} 次，先點排行榜跳到對應片段，逐段重講會最快看到效果。`,
      tone: 'red',
    })
  }

  if (speedStats.fastCount > 0) {
    tips.push({
      id: 'speed-fast',
      title: '先處理偏快片段',
      detail: `有 ${speedStats.fastCount} 個語速點高於 ${speedRange.high} 字/分，先把句尾收慢，再進下一句。`,
      tone: 'amber',
    })
  }

  if (speedStats.slowCount > 0) {
    tips.push({
      id: 'speed-slow',
      title: '補上句子的推進感',
      detail: `有 ${speedStats.slowCount} 個語速點低於 ${speedRange.low} 字/分，可先縮短停頓與拉長尾音。`,
      tone: 'blue',
    })
  }

  tips.push({
    id: 'goal-focus',
    title: `下一輪只專注「${goal.label}」`,
    detail: goalEvaluation.success
      ? `這次已達成目標，下一輪可以維持同目標再壓低標準，或換更高挑戰。`
      : goalEvaluation.nextAction,
    tone: goalEvaluation.success ? 'green' : 'blue',
  })

  while (tips.length < 3) {
    tips.push({
      id: `fallback-${tips.length}`,
      title: '用問題片段跳轉重練',
      detail: '直接點贅字排行榜或異常語速點，把注意力集中在最需要修正的片段。',
      tone: 'blue',
    })
  }

  return tips.slice(0, 3)
}
