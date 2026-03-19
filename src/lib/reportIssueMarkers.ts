import i18n from '../i18n'
import type { ReportIssueKind, ReportIssueMarker, SessionSummary, SpeedRange } from '../types'

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

export function buildTranscriptTimeline(report: Pick<SessionSummary, 'transcript' | 'durationSeconds'>): number[] {
  const { transcript, durationSeconds } = report
  if (transcript.length === 0) return []

  const uniqueTimestamps = new Set(transcript.map((segment) => segment.timestamp))
  const firstTimestamp = transcript[0]?.timestamp ?? 0
  const hasMeaningfulTimestamps = uniqueTimestamps.size > 1 || (transcript.length === 1 && firstTimestamp > 0)

  if (hasMeaningfulTimestamps) {
    return transcript.map((segment) => clamp(segment.timestamp, 0, durationSeconds))
  }

  if (transcript.length === 1) return [0]

  return transcript.map((_, index) => {
    const ratio = index / (transcript.length - 1)
    return clamp(Math.round(ratio * durationSeconds), 0, durationSeconds)
  })
}

export function findNearestSegmentIndex(timeline: number[], timestamp: number): number {
  if (timeline.length === 0) return -1

  let nearestIndex = 0
  let nearestDistance = Infinity

  timeline.forEach((segmentTime, index) => {
    const distance = Math.abs(segmentTime - timestamp)
    if (distance < nearestDistance) {
      nearestDistance = distance
      nearestIndex = index
    }
  })

  return nearestIndex
}

function getSpeedMarkerKind(wpm: number, speedRange: SpeedRange): ReportIssueKind {
  if (wpm > speedRange.high) return 'speed-fast'
  if (wpm < speedRange.low) return 'speed-slow'
  return 'speed-normal'
}

export function buildFillerMarkers(report: SessionSummary): ReportIssueMarker[] {
  const timeline = buildTranscriptTimeline(report)
  const occurrenceTotals = new Map<string, number>()

  report.transcript.forEach((segment) => {
    if (!segment.isFiller) return
    const word = segment.fillerWord ?? segment.text.trim()
    occurrenceTotals.set(word, (occurrenceTotals.get(word) ?? 0) + 1)
  })

  const seenCounts = new Map<string, number>()

  return report.transcript.flatMap((segment, segmentIndex) => {
    if (!segment.isFiller) return []

    const word = segment.fillerWord ?? segment.text.trim()
    const occurrenceIndex = seenCounts.get(word) ?? 0
    seenCounts.set(word, occurrenceIndex + 1)

    return [{
      id: `filler-${word}-${segmentIndex}`,
      kind: 'filler' as const,
      timestamp: timeline[segmentIndex] ?? 0,
      label: word,
      segmentIndex,
      fillerWord: word,
      occurrenceIndex,
      occurrenceCount: occurrenceTotals.get(word) ?? 1,
    }]
  })
}

export function buildSpeedMarkers(
  report: SessionSummary,
  speedRange: SpeedRange
): ReportIssueMarker[] {
  const timeline = buildTranscriptTimeline(report)

  return report.speedHistory.map((point, speedPointIndex) => ({
    id: `speed-${speedPointIndex}-${point.time}`,
    kind: getSpeedMarkerKind(point.wpm, speedRange),
    timestamp: clamp(point.time, 0, report.durationSeconds),
    label: i18n.t('report:issues.speedLabel', { wpm: point.wpm }),
    segmentIndex: findNearestSegmentIndex(timeline, point.time),
    speedPointIndex,
  }))
}

export function findPrimaryReportIssue(
  report: SessionSummary,
  speedRange: SpeedRange
): ReportIssueMarker | null {
  const fillerMarker = buildFillerMarkers(report)[0]
  if (fillerMarker) return fillerMarker

  return buildSpeedMarkers(report, speedRange).find((marker) => marker.kind !== 'speed-normal') ?? null
}

export function describeReportIssue(marker: ReportIssueMarker): string {
  if (marker.kind === 'filler') {
    const current = (marker.occurrenceIndex ?? 0) + 1
    const total = marker.occurrenceCount ?? 1
    return i18n.t('report:issues.fillerOccurrence', {
      label: marker.label,
      current,
      total,
    })
  }

  if (marker.kind === 'speed-fast') {
    return i18n.t('report:issues.speedFast', { label: marker.label })
  }

  if (marker.kind === 'speed-slow') {
    return i18n.t('report:issues.speedSlow', { label: marker.label })
  }

  return i18n.t('report:issues.speedNormal', { label: marker.label })
}
