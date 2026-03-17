import { QRCodeSVG } from 'qrcode.react'

interface Props {
  onClose: () => void
}

export function QRPopover({ onClose }: Props) {
  const url = window.location.href

  return (
    <div
      className="absolute right-0 top-full mt-2 z-50 bg-bg-card border border-divider rounded-2xl shadow-xl p-5 flex flex-col items-center gap-3"
      style={{ minWidth: 200 }}
      onMouseLeave={onClose}
    >
      <div className="rounded-xl overflow-hidden bg-white p-2">
        <QRCodeSVG value={url} size={152} bgColor="#ffffff" fgColor="#1a1a1a" />
      </div>
      <p className="text-[11px] text-text-muted text-center leading-relaxed max-w-[160px]">
        用手機掃描，在真實裝置上開啟原型
      </p>
    </div>
  )
}
