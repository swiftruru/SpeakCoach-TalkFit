import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { FillerWord, PracticeGoalId, PracticePresetId, SpeedRange } from '../types'
import { DEFAULT_LANGUAGE, type AppLanguage } from '../i18n/config'
import {
  applyPresetToFillerWords,
  DEFAULT_PRACTICE_PRESET_ID,
  PRACTICE_PRESETS,
} from '../lib/practicePresets'
import { DEFAULT_PRACTICE_GOAL_ID } from '../lib/practiceGoals'

interface SettingsState {
  preset: PracticePresetId
  practiceGoalId: PracticeGoalId
  fillerWords: FillerWord[]
  speedRange: SpeedRange
  fillerDetectionEnabled: boolean
  speedMonitoringEnabled: boolean
  repeatConnectorEnabled: boolean
  hapticEnabled: boolean
  soundEnabled: boolean
  language: AppLanguage
  micDeviceId: string

  setFillerWords: (words: FillerWord[]) => void
  toggleFillerWord: (word: string) => void
  addFillerWord: (word: string) => void
  removeFillerWord: (word: string) => void
  setSpeedRange: (range: SpeedRange) => void
  applyPreset: (presetId: Exclude<PracticePresetId, 'custom'>) => void
  setPracticeGoalId: (goalId: PracticeGoalId) => void
  setFillerDetectionEnabled: (v: boolean) => void
  setSpeedMonitoringEnabled: (v: boolean) => void
  setRepeatConnectorEnabled: (v: boolean) => void
  setHapticEnabled: (v: boolean) => void
  setSoundEnabled: (v: boolean) => void
  setLanguage: (lang: AppLanguage) => void
  setMicDeviceId: (id: string) => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      preset: DEFAULT_PRACTICE_PRESET_ID,
      practiceGoalId: DEFAULT_PRACTICE_GOAL_ID,
      fillerWords: applyPresetToFillerWords([], DEFAULT_PRACTICE_PRESET_ID, DEFAULT_LANGUAGE),
      speedRange: { ...PRACTICE_PRESETS[DEFAULT_PRACTICE_PRESET_ID].speedRange },
      fillerDetectionEnabled: true,
      speedMonitoringEnabled: true,
      repeatConnectorEnabled: true,
      hapticEnabled: true,
      soundEnabled: false,
      language: DEFAULT_LANGUAGE,
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
          fillerWords: applyPresetToFillerWords(get().fillerWords, presetId, get().language),
        }),
      setPracticeGoalId: (goalId) => set({ practiceGoalId: goalId }),
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
