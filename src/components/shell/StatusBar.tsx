export function StatusBar() {
  const now = new Date()
  const time = `${now.getHours().toString().padStart(2, '0')}:${now
    .getMinutes()
    .toString()
    .padStart(2, '0')}`

  return (
    <div className="flex items-center justify-between px-6 pt-3 pb-1 h-[44px] flex-shrink-0">
      <span className="text-[13px] font-semibold text-gray-800">{time}</span>
      <div className="flex items-center gap-1.5">
        {/* Signal */}
        <svg width="17" height="12" viewBox="0 0 17 12" fill="none">
          <rect x="0" y="7" width="3" height="5" rx="1" fill="#1c1c1e" />
          <rect x="4.5" y="4.5" width="3" height="7.5" rx="1" fill="#1c1c1e" />
          <rect x="9" y="2" width="3" height="10" rx="1" fill="#1c1c1e" />
          <rect x="13.5" y="0" width="3" height="12" rx="1" fill="#1c1c1e" />
        </svg>
        {/* Wifi */}
        <svg width="16" height="12" viewBox="0 0 16 12" fill="none">
          <path d="M8 9.5a1 1 0 110 2 1 1 0 010-2z" fill="#1c1c1e" />
          <path d="M4.5 7C5.8 5.8 6.8 5.2 8 5.2s2.2.6 3.5 1.8" stroke="#1c1c1e" strokeWidth="1.3" strokeLinecap="round" fill="none" />
          <path d="M2 4.5C4 2.7 5.9 2 8 2s4 .7 6 2.5" stroke="#1c1c1e" strokeWidth="1.3" strokeLinecap="round" fill="none" />
        </svg>
        {/* Battery */}
        <svg width="25" height="12" viewBox="0 0 25 12" fill="none">
          <rect x="0.5" y="0.5" width="21" height="11" rx="3.5" stroke="#1c1c1e" strokeOpacity="0.35" />
          <rect x="2" y="2" width="17" height="8" rx="2" fill="#1c1c1e" />
          <path d="M23 4v4a2 2 0 000-4z" fill="#1c1c1e" fillOpacity="0.4" />
        </svg>
      </div>
    </div>
  )
}
