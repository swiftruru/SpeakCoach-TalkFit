import { useState, useEffect } from 'react'

export interface MicDevice {
  deviceId: string
  label: string
}

export function useMicrophoneDevices() {
  const [devices, setDevices] = useState<MicDevice[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        // Request permission first so we get real device labels
        await navigator.mediaDevices.getUserMedia({ audio: true })
        const all = await navigator.mediaDevices.enumerateDevices()
        const mics = all
          .filter((d) => d.kind === 'audioinput')
          .map((d, i) => ({
            deviceId: d.deviceId,
            label: d.label || `麥克風 ${i + 1}`,
          }))
        setDevices(mics)
      } catch {
        setError('無法取得麥克風裝置列表')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return { devices, loading, error }
}
