import i18n from '../i18n'
import { getDefaultFillerWords, getFillerCategoryLabel } from './fillerWords'
import { type AppLanguage } from '../i18n/config'
import type { FillerCategory, FillerWord, PracticePresetId, SpeedRange } from '../types'

export interface PracticePresetDefinition {
  id: Exclude<PracticePresetId, 'custom'>
  label: string
  description: string
  speedRange: SpeedRange
  enabledCategories: FillerCategory[]
  disabledWords?: string[]
  enabledWords?: string[]
}

interface PracticePresetConfig {
  speedRange: SpeedRange
  enabledCategories: FillerCategory[]
  disabledWordIds?: string[]
  enabledWordIds?: string[]
}

export const DEFAULT_PRACTICE_PRESET_ID: Exclude<PracticePresetId, 'custom'> = 'project-presentation'

const PRACTICE_PRESET_IDS: Array<Exclude<PracticePresetId, 'custom'>> = [
  'interview-intro',
  'project-presentation',
  'demo-pitch',
]

const PRACTICE_PRESET_CONFIG: Record<Exclude<PracticePresetId, 'custom'>, PracticePresetConfig> = {
  'interview-intro': {
    speedRange: { low: 110, high: 150 },
    enabledCategories: ['filler-sound', 'demonstrative', 'opener', 'closer'],
  },
  'project-presentation': {
    speedRange: { low: 120, high: 180 },
    enabledCategories: ['filler-sound', 'connector', 'demonstrative', 'opener', 'closer'],
    disabledWordIds: ['like', 'so'],
  },
  'demo-pitch': {
    speedRange: { low: 135, high: 190 },
    enabledCategories: ['filler-sound', 'connector', 'demonstrative'],
    disabledWordIds: ['like', 'so'],
  },
}

export const PRACTICE_PRESETS = PRACTICE_PRESET_CONFIG

export function getPracticePreset(presetId: Exclude<PracticePresetId, 'custom'>): PracticePresetDefinition {
  const preset = PRACTICE_PRESET_CONFIG[presetId]
  return {
    id: presetId,
    label: i18n.t(`practice:presets.${presetId}.label`),
    description: i18n.t(`practice:presets.${presetId}.description`),
    ...preset,
  }
}

export function getPracticePresetList(): PracticePresetDefinition[] {
  return PRACTICE_PRESET_IDS.map(getPracticePreset)
}

export function applyPresetToFillerWords(
  currentWords: FillerWord[],
  presetId: Exclude<PracticePresetId, 'custom'>,
  language?: AppLanguage
) {
  const preset = PRACTICE_PRESET_CONFIG[presetId]
  const customWords = currentWords.filter((word) => word.category === 'custom')

  const builtInWords = getDefaultFillerWords(language).map((word) => {
    let enabled = preset.enabledCategories.includes(word.category)

    if (word.builtinId && preset.enabledWordIds?.includes(word.builtinId)) enabled = true
    if (word.builtinId && preset.disabledWordIds?.includes(word.builtinId)) enabled = false

    return { ...word, enabled }
  })

  return [...builtInWords, ...customWords]
}

export function getPresetCategoryLabels(categories: FillerCategory[]) {
  return categories.map((category) => getFillerCategoryLabel(category))
}
