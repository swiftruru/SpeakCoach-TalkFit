import { create } from 'zustand'

interface DemoState {
  isDemoActive: boolean
  currentStepIndex: number
  startDemo: () => void
  stopDemo: () => void
  goToStep: (i: number) => void
}

export const useDemoStore = create<DemoState>((set) => ({
  isDemoActive: false,
  currentStepIndex: 0,
  startDemo: () => set({ isDemoActive: true, currentStepIndex: 0 }),
  stopDemo: () => set({ isDemoActive: false, currentStepIndex: 0 }),
  goToStep: (i) => set({ currentStepIndex: i }),
}))
