import type { FillerWord } from '../types'

export const DEFAULT_FILLER_WORDS: FillerWord[] = [
  // 填充音
  { word: '嗯', category: 'filler-sound', enabled: true },
  { word: '啊', category: 'filler-sound', enabled: true },
  { word: 'ㄜ', category: 'filler-sound', enabled: true },
  // 連接贅詞
  { word: '然後', category: 'connector', enabled: true },
  { word: '而且', category: 'connector', enabled: true },
  { word: '再來', category: 'connector', enabled: true },
  { word: '接下來', category: 'connector', enabled: true },
  // 指示贅詞
  { word: '這個', category: 'demonstrative', enabled: true },
  { word: '那個', category: 'demonstrative', enabled: true },
  // 習慣性開場白
  { word: '老實說', category: 'opener', enabled: true },
  { word: '我覺得', category: 'opener', enabled: true },
  { word: '基本上', category: 'opener', enabled: true },
  { word: '其實', category: 'opener', enabled: true },
  // 習慣性結尾
  { word: '你懂我意思嗎', category: 'closer', enabled: true },
  { word: '對不對', category: 'closer', enabled: true },
  { word: '是不是', category: 'closer', enabled: true },
  { word: '對', category: 'closer', enabled: true },
  // Common extras (disabled by default)
  { word: '就是', category: 'connector', enabled: false },
  { word: '所以說', category: 'connector', enabled: false },
]

export const CATEGORY_LABELS: Record<string, string> = {
  'filler-sound': '填充音',
  'connector': '連接贅詞',
  'demonstrative': '指示贅詞',
  'opener': '習慣性開場白',
  'closer': '習慣性結尾',
  'custom': '自訂',
}

export const CATEGORY_COLORS: Record<string, string> = {
  'filler-sound': 'bg-red-100 text-red-700 border-red-200',
  'connector': 'bg-amber-100 text-amber-700 border-amber-200',
  'demonstrative': 'bg-blue-100 text-blue-700 border-blue-200',
  'opener': 'bg-purple-100 text-purple-700 border-purple-200',
  'closer': 'bg-green-100 text-green-700 border-green-200',
  'custom': 'bg-gray-100 text-gray-700 border-gray-200',
}
