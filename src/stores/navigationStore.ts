import { create } from 'zustand'
import type { Screen } from '../types'

interface NavigationState {
  screen: Screen
  setScreen: (screen: Screen) => void
}

export const useNavigationStore = create<NavigationState>((set) => ({
  screen: 'home',
  setScreen: (screen) => set({ screen }),
}))
