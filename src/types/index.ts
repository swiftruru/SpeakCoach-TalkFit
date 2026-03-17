export type Screen = 'home' | 'practice' | 'report' | 'history' | 'settings'

export type FillerCategory =
  | 'filler-sound'      // 填充音: 嗯、啊、ㄜ
  | 'connector'         // 連接贅詞: 然後、而且、再來、接下來
  | 'demonstrative'     // 指示贅詞: 這個、那個
  | 'opener'            // 習慣性開場白: 老實說、我覺得、基本上、其實
  | 'closer'            // 習慣性結尾: 你懂我意思嗎、對不對、是不是、對
  | 'custom'

export type PracticePresetId =
  | 'interview-intro'
  | 'project-presentation'
  | 'demo-pitch'
  | 'custom'

export interface FillerWord {
  word: string
  category: FillerCategory
  enabled: boolean
}

export interface SpeedRange {
  low: number
  high: number
}

export interface TranscriptSegment {
  text: string
  isFiller: boolean
  fillerWord?: string
  timestamp: number
  isSpeedFast?: boolean
  isSpeedSlow?: boolean
}

export interface SpeedDataPoint {
  time: number    // seconds
  wpm: number
}

export type SpeedStatus = 'slow' | 'normal' | 'fast'

export interface SessionSummary {
  id: string
  title: string
  date: string            // ISO string
  durationSeconds: number
  avgWpm: number
  fillerCount: number
  fillerCounts: Record<string, number>
  topFiller: string | null
  grade: string           // A, A-, B+, B, C+, C, ...
  speedHistory: SpeedDataPoint[]
  transcript: TranscriptSegment[]
}

export interface AnnotationItem {
  id: string
  targetId: string
  title: string
  description: string
  type: 'feature' | 'design' | 'tech'
}
