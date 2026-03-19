export type Screen = 'home' | 'practice' | 'report' | 'history' | 'settings'

export type FillerCategory =
  | 'filler-sound'
  | 'connector'
  | 'demonstrative'
  | 'opener'
  | 'closer'
  | 'custom'

export type PracticePresetId =
  | 'interview-intro'
  | 'project-presentation'
  | 'demo-pitch'
  | 'custom'

export type PracticeGoalId =
  | 'reduce-fillers'
  | 'steady-speed'
  | 'cut-top-filler'

export interface FillerWord {
  builtinId?: string
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
  time: number
  wpm: number
}

export type SpeedStatus = 'slow' | 'normal' | 'fast'

export type ReportIssueKind = 'filler' | 'speed-fast' | 'speed-normal' | 'speed-slow'

export interface ReportIssueMarker {
  id: string
  kind: ReportIssueKind
  timestamp: number
  label: string
  segmentIndex: number
  speedPointIndex?: number
  fillerWord?: string
  occurrenceIndex?: number
  occurrenceCount?: number
}

export interface RetryPracticeTarget {
  sourceReportId: string
  sourceReportTitle: string
  markerId: string
  kind: Exclude<ReportIssueKind, 'speed-normal'>
  label: string
  timestamp: number
  segmentIndex: number
  snippet: string
  prompt: string
  sessionTitle: string
  recommendedDurationSeconds: number
}

export interface SessionSummary {
  id: string
  title: string
  date: string
  durationSeconds: number
  avgWpm: number
  fillerCount: number
  fillerCounts: Record<string, number>
  topFiller: string | null
  grade: string           // A, A-, B+, B, C+, C, ...
  presetSnapshot?: PracticePresetId
  practiceGoalId?: PracticeGoalId
  speedRangeSnapshot?: SpeedRange
  speedHistory: SpeedDataPoint[]
  transcript: TranscriptSegment[]
}

export interface RetryFeedbackState {
  target: RetryPracticeTarget
  createdAt: number
}

export interface AnnotationItem {
  id: string
  targetId: string
  title: string
  description: string
  type: 'feature' | 'design' | 'tech'
}
