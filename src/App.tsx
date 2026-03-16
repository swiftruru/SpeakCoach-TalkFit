import { useState, useCallback, useEffect } from 'react'
import { useNavigationStore } from './stores/navigationStore'
import { useHistoryStore } from './stores/historyStore'
import { useReportStore } from './stores/reportStore'
import { usePhoneNotificationStore } from './stores/phoneNotificationStore'
import { MOCK_SESSIONS } from './lib/mockData'
import { PhoneFrame } from './components/shell/PhoneFrame'
import { AnnotationPanel } from './annotation/AnnotationPanel'
import { DesignStoryModal } from './components/DesignStoryModal'
import { HomeScreen } from './screens/HomeScreen'
import { PracticeScreen } from './screens/PracticeScreen'
import { ReportScreen } from './screens/ReportScreen'
import { HistoryScreen } from './screens/HistoryScreen'
import { SettingsScreen } from './screens/SettingsScreen'
import { MicSelector } from './components/MicSelector'
import { useDemoStore } from './demo/demoStore'
import { useLiveDemo } from './demo/useLiveDemo'
import { DemoOverlay } from './demo/DemoOverlay'
import { DEMO_STEPS } from './demo/demoScript'
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
  const [showStoryModal, setShowStoryModal] = useState(false)
  const sessions = useHistoryStore((s) => s.sessions)
  const report = useReportStore((s) => s.report)
  const setReport = useReportStore((s) => s.setReport)
  const showPhoneNotification = usePhoneNotificationStore((s) => s.show)
  const { startDemo, stopDemo, isDemoActive } = useDemoStore()
  const currentStepIndex = useDemoStore((s) => s.currentStepIndex)
  const goToStep = useDemoStore((s) => s.goToStep)
  useLiveDemo()

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

  // Keyboard shortcuts for Live Demo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isDemoActive) return
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault()
        if (currentStepIndex < DEMO_STEPS.length - 1) goToStep(currentStepIndex + 1)
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        if (currentStepIndex > 0) goToStep(currentStepIndex - 1)
      } else if (e.key === 'Escape') {
        stopDemo()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isDemoActive, currentStepIndex, goToStep, stopDemo])

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
          <img src="/app-icon.png" alt="TalkFit" className="w-20 h-20 rounded-2xl object-cover flex-shrink-0 shadow-sm" />
          <div>
            <h1 className="text-sm font-semibold text-text-primary leading-none">說來話長 TalkFit</h1>
            <p className="text-[10px] text-text-muted mt-0.5">React Prototype</p>
          </div>
          {/* GitHub link */}
          <a
            href="https://github.com/swiftruru/SpeakCoach-TalkFit"
            target="_blank"
            rel="noopener noreferrer"
            title="View on GitHub"
            className="ml-1 text-text-muted hover:text-text-secondary transition-colors"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
              <path d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.009-.868-.013-1.703-2.782.605-3.369-1.342-3.369-1.342-.454-1.154-1.11-1.461-1.11-1.461-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0 1 12 6.836a9.59 9.59 0 0 1 2.504.337c1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
            </svg>
          </a>
        </div>

        {/* Action buttons + screen nav */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Design story */}
          <button
            onClick={() => setShowStoryModal(true)}
            className="text-xs px-3 py-1.5 rounded-full border border-accent-purple/40 text-accent-purple hover:bg-accent-purple/10 transition-all flex items-center gap-1.5"
          >
            ✦ 設計動機
          </button>

          <button
            onClick={() => {
              useHistoryStore.setState({ sessions: MOCK_SESSIONS })
              setReport(MOCK_SESSIONS[0])
              showPhoneNotification({
                title: 'App 已新增 Mock 資料',
                body: '練習紀錄、分析報告已載入，可直接瀏覽各頁面',
              })
            }}
            className="text-xs px-3 py-1.5 rounded-full border border-accent-amber/40 text-accent-amber hover:bg-accent-amber/10 transition-all"
          >
            ✦ Mock 資料
          </button>
          <button
            onClick={startDemo}
            disabled={isDemoActive}
            className="text-xs px-3 py-1.5 rounded-full border border-accent-blue/40 text-accent-blue-light hover:bg-accent-blue/10 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
          >
            <svg viewBox="0 0 24 24" width="10" height="10" fill="currentColor">
              <polygon points="5,3 19,12 5,21" />
            </svg>
            Live Demo
          </button>

          {/* Mic selector — icon only */}
          <div className="relative">
            <button
              onClick={() => setShowMicMenu((v) => !v)}
              title="設定收音裝置"
              className={`w-8 h-8 rounded-full border transition-all flex items-center justify-center ${
                showMicMenu
                  ? 'bg-bg-card border-accent-blue/40 text-accent-blue-light'
                  : 'border-divider text-text-secondary hover:text-text-primary'
              }`}
            >
              <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8" />
              </svg>
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

          {/* Theme toggle — icon only */}
          <button
            onClick={() => setIsDark((v) => !v)}
            title={isDark ? '切換亮色模式' : '切換暗色模式'}
            className="w-8 h-8 rounded-full border border-divider text-text-secondary hover:text-text-primary transition-all flex items-center justify-center"
          >
            {isDark ? (
              <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2">
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
              <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
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

      {/* Desktop notice */}
      <div className="flex-shrink-0 border-b border-accent-amber/20 bg-accent-amber/5 px-8 py-2 flex items-center justify-center gap-2">
        <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" className="text-accent-amber flex-shrink-0">
          <rect x="2" y="3" width="20" height="14" rx="2" />
          <line x1="8" y1="21" x2="16" y2="21" />
          <line x1="12" y1="17" x2="12" y2="21" />
        </svg>
        <p className="text-xs text-accent-amber">
          此原型網頁建議於電腦瀏覽器操作，以獲得最佳互動體驗
        </p>
      </div>

      {/* Main content: phone + annotation panel */}
      <div className="flex-1 flex overflow-hidden">

        {/* Phone area */}
        <div className="flex-1 flex items-start justify-center px-10 pt-6 pb-8 overflow-auto">
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

      <DesignStoryModal isOpen={showStoryModal} onClose={() => setShowStoryModal(false)} />
      <DemoOverlay />
    </div>
  )
}
