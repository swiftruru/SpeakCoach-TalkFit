import { useEffect, useRef, useCallback, useMemo } from 'react'
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
import { wpmStatus, wpmColor, wpmLabel } from '../lib/grading'
import { useAudioLevel } from '../hooks/useAudioLevel'
import { useDemoStore } from '../demo/demoStore'
import type { TranscriptSegment } from '../types'

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
  const addHistory = useHistoryStore((s) => s.addSession)
  const settings = useSettingsStore()
  const retryTarget = useRetryPracticeStore((s) => s.target)
  const clearRetryPractice = useRetryPracticeStore((s) => s.clearRetryPractice)
  const isDemoActive = useDemoStore((s) => s.isDemoActive)
  const stopDemo = useDemoStore((s) => s.stopDemo)
  const practiceGoalId = settings.practiceGoalId
  const practiceSpeedRange = settings.speedRange

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Start recording
  const handleStart = useCallback(() => {
    session.reset()
    session.startRecording()

    timerRef.current = setInterval(() => session.tick(), 1000)
  }, [session])

  // Stop and go to report
  const handleStop = useCallback(() => {
    session.stopRecording()
    if (timerRef.current) clearInterval(timerRef.current)

    const report = buildSessionSummary(
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
        practiceGoalId,
        speedRangeSnapshot: practiceSpeedRange,
      }
    )
    clearRetryPractice()
    setReport(report)
    addHistory(report)
    setScreen('report')
  }, [
    t,
    i18n.resolvedLanguage,
    session,
    setReport,
    addHistory,
    setScreen,
    practiceGoalId,
    practiceSpeedRange,
    retryTarget,
    clearRetryPractice,
  ])

  const handlePause = useCallback(() => {
    session.pauseRecording()
  }, [session])

  // External demo/replay modes drive the screen state themselves, so stop any live timer first.
  useEffect(() => {
    if (!isDemoActive) return
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [isDemoActive])

  // External demo mode drives this screen itself, so only auto-start in normal use.
  useEffect(() => {
    if (isDemoActive) return
    handleStart()
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      clearRetryPractice()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const totalFillers = Object.values(session.fillerCounts).reduce((s, v) => s + v, 0)
  const topFiller = Object.entries(session.fillerCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—'
  const activePracticeGoal = getPracticeGoal(settings.practiceGoalId)
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
  const audioLevels = useAudioLevel(isRecordingActive, WAVE_BARS, settings.micDeviceId, false)

  return (
    <div className="relative flex flex-col bg-gray-950 min-h-full text-white pb-4">
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

      {/* Speed Gauge */}
      <div data-annotation-id="speed-gauge" className="flex justify-center py-4">
        <SpeedGauge
          wpm={session.currentWpm}
          low={practiceSpeedRange.low}
          high={practiceSpeedRange.high}
        />
      </div>

      <div className="mx-4 mb-4 rounded-2xl border border-white/10 bg-white/5 px-3.5 py-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-[0.18em] text-gray-500">{t('practice:goalSection.title')}</p>
            <p className="text-sm font-semibold text-white mt-1">{activePracticeGoal.label}</p>
            <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">
              {activePracticeGoal.description}
            </p>
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
      </div>

      {retryTarget && (
        <div
          data-annotation-id="retry-practice-banner"
          className="mx-4 mb-4 rounded-2xl border border-accent-amber/30 bg-amber-500/10 px-3.5 py-3"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-[0.18em] text-amber-200/80">{t('practice:retryBanner.title')}</p>
              <p className="text-sm font-semibold text-white mt-1">{retryTarget.sessionTitle}</p>
              <p className="text-[11px] text-amber-100/80 mt-1 leading-relaxed">
                {retryTarget.prompt}
              </p>
            </div>
            <span className="text-[10px] font-semibold px-2 py-1 rounded-full bg-white/10 text-amber-100 flex-shrink-0">
              {t('practice:retryBanner.recommendedSeconds', { count: retryTarget.recommendedDurationSeconds })}
            </span>
          </div>
          <div className="mt-2 rounded-xl bg-black/20 px-3 py-2">
            <p className="text-[10px] text-amber-100/70 mb-1">{t('practice:retryBanner.originalSnippet')}</p>
            <p className="text-[11px] text-gray-100 leading-relaxed">「{retryTarget.snippet}」</p>
          </div>
        </div>
      )}

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
                    ? `rgba(16, 185, 129, ${0.5 + level * 0.5})`  // green, opacity by level
                    : 'rgba(55, 65, 81, 0.8)'                        // dim gray when silent
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

      {/* Controls */}
      <div
        data-annotation-id="recording-controls"
        className="flex items-center justify-center gap-6 px-4"
      >
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={handlePause}
          disabled={isDemoActive}
          className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center text-gray-300 hover:bg-gray-700 transition-colors disabled:opacity-35 disabled:cursor-not-allowed"
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
          className="w-16 h-16 rounded-full bg-accent-red flex items-center justify-center shadow-lg shadow-red-900"
        >
          <svg viewBox="0 0 24 24" width="22" height="22" fill="white">
            <rect x="6" y="6" width="12" height="12" rx="2" />
          </svg>
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
          className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center text-gray-300 hover:bg-gray-700 transition-colors"
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
          </svg>
        </motion.button>
      </div>

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
