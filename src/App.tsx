import { useState, useCallback, useEffect } from 'react'
import { useNavigationStore } from './stores/navigationStore'
import { useHistoryStore } from './stores/historyStore'
import { useReportStore } from './stores/reportStore'
import { MOCK_SESSIONS } from './lib/mockData'
import { PhoneFrame } from './components/shell/PhoneFrame'
import { AnnotationPanel } from './annotation/AnnotationPanel'
import { HomeScreen } from './screens/HomeScreen'
import { PracticeScreen } from './screens/PracticeScreen'
import { ReportScreen } from './screens/ReportScreen'
import { HistoryScreen } from './screens/HistoryScreen'
import { SettingsScreen } from './screens/SettingsScreen'
import { MicSelector } from './components/MicSelector'
import type { Screen } from './types'
import './index.css'

const SCREEN_NAV: { id: Screen; label: string }[] = [
  { id: 'home', label: '首頁' },
  { id: 'practice', label: '練習中' },
  { id: 'report', label: '分析報告' },
  { id: 'history', label: '紀錄' },
  { id: 'settings', label: '設定' },
]

function ScreenContent({ screen }: { screen: Screen }) {
  switch (screen) {
    case 'home':     return <HomeScreen />
    case 'practice': return <PracticeScreen />
    case 'report':   return <ReportScreen />
    case 'history':  return <HistoryScreen />
    case 'settings': return <SettingsScreen />
  }
}

export default function App() {
  const { screen, setScreen } = useNavigationStore()
  const [hoveredAnnotationId, setHoveredAnnotationId] = useState<string | null>(null)
  const [showMicMenu, setShowMicMenu] = useState(false)
  const sessions = useHistoryStore((s) => s.sessions)
  const report = useReportStore((s) => s.report)
  const setReport = useReportStore((s) => s.setReport)

  // Theme: light by default, persist in localStorage
  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem('talkfit-theme') === 'dark'
  })

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('talkfit-theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('talkfit-theme', 'light')
    }
  }, [isDark])

  // Pre-load the most recent session into reportStore for demo
  useEffect(() => {
    if (sessions.length > 0 && !report) {
      setReport(sessions[0])
    }
  }, [sessions, report, setReport])

  const handlePhoneMouseOver = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement
    const annotated = target.closest('[data-annotation-id]') as HTMLElement | null
    const id = annotated?.dataset?.annotationId ?? null
    setHoveredAnnotationId(id)
  }, [])

  const handlePhoneMouseOut = useCallback((e: React.MouseEvent) => {
    const related = e.relatedTarget as HTMLElement | null
    if (!related?.closest?.('[data-annotation-id]')) {
      setHoveredAnnotationId(null)
    }
  }, [])

  return (
    <div className="min-h-screen bg-bg-base flex flex-col font-sans">
      {/* Highlight style injection */}
      {hoveredAnnotationId && (
        <style>{`
          [data-annotation-id="${hoveredAnnotationId}"] {
            outline: 2px solid rgba(59,130,246,0.55);
            border-radius: 8px;
            box-shadow: 0 0 14px rgba(59,130,246,0.3);
          }
        `}</style>
      )}

      {/* Top bar */}
      <div className="flex-shrink-0 border-b border-divider px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src="/app-icon.png" alt="TalkFit" className="w-14 h-14 rounded-2xl object-cover flex-shrink-0 shadow-sm" />
          <div>
            <h1 className="text-sm font-semibold text-text-primary leading-none">說來話長 TalkFit</h1>
            <p className="text-[10px] text-text-muted mt-0.5">React Prototype</p>
          </div>
        </div>

        {/* Screen nav pills + demo button */}
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => {
              useHistoryStore.setState({ sessions: MOCK_SESSIONS })
              setReport(MOCK_SESSIONS[0])
            }}
            className="text-xs px-3 py-1.5 rounded-full border border-accent-amber/40 text-accent-amber hover:bg-accent-amber/10 transition-all"
          >
            ✦ 載入示範資料
          </button>
          <div className="relative">
            <button
              onClick={() => setShowMicMenu((v) => !v)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-all flex items-center gap-1.5 ${
                showMicMenu
                  ? 'bg-bg-card border-accent-blue/40 text-accent-blue-light'
                  : 'border-divider text-text-secondary hover:text-text-primary'
              }`}
            >
              <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8" />
              </svg>
              設定收音裝置
            </button>
            {showMicMenu && (
              <div
                className="absolute right-0 top-full mt-2 z-50 bg-bg-card border border-divider rounded-xl shadow-xl py-2 min-w-[260px]"
                onMouseLeave={() => setShowMicMenu(false)}
              >
                <MicSelector onClose={() => setShowMicMenu(false)} />
              </div>
            )}
          </div>

          {/* Theme toggle */}
          <button
            onClick={() => setIsDark((v) => !v)}
            className="text-xs px-3 py-1.5 rounded-full border border-divider text-text-secondary hover:text-text-primary transition-all flex items-center gap-1.5"
            title={isDark ? '切換亮色模式' : '切換暗色模式'}
          >
            {isDark ? (
              <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" />
                <line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" />
                <line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
            {isDark ? '亮色' : '暗色'}
          </button>

          <div className="w-px h-4 bg-border-divider" />
          {SCREEN_NAV.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setScreen(id)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                screen === id
                  ? 'bg-bg-card border-accent-blue/40 text-accent-blue-light'
                  : 'border-divider text-text-secondary hover:text-text-primary'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>


      {/* Main content: phone + annotation panel */}
      <div className="flex-1 flex overflow-hidden">
        {/* Phone area */}
        <div
          className="flex-1 flex items-center justify-center px-10 py-8 overflow-auto"
        >
          <div
            onMouseOver={handlePhoneMouseOver}
            onMouseOut={handlePhoneMouseOut}
          >
            <PhoneFrame screen={screen}>
              <ScreenContent screen={screen} />
            </PhoneFrame>
          </div>
        </div>

        {/* Vertical divider */}
        <div className="w-px bg-border-divider flex-shrink-0 self-stretch" />

        {/* Annotation panel */}
        <div
          className="bg-bg-surface overflow-hidden flex flex-col flex-shrink-0"
          style={{ width: 340 }}
        >
          <AnnotationPanel
            screen={screen}
            hoveredId={hoveredAnnotationId}
            onHoverItem={setHoveredAnnotationId}
          />
        </div>
      </div>
    </div>
  )
}
