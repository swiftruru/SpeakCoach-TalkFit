import { useMicrophoneDevices } from '../hooks/useMicrophoneDevices'
import { useSettingsStore } from '../stores/settingsStore'

interface MicSelectorProps {
  onClose?: () => void
}

export function MicSelector({ onClose }: MicSelectorProps) {
  const { devices, loading, error } = useMicrophoneDevices()
  const micDeviceId = useSettingsStore((s) => s.micDeviceId)
  const setMicDeviceId = useSettingsStore((s) => s.setMicDeviceId)

  return (
    <div className="px-2">
      <p className="text-[10px] text-text-muted px-2 pb-2 uppercase tracking-wider font-semibold">
        輸入裝置
      </p>

      {loading && (
        <p className="text-xs text-text-muted px-2 py-1">偵測中…</p>
      )}

      {error && (
        <p className="text-xs text-red-400 px-2 py-1">{error}</p>
      )}

      {!loading && !error && devices.map((d) => {
        const isSelected = micDeviceId === d.deviceId ||
          (micDeviceId === 'default' && d.deviceId === devices[0]?.deviceId)
        return (
          <button
            key={d.deviceId}
            onClick={() => { setMicDeviceId(d.deviceId); onClose?.() }}
            className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left transition-colors ${
              isSelected
                ? 'bg-accent-blue/15 text-accent-blue-light'
                : 'text-text-secondary hover:bg-white/5 hover:text-text-primary'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isSelected ? 'bg-accent-blue' : 'bg-white/20'}`} />
            <span className="text-xs truncate">{d.label}</span>
          </button>
        )
      })}

      <p className="text-[10px] text-text-muted px-2 pt-2 pb-1 leading-relaxed border-t border-divider mt-1">
        聲波視覺化使用所選裝置。語音辨識固定使用系統預設輸入。
      </p>
    </div>
  )
}
