// Grade a session based on filler count and average WPM
export function gradeSession(fillerCount: number, avgWpm: number, durationSeconds: number): string {
  if (durationSeconds < 10) return '—'

  const fillerPerMinute = fillerCount / (durationSeconds / 60)
  let score = 100

  // Penalize for fillers per minute
  if (fillerPerMinute > 15) score -= 40
  else if (fillerPerMinute > 10) score -= 30
  else if (fillerPerMinute > 6) score -= 20
  else if (fillerPerMinute > 3) score -= 10
  else if (fillerPerMinute > 1) score -= 5

  // Penalize for out-of-range WPM (ideal 120–180)
  if (avgWpm > 220 || avgWpm < 80) score -= 20
  else if (avgWpm > 190 || avgWpm < 100) score -= 10
  else if (avgWpm > 180 || avgWpm < 120) score -= 5

  if (score >= 95) return 'A+'
  if (score >= 88) return 'A'
  if (score >= 82) return 'A-'
  if (score >= 77) return 'B+'
  if (score >= 72) return 'B'
  if (score >= 66) return 'B-'
  if (score >= 60) return 'C+'
  if (score >= 50) return 'C'
  return 'D'
}

export function gradeColor(grade: string): string {
  if (grade.startsWith('A')) return 'text-accent-green'
  if (grade.startsWith('B')) return 'text-accent-blue'
  if (grade.startsWith('C')) return 'text-accent-amber'
  return 'text-accent-red'
}

export function fillerCountColor(count: number): string {
  if (count <= 5) return 'text-accent-green'
  if (count <= 15) return 'text-accent-amber'
  return 'text-accent-red'
}

export function fillerBadgeStyle(count: number): string {
  if (count <= 5) return 'bg-green-50 text-green-700'
  if (count <= 15) return 'bg-amber-50 text-amber-700'
  return 'bg-red-50 text-red-700'
}

export function wpmStatus(wpm: number, low: number, high: number): 'slow' | 'normal' | 'fast' {
  if (wpm < low) return 'slow'
  if (wpm > high) return 'fast'
  return 'normal'
}

export function wpmColor(status: 'slow' | 'normal' | 'fast'): string {
  if (status === 'fast') return 'text-accent-red'
  if (status === 'slow') return 'text-accent-purple'
  return 'text-accent-green'
}

export function wpmLabel(status: 'slow' | 'normal' | 'fast'): string {
  if (status === 'fast') return '語速偏快'
  if (status === 'slow') return '語速偏慢'
  return '速度適中'
}
