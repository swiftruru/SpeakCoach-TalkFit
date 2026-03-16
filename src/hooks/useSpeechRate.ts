import { useRef, useCallback } from 'react'

interface SpeechRateResult {
  wpm: number
}

// Sliding window: count chars in last N seconds, convert to WPM
export function useSpeechRate(windowSeconds = 10) {
  const charLog = useRef<{ time: number; count: number }[]>([])

  const addText = useCallback((text: string): SpeechRateResult => {
    const now = Date.now()
    const trimmed = text.replace(/\s/g, '')
    if (trimmed.length > 0) {
      charLog.current.push({ time: now, count: trimmed.length })
    }

    // Remove entries older than window
    const cutoff = now - windowSeconds * 1000
    charLog.current = charLog.current.filter((e) => e.time >= cutoff)

    const totalChars = charLog.current.reduce((sum, e) => sum + e.count, 0)
    const wpm = Math.round((totalChars / windowSeconds) * 60)

    return { wpm }
  }, [windowSeconds])

  const reset = useCallback(() => {
    charLog.current = []
  }, [])

  return { addText, reset }
}
