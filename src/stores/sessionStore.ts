import { create } from 'zustand'
import type { TranscriptSegment, SpeedDataPoint } from '../types'

interface SessionState {
  isRecording: boolean
  isPaused: boolean
  elapsedSeconds: number
  transcript: TranscriptSegment[]
  fillerCounts: Record<string, number>
  speedHistory: SpeedDataPoint[]
  currentWpm: number
  lastFlashedFiller: string | null

  startRecording: () => void
  pauseRecording: () => void
  stopRecording: () => void
  tick: () => void
  addSegment: (segment: TranscriptSegment) => void
  updateCurrentWpm: (wpm: number) => void
  addSpeedPoint: (point: SpeedDataPoint) => void
  flashFiller: (word: string) => void
  reset: () => void
}

const initialState = {
  isRecording: false,
  isPaused: false,
  elapsedSeconds: 0,
  transcript: [] as TranscriptSegment[],
  fillerCounts: {} as Record<string, number>,
  speedHistory: [] as SpeedDataPoint[],
  currentWpm: 0,
  lastFlashedFiller: null as string | null,
}

export const useSessionStore = create<SessionState>((set, get) => ({
  ...initialState,

  startRecording: () => set({ isRecording: true, isPaused: false }),
  pauseRecording: () => set({ isPaused: !get().isPaused }),
  stopRecording: () => set({ isRecording: false, isPaused: false }),

  tick: () => {
    if (get().isRecording && !get().isPaused) {
      set((s) => ({ elapsedSeconds: s.elapsedSeconds + 1 }))
    }
  },

  addSegment: (segment) =>
    set((s) => {
      const newCounts = { ...s.fillerCounts }
      if (segment.isFiller && segment.fillerWord) {
        newCounts[segment.fillerWord] = (newCounts[segment.fillerWord] ?? 0) + 1
      }
      return { transcript: [...s.transcript, segment], fillerCounts: newCounts }
    }),

  updateCurrentWpm: (wpm) => set({ currentWpm: wpm }),

  addSpeedPoint: (point) =>
    set((s) => ({ speedHistory: [...s.speedHistory, point] })),

  flashFiller: (word) => {
    set({ lastFlashedFiller: word })
    setTimeout(() => set({ lastFlashedFiller: null }), 1000)
  },

  reset: () => set(initialState),
}))
