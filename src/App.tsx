import { useState, useCallback, useEffect, useMemo, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { useNavigationStore } from './stores/navigationStore'
import { useHistoryStore } from './stores/historyStore'
import { useReportStore } from './stores/reportStore'
import { usePhoneNotificationStore } from './stores/phoneNotificationStore'
import { getMockSessions } from './lib/mockData'
import { DEFAULT_LANGUAGE } from './i18n/config'
import { useAppLanguage } from './i18n/useAppLanguage'
import { AppLaunchOverlay } from './components/AppLaunchOverlay'
import { GuidedTourOverlay } from './components/GuidedTourOverlay'
import { PhoneFrame } from './components/shell/PhoneFrame'
import { PrototypeNavigator } from './components/PrototypeNavigator'
import { AnnotationPanel } from './annotation/AnnotationPanel'
import { DesignStoryModal } from './components/DesignStoryModal'
import { KeyboardShortcutsModal } from './components/KeyboardShortcutsModal'
import { CommandPaletteModal } from './components/CommandPaletteModal'
import { CaptureExportModal } from './components/CaptureExportModal'
import { HomeScreen } from './screens/HomeScreen'
import { PracticeScreen } from './screens/PracticeScreen'
import { ReportScreen } from './screens/ReportScreen'
import { HistoryScreen } from './screens/HistoryScreen'
import { SettingsScreen } from './screens/SettingsScreen'
import { useDemoStore } from './demo/demoStore'
import { useLiveDemo } from './demo/useLiveDemo'
import { getDemoSteps } from './demo/demoScript'
import { ensurePrototypeDataForScreen, resetPrototypeState } from './lib/prototypeState'
import { downloadElementAsPng } from './lib/domCapture'
import { GUIDED_TOUR_STEPS } from './lib/guidedTourSteps'
import { useAnnotationGuideStore } from './stores/annotationGuideStore'
import { useGuidedTourStore } from './stores/guidedTourStore'
import { useRetryPracticeStore } from './stores/retryPracticeStore'
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

const SCREENS: Screen[] = ['home', 'practice', 'report', 'history', 'settings']

function isScreen(value: string | null): value is Screen {
  return value !== null && SCREENS.includes(value as Screen)
}

function hasDeepLinkParams(params = new URLSearchParams(window.location.search)) {
  return (
    params.has('screen') ||
    params.has('panel') ||
    params.has('annotation') ||
    params.has('demo') ||
    params.has('step') ||
    params.has('theme') ||
    params.has('view')
  )
}

function shouldShowLaunchOverlay() {
  const params = new URLSearchParams(window.location.search)
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  return !hasDeepLinkParams(params) && !prefersReducedMotion
}

function isMobileBrowserDevice() {
  const userAgentData = (navigator as Navigator & {
    userAgentData?: { mobile?: boolean }
  }).userAgentData
  if (typeof userAgentData?.mobile === 'boolean') {
    return userAgentData.mobile
  }

  const ua = navigator.userAgent
  const matchesMobileUa = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile/i.test(ua)
  const coarsePointer = window.matchMedia('(pointer: coarse)').matches

  return matchesMobileUa || (coarsePointer && window.innerWidth < 1024)
}

interface HoverConnector {
  d: string
  arrowHeadD: string
  arrowHighlight: { x: number; y: number }
  start: { x: number; y: number }
  end: { x: number; y: number }
}

interface SpotlightRect {
  x: number
  y: number
  width: number
  height: number
  radius: number
}

interface SpotlightGeometry {
  phoneRect: SpotlightRect
  annotationRect?: SpotlightRect
}

type HoverSource = 'phone' | 'annotation' | 'demo'

export default function App() {
  const { t } = useTranslation(['common', 'app', 'commandPalette'])
  const { currentLanguage, setLanguage } = useAppLanguage()
  const { screen, setScreen, requestScreen } = useNavigationStore()
  const [hoveredAnnotationId, setHoveredAnnotationId] = useState<string | null>(null)
  const [hoverConnector, setHoverConnector] = useState<HoverConnector | null>(null)
  const [spotlightGeometry, setSpotlightGeometry] = useState<SpotlightGeometry | null>(null)
  const [hoverSource, setHoverSource] = useState<HoverSource | null>(null)
  const [navigatorOffsetY, setNavigatorOffsetY] = useState(0)
  const [showStoryModal, setShowStoryModal] = useState(false)
  const [showCommandPalette, setShowCommandPalette] = useState(false)
  const [showCaptureModal, setShowCaptureModal] = useState(false)
  const [showShortcutsModal, setShowShortcutsModal] = useState(false)
  const [openDesktopMenu, setOpenDesktopMenu] = useState<'showcase' | 'system' | null>(null)
  const [isExportingCapture, setIsExportingCapture] = useState(false)
  const [showDesktopNotice, setShowDesktopNotice] = useState(() => isMobileBrowserDevice())
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768)
  const [isPresentationMode, setIsPresentationMode] = useState(
    () => new URLSearchParams(window.location.search).get('view') === 'present'
  )
  const [isFullscreen, setIsFullscreen] = useState(() => Boolean(document.fullscreenElement))
  const [capturePreset, setCapturePreset] = useState<'showcase' | 'presentation' | 'phone'>('showcase')
  const [isDesktopAnnotationsVisible, setIsDesktopAnnotationsVisible] = useState(
    () => new URLSearchParams(window.location.search).get('panel') !== 'closed'
  )
  const [showLaunchOverlay, setShowLaunchOverlay] = useState(() => shouldShowLaunchOverlay())
  const [pendingPhoneLaunch, setPendingPhoneLaunch] = useState(false)
  const [showPhoneLaunch, setShowPhoneLaunch] = useState(false)
  const [guidedTourTargetRect, setGuidedTourTargetRect] = useState<DOMRect | null>(null)
  const [showMobileAnnotations, setShowMobileAnnotations] = useState(
    () => new URLSearchParams(window.location.search).get('panel') === 'open'
  )
  const appRootRef = useRef<HTMLDivElement | null>(null)
  const desktopStageRef = useRef<HTMLDivElement | null>(null)
  const navigatorStickyRef = useRef<HTMLDivElement | null>(null)
  const navigatorInnerRef = useRef<HTMLDivElement | null>(null)
  const phoneStageRef = useRef<HTMLDivElement | null>(null)
  const phoneExportRef = useRef<HTMLDivElement | null>(null)
  const hasAppliedInitialUrlState = useRef(false)

  useEffect(() => {
    const handler = () => {
      setIsMobile(window.innerWidth < 768)
      setShowDesktopNotice((current) => current && isMobileBrowserDevice())
    }
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement))
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])
  const sessions = useHistoryStore((s) => s.sessions)
  const report = useReportStore((s) => s.report)
  const setReport = useReportStore((s) => s.setReport)
  const showPhoneNotification = usePhoneNotificationStore((s) => s.show)
  const pinnedAnnotationId = useAnnotationGuideStore((s) => s.pinnedId)
  const pinnedAnnotationSource = useAnnotationGuideStore((s) => s.source)
  const pinAnnotationGuide = useAnnotationGuideStore((s) => s.pin)
  const clearAnnotationGuide = useAnnotationGuideStore((s) => s.clear)
  const isGuidedTourOpen = useGuidedTourStore((s) => s.isOpen)
  const guidedTourStepIndex = useGuidedTourStore((s) => s.currentStepIndex)
  const guidedTourDismissed = useGuidedTourStore((s) => s.dismissed)
  const guidedTourCompleted = useGuidedTourStore((s) => s.completed)
  const startGuidedTour = useGuidedTourStore((s) => s.start)
  const previousGuidedTourStep = useGuidedTourStore((s) => s.previous)
  const nextGuidedTourStep = useGuidedTourStore((s) => s.next)
  const closeGuidedTour = useGuidedTourStore((s) => s.close)
  const skipGuidedTour = useGuidedTourStore((s) => s.skip)
  const finishGuidedTour = useGuidedTourStore((s) => s.finish)
  const { startDemo, stopDemo, isDemoActive } = useDemoStore()
  const setDemoMode = useDemoStore((s) => s.setMode)
  const demoMode = useDemoStore((s) => s.mode)
  const currentStepIndex = useDemoStore((s) => s.currentStepIndex)
  const goToStep = useDemoStore((s) => s.goToStep)
  useLiveDemo()
  const currentGuidedTourStep = GUIDED_TOUR_STEPS[guidedTourStepIndex] ?? GUIDED_TOUR_STEPS[0]
  const activeAnnotationId = pinnedAnnotationId ?? hoveredAnnotationId
  const activeHoverSource = pinnedAnnotationId ? (pinnedAnnotationSource ?? 'demo') : hoverSource
  const currentDemoSteps = getDemoSteps(demoMode)
  const isSpotlightActive = !isMobile && Boolean(activeAnnotationId) && !isGuidedTourOpen

  // Theme: light by default, persist in localStorage
  const [isDark, setIsDark] = useState(() => {
    const themeParam = new URLSearchParams(window.location.search).get('theme')
    if (themeParam === 'dark') return true
    if (themeParam === 'light') return false
    return localStorage.getItem('talkfit-theme') === 'dark'
  })

  const mobileNav = useMemo(
    () => [
      {
        id: 'home' as const,
        label: t('common:screens.home'),
        icon: (
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
        ),
      },
      {
        id: 'practice' as const,
        label: t('common:screens.practice'),
        icon: (
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8" />
          </svg>
        ),
      },
      {
        id: 'report' as const,
        label: t('common:screens.report'),
        icon: (
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="20" x2="18" y2="10" />
            <line x1="12" y1="20" x2="12" y2="4" />
            <line x1="6" y1="20" x2="6" y2="14" />
          </svg>
        ),
      },
      {
        id: 'history' as const,
        label: t('common:screens.history'),
        icon: (
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        ),
      },
      {
        id: 'settings' as const,
        label: t('common:screens.settings'),
        icon: (
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        ),
      },
    ],
    [t]
  )

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

  useEffect(() => {
    if (hasAppliedInitialUrlState.current) return
    hasAppliedInitialUrlState.current = true

    const params = new URLSearchParams(window.location.search)
    const screenParam = params.get('screen')
    if (isScreen(screenParam)) {
      ensurePrototypeDataForScreen(screenParam)
      setScreen(screenParam)
    }

    const annotationParam = params.get('annotation')
    if (annotationParam) {
      pinAnnotationGuide(annotationParam, 'annotation')
    }

    const demoParam = params.get('demo')
    if (demoParam === '1' || demoParam === 'on') {
      const stepCount = getDemoSteps('demo').length
      const requestedStep = Number(params.get('step'))
      const nextStep = Number.isFinite(requestedStep)
        ? Math.min(Math.max(0, Math.floor(requestedStep)), Math.max(0, stepCount - 1))
        : 0

      useDemoStore.setState({
        mode: 'demo',
        isDemoActive: true,
        isDemoPaused: false,
        currentStepIndex: nextStep,
      })
    }
  }, [pinAnnotationGuide, setScreen])

  // When the annotation side drives focus, move the phone viewport so the target
  // lands in a readable position instead of just barely entering view.
  useEffect(() => {
    if (!activeAnnotationId) return

    const phoneStage = phoneStageRef.current
    const scroller = phoneStage?.querySelector('.phone-scroll') as HTMLElement | null
    const el = phoneStage?.querySelector(
      `[data-annotation-id="${activeAnnotationId}"]`
    ) as HTMLElement | null

    if (!scroller || !el) return
    if (activeHoverSource === 'phone') return

    const scrollerRect = scroller.getBoundingClientRect()
    const targetRect = el.getBoundingClientRect()
    const scaleY = scrollerRect.height / Math.max(scroller.clientHeight, 1)
    const relativeTop = scroller.scrollTop + (targetRect.top - scrollerRect.top) / scaleY
    const targetHeight = targetRect.height / scaleY
    const preferredTopGap = Math.min(120, Math.max(28, scroller.clientHeight * 0.22))
    const availableHeight = scroller.clientHeight - preferredTopGap - 24

    const nextTop = targetHeight > availableHeight
      ? relativeTop - 20
      : relativeTop - preferredTopGap

    const maxScrollTop = Math.max(0, scroller.scrollHeight - scroller.clientHeight)

    scroller.scrollTo({
      top: Math.max(0, Math.min(nextTop, maxScrollTop)),
      behavior: 'smooth',
    })
  }, [activeAnnotationId, activeHoverSource])

  const updateNavigatorOffset = useCallback(() => {
    if (isMobile || !activeAnnotationId) {
      setNavigatorOffsetY(0)
      return
    }

    const sticky = navigatorStickyRef.current
    const inner = navigatorInnerRef.current
    const phoneStage = phoneStageRef.current
    const target = phoneStage?.querySelector(
      `[data-annotation-id="${activeAnnotationId}"]`
    ) as HTMLElement | null
    const summaryCard = inner?.querySelector('[data-prototype-summary-card]') as HTMLElement | null

    if (!sticky || !inner || !target || !summaryCard) {
      setNavigatorOffsetY(0)
      return
    }

    const stickyRect = sticky.getBoundingClientRect()
    const targetRect = target.getBoundingClientRect()
    const targetCenterY = targetRect.top + targetRect.height / 2
    const summaryCenterLocal = summaryCard.offsetTop + summaryCard.offsetHeight / 2
    const desiredOffset = targetCenterY - (stickyRect.top + summaryCenterLocal)
    const viewportPadding = 32
    const maxDown = Math.max(
      0,
      window.innerHeight - viewportPadding - (stickyRect.top + inner.offsetHeight)
    )
    const nextOffset = Math.max(0, Math.min(desiredOffset, maxDown))

    setNavigatorOffsetY((current) => (Math.abs(current - nextOffset) < 1 ? current : nextOffset))
  }, [activeAnnotationId, isMobile])

  const updateHoverConnector = useCallback(() => {
    if (!activeAnnotationId || isMobile) {
      setHoverConnector(null)
      setSpotlightGeometry(null)
      return
    }

    const stage = desktopStageRef.current
    if (!stage) {
      setHoverConnector(null)
      setSpotlightGeometry(null)
      return
    }

    const phoneTarget = stage.querySelector(
      `[data-annotation-id="${activeAnnotationId}"]`
    ) as HTMLElement | null
    const annotationCard = stage.querySelector(
      `[data-annotation-card-for="${activeAnnotationId}"]`
    ) as HTMLElement | null

    if (!phoneTarget) {
      setHoverConnector(null)
      setSpotlightGeometry(null)
      return
    }

    const stageRect = stage.getBoundingClientRect()
    const targetRect = phoneTarget.getBoundingClientRect()
    const cardRect = annotationCard ? annotationCard.getBoundingClientRect() : null

    setSpotlightGeometry({
      phoneRect: {
        x: targetRect.left - stageRect.left - 14,
        y: targetRect.top - stageRect.top - 12,
        width: targetRect.width + 28,
        height: targetRect.height + 24,
        radius: 18,
      },
      annotationRect: cardRect
        ? {
            x: cardRect.left - stageRect.left - 12,
            y: cardRect.top - stageRect.top - 10,
            width: cardRect.width + 24,
            height: cardRect.height + 20,
            radius: 20,
          }
        : undefined,
    })

    if (!annotationCard || !cardRect || !isDesktopAnnotationsVisible) {
      setHoverConnector(null)
      return
    }

    const phonePoint = {
      x: targetRect.right - stageRect.left + 18,
      y: targetRect.top - stageRect.top + targetRect.height / 2,
    }
    const annotationRect = cardRect
    const annotationPoint = {
      x: annotationRect.left - stageRect.left - 22,
      y: annotationRect.top - stageRect.top + Math.min(42, annotationRect.height / 2),
    }
    const start = activeHoverSource === 'annotation' ? annotationPoint : phonePoint
    const end = activeHoverSource === 'annotation' ? phonePoint : annotationPoint
    const direction = end.x >= start.x ? 1 : -1
    const horizontalGap = Math.max(56, Math.abs(end.x - start.x) * 0.32)
    const c1 = {
      x: start.x + horizontalGap * direction,
      y: start.y,
    }
    const c2 = {
      x: end.x - horizontalGap * direction,
      y: end.y,
    }
    const d = [
      `M ${start.x} ${start.y}`,
      `C ${c1.x} ${c1.y},`,
      `${c2.x} ${c2.y},`,
      `${end.x} ${end.y}`,
    ].join(' ')
    const tangent = {
      x: end.x - c2.x,
      y: end.y - c2.y,
    }
    const tangentLength = Math.hypot(tangent.x, tangent.y) || 1
    const unit = {
      x: tangent.x / tangentLength,
      y: tangent.y / tangentLength,
    }
    const perpendicular = {
      x: -unit.y,
      y: unit.x,
    }
    const arrowLength = 16
    const arrowWidth = 12
    const arrowBase = {
      x: end.x - unit.x * arrowLength,
      y: end.y - unit.y * arrowLength,
    }
    const upper = {
      x: arrowBase.x + perpendicular.x * (arrowWidth / 2),
      y: arrowBase.y + perpendicular.y * (arrowWidth / 2),
    }
    const lower = {
      x: arrowBase.x - perpendicular.x * (arrowWidth / 2),
      y: arrowBase.y - perpendicular.y * (arrowWidth / 2),
    }
    const upperControl = {
      x: end.x - unit.x * 3 + perpendicular.x * 2.5,
      y: end.y - unit.y * 3 + perpendicular.y * 2.5,
    }
    const lowerControl = {
      x: end.x - unit.x * 3 - perpendicular.x * 2.5,
      y: end.y - unit.y * 3 - perpendicular.y * 2.5,
    }
    const arrowHeadD = [
      `M ${upper.x} ${upper.y}`,
      `Q ${upperControl.x} ${upperControl.y} ${end.x} ${end.y}`,
      `Q ${lowerControl.x} ${lowerControl.y} ${lower.x} ${lower.y}`,
      `Q ${arrowBase.x} ${arrowBase.y} ${upper.x} ${upper.y}`,
      'Z',
    ].join(' ')
    const arrowHighlight = {
      x: end.x - unit.x * 7,
      y: end.y - unit.y * 7,
    }

    setHoverConnector({ d, arrowHeadD, arrowHighlight, start, end })
  }, [activeAnnotationId, activeHoverSource, isDesktopAnnotationsVisible, isMobile])

  useEffect(() => {
    let frame = 0

    if (!activeAnnotationId || isMobile) {
      frame = window.requestAnimationFrame(() => {
        setHoverConnector(null)
      })
      return () => window.cancelAnimationFrame(frame)
    }

    frame = window.requestAnimationFrame(() => {
      updateHoverConnector()
    })

    const handleReposition = () => {
      window.cancelAnimationFrame(frame)
      frame = window.requestAnimationFrame(() => {
        updateHoverConnector()
      })
    }
    const stage = desktopStageRef.current
    const phoneTarget = stage?.querySelector(
      `[data-annotation-id="${activeAnnotationId}"]`
    ) as HTMLElement | null
    const annotationCard = stage?.querySelector(
      `[data-annotation-card-for="${activeAnnotationId}"]`
    ) as HTMLElement | null

    const resizeObserver = new ResizeObserver(() => {
      updateHoverConnector()
    })

    if (stage) resizeObserver.observe(stage)
    if (phoneTarget) resizeObserver.observe(phoneTarget)
    if (annotationCard) resizeObserver.observe(annotationCard)

    window.addEventListener('resize', handleReposition)
    window.addEventListener('scroll', handleReposition, true)

    return () => {
      window.cancelAnimationFrame(frame)
      resizeObserver.disconnect()
      window.removeEventListener('resize', handleReposition)
      window.removeEventListener('scroll', handleReposition, true)
    }
  }, [activeAnnotationId, isMobile, screen, updateHoverConnector])

  useEffect(() => {
    let frame = 0

    const scheduleUpdate = () => {
      window.cancelAnimationFrame(frame)
      frame = window.requestAnimationFrame(() => {
        updateNavigatorOffset()
      })
    }

    scheduleUpdate()

    const phoneStage = phoneStageRef.current
    const sticky = navigatorStickyRef.current
    const inner = navigatorInnerRef.current
    const scroller = phoneStage?.querySelector('.phone-scroll') as HTMLElement | null
    const target = phoneStage?.querySelector(
      `[data-annotation-id="${activeAnnotationId}"]`
    ) as HTMLElement | null
    const summaryCard = inner?.querySelector('[data-prototype-summary-card]') as HTMLElement | null

    const resizeObserver = new ResizeObserver(() => {
      scheduleUpdate()
    })

    if (sticky) resizeObserver.observe(sticky)
    if (inner) resizeObserver.observe(inner)
    if (target) resizeObserver.observe(target)
    if (summaryCard) resizeObserver.observe(summaryCard)

    scroller?.addEventListener('scroll', scheduleUpdate, { passive: true })
    window.addEventListener('resize', scheduleUpdate)

    return () => {
      window.cancelAnimationFrame(frame)
      resizeObserver.disconnect()
      scroller?.removeEventListener('scroll', scheduleUpdate)
      window.removeEventListener('resize', scheduleUpdate)
    }
  }, [activeAnnotationId, isMobile, screen, updateNavigatorOffset])

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setHoveredAnnotationId(null)
      clearAnnotationGuide()
      setHoverSource(null)
      setNavigatorOffsetY(0)
      setSpotlightGeometry(null)
    })

    return () => window.cancelAnimationFrame(frame)
  }, [clearAnnotationGuide, screen])

  useEffect(() => {
    const url = new URL(window.location.href)

    if (screen === 'home') url.searchParams.delete('screen')
    else url.searchParams.set('screen', screen)

    if (showMobileAnnotations) url.searchParams.set('panel', 'open')
    else if (!isDesktopAnnotationsVisible) url.searchParams.set('panel', 'closed')
    else url.searchParams.delete('panel')

    if (pinnedAnnotationId) url.searchParams.set('annotation', pinnedAnnotationId)
    else url.searchParams.delete('annotation')

    if (isDemoActive) {
      url.searchParams.set('demo', '1')
      url.searchParams.set('step', currentStepIndex.toString())
    } else {
      url.searchParams.delete('demo')
      url.searchParams.delete('step')
    }

    if (isDark) url.searchParams.set('theme', 'dark')
    else url.searchParams.delete('theme')

    if (isPresentationMode) url.searchParams.set('view', 'present')
    else url.searchParams.delete('view')

    if (currentLanguage !== DEFAULT_LANGUAGE) url.searchParams.set('lang', currentLanguage)
    else url.searchParams.delete('lang')

    window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`)
  }, [
    currentLanguage,
    currentStepIndex,
    isDark,
    isDemoActive,
    isDesktopAnnotationsVisible,
    isPresentationMode,
    pinnedAnnotationId,
    screen,
    showMobileAnnotations,
  ])

  const handleToggleDemo = useCallback(() => {
    if (isDemoActive) {
      stopDemo()
      return
    }

    setDemoMode('demo')
    startDemo()
  }, [isDemoActive, setDemoMode, startDemo, stopDemo])

  const handleToggleAnnotationPanel = useCallback(() => {
    if (isMobile) {
      setShowMobileAnnotations((current) => !current)
      return
    }

    setIsDesktopAnnotationsVisible((current) => !current)
  }, [isMobile])

  const handleTogglePresentationMode = useCallback(() => {
    setIsPresentationMode((current) => !current)
  }, [])

  const handleToggleFullscreen = useCallback(async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen()
        return
      }

      const target = appRootRef.current ?? document.documentElement
      await target.requestFullscreen()
    } catch {
      showPhoneNotification({
        title: t('app:notifications.fullscreenError.title'),
        body: t('app:notifications.fullscreenError.body'),
      })
    }
  }, [showPhoneNotification, t])

  const handleLoadMockData = useCallback(() => {
    const mockSessions = getMockSessions()
    useHistoryStore.setState({ sessions: mockSessions })
    useRetryPracticeStore.getState().clearRetryPractice()
    setReport(mockSessions[0])
    setScreen('report')
    showPhoneNotification({
      title: t('app:notifications.mockLoaded.title'),
      body: t('app:notifications.mockLoaded.body'),
    })
  }, [setReport, setScreen, showPhoneNotification, t])

  const handlePhoneMouseOver = useCallback((e: React.MouseEvent) => {
    if (isGuidedTourOpen || pinnedAnnotationId || !isDesktopAnnotationsVisible) return
    const target = e.target as HTMLElement
    const annotated = target.closest('[data-annotation-id]') as HTMLElement | null
    const id = annotated?.dataset?.annotationId ?? null
    setHoveredAnnotationId(id)
    setHoverSource(id ? 'phone' : null)
  }, [isDesktopAnnotationsVisible, isGuidedTourOpen, pinnedAnnotationId])

  const handlePhoneMouseOut = useCallback((e: React.MouseEvent) => {
    if (isGuidedTourOpen || pinnedAnnotationId || !isDesktopAnnotationsVisible) return
    const related = e.relatedTarget as HTMLElement | null
    if (!related?.closest?.('[data-annotation-id]') && !related?.closest?.('[data-annotation-card-for]')) {
      setHoveredAnnotationId(null)
      setHoverSource(null)
    }
  }, [isDesktopAnnotationsVisible, isGuidedTourOpen, pinnedAnnotationId])

  const handleStartGuidedTour = useCallback(() => {
    if (isMobile) return

    stopDemo()
    setOpenDesktopMenu(null)
    setShowCommandPalette(false)
    setShowCaptureModal(false)
    setShowShortcutsModal(false)
    setShowStoryModal(false)
    setIsPresentationMode(false)
    setIsDesktopAnnotationsVisible(true)
    setShowMobileAnnotations(false)
    setHoveredAnnotationId(null)
    clearAnnotationGuide()
    setHoverSource(null)
    startGuidedTour()
  }, [clearAnnotationGuide, isMobile, startGuidedTour, stopDemo])

  const handleResetPrototype = useCallback(() => {
    resetPrototypeState()
    setHoveredAnnotationId(null)
    clearAnnotationGuide()
    setHoverSource(null)
    setShowCommandPalette(false)
    setShowCaptureModal(false)
    setShowMobileAnnotations(false)
    setIsDesktopAnnotationsVisible(true)
    setIsPresentationMode(false)
    setShowStoryModal(false)
    setShowShortcutsModal(false)
    showPhoneNotification({
      title: t('app:notifications.prototypeReset.title'),
      body: t('app:notifications.prototypeReset.body'),
    })
  }, [clearAnnotationGuide, showPhoneNotification, t])

  useEffect(() => {
    if (isMobile && isGuidedTourOpen) {
      closeGuidedTour()
    }
  }, [closeGuidedTour, isGuidedTourOpen, isMobile])

  useEffect(() => {
    if (!isGuidedTourOpen || isMobile || !currentGuidedTourStep) {
      setGuidedTourTargetRect(null)
      return
    }

    setOpenDesktopMenu(currentGuidedTourStep.openMenu ?? null)
    setIsDesktopAnnotationsVisible(true)

    let frame = 0
    const updateTargetRect = () => {
      const target = document.querySelector(currentGuidedTourStep.target) as HTMLElement | null
      setGuidedTourTargetRect(target?.getBoundingClientRect() ?? null)
    }

    const scheduleUpdate = () => {
      window.cancelAnimationFrame(frame)
      frame = window.requestAnimationFrame(updateTargetRect)
    }

    scheduleUpdate()

    const target = document.querySelector(currentGuidedTourStep.target) as HTMLElement | null
    const resizeObserver = new ResizeObserver(() => {
      scheduleUpdate()
    })

    if (target) resizeObserver.observe(target)

    window.addEventListener('resize', scheduleUpdate)
    window.addEventListener('scroll', scheduleUpdate, true)

    return () => {
      window.cancelAnimationFrame(frame)
      resizeObserver.disconnect()
      window.removeEventListener('resize', scheduleUpdate)
      window.removeEventListener('scroll', scheduleUpdate, true)
    }
  }, [currentGuidedTourStep, isDesktopAnnotationsVisible, isGuidedTourOpen, isMobile, openDesktopMenu])

  useEffect(() => {
    if (!isGuidedTourOpen) {
      setGuidedTourTargetRect(null)
      setOpenDesktopMenu(null)
    }
  }, [isGuidedTourOpen])

  useEffect(() => {
    if (
      isMobile ||
      isGuidedTourOpen ||
      guidedTourDismissed ||
      guidedTourCompleted ||
      showLaunchOverlay ||
      pendingPhoneLaunch ||
      showPhoneLaunch ||
      isDemoActive ||
      showStoryModal ||
      showCommandPalette ||
      showCaptureModal ||
      showShortcutsModal ||
      isPresentationMode ||
      hasDeepLinkParams()
    ) {
      return
    }

    const timer = window.setTimeout(() => {
      handleStartGuidedTour()
    }, 640)

    return () => window.clearTimeout(timer)
  }, [
    guidedTourCompleted,
    guidedTourDismissed,
    handleStartGuidedTour,
    isDemoActive,
    isGuidedTourOpen,
    isMobile,
    isPresentationMode,
    pendingPhoneLaunch,
    showCaptureModal,
    showCommandPalette,
    showLaunchOverlay,
    showPhoneLaunch,
    showShortcutsModal,
    showStoryModal,
  ])

  const handleCopyCurrentViewLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      showPhoneNotification({
        title: t('app:notifications.copyLinkSuccess.title'),
        body: t('app:notifications.copyLinkSuccess.body'),
      })
    } catch {
      showPhoneNotification({
        title: t('app:notifications.copyLinkError.title'),
        body: t('app:notifications.copyLinkError.body'),
      })
    }
  }, [showPhoneNotification, t])

  const handleExportCapture = useCallback(async () => {
    const desktopStage = desktopStageRef.current
    const phoneOnly = phoneExportRef.current

    const target =
      capturePreset === 'phone'
        ? phoneOnly
        : desktopStage

    if (!target) {
      showPhoneNotification({
        title: t('app:notifications.exportNoTarget.title'),
        body: t('app:notifications.exportNoTarget.body'),
      })
      return
    }

    setIsExportingCapture(true)

    try {
      await downloadElementAsPng(target, {
        fileName: `talkfit-${capturePreset}-${new Date().toISOString().slice(0, 10)}.png`,
        background: '#f8fafc',
        padding: capturePreset === 'phone' ? 28 : 24,
        scale: capturePreset === 'phone' ? 2.4 : 2,
        beforeSerialize: (clone) => {
          clone.querySelectorAll<HTMLElement>('[data-capture-role="navigator"]').forEach((node) => {
            if (capturePreset === 'presentation') {
              node.remove()
            }
          })

          clone.querySelectorAll<HTMLElement>('[data-capture-role="annotation-divider"]').forEach((node) => {
            if (capturePreset === 'presentation' && clone.querySelector('[data-capture-role="annotation-panel"]')) {
              node.style.display = 'none'
            }
          })

          clone.querySelectorAll<HTMLElement>('[data-capture-role="annotation-panel"]').forEach((node) => {
            if (capturePreset === 'phone') {
              node.remove()
            }
          })

          clone.querySelectorAll<HTMLElement>('[data-capture-role="spotlight-overlay"], [data-capture-role="hover-connector"], [data-capture-role="guided-tour-overlay"]').forEach((node) => node.remove())
        },
      })

      setShowCaptureModal(false)
      showPhoneNotification({
        title: t('app:notifications.exportSuccess.title'),
        body: t('app:notifications.exportSuccess.body'),
      })
    } catch (error) {
      console.error('Failed to export PNG capture', error)
      showPhoneNotification({
        title: t('app:notifications.exportError.title'),
        body: t('app:notifications.exportError.body'),
      })
    } finally {
      setIsExportingCapture(false)
    }
  }, [capturePreset, showPhoneNotification, t])

  const commandPaletteActions = useMemo(() => {
    const getKeywords = (key: string) => {
      const value = t(key, { returnObjects: true })
      return Array.isArray(value) ? value.map(String) : []
    }

    const screenActions: Array<{
      id: Screen
      title: string
      description: string
      keywords: string[]
    }> = [
      { id: 'home', title: t('commandPalette:actions.home.title'), description: t('commandPalette:actions.home.description'), keywords: getKeywords('commandPalette:actions.home.keywords') },
      { id: 'practice', title: t('commandPalette:actions.practice.title'), description: t('commandPalette:actions.practice.description'), keywords: getKeywords('commandPalette:actions.practice.keywords') },
      { id: 'report', title: t('commandPalette:actions.report.title'), description: t('commandPalette:actions.report.description'), keywords: getKeywords('commandPalette:actions.report.keywords') },
      { id: 'history', title: t('commandPalette:actions.history.title'), description: t('commandPalette:actions.history.description'), keywords: getKeywords('commandPalette:actions.history.keywords') },
      { id: 'settings', title: t('commandPalette:actions.settings.title'), description: t('commandPalette:actions.settings.description'), keywords: getKeywords('commandPalette:actions.settings.keywords') },
    ]

    return [
      ...screenActions.map((action) => ({
        id: `screen-${action.id}`,
        title: action.title,
        description: action.description,
        section: t('commandPalette:sections.screen'),
        keywords: action.keywords,
        onSelect: () => {
          ensurePrototypeDataForScreen(action.id)
          requestScreen(action.id)
        },
      })),
      {
        id: 'toggle-demo',
        title: isDemoActive
          ? t('commandPalette:actions.demoStop.title')
          : t('commandPalette:actions.demoStart.title'),
        description: isDemoActive
          ? t('commandPalette:actions.demoStop.description')
          : t('commandPalette:actions.demoStart.description'),
        section: t('commandPalette:sections.showcase'),
        shortcut: 'D',
        keywords: isDemoActive
          ? getKeywords('commandPalette:actions.demoStop.keywords')
          : getKeywords('commandPalette:actions.demoStart.keywords'),
        onSelect: handleToggleDemo,
      },
      {
        id: 'toggle-presentation',
        title: isPresentationMode
          ? t('commandPalette:actions.presentationOff.title')
          : t('commandPalette:actions.presentationOn.title'),
        description: isPresentationMode
          ? t('commandPalette:actions.presentationOff.description')
          : t('commandPalette:actions.presentationOn.description'),
        section: t('commandPalette:sections.showcase'),
        shortcut: 'P',
        keywords: isPresentationMode
          ? getKeywords('commandPalette:actions.presentationOff.keywords')
          : getKeywords('commandPalette:actions.presentationOn.keywords'),
        onSelect: handleTogglePresentationMode,
      },
      {
        id: 'toggle-fullscreen',
        title: isFullscreen
          ? t('commandPalette:actions.fullscreenOff.title')
          : t('commandPalette:actions.fullscreenOn.title'),
        description: isFullscreen
          ? t('commandPalette:actions.fullscreenOff.description')
          : t('commandPalette:actions.fullscreenOn.description'),
        section: t('commandPalette:sections.showcase'),
        shortcut: 'F',
        keywords: isFullscreen
          ? getKeywords('commandPalette:actions.fullscreenOff.keywords')
          : getKeywords('commandPalette:actions.fullscreenOn.keywords'),
        onSelect: () => { void handleToggleFullscreen() },
      },
      {
        id: 'toggle-annotations',
        title: isDesktopAnnotationsVisible || showMobileAnnotations
          ? t('commandPalette:actions.annotationsHide.title')
          : t('commandPalette:actions.annotationsShow.title'),
        description: isDesktopAnnotationsVisible || showMobileAnnotations
          ? t('commandPalette:actions.annotationsHide.description')
          : t('commandPalette:actions.annotationsShow.description'),
        section: t('commandPalette:sections.showcase'),
        shortcut: 'A',
        keywords: isDesktopAnnotationsVisible || showMobileAnnotations
          ? getKeywords('commandPalette:actions.annotationsHide.keywords')
          : getKeywords('commandPalette:actions.annotationsShow.keywords'),
        onSelect: handleToggleAnnotationPanel,
      },
      {
        id: 'load-mock',
        title: t('commandPalette:actions.loadMock.title'),
        description: t('commandPalette:actions.loadMock.description'),
        section: t('commandPalette:sections.tools'),
        keywords: getKeywords('commandPalette:actions.loadMock.keywords'),
        onSelect: handleLoadMockData,
      },
      {
        id: 'open-capture-export',
        title: t('commandPalette:actions.capture.title'),
        description: t('commandPalette:actions.capture.description'),
        section: t('commandPalette:sections.tools'),
        shortcut: 'E',
        keywords: getKeywords('commandPalette:actions.capture.keywords'),
        onSelect: () => setShowCaptureModal(true),
      },
      {
        id: 'open-guided-tour',
        title: t('commandPalette:actions.guidedTour.title'),
        description: t('commandPalette:actions.guidedTour.description'),
        section: t('commandPalette:sections.tools'),
        keywords: getKeywords('commandPalette:actions.guidedTour.keywords'),
        onSelect: handleStartGuidedTour,
      },
      {
        id: 'copy-link',
        title: t('commandPalette:actions.copyLink.title'),
        description: t('commandPalette:actions.copyLink.description'),
        section: t('commandPalette:sections.tools'),
        shortcut: 'L',
        keywords: getKeywords('commandPalette:actions.copyLink.keywords'),
        onSelect: () => { void handleCopyCurrentViewLink() },
      },
      {
        id: 'toggle-theme',
        title: isDark
          ? t('commandPalette:actions.themeLight.title')
          : t('commandPalette:actions.themeDark.title'),
        description: isDark
          ? t('commandPalette:actions.themeLight.description')
          : t('commandPalette:actions.themeDark.description'),
        section: t('commandPalette:sections.tools'),
        shortcut: 'T',
        keywords: isDark
          ? getKeywords('commandPalette:actions.themeLight.keywords')
          : getKeywords('commandPalette:actions.themeDark.keywords'),
        onSelect: () => setIsDark((current) => !current),
      },
      {
        id: 'open-design-story',
        title: t('commandPalette:actions.designStory.title'),
        description: t('commandPalette:actions.designStory.description'),
        section: t('commandPalette:sections.tools'),
        shortcut: 'S',
        keywords: getKeywords('commandPalette:actions.designStory.keywords'),
        onSelect: () => setShowStoryModal(true),
      },
      {
        id: 'open-shortcuts',
        title: t('commandPalette:actions.shortcuts.title'),
        description: t('commandPalette:actions.shortcuts.description'),
        section: t('commandPalette:sections.tools'),
        shortcut: '?',
        keywords: getKeywords('commandPalette:actions.shortcuts.keywords'),
        onSelect: () => setShowShortcutsModal(true),
      },
      {
        id: 'reset-prototype',
        title: t('commandPalette:actions.reset.title'),
        description: t('commandPalette:actions.reset.description'),
        section: t('commandPalette:sections.tools'),
        shortcut: 'R',
        keywords: getKeywords('commandPalette:actions.reset.keywords'),
        onSelect: handleResetPrototype,
      },
    ]
  }, [
    handleCopyCurrentViewLink,
    handleToggleFullscreen,
    handleStartGuidedTour,
    handleLoadMockData,
    handleResetPrototype,
    handleToggleAnnotationPanel,
    handleToggleDemo,
    handleTogglePresentationMode,
    isDark,
    isDemoActive,
    isDesktopAnnotationsVisible,
    isFullscreen,
    isPresentationMode,
    requestScreen,
    showMobileAnnotations,
    t,
  ])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      const isTyping =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target?.isContentEditable

      if (isTyping) return

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setShowShortcutsModal(false)
        setShowCommandPalette((current) => !current)
        return
      }

      if ((e.key === '?' || (e.key === '/' && e.shiftKey)) && !e.metaKey && !e.ctrlKey) {
        e.preventDefault()
        setShowShortcutsModal((current) => !current)
        return
      }

      if (showCommandPalette) {
        if (e.key === 'Escape') {
          e.preventDefault()
          setShowCommandPalette(false)
        }
        return
      }

      if (showCaptureModal) {
        if (e.key === 'Escape') {
          e.preventDefault()
          setShowCaptureModal(false)
        }
        return
      }

      if (showShortcutsModal) {
        if (e.key === 'Escape') {
          e.preventDefault()
          setShowShortcutsModal(false)
        }
        return
      }

      if (isGuidedTourOpen) {
        if (e.key === 'Escape') {
          e.preventDefault()
          skipGuidedTour()
          return
        }

        if (e.key === 'ArrowRight') {
          e.preventDefault()
          if (guidedTourStepIndex < GUIDED_TOUR_STEPS.length - 1) nextGuidedTourStep(GUIDED_TOUR_STEPS.length)
          else finishGuidedTour()
          return
        }

        if (e.key === 'ArrowLeft') {
          e.preventDefault()
          if (guidedTourStepIndex > 0) previousGuidedTourStep()
          return
        }
      }

      if (!showStoryModal && e.key.toLowerCase() === 'd') {
        e.preventDefault()
        handleToggleDemo()
        return
      }

      if (!showStoryModal && e.key.toLowerCase() === 'r') {
        e.preventDefault()
        handleResetPrototype()
        return
      }

      if (!showStoryModal && e.key.toLowerCase() === 'a') {
        e.preventDefault()
        handleToggleAnnotationPanel()
        return
      }

      if (!showStoryModal && e.key.toLowerCase() === 'p') {
        e.preventDefault()
        handleTogglePresentationMode()
        return
      }

      if (!showStoryModal && e.key.toLowerCase() === 'f') {
        e.preventDefault()
        void handleToggleFullscreen()
        return
      }

      if (!showStoryModal && e.key.toLowerCase() === 'e') {
        e.preventDefault()
        setShowCaptureModal(true)
        return
      }

      if (!showStoryModal && e.key.toLowerCase() === 't') {
        e.preventDefault()
        setIsDark((current) => !current)
        return
      }

      if (!showStoryModal && e.key.toLowerCase() === 's') {
        e.preventDefault()
        setShowStoryModal(true)
        return
      }

      if (!showStoryModal && e.key.toLowerCase() === 'l') {
        e.preventDefault()
        void handleCopyCurrentViewLink()
        return
      }

      if (!isDemoActive) return

      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault()
        if (currentStepIndex < currentDemoSteps.length - 1) goToStep(currentStepIndex + 1)
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        if (currentStepIndex > 0) goToStep(currentStepIndex - 1)
      } else if (e.key.toLowerCase() === 'k') {
        e.preventDefault()
        useDemoStore.getState().togglePause()
      } else if (e.key === 'Escape') {
        stopDemo()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [
    currentDemoSteps.length,
    currentStepIndex,
    finishGuidedTour,
    goToStep,
    handleCopyCurrentViewLink,
    handleResetPrototype,
    guidedTourStepIndex,
    handleToggleAnnotationPanel,
    handleToggleDemo,
    handleToggleFullscreen,
    isGuidedTourOpen,
    handleTogglePresentationMode,
    isDemoActive,
    nextGuidedTourStep,
    previousGuidedTourStep,
    showCommandPalette,
    showCaptureModal,
    showShortcutsModal,
    showStoryModal,
    skipGuidedTour,
    stopDemo,
  ])

  const handleCompleteLaunch = useCallback(() => {
    setShowLaunchOverlay(false)
    setPendingPhoneLaunch(true)
  }, [])

  useEffect(() => {
    if (!pendingPhoneLaunch) return

    const timer = window.setTimeout(() => {
      setShowPhoneLaunch(true)
      setPendingPhoneLaunch(false)
    }, 220)

    return () => window.clearTimeout(timer)
  }, [pendingPhoneLaunch])

  useEffect(() => {
    if (!showPhoneLaunch) return

    const timer = window.setTimeout(() => {
      setShowPhoneLaunch(false)
    }, 1050)

    return () => window.clearTimeout(timer)
  }, [showPhoneLaunch])

  const renderLanguageToggle = (className = '') => {
    const nextLanguage = currentLanguage === 'zh-TW' ? 'en' : 'zh-TW'
    const nextLabel = nextLanguage === 'zh-TW'
      ? t('common:languageToggle.switchToZh')
      : t('common:languageToggle.switchToEn')
    const currentShortLabel = currentLanguage === 'zh-TW'
      ? t('common:languageToggle.zh')
      : t('common:languageToggle.en')

    return (
      <button
        onClick={() => setLanguage(nextLanguage)}
        className={`inline-flex items-center gap-2 rounded-full border border-divider bg-bg-card/80 px-3 py-1.5 text-xs font-medium text-text-secondary transition-all hover:border-accent-blue/30 hover:bg-accent-blue/10 hover:text-text-primary ${className}`}
        title={nextLabel}
        aria-label={nextLabel}
      >
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M4 5h8" />
          <path d="M8 3v2c0 4.4-2 8.1-5 10" />
          <path d="M6 11c1.2 1.5 2.6 2.9 4.2 4" />
          <path d="M14 19l4.2-10.5L22.5 19" />
          <path d="M15.6 15h5.2" />
        </svg>
        <span>{currentShortLabel}</span>
      </button>
    )
  }

  return (
    <div ref={appRootRef} className="min-h-screen bg-bg-base flex flex-col font-sans">
      {/* Highlight style injection */}
      {activeAnnotationId && isMobile && (
        <style>{`
          [data-annotation-id="${activeAnnotationId}"] {
            border-radius: 12px;
            box-shadow:
              inset 0 0 0 2px rgba(251,191,36,0.78),
              0 10px 22px rgba(249,115,22,0.16);
            transition: box-shadow 180ms ease;
          }
        `}</style>
      )}

      {/* Top bar */}
      <AnimatePresence initial={false}>
        {!isPresentationMode && (
          <motion.div
            className="flex-shrink-0 border-b border-divider px-4 md:px-8 py-2 md:py-3.5 flex items-center justify-between"
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.18 }}
          >
        <div data-tour-target="topbar-actions" className="flex items-center gap-2 md:gap-3">
          <img src="/app-icon.png" alt="TalkFit" className="w-10 h-10 md:w-20 md:h-20 rounded-2xl object-cover flex-shrink-0 shadow-sm" />
          <div>
            <h1 className="text-sm font-semibold text-text-primary leading-none">{t('common:appName')}</h1>
            <p className="hidden md:block text-[10px] text-text-muted mt-0.5">{t('common:madeWithReact')}</p>
          </div>
          {/* GitHub link — desktop only */}
          <a
            href="https://github.com/swiftruru/SpeakCoach-TalkFit"
            target="_blank"
            rel="noopener noreferrer"
            title={t('common:viewOnGitHub')}
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
            ✦ {t('common:actions.designStory')}
          </button>

          {/* Mock data — desktop only */}
          <button
            onClick={handleLoadMockData}
            className="hidden md:block text-xs px-3 py-1.5 rounded-full border border-accent-amber/40 text-accent-amber hover:bg-accent-amber/10 transition-all"
          >
            ✦ {t('common:actions.mockData')}
          </button>

          <div
            className="relative hidden md:block"
            onMouseEnter={() => setOpenDesktopMenu('showcase')}
            onMouseLeave={() => setOpenDesktopMenu((current) => (current === 'showcase' ? null : current))}
          >
            <button
              onClick={() => setOpenDesktopMenu((current) => (current === 'showcase' ? null : 'showcase'))}
              className={`text-xs px-3 py-1.5 rounded-full border transition-all flex items-center gap-1.5 ${
                openDesktopMenu === 'showcase'
                  ? 'border-accent-blue/35 bg-accent-blue/10 text-accent-blue-light'
                  : 'border-divider text-text-secondary hover:text-text-primary hover:bg-bg-card'
              }`}
            >
              <span>{t('app:topbar.showcaseTools')}</span>
              <svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            <AnimatePresence>
              {openDesktopMenu === 'showcase' && (
                <motion.div
                  data-tour-target="topbar-showcase-menu"
                  className="absolute right-0 top-[calc(100%+10px)] z-30 w-56 rounded-2xl border border-divider bg-bg-surface/96 p-2 shadow-[0_18px_40px_rgba(15,23,42,0.14)] backdrop-blur-md"
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.16 }}
                >
                  <button
                    onClick={() => {
                      setShowCommandPalette(true)
                      setOpenDesktopMenu(null)
                    }}
                    className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm text-text-secondary transition-all hover:bg-bg-card hover:text-text-primary"
                  >
                    <span>{t('app:topbar.quickActions')}</span>
                    <span className="text-[11px] text-text-muted">{t('common:actions.quickActions')}</span>
                  </button>
                  <button
                    onClick={() => {
                      handleToggleAnnotationPanel()
                      setOpenDesktopMenu(null)
                    }}
                    className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm text-text-secondary transition-all hover:bg-bg-card hover:text-text-primary"
                  >
                    <span>{isDesktopAnnotationsVisible ? t('common:actions.collapseAnnotations') : t('common:actions.openAnnotations')}</span>
                    <span className="text-[11px] text-text-muted">{t('app:topbar.annotationsHint')}</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowCaptureModal(true)
                      setOpenDesktopMenu(null)
                    }}
                    className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm text-text-secondary transition-all hover:bg-bg-card hover:text-text-primary"
                  >
                    <span>{t('common:actions.exportCapture')}</span>
                    <span className="text-[11px] text-text-muted">{t('app:topbar.captureHint')}</span>
                  </button>
                  <button
                    onClick={() => {
                      handleTogglePresentationMode()
                      setOpenDesktopMenu(null)
                    }}
                    className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm text-text-secondary transition-all hover:bg-bg-card hover:text-text-primary"
                  >
                    <span>{isPresentationMode ? t('common:actions.endPresentation') : t('common:actions.presentationMode')}</span>
                    <span className="text-[11px] text-text-muted">{t('app:topbar.presentationHint')}</span>
                  </button>
                  <button
                    onClick={() => {
                      void handleToggleFullscreen()
                      setOpenDesktopMenu(null)
                    }}
                    className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm text-text-secondary transition-all hover:bg-bg-card hover:text-text-primary"
                  >
                    <span>{isFullscreen ? t('common:actions.exitFullscreen') : t('common:actions.fullscreen')}</span>
                    <span className="text-[11px] text-text-muted">{t('app:topbar.fullscreenHint')}</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button
            onClick={() => {
              handleToggleDemo()
            }}
            className={`lg:hidden text-xs px-3 py-1.5 rounded-full border transition-all flex items-center gap-1.5 ${
              isDemoActive
                ? 'border-accent-amber/40 text-accent-amber bg-accent-amber/10'
                : 'border-accent-blue/40 text-accent-blue-light hover:bg-accent-blue/10'
            }`}
          >
            <svg viewBox="0 0 24 24" width="10" height="10" fill="currentColor">
              {isDemoActive ? (
                <rect x="6" y="6" width="12" height="12" rx="2" />
              ) : (
                <polygon points="5,3 19,12 5,21" />
              )}
            </svg>
            <span>{isDemoActive ? t('common:actions.stopDemo') : t('common:actions.startDemo')}</span>
          </button>

          <div
            className="relative hidden md:block"
            onMouseEnter={() => setOpenDesktopMenu('system')}
            onMouseLeave={() => setOpenDesktopMenu((current) => (current === 'system' ? null : current))}
          >
            <button
              onClick={() => setOpenDesktopMenu((current) => (current === 'system' ? null : 'system'))}
              className={`text-xs px-3 py-1.5 rounded-full border transition-all flex items-center gap-1.5 ${
                openDesktopMenu === 'system'
                  ? 'border-divider bg-bg-card text-text-primary'
                  : 'border-divider text-text-secondary hover:text-text-primary hover:bg-bg-card'
              }`}
            >
              <span>{t('common:actions.more')}</span>
              <svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            <AnimatePresence>
              {openDesktopMenu === 'system' && (
                <motion.div
                  className="absolute right-0 top-[calc(100%+10px)] z-30 w-56 rounded-2xl border border-divider bg-bg-surface/96 p-2 shadow-[0_18px_40px_rgba(15,23,42,0.14)] backdrop-blur-md"
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.16 }}
                >
                  <button
                    onClick={() => {
                      handleStartGuidedTour()
                      setOpenDesktopMenu(null)
                    }}
                    className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm text-text-secondary transition-all hover:bg-bg-card hover:text-text-primary"
                  >
                    <span>{t('common:actions.guidedTour')}</span>
                    <span className="text-[11px] text-text-muted">{t('app:topbar.tourHint')}</span>
                  </button>
                  <button
                    onClick={() => {
                      handleResetPrototype()
                      setOpenDesktopMenu(null)
                    }}
                    className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm text-text-secondary transition-all hover:bg-bg-card hover:text-text-primary"
                  >
                    <span>{t('common:actions.resetPrototype')}</span>
                    <span className="text-[11px] text-text-muted">{t('app:topbar.resetHint')}</span>
                  </button>
                  <button
                    onClick={() => {
                      void handleCopyCurrentViewLink()
                      setOpenDesktopMenu(null)
                    }}
                    className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm text-text-secondary transition-all hover:bg-bg-card hover:text-text-primary"
                  >
                    <span>{t('common:actions.copyLink')}</span>
                    <span className="text-[11px] text-text-muted">{t('app:topbar.shareHint')}</span>
                  </button>
                  <button
                    onClick={() => {
                      setIsDark((v) => !v)
                      setOpenDesktopMenu(null)
                    }}
                    className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm text-text-secondary transition-all hover:bg-bg-card hover:text-text-primary"
                  >
                    <span>{isDark ? t('common:actions.themeLight') : t('common:actions.themeDark')}</span>
                    <span className="text-[11px] text-text-muted">{t('app:topbar.themeHint')}</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {renderLanguageToggle()}
        </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence initial={false}>
        {isPresentationMode && (
          <motion.div
            className="fixed right-6 top-5 z-40 hidden items-center gap-2 rounded-full border border-divider bg-bg-surface/92 px-3 py-2 shadow-lg backdrop-blur md:flex"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.18 }}
          >
            <button
              onClick={handleTogglePresentationMode}
              className="rounded-full border border-divider px-3 py-1.5 text-xs text-text-secondary transition-all hover:bg-bg-card hover:text-text-primary"
            >
              {t('common:actions.endPresentation')}
            </button>
            {renderLanguageToggle()}
            <button
              onClick={handleToggleAnnotationPanel}
              className="rounded-full border border-divider px-3 py-1.5 text-xs text-text-secondary transition-all hover:bg-bg-card hover:text-text-primary"
            >
              {isDesktopAnnotationsVisible ? t('common:actions.collapseAnnotations') : t('common:actions.openAnnotations')}
            </button>
            <button
              onClick={() => setShowCaptureModal(true)}
              className="rounded-full border border-divider px-3 py-1.5 text-xs text-text-secondary transition-all hover:bg-bg-card hover:text-text-primary"
            >
              {t('common:actions.exportCapture')}
            </button>
            <button
              onClick={() => { void handleToggleFullscreen() }}
              className="rounded-full border border-divider px-3 py-1.5 text-xs text-text-secondary transition-all hover:bg-bg-card hover:text-text-primary"
            >
              {isFullscreen ? t('common:actions.exitFullscreen') : t('common:actions.fullscreen')}
            </button>
            <button
              onClick={() => setShowCommandPalette(true)}
              className="rounded-full border border-divider px-3 py-1.5 text-xs text-text-secondary transition-all hover:bg-bg-card hover:text-text-primary"
            >
              {t('common:actions.quickActions')}
            </button>
            {renderLanguageToggle()}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main content: phone + annotation panel */}
      <div ref={desktopStageRef} className="relative flex-1 flex flex-col md:flex-row overflow-hidden">
        <AnimatePresence initial={false}>
          {isSpotlightActive && spotlightGeometry && (
            <motion.div
              data-capture-ignore
              data-capture-role="spotlight-overlay"
              className="pointer-events-none absolute inset-0 z-[4] hidden md:block"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
            >
              <svg className="h-full w-full">
                <defs>
                  <mask id="spotlight-mask">
                    <rect width="100%" height="100%" fill="white" />
                    <rect
                      x={spotlightGeometry.phoneRect.x}
                      y={spotlightGeometry.phoneRect.y}
                      width={spotlightGeometry.phoneRect.width}
                      height={spotlightGeometry.phoneRect.height}
                      rx={spotlightGeometry.phoneRect.radius}
                      fill="black"
                    />
                    {spotlightGeometry.annotationRect ? (
                      <rect
                        x={spotlightGeometry.annotationRect.x}
                        y={spotlightGeometry.annotationRect.y}
                        width={spotlightGeometry.annotationRect.width}
                        height={spotlightGeometry.annotationRect.height}
                        rx={spotlightGeometry.annotationRect.radius}
                        fill="black"
                      />
                    ) : null}
                  </mask>
                  <filter id="spotlight-shadow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="12" stdDeviation="18" floodColor="rgba(15,23,42,0.12)" />
                  </filter>
                </defs>

                <rect width="100%" height="100%" fill="rgba(15,23,42,0.18)" mask="url(#spotlight-mask)" />

                <rect
                  x={spotlightGeometry.phoneRect.x}
                  y={spotlightGeometry.phoneRect.y}
                  width={spotlightGeometry.phoneRect.width}
                  height={spotlightGeometry.phoneRect.height}
                  rx={spotlightGeometry.phoneRect.radius}
                  fill="none"
                  stroke="rgba(251,191,36,0.7)"
                  strokeWidth="2"
                  filter="url(#spotlight-shadow)"
                />
                {spotlightGeometry.annotationRect ? (
                  <rect
                    x={spotlightGeometry.annotationRect.x}
                    y={spotlightGeometry.annotationRect.y}
                    width={spotlightGeometry.annotationRect.width}
                    height={spotlightGeometry.annotationRect.height}
                    rx={spotlightGeometry.annotationRect.radius}
                    fill="none"
                    stroke="rgba(249,115,22,0.55)"
                    strokeWidth="2"
                    filter="url(#spotlight-shadow)"
                  />
                ) : null}
              </svg>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {hoverConnector && (
            <motion.div
              data-capture-ignore
              data-capture-role="hover-connector"
              className="pointer-events-none absolute inset-0 z-10 hidden md:block"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.16 }}
            >
              <svg className="h-full w-full overflow-visible">
                <defs>
                  <linearGradient id="annotation-arrow-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="rgba(251, 191, 36, 0.95)" />
                    <stop offset="100%" stopColor="rgba(249, 115, 22, 0.95)" />
                  </linearGradient>
                  <filter id="annotation-arrow-glow" x="-30%" y="-30%" width="160%" height="160%">
                    <feDropShadow dx="0" dy="0" stdDeviation="3.5" floodColor="rgba(249, 115, 22, 0.22)" />
                  </filter>
                </defs>
                <motion.path
                  d={hoverConnector.d}
                  fill="none"
                  stroke="url(#annotation-arrow-gradient)"
                  strokeWidth="2.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  filter="url(#annotation-arrow-glow)"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.24, ease: 'easeOut' }}
                />
                <motion.path
                  d={hoverConnector.arrowHeadD}
                  fill="rgba(255, 237, 213, 0.98)"
                  stroke="rgba(249, 115, 22, 0.9)"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  filter="url(#annotation-arrow-glow)"
                  initial={{ opacity: 0, pathLength: 0 }}
                  animate={{ opacity: 1, pathLength: 1 }}
                  transition={{ duration: 0.18, delay: 0.08, ease: 'easeOut' }}
                />
                <circle
                  cx={hoverConnector.arrowHighlight.x}
                  cy={hoverConnector.arrowHighlight.y}
                  r="2.2"
                  fill="rgba(255, 255, 255, 0.82)"
                />
                <circle
                  cx={hoverConnector.start.x}
                  cy={hoverConnector.start.y}
                  r="10"
                  fill="rgba(251, 191, 36, 0.12)"
                />
                <circle
                  cx={hoverConnector.start.x}
                  cy={hoverConnector.start.y}
                  r="5"
                  fill="rgba(255, 247, 237, 0.96)"
                  stroke="rgba(245, 158, 11, 0.88)"
                  strokeWidth="2"
                />
              </svg>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Phone area */}
        <div
          className={`flex-1 overflow-auto px-4 pb-8 md:pb-8 ${
            isPresentationMode ? 'pt-5 md:px-6 md:pt-5' : 'pt-6 md:px-8'
          }`}
        >
          <div className={`flex items-start justify-center ${isPresentationMode ? 'gap-4 xl:gap-5' : 'gap-5 xl:gap-7'}`}>
            <div data-capture-role="navigator" data-tour-target="prototype-navigator" className="hidden lg:block w-[344px] flex-shrink-0">
              <div ref={navigatorStickyRef} className="sticky top-6">
                <div
                  ref={navigatorInnerRef}
                  className="transition-transform duration-300 ease-out will-change-transform"
                  style={{ transform: `translateY(${navigatorOffsetY}px)` }}
                >
                  <PrototypeNavigator isSpotlightMode={isSpotlightActive} />
                </div>
              </div>
            </div>

            <div
              ref={phoneStageRef}
              data-tour-target="phone-stage"
              style={
                isMobile
                  ? { transform: 'scale(0.9)', transformOrigin: 'top center', marginBottom: '-81px' }
                  : {
                      transform: isPresentationMode ? 'scale(0.92)' : 'scale(0.85)',
                      transformOrigin: 'top center',
                      marginBottom: isPresentationMode ? '-70px' : '-122px',
                    }
              }
              onMouseOver={handlePhoneMouseOver}
              onMouseOut={handlePhoneMouseOut}
            >
              <div ref={phoneExportRef} data-capture-role="phone-stage">
                <PhoneFrame screen={screen} isLaunching={showPhoneLaunch}>
                  <ScreenContent screen={screen} />
                </PhoneFrame>
              </div>
            </div>
          </div>
        </div>

        {/* Vertical divider — desktop only */}
        {isDesktopAnnotationsVisible && (
          <div data-capture-role="annotation-divider" className="hidden md:block w-px bg-border-divider flex-shrink-0 self-stretch" />
        )}

        {/* Annotation panel — desktop only */}
        <AnimatePresence initial={false}>
          {isDesktopAnnotationsVisible && (
            <motion.div
              data-capture-role="annotation-panel"
              data-tour-target="annotation-panel"
              className="hidden md:flex bg-bg-surface overflow-hidden flex-col flex-shrink-0"
              style={{ width: isPresentationMode ? 360 : 340 }}
              initial={{ opacity: 0, x: 18 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 18 }}
              transition={{ duration: 0.18 }}
            >
              <AnnotationPanel
                screen={screen}
                activeId={activeAnnotationId}
                pinnedId={pinnedAnnotationId}
                isSpotlightMode={isSpotlightActive}
                onHoverItem={(id) => {
                  if (pinnedAnnotationId) return
                  setHoveredAnnotationId(id)
                  setHoverSource(id ? 'annotation' : null)
                }}
                onTogglePin={(id) => {
                  if (pinnedAnnotationId === id) {
                    clearAnnotationGuide()
                    setHoverSource(null)
                    return
                  }

                  pinAnnotationGuide(id, 'annotation')
                  setHoverSource('annotation')
                  setHoveredAnnotationId(null)
                }}
                onNavigate={requestScreen}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Mobile bottom nav — mobile only */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-bg-surface border-t border-divider flex items-center justify-around px-2 py-2">
        {mobileNav.map(({ id, label, icon }) => (
          <button
            key={id}
            onClick={() => { requestScreen(id); setShowMobileAnnotations(false) }}
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
          {t('common:mobile.annotations')}
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
                activeId={activeAnnotationId}
                pinnedId={pinnedAnnotationId}
                isSpotlightMode={isSpotlightActive}
                onHoverItem={(id) => {
                  if (pinnedAnnotationId) return
                  setHoveredAnnotationId(id)
                    setHoverSource(id ? 'annotation' : null)
                  }}
                  onTogglePin={(id) => {
                    if (pinnedAnnotationId === id) {
                      clearAnnotationGuide()
                      setHoverSource(null)
                      return
                    }

                    pinAnnotationGuide(id, 'annotation')
                    setHoverSource('annotation')
                    setHoveredAnnotationId(null)
                  }}
                  onNavigate={(s) => { requestScreen(s); setShowMobileAnnotations(false) }}
                />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <DesignStoryModal isOpen={showStoryModal} onClose={() => setShowStoryModal(false)} />
      <GuidedTourOverlay
        isOpen={isGuidedTourOpen}
        step={currentGuidedTourStep}
        stepIndex={guidedTourStepIndex}
        totalSteps={GUIDED_TOUR_STEPS.length}
        targetRect={guidedTourTargetRect}
        onPrevious={previousGuidedTourStep}
        onNext={() => nextGuidedTourStep(GUIDED_TOUR_STEPS.length)}
        onSkip={skipGuidedTour}
        onFinish={finishGuidedTour}
      />
      <CommandPaletteModal
        isOpen={showCommandPalette}
        actions={commandPaletteActions}
        onClose={() => setShowCommandPalette(false)}
      />
      <CaptureExportModal
        isOpen={showCaptureModal}
        isExporting={isExportingCapture}
        selectedPreset={capturePreset}
        onSelectPreset={setCapturePreset}
        onExport={() => { void handleExportCapture() }}
        onClose={() => setShowCaptureModal(false)}
      />
      <KeyboardShortcutsModal
        isOpen={showShortcutsModal}
        onClose={() => setShowShortcutsModal(false)}
      />
      {/* Mobile-browser notice — floating card, bottom-right */}
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
              {t('app:mobileNotice.before')}
              <span className="text-accent-amber font-medium">{t('app:mobileNotice.highlight')}</span>
              {t('app:mobileNotice.after')}
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

      <AnimatePresence>
        {showLaunchOverlay && (
          <AppLaunchOverlay onComplete={handleCompleteLaunch} />
        )}
      </AnimatePresence>
    </div>
  )
}
