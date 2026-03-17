import { create } from 'zustand'
import type { RetryPracticeTarget } from '../types'

interface RetryPracticeState {
  target: RetryPracticeTarget | null
  startRetryPractice: (target: RetryPracticeTarget) => void
  clearRetryPractice: () => void
}

export const useRetryPracticeStore = create<RetryPracticeState>((set) => ({
  target: null,
  startRetryPractice: (target) => set({ target }),
  clearRetryPractice: () => set({ target: null }),
}))
