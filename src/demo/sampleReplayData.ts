import type { TranscriptSegment } from '../types'

export interface SampleReplayEvent {
  atMs: number
  elapsedSeconds: number
  wpm: number
  segment: TranscriptSegment
}

export const SAMPLE_REPLAY_DURATION_SECONDS = 10
export const SAMPLE_REPLAY_TITLE = 'Sample 回放練習'

export const SAMPLE_REPLAY_EVENTS: SampleReplayEvent[] = [
  {
    atMs: 1200,
    elapsedSeconds: 1,
    wpm: 132,
    segment: {
      text: '各位好，今天我要用一分鐘介紹 TalkFit。',
      isFiller: false,
      timestamp: 1,
    },
  },
  {
    atMs: 2600,
    elapsedSeconds: 3,
    wpm: 126,
    segment: {
      text: '嗯',
      isFiller: true,
      fillerWord: '嗯',
      timestamp: 3,
    },
  },
  {
    atMs: 4200,
    elapsedSeconds: 5,
    wpm: 148,
    segment: {
      text: '它會即時幫你抓出演講裡的贅字和語速問題。',
      isFiller: false,
      timestamp: 5,
    },
  },
  {
    atMs: 5800,
    elapsedSeconds: 6,
    wpm: 158,
    segment: {
      text: '然後',
      isFiller: true,
      fillerWord: '然後',
      timestamp: 6,
    },
  },
  {
    atMs: 7400,
    elapsedSeconds: 8,
    wpm: 192,
    segment: {
      text: '當你講太快的時候，系統會直接提醒你放慢。',
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
      text: '練完之後，報告會把贅字排行榜和語速曲線都整理好。',
      isFiller: false,
      timestamp: 10,
    },
  },
]
