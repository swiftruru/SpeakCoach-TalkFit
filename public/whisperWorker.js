// ES module worker — both files served from public/, Vite never processes them
import { pipeline, env } from '/transformers.min.js'

env.allowLocalModels = false

const MODEL_ID = 'Xenova/whisper-base'

const LANG_MAP = {
  'zh-TW': 'chinese',
  'zh-HK': 'chinese',
  'zh-CN': 'chinese',
  'en-US': 'english',
  'en':    'english',
  'zh':    'chinese',
}

function toLang(appLang) {
  return LANG_MAP[appLang] ?? 'chinese'
}

let pipe = null
let isTranscribing = false
let pending = null

self.addEventListener('message', async (e) => {
  const msg = e.data

  if (msg.type === 'load') {
    try {
      pipe = await pipeline(
        'automatic-speech-recognition',
        MODEL_ID,
        {
          quantized: true,
          progress_callback: (info) => {
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
      pending = { audio: msg.audio, language: msg.language }
      return
    }
    await runTranscription(msg.audio, msg.language)
  }
})

async function runTranscription(audio, language) {
  if (!pipe) return
  isTranscribing = true
  try {
    const result = await pipe(audio, {
      language: toLang(language),
      task: 'transcribe',
      return_timestamps: false,
    })
    const text = (result.text ?? '').trim()
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
