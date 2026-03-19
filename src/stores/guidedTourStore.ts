import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface GuidedTourState {
  isOpen: boolean
  currentStepIndex: number
  dismissed: boolean
  completed: boolean
  start: () => void
  goToStep: (index: number) => void
  next: (totalSteps: number) => void
  previous: () => void
  close: () => void
  skip: () => void
  finish: () => void
}

export const useGuidedTourStore = create<GuidedTourState>()(
  persist(
    (set) => ({
      isOpen: false,
      currentStepIndex: 0,
      dismissed: false,
      completed: false,
      start: () => set({ isOpen: true, currentStepIndex: 0 }),
      goToStep: (index) => set({ currentStepIndex: Math.max(0, index) }),
      next: (totalSteps) =>
        set((state) => ({
          currentStepIndex: Math.min(state.currentStepIndex + 1, Math.max(0, totalSteps - 1)),
        })),
      previous: () =>
        set((state) => ({
          currentStepIndex: Math.max(0, state.currentStepIndex - 1),
        })),
      close: () => set({ isOpen: false }),
      skip: () => set({ isOpen: false, dismissed: true }),
      finish: () => set({ isOpen: false, completed: true }),
    }),
    {
      name: 'talkfit-guided-tour',
      partialize: (state) => ({
        dismissed: state.dismissed,
        completed: state.completed,
      }),
    }
  )
)
