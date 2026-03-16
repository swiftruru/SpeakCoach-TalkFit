import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { FillerWord } from '../types'
import { DEFAULT_FILLER_WORDS } from '../lib/fillerWords'

interface SettingsState {
  fillerWords: FillerWord[]
  speedRange: { low: number; high: number }
  fillerDetectionEnabled: boolean
  speedMonitoringEnabled: boolean
  repeatConnectorEnabled: boolean
  hapticEnabled: boolean
  soundEnabled: boolean
  language: string
  micDeviceId: string

  setFillerWords: (words: FillerWord[]) => void
  toggleFillerWord: (word: string) => void
  addFillerWord: (word: string) => void
  removeFillerWord: (word: string) => void
  setSpeedRange: (range: { low: number; high: number }) => void
  setFillerDetectionEnabled: (v: boolean) => void
  setSpeedMonitoringEnabled: (v: boolean) => void
  setRepeatConnectorEnabled: (v: boolean) => void
  setHapticEnabled: (v: boolean) => void
  setSoundEnabled: (v: boolean) => void
  setLanguage: (lang: string) => void
  setMicDeviceId: (id: string) => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      fillerWords: DEFAULT_FILLER_WORDS,
      speedRange: { low: 120, high: 180 },
      fillerDetectionEnabled: true,
      speedMonitoringEnabled: true,
      repeatConnectorEnabled: true,
      hapticEnabled: true,
      soundEnabled: false,
      language: 'zh-TW',
      micDeviceId: 'default',

      setFillerWords: (words) => set({ fillerWords: words }),

      toggleFillerWord: (word) =>
        set({
          fillerWords: get().fillerWords.map((fw) =>
            fw.word === word ? { ...fw, enabled: !fw.enabled } : fw
          ),
        }),

      addFillerWord: (word) => {
        const trimmed = word.trim()
        if (!trimmed || get().fillerWords.some((fw) => fw.word === trimmed)) return
        set({
          fillerWords: [...get().fillerWords, { word: trimmed, category: 'custom', enabled: true }],
        })
      },

      removeFillerWord: (word) =>
        set({ fillerWords: get().fillerWords.filter((fw) => fw.word !== word) }),

      setSpeedRange: (range) => set({ speedRange: range }),
      setFillerDetectionEnabled: (v) => set({ fillerDetectionEnabled: v }),
      setSpeedMonitoringEnabled: (v) => set({ speedMonitoringEnabled: v }),
      setRepeatConnectorEnabled: (v) => set({ repeatConnectorEnabled: v }),
      setHapticEnabled: (v) => set({ hapticEnabled: v }),
      setSoundEnabled: (v) => set({ soundEnabled: v }),
      setLanguage: (lang) => set({ language: lang }),
      setMicDeviceId: (id) => set({ micDeviceId: id }),
    }),
    { name: 'talkfit-settings' }
  )
)
