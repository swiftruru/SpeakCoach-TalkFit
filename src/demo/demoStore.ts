import { create } from 'zustand'

export type DemoMode = 'demo' | 'explore'

interface DemoState {
  mode: DemoMode
  isDemoActive: boolean
  isDemoPaused: boolean
  currentStepIndex: number
  playbackRate: 1 | 1.5 | 2
  setMode: (mode: DemoMode) => void
  startDemo: () => void
  stopDemo: () => void
  togglePause: () => void
  goToStep: (i: number) => void
  cyclePlaybackRate: () => void
}

export const useDemoStore = create<DemoState>((set) => ({
  mode: 'demo',
  isDemoActive: false,
  isDemoPaused: false,
  currentStepIndex: 0,
  playbackRate: 1,
  setMode: (mode) => set((state) => ({
    mode,
    ...(state.isDemoActive ? { isDemoActive: false, isDemoPaused: false, currentStepIndex: 0 } : {}),
  })),
  startDemo: () => set({ isDemoActive: true, isDemoPaused: false, currentStepIndex: 0 }),
  stopDemo: () => set({ isDemoActive: false, isDemoPaused: false, currentStepIndex: 0 }),
  togglePause: () => set((state) => (
    state.isDemoActive
      ? { isDemoPaused: !state.isDemoPaused }
      : state
  )),
  goToStep: (i) => set({ currentStepIndex: i, isDemoPaused: false }),
  cyclePlaybackRate: () => set((state) => ({
    playbackRate:
      state.playbackRate === 1
        ? 1.5
        : state.playbackRate === 1.5
        ? 2
        : 1,
  })),
}))
