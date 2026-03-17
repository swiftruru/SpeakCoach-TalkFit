import { useEffect, useRef, useCallback, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigationStore } from '../stores/navigationStore'
import { useSessionStore } from '../stores/sessionStore'
import { useReportStore } from '../stores/reportStore'
import { useHistoryStore } from '../stores/historyStore'
import { useSettingsStore } from '../stores/settingsStore'
import { useSpeechRecognition } from '../hooks/useSpeechRecognition'
import { useSpeechRate } from '../hooks/useSpeechRate'
import { detectFillers, buildSessionSummary, formatDuration } from '../lib/speechAnalysis'
import { PRACTICE_GOALS, evaluatePracticeGoal } from '../lib/practiceGoals'
import { wpmStatus, wpmColor, wpmLabel } from '../lib/grading'
import { useAudioLevel } from '../hooks/useAudioLevel'
import { useDemoStore } from '../demo/demoStore'
import type { TranscriptSegment } from '../types'

export function PracticeScreen() {
  const setScreen = useNavigationStore((s) => s.setScreen)
  const session = useSessionStore()
  const setReport = useReportStore((s) => s.setReport)
  const addHistory = useHistoryStore((s) => s.addSession)
  const settings = useSettingsStore()
  const isDemoActive = useDemoStore((s) => s.isDemoActive)
  const stopDemo = useDemoStore((s) => s.stopDemo)
  const practiceGoalId = settings.practiceGoalId
  const practiceSpeedRange = settings.speedRange

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [interimText, setInterimText] = useState('')
  const [micError, setMicError] = useState<string | null>(null)
  const { addText, reset: resetRate } = useSpeechRate(10)

  const handleResult = useCallback((text: string, isFinal: boolean) => {
    if (!isFinal) {
      setInterimText(text)
      const { wpm } = addText(text)
      session.updateCurrentWpm(wpm)
      return
    }

    setInterimText('')
    const { wpm } = addText(text)
    session.updateCurrentWpm(wpm)

    const { isFiller, fillerWord } = detectFillers(text, settings.fillerWords)
    const status = wpmStatus(wpm, settings.speedRange.low, settings.speedRange.high)

    const segment: TranscriptSegment = {
      text,
      isFiller,
      fillerWord,
      timestamp: session.elapsedSeconds,
      isSpeedFast: status === 'fast',
      isSpeedSlow: status === 'slow',
    }
    session.addSegment(segment)

    if (isFiller && fillerWord) {
      session.flashFiller(fillerWord)
    }

    // Record speed point every final result
    session.addSpeedPoint({ time: session.elapsedSeconds, wpm })
  }, [settings.fillerWords, settings.speedRange, session, addText])

  const { start, stop, modelState } = useSpeechRecognition({
    language: settings.language,
    enabled: !isDemoActive,
    onResult: handleResult,
    onError: (err) => setMicError(err),
  })

  // Start recording
  const handleStart = useCallback(() => {
    session.reset()
    resetRate()
    session.startRecording()
    start()

    timerRef.current = setInterval(() => session.tick(), 1000)
  }, [session, start, resetRate])

  // Stop and go to report
  const handleStop = useCallback(() => {
    stop()
    session.stopRecording()
    if (timerRef.current) clearInterval(timerRef.current)

    const report = buildSessionSummary(
      Date.now().toString(),
      '練習 ' + new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' }),
      session.elapsedSeconds,
      session.transcript,
      session.speedHistory,
      {
        practiceGoalId,
        speedRangeSnapshot: practiceSpeedRange,
      }
    )
    setReport(report)
    addHistory(report)
    setScreen('report')
  }, [session, stop, setReport, addHistory, setScreen, practiceGoalId, practiceSpeedRange])

  const handlePause = useCallback(() => {
    session.pauseRecording()
    if (session.isPaused) start()
    else stop()
  }, [session, start, stop])

  // External demo/replay modes drive the screen state themselves, so stop any live mic loop first.
  useEffect(() => {
    if (!isDemoActive) return
    stop()
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [isDemoActive, stop])

  // External demo mode drives this screen itself, so only auto-start in normal use.
  useEffect(() => {
    if (isDemoActive) return
    handleStart()
    return () => {
      stop()
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const totalFillers = Object.values(session.fillerCounts).reduce((s, v) => s + v, 0)
  const topFiller = Object.entries(session.fillerCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—'
  const activePracticeGoal = PRACTICE_GOALS[settings.practiceGoalId]
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
  const audioLevels = useAudioLevel(isRecordingActive, WAVE_BARS, settings.micDeviceId, !isDemoActive)

  return (
    <div className="flex flex-col bg-gray-950 min-h-full text-white pb-4">
      {/* Header */}
      <div
        data-annotation-id="practice-badge"
        className="flex items-center justify-between px-5 pt-4 pb-2"
      >
        <div>
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${session.isRecording && !session.isPaused ? 'bg-red-500 animate-pulse-dot' : 'bg-gray-500'}`} />
            <span className="text-sm font-medium text-gray-300">
              {session.isPaused ? '已暫停' : session.isRecording ? '錄音中' : '準備中'}
            </span>
          </div>
          {isDemoActive && (
            <p className="text-[11px] text-accent-amber mt-1">
              示範模式中，無需麥克風
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
            <p className="text-[10px] uppercase tracking-[0.18em] text-gray-500">本次目標</p>
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

      {/* Live stats */}
      <div
        data-annotation-id="live-stats"
        className="grid grid-cols-3 gap-3 mx-4 mb-4"
      >
        <LiveStatCard
          label="贅字"
          value={totalFillers.toString()}
          color={totalFillers > 10 ? 'text-accent-red' : 'text-white'}
          flash={session.lastFlashedFiller !== null}
        />
        <LiveStatCard label="最常出現" value={topFiller} color="text-accent-amber" />
        <LiveStatCard label="長停頓" value="—" color="text-gray-400" />
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
        <p className="text-[11px] text-gray-500 mb-1.5">即時逐字稿</p>
        <p className="text-xs text-gray-300 leading-relaxed">
          {session.transcript.map((seg, i) => (
            <TranscriptWord key={i} segment={seg} />
          ))}
          {interimText && (
            <span className="text-gray-500 italic">{interimText}</span>
          )}
          {session.transcript.length === 0 && !session.isRecording && (
            <span className="text-gray-600">開始說話後，文字將會出現在這裡…</span>
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
            setScreen('home')
          }}
          className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center text-gray-300 hover:bg-gray-700 transition-colors"
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
          </svg>
        </motion.button>
      </div>

      {!isDemoActive && modelState.status === 'loading' && (
        <p className="text-center text-xs text-gray-500 mt-3">
          載入語音模型 {'progress' in modelState ? modelState.progress : 0}%…
        </p>
      )}
      {!isDemoActive && modelState.status === 'error' && (
        <p className="text-center text-xs text-red-400 mt-2 px-4">
          語音模型載入失敗
        </p>
      )}
      {micError && (
        <p className="text-center text-xs text-red-400 mt-2 px-4">
          麥克風錯誤：{micError}
        </p>
      )}
    </div>
  )
}

// SVG circular gauge
function SpeedGauge({ wpm, low, high }: { wpm: number; low: number; high: number }) {
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
        <span className="text-[10px] text-gray-400 mt-0.5">字/分鐘</span>
        <span className={`text-[11px] font-medium mt-0.5 ${wpmColor(status)}`}>
          {wpm > 0 ? wpmLabel(status) : '等待語音'}
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
