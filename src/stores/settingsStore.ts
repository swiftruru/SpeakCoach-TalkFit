import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { FillerWord, PracticePresetId, SpeedRange } from '../types'
import { DEFAULT_FILLER_WORDS } from '../lib/fillerWords'
import {
  applyPresetToFillerWords,
  DEFAULT_PRACTICE_PRESET_ID,
  PRACTICE_PRESETS,
} from '../lib/practicePresets'

interface SettingsState {
  preset: PracticePresetId
  fillerWords: FillerWord[]
  speedRange: SpeedRange
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
  setSpeedRange: (range: SpeedRange) => void
  applyPreset: (presetId: Exclude<PracticePresetId, 'custom'>) => void
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
      preset: DEFAULT_PRACTICE_PRESET_ID,
      fillerWords: applyPresetToFillerWords(DEFAULT_FILLER_WORDS, DEFAULT_PRACTICE_PRESET_ID),
      speedRange: { ...PRACTICE_PRESETS[DEFAULT_PRACTICE_PRESET_ID].speedRange },
      fillerDetectionEnabled: true,
      speedMonitoringEnabled: true,
      repeatConnectorEnabled: true,
      hapticEnabled: true,
      soundEnabled: false,
      language: 'zh-TW',
      micDeviceId: 'default',

      setFillerWords: (words) => set({ fillerWords: words, preset: 'custom' }),

      toggleFillerWord: (word) =>
        set({
          preset: 'custom',
          fillerWords: get().fillerWords.map((fw) =>
            fw.word === word ? { ...fw, enabled: !fw.enabled } : fw
          ),
        }),

      addFillerWord: (word) => {
        const trimmed = word.trim()
        if (!trimmed || get().fillerWords.some((fw) => fw.word === trimmed)) return
        set({
          preset: 'custom',
          fillerWords: [...get().fillerWords, { word: trimmed, category: 'custom', enabled: true }],
        })
      },

      removeFillerWord: (word) =>
        set({
          preset: 'custom',
          fillerWords: get().fillerWords.filter((fw) => fw.word !== word),
        }),

      setSpeedRange: (range) => set({ speedRange: range, preset: 'custom' }),
      applyPreset: (presetId) =>
        set({
          preset: presetId,
          speedRange: { ...PRACTICE_PRESETS[presetId].speedRange },
          fillerWords: applyPresetToFillerWords(get().fillerWords, presetId),
        }),
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
