import { useEffect, useRef, useCallback, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { useNavigationStore } from '../stores/navigationStore'
import { useSessionStore } from '../stores/sessionStore'
import { useReportStore } from '../stores/reportStore'
import { useHistoryStore } from '../stores/historyStore'
import { useSettingsStore } from '../stores/settingsStore'
import { useRetryPracticeStore } from '../stores/retryPracticeStore'
import { buildSessionSummary, formatDuration } from '../lib/speechAnalysis'
import { evaluatePracticeGoal, getPracticeGoal } from '../lib/practiceGoals'
import { getPracticePreset } from '../lib/practicePresets'
import { wpmStatus, wpmColor, wpmLabel } from '../lib/grading'
import { findPrimaryReportIssue } from '../lib/reportIssueMarkers'
import { buildRetryPracticeTarget } from '../lib/retryPractice'
import { useAudioLevel } from '../hooks/useAudioLevel'
import { useDemoStore } from '../demo/demoStore'
import type { RetryPracticeTarget, SessionSummary, TranscriptSegment } from '../types'

interface PostStopMenuState {
  retryTarget: RetryPracticeTarget | null
}

export function PracticeScreen() {
  const { t, i18n } = useTranslation(['common', 'practice'])
  const setScreen = useNavigationStore((s) => s.setScreen)
  const requestScreen = useNavigationStore((s) => s.requestScreen)
  const pendingScreen = useNavigationStore((s) => s.pendingScreen)
  const isRecordingExitConfirmOpen = useNavigationStore((s) => s.isRecordingExitConfirmOpen)
  const confirmRecordingExit = useNavigationStore((s) => s.confirmRecordingExit)
  const cancelRecordingExit = useNavigationStore((s) => s.cancelRecordingExit)
  const session = useSessionStore()
  const setReport = useReportStore((s) => s.setReport)
  const setRetryFeedback = useReportStore((s) => s.setRetryFeedback)
  const addHistory = useHistoryStore((s) => s.addSession)
  const settings = useSettingsStore()
  const retryTarget = useRetryPracticeStore((s) => s.target)
  const startRetryPractice = useRetryPracticeStore((s) => s.startRetryPractice)
  const clearRetryPractice = useRetryPracticeStore((s) => s.clearRetryPractice)
  const isDemoActive = useDemoStore((s) => s.isDemoActive)
  const stopDemo = useDemoStore((s) => s.stopDemo)
  const practiceGoalId = settings.practiceGoalId
  const practiceSpeedRange = settings.speedRange

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const countdownRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const preflightStartRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const analysisTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [countdownValue, setCountdownValue] = useState<number | null>(null)
  const [isFocusMode, setIsFocusMode] = useState(Boolean(retryTarget))
  const [pendingAnalysisReport, setPendingAnalysisReport] = useState<SessionSummary | null>(null)
  const [postStopMenu, setPostStopMenu] = useState<PostStopMenuState | null>(null)

  const beginRecording = useCallback(() => {
    session.reset()
    session.startRecording()

    timerRef.current = setInterval(() => session.tick(), 1000)
  }, [session])

  // Stop and go to report
  const handleStop = useCallback(() => {
    session.stopRecording()
    if (timerRef.current) clearInterval(timerRef.current)

    const nextReport = buildSessionSummary(
      Date.now().toString(),
      retryTarget?.sessionTitle
        ?? `${t('practice:session.titlePrefix')}${new Date().toLocaleTimeString(
          i18n.resolvedLanguage === 'en' ? 'en-US' : 'zh-TW',
          { hour: '2-digit', minute: '2-digit', hour12: false }
        )}`,
      session.elapsedSeconds,
      session.transcript,
      session.speedHistory,
      {
        presetSnapshot: settings.preset,
        practiceGoalId,
        speedRangeSnapshot: practiceSpeedRange,
      }
    )
    setPendingAnalysisReport(nextReport)
    analysisTimerRef.current = setTimeout(() => {
      setReport(nextReport)
      if (retryTarget) {
        setRetryFeedback(retryTarget)
      }
      addHistory(nextReport)
      clearRetryPractice()
      setPendingAnalysisReport(null)
      if (isDemoActive) {
        setScreen('report')
      } else {
        const primaryIssue = findPrimaryReportIssue(nextReport, practiceSpeedRange)
        setPostStopMenu({
          retryTarget: primaryIssue
            ? buildRetryPracticeTarget(nextReport, primaryIssue, practiceSpeedRange)
            : null,
        })
      }
      analysisTimerRef.current = null
    }, retryTarget ? 1350 : 1100)
  }, [
    t,
    i18n.resolvedLanguage,
    session,
    setReport,
    setRetryFeedback,
    addHistory,
    setScreen,
    settings.preset,
    practiceGoalId,
    practiceSpeedRange,
    retryTarget,
    clearRetryPractice,
    isDemoActive,
  ])

  const handlePause = useCallback(() => {
    session.pauseRecording()
  }, [session])

  useEffect(() => {
    if (countdownValue === null) return

    countdownRef.current = setTimeout(() => {
      if (countdownValue <= 1) {
        setCountdownValue(null)
        beginRecording()
        return
      }
      setCountdownValue(countdownValue - 1)
    }, 1000)

    return () => {
      if (countdownRef.current) {
        clearTimeout(countdownRef.current)
        countdownRef.current = null
      }
    }
  }, [beginRecording, countdownValue])

  useEffect(() => {
    if (pendingAnalysisReport || postStopMenu || isDemoActive || session.isRecording || countdownValue !== null) return

    preflightStartRef.current = setTimeout(() => {
      preflightStartRef.current = null
      setCountdownValue(3)
    }, 450)

    return () => {
      if (preflightStartRef.current) {
        clearTimeout(preflightStartRef.current)
        preflightStartRef.current = null
      }
    }
  }, [countdownValue, isDemoActive, pendingAnalysisReport, postStopMenu, session.isRecording])

  useEffect(() => {
    if (!postStopMenu) return

    if (preflightStartRef.current) {
      clearTimeout(preflightStartRef.current)
      preflightStartRef.current = null
    }

    if (countdownRef.current) {
      clearTimeout(countdownRef.current)
      countdownRef.current = null
    }

    setCountdownValue(null)
  }, [postStopMenu])

  // External demo/replay modes drive the screen state themselves, so stop any live timer first.
  useEffect(() => {
    if (!isDemoActive) return
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [isDemoActive])

  // Keep the practice screen clean on entry when not driven by demo playback.
  useEffect(() => {
    if (isDemoActive) return
    session.reset()
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (countdownRef.current) clearTimeout(countdownRef.current)
      if (preflightStartRef.current) clearTimeout(preflightStartRef.current)
      if (analysisTimerRef.current) clearTimeout(analysisTimerRef.current)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handlePostStopViewReport = useCallback(() => {
    setPostStopMenu(null)
    setScreen('report')
  }, [setScreen])

  const handlePostStopRetry = useCallback(() => {
    if (!postStopMenu?.retryTarget) return
    setPostStopMenu(null)
    startRetryPractice(postStopMenu.retryTarget)
    setScreen('practice')
  }, [postStopMenu, setScreen, startRetryPractice])

  const handlePostStopGoHome = useCallback(() => {
    setPostStopMenu(null)
    setScreen('home')
  }, [setScreen])

  const totalFillers = Object.values(session.fillerCounts).reduce((s, v) => s + v, 0)
  const topFiller = Object.entries(session.fillerCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—'
  const activePracticeGoal = getPracticeGoal(settings.practiceGoalId)
  const activePresetLabel = settings.preset === 'custom'
    ? t('common:states.customizing')
    : getPracticePreset(settings.preset).label
  const goalEvaluation = useMemo(
    () => evaluatePracticeGoal({
      durationSeconds: Math.max(session.elapsedSeconds, 1),
      fillerCount: totalFillers,
      fillerCounts: session.fillerCounts,
      topFiller: topFiller === '—' ? null : topFiller,
      speedHistory: session.speedHistory,
    }, practiceGoalId, practiceSpeedRange),
    [
      session.elapsedSeconds,
      session.fillerCounts,
      session.speedHistory,
      practiceGoalId,
      practiceSpeedRange,
      topFiller,
      totalFillers,
    ]
  )

  const WAVE_BARS = 20
  const isRecordingActive = session.isRecording && !session.isPaused
  const showPreflight = !pendingAnalysisReport && !postStopMenu && !isDemoActive && !session.isRecording && countdownValue === null
  const showSecondaryPanels = !isFocusMode || isDemoActive
  const showRetryDetails = showPreflight || !isFocusMode
  const audioLevels = useAudioLevel(isRecordingActive, WAVE_BARS, settings.micDeviceId, false)

  return (
    <div className="relative flex flex-col bg-gray-950 min-h-full text-white pb-4">
      <AnimatePresence>
        {countdownValue !== null && (
          <>
            <motion.div
              className="absolute inset-0 z-40 bg-black/70 backdrop-blur-[6px]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            />
            <motion.div
              data-annotation-id="practice-preflight"
              className="absolute inset-0 z-50 flex flex-col items-center justify-center px-6 text-center"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              <p className="text-[11px] uppercase tracking-[0.28em] text-accent-amber/80">
                {t('practice:countdown.title')}
              </p>
              <span className="mt-4 text-7xl font-black tracking-[-0.08em] text-white tabular-nums">
                {countdownValue}
              </span>
              <p className="mt-3 text-sm text-gray-300">
                {t('practice:countdown.subtitle')}
              </p>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {pendingAnalysisReport && (
          <>
            <motion.div
              className="absolute inset-0 z-[60] bg-black/76 backdrop-blur-[8px]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            />
            <motion.div
              className="absolute inset-0 z-[70] flex items-center justify-center px-6"
              initial={{ opacity: 0, y: 18, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 18, scale: 0.97 }}
              transition={{ duration: 0.26, ease: 'easeOut' }}
            >
              <div className="relative w-full max-w-[294px] overflow-hidden rounded-[30px] border border-white/10 bg-[#121a2b] px-5 py-6 text-center shadow-[0_20px_42px_rgba(10,18,34,0.36)]">
                <div className="relative mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-white/14 bg-white/[0.04]">
                  <div className="absolute inset-2 rounded-full border border-white/12" />
                  <div className="flex items-end gap-1.5">
                    <span className="h-3.5 w-1 rounded-full bg-accent-blue-light animate-pulse" />
                    <span className="h-6 w-1 rounded-full bg-accent-blue-light animate-pulse" style={{ animationDelay: '120ms', opacity: 0.88 }} />
                    <span className="h-4.5 w-1 rounded-full bg-accent-blue-light animate-pulse" style={{ animationDelay: '240ms', opacity: 0.68 }} />
                  </div>
                </div>

                <p className="text-[11px] uppercase tracking-[0.32em] text-accent-blue-light/90">
                  {t('practice:analysis.eyebrow')}
                </p>
                <h3 className="mt-3 text-[29px] font-semibold leading-[1.08] tracking-[-0.04em] text-white">
                  {retryTarget ? t('practice:analysis.retryTitle') : t('practice:analysis.title')}
                </h3>
                <p className="mx-auto mt-3 max-w-[230px] text-[14px] leading-7 text-slate-200">
                  {retryTarget ? t('practice:analysis.retryBody') : t('practice:analysis.body')}
                </p>

                <div className="mt-5 space-y-2.5 text-left">
                  <AnalysisProgressRow
                    indexLabel="01"
                    label={t('practice:analysis.steps.summary')}
                    active
                  />
                  <AnalysisProgressRow
                    indexLabel="02"
                    label={t('practice:analysis.steps.patterns')}
                    active
                    delayMs={120}
                  />
                  <AnalysisProgressRow
                    indexLabel="03"
                    label={retryTarget ? t('practice:analysis.steps.retry') : t('practice:analysis.steps.coaching')}
                    active
                    delayMs={240}
                  />
                </div>

                <div className="mt-5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2">
                  <div className="h-1.5 overflow-hidden rounded-full bg-white/8">
                    <motion.div
                      className="h-full rounded-full bg-accent-blue"
                      initial={{ width: '22%', opacity: 0.72 }}
                      animate={{ width: ['22%', '100%'], opacity: [0.72, 1] }}
                      transition={{ duration: 1.15, ease: 'easeInOut', repeat: Infinity, repeatType: 'reverse' }}
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {postStopMenu && (
          <>
            <motion.div
              className="absolute inset-0 z-[72] bg-black/62 backdrop-blur-[6px]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
            />
            <motion.div
              className="absolute inset-x-0 bottom-0 z-[80] rounded-t-[28px] border-t border-white/10 bg-[#101827] px-5 pb-6 pt-5 shadow-[0_-18px_48px_rgba(0,0,0,0.34)]"
              initial={{ y: 28, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 28, opacity: 0 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
            >
              <p className="text-[11px] uppercase tracking-[0.22em] text-accent-blue-light/80">
                {t('practice:postStop.eyebrow')}
              </p>
              <h3 className="mt-2 text-[22px] font-semibold tracking-[-0.04em] text-white">
                {t('practice:postStop.title')}
              </h3>
              <p className="mt-2 text-[13px] leading-6 text-slate-300">
                {t('practice:postStop.body')}
              </p>

              {postStopMenu.retryTarget && (
                <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
                  <p className="text-[10px] uppercase tracking-[0.16em] text-slate-400">
                    {t('practice:postStop.retryEyebrow')}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-white">
                    {postStopMenu.retryTarget.sessionTitle}
                  </p>
                  <p className="mt-1 text-[11px] leading-relaxed text-slate-300">
                    {postStopMenu.retryTarget.prompt}
                  </p>
                </div>
              )}

              <div className="mt-5 space-y-2.5">
                <button
                  type="button"
                  onClick={handlePostStopViewReport}
                  className="flex w-full items-center justify-between rounded-2xl bg-accent-blue px-4 py-3 text-left text-white shadow-lg shadow-blue-950/25"
                >
                  <div>
                    <p className="text-sm font-semibold">{t('practice:postStop.viewReport')}</p>
                    <p className="mt-0.5 text-[11px] text-white/75">{t('practice:postStop.viewReportBody')}</p>
                  </div>
                  <span className="text-xl">→</span>
                </button>

                <button
                  type="button"
                  onClick={handlePostStopRetry}
                  disabled={!postStopMenu.retryTarget}
                  className="flex w-full items-center justify-between rounded-2xl border border-white/12 bg-white/[0.04] px-4 py-3 text-left text-white transition-colors disabled:cursor-not-allowed disabled:opacity-45"
                >
                  <div>
                    <p className="text-sm font-semibold">{t('practice:postStop.retry')}</p>
                    <p className="mt-0.5 text-[11px] text-slate-300">
                      {postStopMenu.retryTarget
                        ? t('practice:postStop.retryBody', { issue: postStopMenu.retryTarget.label })
                        : t('practice:postStop.retryDisabled')}
                    </p>
                  </div>
                  <span className="text-xl">↺</span>
                </button>

                <button
                  type="button"
                  onClick={handlePostStopGoHome}
                  className="w-full rounded-2xl px-4 py-3 text-sm font-medium text-slate-300"
                >
                  {t('practice:postStop.goHome')}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Header */}
      <div
        data-annotation-id="practice-badge"
        className="flex items-center justify-between px-5 pt-4 pb-2"
      >
        <div>
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${session.isRecording && !session.isPaused ? 'bg-red-500 animate-pulse-dot' : 'bg-gray-500'}`} />
            <span className="text-sm font-medium text-gray-300">
              {session.isPaused
                ? t('practice:status.paused')
                : session.isRecording
                  ? retryTarget ? t('practice:status.retrying') : t('practice:status.recording')
                  : t('practice:status.preparing')}
            </span>
          </div>
          {isDemoActive && (
            <p className="text-[11px] text-accent-amber mt-1">
              {t('practice:notices.demoNoMic')}
            </p>
          )}
          {!isDemoActive && (
            <p className="text-[11px] text-gray-500 mt-1">
              {t('practice:notices.prototypeNoCapture')}
            </p>
          )}
        </div>
        <span className="text-2xl font-mono font-bold text-white tabular-nums">
          {formatDuration(session.elapsedSeconds)}
        </span>
      </div>

      {!isDemoActive && (
        <div className="mx-4 mb-3 flex justify-end">
          <button
            type="button"
            onClick={() => setIsFocusMode((value) => !value)}
            className={`rounded-full border px-3 py-1.5 text-[11px] font-medium transition-colors ${
              isFocusMode
                ? 'border-accent-amber/40 bg-amber-500/15 text-amber-100'
                : 'border-white/10 bg-white/5 text-gray-300'
            }`}
          >
            {isFocusMode ? t('practice:focusMode.active') : t('practice:focusMode.inactive')}
          </button>
        </div>
      )}

      {/* Speed Gauge */}
      <div data-annotation-id="speed-gauge" className="flex justify-center py-4">
        <SpeedGauge
          wpm={session.currentWpm}
          low={practiceSpeedRange.low}
          high={practiceSpeedRange.high}
        />
      </div>

      {retryTarget && !showPreflight && (
        <div
          data-annotation-id="retry-practice-banner"
          className="mx-4 mb-4 rounded-2xl border border-accent-amber/30 bg-amber-500/10 px-3.5 py-3"
        >
          <RetryPracticeBanner
            sessionTitle={retryTarget.sessionTitle}
            prompt={retryTarget.prompt}
            snippet={retryTarget.snippet}
            recommendedDurationSeconds={retryTarget.recommendedDurationSeconds}
            showDetails={showRetryDetails}
          />
        </div>
      )}

      {!showPreflight && (
        <div
          data-annotation-id="recording-controls"
          className="sticky top-2 z-20 mx-4 mb-4 flex items-center justify-center gap-4 rounded-[24px] border border-white/10 bg-gray-950/90 px-4 py-3 shadow-[0_10px_24px_rgba(0,0,0,0.24)] backdrop-blur-sm"
        >
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handlePause}
            disabled={isDemoActive}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-gray-800 text-gray-300 transition-colors hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-35"
          >
            {session.isPaused ? (
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                <polygon points="5,3 19,12 5,21" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                <rect x="6" y="4" width="4" height="16" rx="1" />
                <rect x="14" y="4" width="4" height="16" rx="1" />
              </svg>
            )}
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={isDemoActive ? stopDemo : handleStop}
            className="flex h-14 min-w-[108px] items-center justify-center gap-2 rounded-full bg-accent-red px-5 text-sm font-semibold text-white shadow-lg shadow-red-900/40"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="white">
              <rect x="6" y="6" width="12" height="12" rx="2" />
            </svg>
            <span>{t('common:actions.stop')}</span>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => {
              if (isDemoActive) {
                stopDemo()
                return
              }
              requestScreen('home')
            }}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-gray-800 text-gray-300 transition-colors hover:bg-gray-700"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            </svg>
          </motion.button>
        </div>
      )}

      {showPreflight && (
        <div
          data-annotation-id="practice-preflight"
          className="mx-4 mb-4 rounded-[28px] border border-[#f7dce7]/18 bg-white/5 px-4 py-4 shadow-lg shadow-black/10"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] uppercase tracking-[0.18em] text-gray-500">{t('practice:preflight.eyebrow')}</p>
              <h3 className="mt-1 text-lg font-semibold text-white">{t('practice:preflight.title')}</h3>
              <p className="mt-1 text-[12px] leading-relaxed text-gray-400">
                {retryTarget ? t('practice:preflight.retryBody') : t('practice:preflight.body')}
              </p>
            </div>
            <span className="rounded-full bg-accent-blue/15 px-2.5 py-1 text-[10px] font-semibold text-accent-blue">
              {retryTarget ? t('practice:preflight.retryBadge') : t('practice:preflight.liveBadge')}
            </span>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2">
            <PreflightStat
              label={t('practice:preflight.goal')}
              value={activePracticeGoal.label}
            />
            <PreflightStat
              label={t('practice:preflight.preset')}
              value={activePresetLabel}
            />
            <PreflightStat
              label={t('practice:preflight.range')}
              value={t('practice:preflight.rangeValue', {
                low: practiceSpeedRange.low,
                high: practiceSpeedRange.high,
              })}
            />
          </div>

          <div className="mt-3 rounded-2xl border border-[#f7dce7]/16 bg-black/20 px-3.5 py-3">
            <p className="text-[11px] font-semibold text-white">{t('practice:preflight.goalHintTitle')}</p>
            <p className="mt-1 text-[11px] leading-relaxed text-gray-300">
              {activePracticeGoal.coachHint}
            </p>
            {retryTarget && (
              <p className="mt-2 text-[11px] leading-relaxed text-amber-100/85">
                {retryTarget.prompt}
              </p>
            )}
          </div>

          {retryTarget && (
            <div
              data-annotation-id="retry-practice-banner"
              className="mt-3 rounded-2xl border border-accent-amber/30 bg-amber-500/10 px-3.5 py-3"
            >
              <RetryPracticeBanner
                sessionTitle={retryTarget.sessionTitle}
                prompt={retryTarget.prompt}
                snippet={retryTarget.snippet}
                recommendedDurationSeconds={retryTarget.recommendedDurationSeconds}
                showDetails
              />
            </div>
          )}

          <p className="mt-4 text-center text-[11px] text-gray-400">
            {t('practice:preflight.autoStart')}
          </p>
        </div>
      )}

      {!showPreflight && (
        <>
          <div
            data-annotation-id="practice-goal-progress"
            className="mx-4 mb-4 rounded-2xl border border-[#f7dce7]/18 bg-white/5 px-3.5 py-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-[0.18em] text-gray-500">{t('practice:goalSection.title')}</p>
                <p className="text-sm font-semibold text-white mt-1">{activePracticeGoal.label}</p>
                {!isFocusMode && (
                  <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">
                    {activePracticeGoal.description}
                  </p>
                )}
              </div>
              <span className={`text-[10px] font-semibold px-2 py-1 rounded-full flex-shrink-0 ${
                goalEvaluation.success
                  ? 'bg-emerald-500/20 text-emerald-300'
                  : 'bg-amber-500/15 text-amber-200'
              }`}>
                {goalEvaluation.progressLabel}
              </span>
            </div>
            <p className="text-[11px] text-gray-300 mt-2">
              {goalEvaluation.statusText}
            </p>
            {isFocusMode && (
              <p className="text-[11px] text-accent-amber mt-1.5">
                {t('practice:focusMode.helper')}
              </p>
            )}
          </div>

          {/* Live stats */}
          <div
            data-annotation-id="live-stats"
            className="grid grid-cols-3 gap-3 mx-4 mb-4"
          >
            <LiveStatCard
              label={t('practice:liveStats.fillerCount')}
              value={totalFillers.toString()}
              color={totalFillers > 10 ? 'text-accent-red' : 'text-white'}
              flash={session.lastFlashedFiller !== null}
            />
            <LiveStatCard label={t('practice:liveStats.topFiller')} value={topFiller} color="text-accent-amber" />
            <LiveStatCard label={t('practice:liveStats.longPause')} value={t('practice:liveStats.none')} color="text-gray-400" />
          </div>
        </>
      )}

      {showSecondaryPanels && (
        <>
          {/* Waveform */}
          <div
            data-annotation-id="waveform"
            className="mx-4 mb-3 bg-gray-900 rounded-xl px-4 py-3 flex items-center justify-center gap-0.5 h-14"
          >
            {audioLevels.map((level, i) => {
              const hasSound = level > 0.04
              const height = isRecordingActive ? Math.max(4, Math.round(level * 40)) : 4
              return (
                <div
                  key={i}
                  className="w-1 rounded-full flex-shrink-0"
                  style={{
                    height: `${height}px`,
                    backgroundColor: isRecordingActive
                      ? hasSound
                        ? `rgba(16, 185, 129, ${0.5 + level * 0.5})`
                        : 'rgba(55, 65, 81, 0.8)'
                      : 'rgb(55, 65, 81)',
                    transition: 'height 80ms ease-out, background-color 150ms ease',
                  }}
                />
              )
            })}
          </div>

          {/* Live transcript */}
          <div
            data-annotation-id="live-transcript"
            className="mx-4 mb-4 bg-gray-900 rounded-xl p-3 max-h-[100px] overflow-y-auto phone-scroll"
          >
            <p className="text-[11px] text-gray-500 mb-1.5">{t('practice:transcript.title')}</p>
            <p className="text-xs text-gray-300 leading-relaxed">
              {session.transcript.map((seg, i) => (
                <TranscriptWord key={i} segment={seg} />
              ))}
              {session.transcript.length === 0 && !session.isRecording && (
                <span className="text-gray-600">{t('practice:transcript.emptyIdle')}</span>
              )}
              {session.transcript.length === 0 && session.isRecording && retryTarget && (
                <span className="text-gray-500">{t('practice:transcript.emptyRetry')}</span>
              )}
              {session.transcript.length === 0 && session.isRecording && !retryTarget && (
                <span className="text-gray-500">{t('practice:transcript.emptyPrototype')}</span>
              )}
            </p>
          </div>
        </>
      )}

      <AnimatePresence>
        {isRecordingExitConfirmOpen && (
          <>
            <motion.div
              className="absolute inset-0 z-40 bg-black/45 backdrop-blur-[2px]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              onClick={cancelRecordingExit}
            />
            <motion.div
              className="absolute inset-0 z-50 flex items-center justify-center px-5"
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              <div className="w-full max-w-[280px] overflow-hidden rounded-[22px] bg-white/95 text-center text-gray-900 shadow-2xl shadow-black/30">
                <div className="px-5 pt-5 pb-4">
                  <p className="text-[17px] font-semibold tracking-[-0.01em]">{t('practice:exitConfirm.title')}</p>
                  <p className="mt-2 text-[13px] leading-5 text-gray-500">
                    {t('practice:exitConfirm.body', {
                      screen: pendingScreen ? t(`common:screens.${pendingScreen}`) : t('practice:exitConfirm.otherScreen'),
                    })}
                  </p>
                </div>
                <div className="grid grid-cols-2 border-t border-gray-200">
                  <button
                    onClick={cancelRecordingExit}
                    className="py-3.5 text-[17px] font-medium text-accent-blue border-r border-gray-200"
                  >
                    {t('common:actions.cancel')}
                  </button>
                  <button
                    onClick={confirmRecordingExit}
                    className="py-3.5 text-[17px] font-semibold text-red-500"
                  >
                    {t('practice:exitConfirm.confirm')}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

function PreflightStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[#f7dce7]/16 bg-black/15 px-3 py-3">
      <p className="text-[10px] uppercase tracking-[0.14em] text-gray-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-white leading-snug">{value}</p>
    </div>
  )
}

function AnalysisProgressRow({
  indexLabel,
  label,
  active,
  delayMs = 0,
}: {
  indexLabel: string
  label: string
  active: boolean
  delayMs?: number
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-3.5 py-3">
      <div className="flex items-center gap-3">
        <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border border-white/12 bg-white/[0.04] text-[10px] font-semibold tracking-[0.18em] text-slate-200">
          {indexLabel}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[12px] font-medium tracking-[-0.01em] text-white">{label}</p>
            <span
              className={`h-2.5 w-2.5 flex-shrink-0 rounded-full ${active ? 'bg-accent-blue-light' : 'bg-white/16'}`}
              style={active ? { animation: `pulse 1.6s ease-in-out ${delayMs}ms infinite` } : undefined}
            />
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/8">
            <motion.div
              className="h-full rounded-full bg-accent-blue-light"
              initial={{ width: '18%', opacity: 0.56 }}
              animate={active ? { width: ['18%', '100%'], opacity: [0.56, 1] } : { width: '0%', opacity: 0 }}
              transition={{ duration: 1.05, ease: 'easeInOut', repeat: Infinity, repeatType: 'reverse', delay: delayMs / 1000 }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

function RetryPracticeBanner({
  sessionTitle,
  prompt,
  snippet,
  recommendedDurationSeconds,
  showDetails,
}: {
  sessionTitle: string
  prompt: string
  snippet: string
  recommendedDurationSeconds: number
  showDetails: boolean
}) {
  const { t } = useTranslation(['practice'])

  return (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-[0.18em] text-amber-200/80">{t('practice:retryBanner.title')}</p>
          <p className="text-sm font-semibold text-white mt-1">{sessionTitle}</p>
          {showDetails && (
            <p className="text-[11px] text-amber-100/80 mt-1 leading-relaxed">
              {prompt}
            </p>
          )}
        </div>
        <span className="text-[10px] font-semibold px-2 py-1 rounded-full bg-white/10 text-amber-100 flex-shrink-0">
          {t('practice:retryBanner.recommendedSeconds', { count: recommendedDurationSeconds })}
        </span>
      </div>
      {showDetails && (
        <div className="mt-2 rounded-xl bg-black/20 px-3 py-2">
          <p className="text-[10px] text-amber-100/70 mb-1">{t('practice:retryBanner.originalSnippet')}</p>
          <p className="text-[11px] text-gray-100 leading-relaxed">「{snippet}」</p>
        </div>
      )}
    </>
  )
}

// SVG circular gauge
function SpeedGauge({ wpm, low, high }: { wpm: number; low: number; high: number }) {
  const { t } = useTranslation(['practice'])
  const status = wpmStatus(wpm, low, high)
  const color = status === 'fast' ? '#ef4444' : status === 'slow' ? '#8b5cf6' : '#10b981'

  // Arc math: 240deg arc, 60deg gap at bottom
  const R = 52
  const cx = 72
  const cy = 72
  const startAngle = 150 // degrees
  const totalDeg = 240

  const maxWpm = high + 80
  const clampedWpm = Math.min(Math.max(wpm, 0), maxWpm)
  const progress = clampedWpm / maxWpm
  const filledDeg = progress * totalDeg

  function polarToXY(deg: number) {
    const rad = ((deg - 90) * Math.PI) / 180
    return { x: cx + R * Math.cos(rad), y: cy + R * Math.sin(rad) }
  }

  function describeArc(startDeg: number, sweepDeg: number) {
    const start = polarToXY(startDeg)
    const end = polarToXY(startDeg + sweepDeg)
    const largeArc = sweepDeg > 180 ? 1 : 0
    return `M ${start.x} ${start.y} A ${R} ${R} 0 ${largeArc} 1 ${end.x} ${end.y}`
  }

  return (
    <div className="relative" style={{ width: 144, height: 144 }}>
      <svg width="144" height="144" viewBox="0 0 144 144">
        {/* Track */}
        <path
          d={describeArc(startAngle, totalDeg)}
          fill="none"
          stroke="#1f2937"
          strokeWidth="10"
          strokeLinecap="round"
        />
        {/* Progress */}
        {wpm > 0 && (
          <path
            d={describeArc(startAngle, Math.min(filledDeg, totalDeg))}
            fill="none"
            stroke={color}
            strokeWidth="10"
            strokeLinecap="round"
            style={{ transition: 'stroke 0.3s, d 0.3s' }}
          />
        )}
      </svg>
      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-white tabular-nums">{wpm || '—'}</span>
        <span className="text-[10px] text-gray-400 mt-0.5">{t('practice:gauge.unit')}</span>
        <span className={`text-[11px] font-medium mt-0.5 ${wpmColor(status)}`}>
          {wpm > 0 ? wpmLabel(status) : t('practice:gauge.waiting')}
        </span>
      </div>
    </div>
  )
}

function LiveStatCard({
  label, value, color, flash
}: {
  label: string
  value: string
  color: string
  flash?: boolean
}) {
  return (
    <div className={`bg-gray-900 rounded-xl p-2.5 text-center transition-all ${flash ? 'bg-red-950' : ''}`}>
      <AnimatePresence mode="wait">
        <motion.p
          key={value}
          initial={{ scale: flash ? 1.3 : 1, opacity: 0.5 }}
          animate={{ scale: 1, opacity: 1 }}
          className={`text-lg font-bold ${color}`}
        >
          {value}
        </motion.p>
      </AnimatePresence>
      <p className="text-[10px] text-gray-500 mt-0.5">{label}</p>
    </div>
  )
}

function TranscriptWord({ segment }: { segment: TranscriptSegment }) {
  if (segment.isFiller) {
    return (
      <span className="inline bg-red-900/50 text-red-300 rounded px-0.5 mx-0.5">
        {segment.text}
      </span>
    )
  }
  if (segment.isSpeedFast) {
    return (
      <span className="border-b border-amber-500/70 text-gray-300">
        {segment.text}
      </span>
    )
  }
  return <span>{segment.text}</span>
}
