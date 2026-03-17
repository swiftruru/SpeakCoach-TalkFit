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
    return {
      sourceReportId: report.id,
      sourceReportTitle: report.title,
      markerId: marker.id,
      kind: 'filler',
      label: marker.fillerWord ?? marker.label,
      timestamp: marker.timestamp,
      segmentIndex: marker.segmentIndex,
      snippet,
      prompt: `重講這段時，刻意不要說「${marker.fillerWord ?? marker.label}」，把句子一次講完整。`,
      sessionTitle: `片段重練 · ${marker.fillerWord ?? marker.label}`,
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
      prompt: `把這段再講得更俐落一點，盡量維持在 ${speedRange.low}–${speedRange.high} 字/分內。`,
      sessionTitle: '片段重練 · 語速偏慢',
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
    prompt: `把這段放慢一點，句尾多留半拍，先穩回 ${speedRange.low}–${speedRange.high} 字/分。`,
    sessionTitle: '片段重練 · 語速偏快',
    recommendedDurationSeconds: 15,
  }
}
