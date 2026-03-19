import { create } from 'zustand'
import type { RetryFeedbackState, RetryPracticeTarget, SessionSummary } from '../types'

interface ReportState {
  report: SessionSummary | null
  retryFeedback: RetryFeedbackState | null
  setReport: (report: SessionSummary) => void
  setRetryFeedback: (target: RetryPracticeTarget) => void
  clearRetryFeedback: () => void
  clearReport: () => void
}

export const useReportStore = create<ReportState>((set) => ({
  report: null,
  retryFeedback: null,
  setReport: (report) => set({ report, retryFeedback: null }),
  setRetryFeedback: (target) => set({ retryFeedback: { target, createdAt: Date.now() } }),
  clearRetryFeedback: () => set({ retryFeedback: null }),
  clearReport: () => set({ report: null, retryFeedback: null }),
}))
