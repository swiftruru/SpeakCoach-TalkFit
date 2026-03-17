import { CATEGORY_LABELS, DEFAULT_FILLER_WORDS } from './fillerWords'
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

export const DEFAULT_PRACTICE_PRESET_ID: Exclude<PracticePresetId, 'custom'> = 'project-presentation'

export const PRACTICE_PRESET_LIST: PracticePresetDefinition[] = [
  {
    id: 'interview-intro',
    label: '面試自介',
    description: '放慢一點、講清楚，優先抓填充音、口頭禪開場與尾句確認。',
    speedRange: { low: 110, high: 150 },
    enabledCategories: ['filler-sound', 'demonstrative', 'opener', 'closer'],
  },
  {
    id: 'project-presentation',
    label: '專題簡報',
    description: '最接近完整簡報場景，兼顧內容銜接、語速穩定與贅字控制。',
    speedRange: { low: 120, high: 180 },
    enabledCategories: ['filler-sound', 'connector', 'demonstrative', 'opener', 'closer'],
    disabledWords: ['就是', '所以說'],
  },
  {
    id: 'demo-pitch',
    label: 'Demo Pitch',
    description: '節奏可以更俐落，但要特別壓住「然後」「這個」這類破壞銳利感的詞。',
    speedRange: { low: 135, high: 190 },
    enabledCategories: ['filler-sound', 'connector', 'demonstrative'],
    disabledWords: ['就是', '所以說'],
  },
]

export const PRACTICE_PRESETS = Object.fromEntries(
  PRACTICE_PRESET_LIST.map((preset) => [preset.id, preset])
) as Record<Exclude<PracticePresetId, 'custom'>, PracticePresetDefinition>

export function applyPresetToFillerWords(
  currentWords: FillerWord[],
  presetId: Exclude<PracticePresetId, 'custom'>
) {
  const preset = PRACTICE_PRESETS[presetId]
  const customWords = currentWords.filter((word) => word.category === 'custom')

  const builtInWords = DEFAULT_FILLER_WORDS.map((word) => {
    let enabled = preset.enabledCategories.includes(word.category)

    if (preset.enabledWords?.includes(word.word)) enabled = true
    if (preset.disabledWords?.includes(word.word)) enabled = false

    return { ...word, enabled }
  })

  return [...builtInWords, ...customWords]
}

export function getPresetCategoryLabels(categories: FillerCategory[]) {
  return categories.map((category) => CATEGORY_LABELS[category])
}
