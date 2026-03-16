import { useState, useEffect, useRef } from 'react'

export function useAudioLevel(isActive: boolean, barCount = 20, deviceId = 'default') {
  const [levels, setLevels] = useState<number[]>(() => new Array(barCount).fill(0))
  const rafRef = useRef<number | null>(null)
  const contextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    if (!isActive) {
      setLevels(new Array(barCount).fill(0))
      return
    }

    let cancelled = false
    const startTime = performance.now()

    // Try to get real audio; demo animation always runs regardless
    async function setup() {
      try {
        const audioConstraint = deviceId && deviceId !== 'default'
          ? { deviceId: { exact: deviceId } }
          : true
        const stream = await navigator.mediaDevices.getUserMedia({ audio: audioConstraint, video: false })
        if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return }

        streamRef.current = stream
        const ctx = new AudioContext()
        contextRef.current = ctx

        const analyser = ctx.createAnalyser()
        analyser.fftSize = 64
        analyser.smoothingTimeConstant = 0.6
        analyserRef.current = analyser

        ctx.createMediaStreamSource(stream).connect(analyser)
      } catch {
        // mic unavailable — demo animation still runs below
      }
    }

    setup()

    const data = new Uint8Array(barCount)
    const step = 1

    function tick() {
      const t = (performance.now() - startTime) / 1000

      // Demo sine-wave baseline — always visible
      const demoBars = Array.from({ length: barCount }, (_, i) => {
        const phase = (i / barCount) * Math.PI * 2
        return (
          0.28 + 0.22 * Math.sin(t * 2.1 + phase) +
          0.12 * Math.sin(t * 3.7 + phase * 1.5) +
          0.08 * Math.sin(t * 5.3 + phase * 0.7)
        )
      })

      // If real analyser is ready, blend: take max so speech also shows through
      if (analyserRef.current) {
        const freq = new Uint8Array(analyserRef.current.frequencyBinCount)
        analyserRef.current.getByteFrequencyData(freq)
        const step2 = Math.max(1, Math.floor(freq.length / barCount))
        const bars = demoBars.map((demo, i) => {
          const slice = freq.slice(i * step2, i * step2 + step2)
          const avg = slice.reduce((s, v) => s + v, 0) / slice.length / 255
          return Math.max(demo, avg)
        })
        setLevels(bars)
      } else {
        setLevels(demoBars)
      }

      rafRef.current = requestAnimationFrame(tick)
    }
    tick()

    return () => {
      cancelled = true
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      analyserRef.current?.disconnect()
      contextRef.current?.close()
      streamRef.current?.getTracks().forEach((t) => t.stop())
      rafRef.current = null
      contextRef.current = null
      analyserRef.current = null
      streamRef.current = null
    }
  }, [isActive, barCount, deviceId])

  return levels
}
