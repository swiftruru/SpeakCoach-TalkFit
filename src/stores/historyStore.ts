import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { SessionSummary } from '../types'

interface HistoryState {
  sessions: SessionSummary[]
  addSession: (session: SessionSummary) => void
  removeSession: (id: string) => void
  clearAll: () => void
}

export const useHistoryStore = create<HistoryState>()(
  persist(
    (set, get) => ({
      sessions: [],
      addSession: (session) =>
        set({ sessions: [session, ...get().sessions] }),
      removeSession: (id) =>
        set({ sessions: get().sessions.filter((s) => s.id !== id) }),
      clearAll: () => set({ sessions: [] }),
    }),
    { name: 'talkfit-history' }
  )
)
