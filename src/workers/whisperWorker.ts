import { pipeline, env } from '@xenova/transformers'

// Point WASM to local node_modules (Vite dev serves these directly)
// This avoids the onnxruntime version mismatch with CDN URLs
// @ts-ignore
env.backends.onnx.wasm.wasmPaths = `${self.location.origin}/node_modules/onnxruntime-web/dist/`
// @ts-ignore
env.allowLocalModels = false

const MODEL_ID = 'Xenova/whisper-base'

const LANG_MAP: Record<string, string> = {
  'zh-TW': 'chinese',
  'zh-HK': 'chinese',
  'zh-CN': 'chinese',
  'en-US': 'english',
  'en':    'english',
  'zh':    'chinese',
}

function toLang(appLang: string): string {
  return LANG_MAP[appLang] ?? 'chinese'
}

type InMessage =
  | { type: 'load'; language: string }
  | { type: 'transcribe'; audio: Float32Array; language: string }

let pipe: any = null
let isTranscribing = false
let pending: { audio: Float32Array; language: string } | null = null

self.addEventListener('message', async (e: MessageEvent<InMessage>) => {
  const msg = e.data

  if (msg.type === 'load') {
    try {
      pipe = await pipeline(
        'automatic-speech-recognition',
        MODEL_ID,
        {
          quantized: true,
          progress_callback: (info: any) => {
            if (info.status === 'downloading' || info.status === 'progress') {
              self.postMessage({
                type: 'progress',
                status: 'loading',
                progress: Math.round(info.progress ?? 0),
                file: info.file ?? '',
              })
            }
          },
        }
      )
      self.postMessage({ type: 'progress', status: 'ready' })
    } catch (err) {
      self.postMessage({ type: 'error', message: String(err) })
    }
    return
  }

  if (msg.type === 'transcribe') {
    if (isTranscribing) {
      // Keep only the latest chunk — drop the previous queued one
      pending = { audio: msg.audio, language: msg.language }
      return
    }
    await runTranscription(msg.audio, msg.language)
  }
})

async function runTranscription(audio: Float32Array, language: string) {
  if (!pipe) return
  isTranscribing = true
  try {
    const result = await pipe(audio, {
      language: toLang(language),
      task: 'transcribe',
      return_timestamps: false,
    }) as { text: string }
    const text = result.text?.trim() ?? ''
    if (text) {
      self.postMessage({ type: 'result', text })
    }
  } catch (err) {
    self.postMessage({ type: 'error', message: String(err) })
  } finally {
    isTranscribing = false
    if (pending) {
      const next = pending
      pending = null
      await runTranscription(next.audio, next.language)
    }
  }
}
