import { create } from 'zustand'
import { useRetryPracticeStore } from './retryPracticeStore'
import { useSessionStore } from './sessionStore'
import type { Screen } from '../types'

interface NavigationState {
  screen: Screen
  pendingScreen: Screen | null
  isRecordingExitConfirmOpen: boolean
  setScreen: (screen: Screen) => void
  requestScreen: (screen: Screen) => void
  confirmRecordingExit: () => void
  cancelRecordingExit: () => void
}

export const useNavigationStore = create<NavigationState>((set, get) => ({
  screen: 'home',
  pendingScreen: null,
  isRecordingExitConfirmOpen: false,
  setScreen: (screen) => set({ screen }),
  requestScreen: (screen) => {
    const currentScreen = get().screen
    if (screen === currentScreen) return

    const { isRecording } = useSessionStore.getState()
    if (currentScreen === 'practice' && isRecording) {
      set({
        pendingScreen: screen,
        isRecordingExitConfirmOpen: true,
      })
      return
    }

    set({ screen })
  },
  confirmRecordingExit: () => {
    const { pendingScreen } = get()
    if (!pendingScreen) {
      set({ isRecordingExitConfirmOpen: false })
      return
    }

    useSessionStore.getState().reset()
    useRetryPracticeStore.getState().clearRetryPractice()

    set({
      screen: pendingScreen,
      pendingScreen: null,
      isRecordingExitConfirmOpen: false,
    })
  },
  cancelRecordingExit: () => set({
    pendingScreen: null,
    isRecordingExitConfirmOpen: false,
  }),
}))
