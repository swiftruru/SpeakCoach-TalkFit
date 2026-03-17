import { useState, useCallback, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
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


function ScreenContent({ screen }: { screen: Screen }) {
  switch (screen) {
    case 'home':     return <HomeScreen />
    case 'practice': return <PracticeScreen />
    case 'report':   return <ReportScreen />
    case 'history':  return <HistoryScreen />
    case 'settings': return <SettingsScreen />
  }
}

const MOBILE_NAV = [
  {
    id: 'home' as const,
    label: '首頁',
    icon: (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    id: 'practice' as const,
    label: '練習',
    icon: (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
        <path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8" />
      </svg>
    ),
  },
  {
    id: 'report' as const,
    label: '報告',
    icon: (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
  },
  {
    id: 'history' as const,
    label: '紀錄',
    icon: (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
      </svg>
    ),
  },
  {
    id: 'settings' as const,
    label: '設定',
    icon: (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    ),
  },
]

export default function App() {
  const { screen, setScreen } = useNavigationStore()
  const [hoveredAnnotationId, setHoveredAnnotationId] = useState<string | null>(null)
  const [showMicMenu, setShowMicMenu] = useState(false)
  const [showStoryModal, setShowStoryModal] = useState(false)
  const [showDesktopNotice, setShowDesktopNotice] = useState(true)
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768)
  const [showMobileAnnotations, setShowMobileAnnotations] = useState(false)

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])
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

  // Scroll phone screen to show element when annotation panel item is hovered
  useEffect(() => {
    if (!hoveredAnnotationId) return
    const el = document.querySelector(
      `[data-annotation-id="${hoveredAnnotationId}"]`
    ) as HTMLElement | null
    if (!el) return
    el.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [hoveredAnnotationId])

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
      <div className="flex-shrink-0 border-b border-divider px-4 md:px-8 py-2 md:py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-2 md:gap-3">
          <img src="/app-icon.png" alt="TalkFit" className="w-10 h-10 md:w-20 md:h-20 rounded-2xl object-cover flex-shrink-0 shadow-sm" />
          <div>
            <h1 className="text-sm font-semibold text-text-primary leading-none">說來話長 TalkFit</h1>
            <p className="hidden md:block text-[10px] text-text-muted mt-0.5">React Prototype</p>
          </div>
          {/* GitHub link — desktop only */}
          <a
            href="https://github.com/swiftruru/SpeakCoach-TalkFit"
            target="_blank"
            rel="noopener noreferrer"
            title="View on GitHub"
            className="hidden md:block ml-1 text-text-muted hover:text-text-secondary transition-colors"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
              <path d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.009-.868-.013-1.703-2.782.605-3.369-1.342-3.369-1.342-.454-1.154-1.11-1.461-1.11-1.461-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0 1 12 6.836a9.59 9.59 0 0 1 2.504.337c1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
            </svg>
          </a>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 md:gap-3">
          {/* Design story — desktop only */}
          <button
            onClick={() => setShowStoryModal(true)}
            className="hidden md:flex text-xs px-3 py-1.5 rounded-full border border-accent-purple/40 text-accent-purple hover:bg-accent-purple/10 transition-all items-center gap-1.5"
          >
            ✦ 設計動機
          </button>

          {/* Mock data — desktop only */}
          <button
            onClick={() => {
              useHistoryStore.setState({ sessions: MOCK_SESSIONS })
              setReport(MOCK_SESSIONS[0])
              showPhoneNotification({
                title: 'App 已新增 Mock 資料',
                body: '練習紀錄、分析報告已載入，可直接瀏覽各頁面',
              })
            }}
            className="hidden md:block text-xs px-3 py-1.5 rounded-full border border-accent-amber/40 text-accent-amber hover:bg-accent-amber/10 transition-all"
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
            <span className="hidden md:inline">Live </span>Demo
          </button>

          <div className="hidden md:block w-px h-4 bg-border-divider" />

          {/* Mic selector — desktop only */}
          <div className="relative hidden md:block">
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

          {/* Theme toggle */}
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
        </div>
      </div>

      {/* Main content: phone + annotation panel */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">

        {/* Phone area */}
        <div className="flex-1 flex items-start justify-center px-4 md:px-10 pt-6 pb-8 md:pb-8 overflow-auto">
          <div
            style={
              isMobile
                ? { transform: 'scale(0.9)', transformOrigin: 'top center', marginBottom: '-81px' }
                : { transform: 'scale(0.85)', transformOrigin: 'top center', marginBottom: '-122px' }
            }
            onMouseOver={handlePhoneMouseOver}
            onMouseOut={handlePhoneMouseOut}
          >
            <PhoneFrame screen={screen}>
              <ScreenContent screen={screen} />
            </PhoneFrame>
          </div>
        </div>

        {/* Vertical divider — desktop only */}
        <div className="hidden md:block w-px bg-border-divider flex-shrink-0 self-stretch" />

        {/* Annotation panel — desktop only */}
        <div
          className="hidden md:flex bg-bg-surface overflow-hidden flex-col flex-shrink-0"
          style={{ width: 340 }}
        >
          <AnnotationPanel
            screen={screen}
            hoveredId={hoveredAnnotationId}
            onHoverItem={setHoveredAnnotationId}
            onNavigate={setScreen}
          />
        </div>
      </div>

      {/* Mobile bottom nav — mobile only */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-bg-surface border-t border-divider flex items-center justify-around px-2 py-2">
        {MOBILE_NAV.map(({ id, label, icon }) => (
          <button
            key={id}
            onClick={() => { setScreen(id); setShowMobileAnnotations(false) }}
            className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl text-[10px] transition-all ${
              screen === id && !showMobileAnnotations ? 'text-accent-blue-light' : 'text-text-muted'
            }`}
          >
            {icon}
            {label}
          </button>
        ))}
        {/* 說明 toggle */}
        <button
          onClick={() => setShowMobileAnnotations((v) => !v)}
          className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl text-[10px] transition-all ${
            showMobileAnnotations ? 'text-accent-purple' : 'text-text-muted'
          }`}
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          說明
        </button>
      </nav>

      {/* Mobile annotation bottom sheet */}
      <AnimatePresence>
        {showMobileAnnotations && (
          <>
            {/* Backdrop */}
            <motion.div
              className="md:hidden fixed inset-0 z-40 bg-black/40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setShowMobileAnnotations(false)}
            />
            {/* Sheet */}
            <motion.div
              className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-bg-surface rounded-t-2xl flex flex-col"
              style={{ height: '70vh' }}
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 380, damping: 34 }}
            >
              {/* Drag handle */}
              <div className="flex-shrink-0 flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full bg-border-divider" />
              </div>
              <div className="flex-1 overflow-hidden">
                <AnnotationPanel
                  screen={screen}
                  hoveredId={hoveredAnnotationId}
                  onHoverItem={setHoveredAnnotationId}
                  onNavigate={(s) => { setScreen(s); setShowMobileAnnotations(false) }}
                />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <DesignStoryModal isOpen={showStoryModal} onClose={() => setShowStoryModal(false)} />
      <DemoOverlay />

      {/* Desktop notice — floating card, bottom-right */}
      <AnimatePresence>
        {showDesktopNotice && (
          <motion.div
            className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-40 flex items-start gap-2.5 px-4 py-3 rounded-2xl border border-accent-amber/35 bg-bg-card shadow-xl max-w-[260px]"
            initial={{ opacity: 0, y: 12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.22 }}
          >
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" className="text-accent-amber flex-shrink-0 mt-0.5">
              <rect x="2" y="3" width="20" height="14" rx="2" />
              <line x1="8" y1="21" x2="16" y2="21" />
              <line x1="12" y1="17" x2="12" y2="21" />
            </svg>
            <p className="text-xs text-text-secondary leading-relaxed flex-1">
              此原型網頁建議於<span className="text-accent-amber font-medium">電腦瀏覽器</span>操作，以獲得最佳互動體驗
            </p>
            <button
              onClick={() => setShowDesktopNotice(false)}
              className="text-text-muted hover:text-text-primary transition-colors flex-shrink-0 mt-0.5"
            >
              <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
