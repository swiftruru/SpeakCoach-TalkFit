import i18n from '../i18n'
import type { ReportIssueMarker, RetryPracticeTarget, SessionSummary, SpeedRange } from '../types'

function buildSnippet(report: SessionSummary, segmentIndex: number) {
  const start = Math.max(0, segmentIndex - 1)
  const end = Math.min(report.transcript.length, segmentIndex + 2)
  return report.transcript.slice(start, end).map((segment) => segment.text).join('')
}

export function buildRetryPracticeTarget(
  report: SessionSummary,
  marker: ReportIssueMarker,
  speedRange: SpeedRange
): RetryPracticeTarget {
  const snippet = buildSnippet(report, marker.segmentIndex)

  if (marker.kind === 'filler') {
    const word = marker.fillerWord ?? marker.label
    return {
      sourceReportId: report.id,
      sourceReportTitle: report.title,
      markerId: marker.id,
      kind: 'filler',
      label: word,
      timestamp: marker.timestamp,
      segmentIndex: marker.segmentIndex,
      snippet,
      prompt: i18n.t('practice:retryPractice.fillerPrompt', { word }),
      sessionTitle: i18n.t('practice:retryPractice.fillerSessionTitle', { word }),
      recommendedDurationSeconds: 15,
    }
  }

  if (marker.kind === 'speed-slow') {
    return {
      sourceReportId: report.id,
      sourceReportTitle: report.title,
      markerId: marker.id,
      kind: 'speed-slow',
      label: marker.label,
      timestamp: marker.timestamp,
      segmentIndex: marker.segmentIndex,
      snippet,
      prompt: i18n.t('practice:retryPractice.slowPrompt', {
        low: speedRange.low,
        high: speedRange.high,
      }),
      sessionTitle: i18n.t('practice:retryPractice.slowSessionTitle'),
      recommendedDurationSeconds: 15,
    }
  }

  return {
    sourceReportId: report.id,
    sourceReportTitle: report.title,
    markerId: marker.id,
    kind: 'speed-fast',
    label: marker.label,
    timestamp: marker.timestamp,
    segmentIndex: marker.segmentIndex,
    snippet,
    prompt: i18n.t('practice:retryPractice.fastPrompt', {
      low: speedRange.low,
      high: speedRange.high,
    }),
    sessionTitle: i18n.t('practice:retryPractice.fastSessionTitle'),
    recommendedDurationSeconds: 15,
  }
}
