import { useRef, useCallback, useState, useEffect } from 'react'
import { useSettingsStore } from '../stores/settingsStore'

interface UseSpeechRecognitionOptions {
  language?: string
  enabled?: boolean
  onResult: (text: string, isFinal: boolean) => void
  onError?: (error: string) => void
}

export type ModelStatus =
  | { status: 'idle' }
  | { status: 'loading'; progress: number; file: string }
  | { status: 'ready' }
  | { status: 'error'; message: string }

function resampleTo16k(buf: Float32Array, fromRate: number): Float32Array {
  if (fromRate === 16000) return buf
  const ratio = fromRate / 16000
  const out = new Float32Array(Math.floor(buf.length / ratio))
  for (let i = 0; i < out.length; i++) out[i] = buf[Math.floor(i * ratio)]
  return out
}

export function useSpeechRecognition({
  language = 'zh-TW',
  enabled = true,
  onResult,
  onError,
}: UseSpeechRecognitionOptions) {
  const micDeviceId = useSettingsStore((s) => s.micDeviceId)

  const workerRef = useRef<Worker | null>(null)
  const contextRef = useRef<AudioContext | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const processorRef = useRef<ScriptProcessorNode | null>(null)
  const bufferRef = useRef<Float32Array[]>([])
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const shouldRunRef = useRef(false)

  const onResultRef = useRef(onResult)
  const onErrorRef = useRef(onError)
  const languageRef = useRef(language)

  const [modelState, setModelState] = useState<ModelStatus>({ status: 'idle' })

  useEffect(() => {
    onResultRef.current = onResult
  }, [onResult])

  useEffect(() => {
    onErrorRef.current = onError
  }, [onError])

  useEffect(() => {
    languageRef.current = language
  }, [language])

  const teardown = useCallback(() => {
    shouldRunRef.current = false
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null }
    if (processorRef.current) { processorRef.current.disconnect(); processorRef.current = null }
    if (contextRef.current) { contextRef.current.close(); contextRef.current = null }
    if (streamRef.current) { streamRef.current.getTracks().forEach((t) => t.stop()); streamRef.current = null }
    bufferRef.current = []
  }, [])

  useEffect(() => {
    if (!enabled) {
      teardown()
      if (workerRef.current) {
        workerRef.current.terminate()
        workerRef.current = null
      }
      return
    }

    const worker = new Worker('/whisperWorker.js', { type: 'module' })

    worker.onmessage = (e) => {
      const msg = e.data
      if (msg.type === 'progress') {
        if (msg.status === 'loading') {
          setModelState({ status: 'loading', progress: msg.progress, file: msg.file })
        } else if (msg.status === 'ready') {
          setModelState({ status: 'ready' })
        }
      } else if (msg.type === 'result') {
        onResultRef.current(msg.text, true)
      } else if (msg.type === 'error') {
        onErrorRef.current?.(msg.message)
        setModelState({ status: 'error', message: msg.message })
      }
    }

    worker.onerror = (e) => {
      onErrorRef.current?.(e.message)
      setModelState({ status: 'error', message: e.message })
    }

    workerRef.current = worker
    worker.postMessage({ type: 'load', language: languageRef.current })

    return () => {
      worker.terminate()
      workerRef.current = null
    }
  }, [enabled, teardown])

  const stop = useCallback(() => {
    teardown()
  }, [teardown])

  const start = useCallback(async () => {
    if (!enabled) return
    if (shouldRunRef.current) return
    shouldRunRef.current = true

    try {
      const audioConstraint: MediaTrackConstraints =
        micDeviceId && micDeviceId !== 'default'
          ? { deviceId: { exact: micDeviceId } }
          : {}

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { ...audioConstraint, sampleRate: { ideal: 16000 } },
        video: false,
      })
      if (!shouldRunRef.current) { stream.getTracks().forEach((t) => t.stop()); return }

      streamRef.current = stream
      const ctx = new AudioContext()
      contextRef.current = ctx

      const source = ctx.createMediaStreamSource(stream)
      const processor = ctx.createScriptProcessor(4096, 1, 1)
      processorRef.current = processor

      processor.onaudioprocess = (e) => {
        if (!shouldRunRef.current) return
        const data = e.inputBuffer.getChannelData(0)
        bufferRef.current.push(new Float32Array(data))
      }

      source.connect(processor)
      processor.connect(ctx.destination)

      intervalRef.current = setInterval(() => {
        if (!shouldRunRef.current || !workerRef.current) return
        if (bufferRef.current.length === 0) return

        const chunks = bufferRef.current
        bufferRef.current = []

        const totalLen = chunks.reduce((s, c) => s + c.length, 0)
        if (totalLen < ctx.sampleRate * 0.5) return

        const merged = new Float32Array(totalLen)
        let offset = 0
        for (const chunk of chunks) { merged.set(chunk, offset); offset += chunk.length }

        const resampled = resampleTo16k(merged, ctx.sampleRate)

        onResultRef.current('...', false)

        workerRef.current.postMessage(
          { type: 'transcribe', audio: resampled, language: languageRef.current },
          [resampled.buffer]
        )
      }, 3000)

    } catch (err) {
      shouldRunRef.current = false
      onErrorRef.current?.(String(err))
    }
  }, [enabled, micDeviceId])

  return {
    isSupported: true,
    isListening: false,
    modelState: enabled ? modelState : ({ status: 'idle' } as const),
    start,
    stop,
  }
}
