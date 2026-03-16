import { create } from 'zustand'
import type { SessionSummary } from '../types'

interface ReportState {
  report: SessionSummary | null
  setReport: (report: SessionSummary) => void
  clearReport: () => void
}

export const useReportStore = create<ReportState>((set) => ({
  report: null,
  setReport: (report) => set({ report }),
  clearReport: () => set({ report: null }),
}))
