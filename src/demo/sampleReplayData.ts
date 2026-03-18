import i18n from '../i18n'
import type { TranscriptSegment } from '../types'

export interface SampleReplayEvent {
  atMs: number
  elapsedSeconds: number
  wpm: number
  segment: TranscriptSegment
}

export const SAMPLE_REPLAY_DURATION_SECONDS = 10

export function getSampleReplayTitle() {
  return i18n.t('demo:sampleReplay.title')
}

export function getSampleReplayEvents(): SampleReplayEvent[] {
  return [
    {
      atMs: 1200,
      elapsedSeconds: 1,
      wpm: 132,
      segment: {
        text: i18n.t('demo:sampleReplay.segments.intro'),
        isFiller: false,
        timestamp: 1,
      },
    },
    {
      atMs: 2600,
      elapsedSeconds: 3,
      wpm: 126,
      segment: {
        text: i18n.t('demo:sampleReplay.segments.fillerUm'),
        isFiller: true,
        fillerWord: i18n.t('demo:sampleReplay.segments.fillerUm'),
        timestamp: 3,
      },
    },
    {
      atMs: 4200,
      elapsedSeconds: 5,
      wpm: 148,
      segment: {
        text: i18n.t('demo:sampleReplay.segments.realtime'),
        isFiller: false,
        timestamp: 5,
      },
    },
    {
      atMs: 5800,
      elapsedSeconds: 6,
      wpm: 158,
      segment: {
        text: i18n.t('demo:sampleReplay.segments.fillerThen'),
        isFiller: true,
        fillerWord: i18n.t('demo:sampleReplay.segments.fillerThen'),
        timestamp: 6,
      },
    },
    {
      atMs: 7400,
      elapsedSeconds: 8,
      wpm: 192,
      segment: {
        text: i18n.t('demo:sampleReplay.segments.slowDown'),
        isFiller: false,
        timestamp: 8,
        isSpeedFast: true,
      },
    },
    {
      atMs: 9000,
      elapsedSeconds: 10,
      wpm: 166,
      segment: {
        text: i18n.t('demo:sampleReplay.segments.report'),
        isFiller: false,
        timestamp: 10,
      },
    },
  ]
}
