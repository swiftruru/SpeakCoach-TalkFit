import { useNavigationStore } from '../../stores/navigationStore'
import type { Screen } from '../../types'

const HomeIcon = ({ active }: { active: boolean }) => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill={active ? 'currentColor' : 'none'}
    stroke={active ? 'none' : 'currentColor'} strokeWidth="2">
    <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
  </svg>
)

const HistoryIcon = ({ active }: { active: boolean }) => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none"
    stroke="currentColor" strokeWidth={active ? 2.5 : 2} strokeLinecap="round">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
  </svg>
)

const SettingsIcon = ({ active }: { active: boolean }) => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none"
    stroke="currentColor" strokeWidth={active ? 2.5 : 2}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
  </svg>
)

export function TabBar() {
  const { screen, setScreen } = useNavigationStore()

  return (
    <div className="flex items-center justify-around px-2 pt-2 pb-6 bg-white/90 backdrop-blur-sm border-t border-gray-200 flex-shrink-0">
      <TabItem
        id="home"
        label="首頁"
        active={screen === 'home'}
        onClick={() => setScreen('home')}
        icon={<HomeIcon active={screen === 'home'} />}
      />
      <TabItem
        id="history"
        label="紀錄"
        active={screen === 'history'}
        onClick={() => setScreen('history')}
        icon={<HistoryIcon active={screen === 'history'} />}
      />
      <TabItem
        id="settings"
        label="設定"
        active={screen === 'settings'}
        onClick={() => setScreen('settings')}
        icon={<SettingsIcon active={screen === 'settings'} />}
      />
    </div>
  )
}

function TabItem({
  id, label, active, onClick, icon
}: {
  id: Screen
  label: string
  active: boolean
  onClick: () => void
  icon: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      data-annotation-id={`tab-${id}`}
      className={`flex flex-col items-center gap-0.5 px-4 py-1 rounded-xl transition-all ${
        active ? 'text-accent-blue' : 'text-gray-400'
      }`}
    >
      {icon}
      <span className="text-[10px] font-medium">{label}</span>
    </button>
  )
}
