import type { TranscriptSegment } from '../types'

export interface SampleReplayEvent {
  atMs: number
  elapsedSeconds: number
  wpm: number
  segment: TranscriptSegment
}

export const SAMPLE_REPLAY_DURATION_SECONDS = 20
export const SAMPLE_REPLAY_TITLE = 'Sample 回放練習'

export const SAMPLE_REPLAY_EVENTS: SampleReplayEvent[] = [
  {
    atMs: 1400,
    elapsedSeconds: 2,
    wpm: 132,
    segment: {
      text: '各位好，今天我要用一分鐘介紹 TalkFit。',
      isFiller: false,
      timestamp: 2,
    },
  },
  {
    atMs: 3200,
    elapsedSeconds: 4,
    wpm: 126,
    segment: {
      text: '嗯',
      isFiller: true,
      fillerWord: '嗯',
      timestamp: 4,
    },
  },
  {
    atMs: 5000,
    elapsedSeconds: 6,
    wpm: 148,
    segment: {
      text: '它會即時幫你抓出演講裡的贅字和語速問題。',
      isFiller: false,
      timestamp: 6,
    },
  },
  {
    atMs: 6900,
    elapsedSeconds: 8,
    wpm: 158,
    segment: {
      text: '然後',
      isFiller: true,
      fillerWord: '然後',
      timestamp: 8,
    },
  },
  {
    atMs: 8800,
    elapsedSeconds: 10,
    wpm: 192,
    segment: {
      text: '當你講太快的時候，系統會直接提醒你放慢。',
      isFiller: false,
      timestamp: 10,
      isSpeedFast: true,
    },
  },
  {
    atMs: 10800,
    elapsedSeconds: 12,
    wpm: 174,
    segment: {
      text: '這樣你就不用等到講完才發現自己失控。',
      isFiller: false,
      timestamp: 12,
    },
  },
  {
    atMs: 12800,
    elapsedSeconds: 14,
    wpm: 154,
    segment: {
      text: '這個',
      isFiller: true,
      fillerWord: '這個',
      timestamp: 14,
    },
  },
  {
    atMs: 14800,
    elapsedSeconds: 16,
    wpm: 166,
    segment: {
      text: '練完之後，報告會把贅字排行榜和語速曲線都整理好。',
      isFiller: false,
      timestamp: 16,
    },
  },
  {
    atMs: 16600,
    elapsedSeconds: 18,
    wpm: 144,
    segment: {
      text: '然後',
      isFiller: true,
      fillerWord: '然後',
      timestamp: 18,
    },
  },
  {
    atMs: 18200,
    elapsedSeconds: 20,
    wpm: 150,
    segment: {
      text: '你可以很清楚知道哪一段最需要重講。',
      isFiller: false,
      timestamp: 20,
    },
  },
]
