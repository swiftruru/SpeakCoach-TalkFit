import i18n, { normalizeLanguage } from '../i18n'
import { DEFAULT_LANGUAGE, type AppLanguage } from '../i18n/config'
import type { FillerCategory, FillerWord } from '../types'

interface BuiltinFillerDefinition {
  id: string
  category: Exclude<FillerCategory, 'custom'>
  labels: Record<AppLanguage, string>
  defaultEnabled: boolean
}

const BUILTIN_FILLER_DEFINITIONS: BuiltinFillerDefinition[] = [
  { id: 'um', category: 'filler-sound', labels: { 'zh-TW': '嗯', en: 'um' }, defaultEnabled: true },
  { id: 'ah', category: 'filler-sound', labels: { 'zh-TW': '啊', en: 'uh' }, defaultEnabled: true },
  { id: 'er', category: 'filler-sound', labels: { 'zh-TW': 'ㄜ', en: 'erm' }, defaultEnabled: true },
  { id: 'then', category: 'connector', labels: { 'zh-TW': '然後', en: 'and then' }, defaultEnabled: true },
  { id: 'and', category: 'connector', labels: { 'zh-TW': '而且', en: 'also' }, defaultEnabled: true },
  { id: 'next', category: 'connector', labels: { 'zh-TW': '再來', en: 'next up' }, defaultEnabled: true },
  { id: 'after-that', category: 'connector', labels: { 'zh-TW': '接下來', en: 'after that' }, defaultEnabled: true },
  { id: 'this', category: 'demonstrative', labels: { 'zh-TW': '這個', en: 'this thing' }, defaultEnabled: true },
  { id: 'that', category: 'demonstrative', labels: { 'zh-TW': '那個', en: 'that thing' }, defaultEnabled: true },
  { id: 'honestly', category: 'opener', labels: { 'zh-TW': '老實說', en: 'honestly' }, defaultEnabled: true },
  { id: 'i-think', category: 'opener', labels: { 'zh-TW': '我覺得', en: 'I think' }, defaultEnabled: true },
  { id: 'basically', category: 'opener', labels: { 'zh-TW': '基本上', en: 'basically' }, defaultEnabled: true },
  { id: 'actually', category: 'opener', labels: { 'zh-TW': '其實', en: 'actually' }, defaultEnabled: true },
  { id: 'you-know', category: 'closer', labels: { 'zh-TW': '你懂我意思嗎', en: 'you know' }, defaultEnabled: true },
  { id: 'right-question', category: 'closer', labels: { 'zh-TW': '對不對', en: 'right?' }, defaultEnabled: true },
  { id: 'isnt-it', category: 'closer', labels: { 'zh-TW': '是不是', en: 'does that make sense?' }, defaultEnabled: true },
  { id: 'right', category: 'closer', labels: { 'zh-TW': '對', en: 'okay?' }, defaultEnabled: true },
  { id: 'like', category: 'connector', labels: { 'zh-TW': '就是', en: 'like' }, defaultEnabled: false },
  { id: 'so', category: 'connector', labels: { 'zh-TW': '所以說', en: 'so' }, defaultEnabled: false },
]

function getCurrentLanguage(): AppLanguage {
  return normalizeLanguage(i18n.resolvedLanguage ?? i18n.language ?? DEFAULT_LANGUAGE)
}

function getBuiltinDefinition(fillerWord: Pick<FillerWord, 'builtinId' | 'word'>) {
  if (fillerWord.builtinId) {
    return BUILTIN_FILLER_DEFINITIONS.find((definition) => definition.id === fillerWord.builtinId)
  }

  return BUILTIN_FILLER_DEFINITIONS.find((definition) =>
    Object.values(definition.labels).includes(fillerWord.word)
  )
}

export function getDefaultFillerWords(language: AppLanguage = getCurrentLanguage()): FillerWord[] {
  return BUILTIN_FILLER_DEFINITIONS.map((definition) => ({
    builtinId: definition.id,
    word: definition.labels[language],
    category: definition.category,
    enabled: definition.defaultEnabled,
  }))
}

export const DEFAULT_FILLER_WORDS: FillerWord[] = getDefaultFillerWords(DEFAULT_LANGUAGE)

export function localizeFillerWords(
  fillerWords: FillerWord[],
  language: AppLanguage = getCurrentLanguage()
): FillerWord[] {
  const builtInEnabledState = new Map<string, boolean>()
  const customWords: FillerWord[] = []

  fillerWords.forEach((fillerWord) => {
    const definition = getBuiltinDefinition(fillerWord)
    if (definition) {
      builtInEnabledState.set(definition.id, fillerWord.enabled)
      return
    }

    customWords.push(fillerWord)
  })

  const localizedBuiltIns = getDefaultFillerWords(language).map((fillerWord) => ({
    ...fillerWord,
    enabled: builtInEnabledState.get(fillerWord.builtinId ?? '') ?? fillerWord.enabled,
  }))

  return [...localizedBuiltIns, ...customWords]
}

export function getFillerCategoryLabel(category: FillerCategory) {
  return i18n.t(`practice:fillerCategories.${category}`)
}

export const CATEGORY_COLORS: Record<string, string> = {
  'filler-sound': 'bg-red-100 text-red-700 border-red-200',
  connector: 'bg-amber-100 text-amber-700 border-amber-200',
  demonstrative: 'bg-blue-100 text-blue-700 border-blue-200',
  opener: 'bg-purple-100 text-purple-700 border-purple-200',
  closer: 'bg-green-100 text-green-700 border-green-200',
  custom: 'bg-gray-100 text-gray-700 border-gray-200',
}
