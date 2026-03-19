import { forwardRef, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigationStore } from '../stores/navigationStore'
import { useReportStore } from '../stores/reportStore'
import { useRetryPracticeStore } from '../stores/retryPracticeStore'
import { useSettingsStore } from '../stores/settingsStore'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ReferenceLine,
  ResponsiveContainer, CartesianGrid, ReferenceArea
} from 'recharts'
import { formatDuration, formatDate } from '../lib/speechAnalysis'
import { evaluatePracticeGoal, getPracticeGoal } from '../lib/practiceGoals'
import { buildReportCoachingTips } from '../lib/reportCoaching'
import { buildFillerMarkers, buildSpeedMarkers, describeReportIssue } from '../lib/reportIssueMarkers'
import { buildRetryPracticeTarget } from '../lib/retryPractice'
import {
  buildReportShareCardData,
  buildReportShareFilename,
  exportReportSharePng,
  exportReportShareSvg,
} from '../lib/reportShare'
import { gradeColor, fillerCountColor } from '../lib/grading'
import { ReportShareCard } from '../components/report/ReportShareCard'
import type { ReportIssueMarker, TranscriptSegment } from '../types'

export function ReportScreen() {
  const { t } = useTranslation(['common', 'report'])
  const setScreen = useNavigationStore((s) => s.setScreen)
  const report = useReportStore((s) => s.report)
  const retryFeedback = useReportStore((s) => s.retryFeedback)
  const clearRetryFeedback = useReportStore((s) => s.clearRetryFeedback)
  const startRetryPractice = useRetryPracticeStore((s) => s.startRetryPractice)
  const configuredSpeedRange = useSettingsStore((s) => s.speedRange)
  const currentPracticeGoalId = useSettingsStore((s) => s.practiceGoalId)
  const [activeMarkerId, setActiveMarkerId] = useState<string | null>(null)
  const transcriptRefs = useRef<Array<HTMLSpanElement | null>>([])
  const shareCardRef = useRef<SVGSVGElement | null>(null)
  const [shareExporting, setShareExporting] = useState<'png' | 'svg' | null>(null)
  const [shareError, setShareError] = useState<string | null>(null)

  const speedRange = report?.speedRangeSnapshot ?? configuredSpeedRange
  const practiceGoalId = report?.practiceGoalId ?? currentPracticeGoalId
  const activePracticeGoal = getPracticeGoal(practiceGoalId)
  const sortedFillers = useMemo(
    () => (report ? Object.entries(report.fillerCounts).sort((a, b) => b[1] - a[1]) : []),
    [report]
  )
  const maxFiller = sortedFillers[0]?.[1] ?? 1

  const fillerMarkers = useMemo(() => (report ? buildFillerMarkers(report) : []), [report])
  const speedMarkers = useMemo(
    () => (report ? buildSpeedMarkers(report, speedRange) : []),
    [report, speedRange]
  )
  const shareCardData = useMemo(
    () => (report ? buildReportShareCardData(report, speedRange) : null),
    [report, speedRange]
  )
  const goalEvaluation = useMemo(
    () => (report ? evaluatePracticeGoal(report, practiceGoalId, speedRange) : null),
    [practiceGoalId, report, speedRange]
  )
  const coachingTips = useMemo(
    () => (report ? buildReportCoachingTips(report, speedRange, practiceGoalId) : []),
    [practiceGoalId, report, speedRange]
  )
  const retryReview = useMemo(() => {
    if (!report || !retryFeedback) return null

    if (retryFeedback.target.kind === 'filler') {
      const retryCount = report.transcript.filter((segment) => {
        const word = segment.fillerWord ?? segment.text.trim()
        return segment.isFiller && word === retryFeedback.target.label
      }).length

      return retryCount === 0
        ? {
            tone: 'green' as const,
            title: t('report:retryFeedback.fillerSuccessTitle', { word: retryFeedback.target.label }),
            body: t('report:retryFeedback.fillerSuccessBody'),
          }
        : {
            tone: 'amber' as const,
            title: t('report:retryFeedback.fillerRetryTitle', { word: retryFeedback.target.label }),
            body: t('report:retryFeedback.fillerRetryBody', { count: retryCount }),
          }
    }

    const outOfRangeCount = report.speedHistory.filter((point) => (
      retryFeedback.target.kind === 'speed-fast'
        ? point.wpm > speedRange.high
        : point.wpm < speedRange.low
    )).length

    if (retryFeedback.target.kind === 'speed-fast') {
      return outOfRangeCount === 0
        ? {
            tone: 'green' as const,
            title: t('report:retryFeedback.fastSuccessTitle'),
            body: t('report:retryFeedback.fastSuccessBody'),
          }
        : {
            tone: 'amber' as const,
            title: t('report:retryFeedback.fastRetryTitle'),
            body: t('report:retryFeedback.fastRetryBody', { count: outOfRangeCount }),
          }
    }

    return outOfRangeCount === 0
      ? {
          tone: 'green' as const,
          title: t('report:retryFeedback.slowSuccessTitle'),
          body: t('report:retryFeedback.slowSuccessBody'),
        }
      : {
          tone: 'amber' as const,
          title: t('report:retryFeedback.slowRetryTitle'),
          body: t('report:retryFeedback.slowRetryBody', { count: outOfRangeCount }),
        }
  }, [report, retryFeedback, speedRange.high, speedRange.low, t])
  const topHighlights = useMemo<Array<{
    id: string
    label: string
    title: string
    body: string
    tone: HighlightTone
  }>>(() => {
    if (!report || !goalEvaluation) return []

    const fastCount = speedMarkers.filter((marker) => marker.kind === 'speed-fast').length
    const slowCount = speedMarkers.filter((marker) => marker.kind === 'speed-slow').length
    const topFillerCount = report.topFiller ? report.fillerCounts[report.topFiller] ?? 0 : 0

    let focusTitle = t('report:topHighlights.focus.steadyTitle')
    let focusBody = t('report:topHighlights.focus.steadyBody')
    let focusTone: HighlightTone = 'blue'

    if (report.topFiller && topFillerCount > 0) {
      focusTitle = t('report:topHighlights.focus.topFillerTitle', { word: report.topFiller })
      focusBody = t('report:topHighlights.focus.topFillerBody', { count: topFillerCount })
      focusTone = 'red'
    } else if (fastCount >= slowCount && fastCount > 0) {
      focusTitle = t('report:topHighlights.focus.fastTitle')
      focusBody = t('report:topHighlights.focus.fastBody', {
        count: fastCount,
        high: speedRange.high,
      })
      focusTone = 'amber'
    } else if (slowCount > 0) {
      focusTitle = t('report:topHighlights.focus.slowTitle')
      focusBody = t('report:topHighlights.focus.slowBody', {
        count: slowCount,
        low: speedRange.low,
      })
      focusTone = 'blue'
    }

    return [
      {
        id: 'outcome',
        label: t('report:topHighlights.outcome.label'),
        title: goalEvaluation.success
          ? t('report:topHighlights.outcome.metTitle', { goal: activePracticeGoal.label })
          : t('report:topHighlights.outcome.retryTitle', { goal: activePracticeGoal.label }),
        body: goalEvaluation.statusText,
        tone: goalEvaluation.success ? 'green' : 'amber',
      },
      {
        id: 'focus',
        label: t('report:topHighlights.focus.label'),
        title: focusTitle,
        body: focusBody,
        tone: focusTone,
      },
      {
        id: 'next',
        label: t('report:topHighlights.next.label'),
        title: coachingTips[0]?.title ?? t('report:topHighlights.next.fallbackTitle'),
        body: coachingTips[0]?.detail ?? goalEvaluation.nextAction,
        tone: 'blue',
      },
    ]
  }, [activePracticeGoal.label, coachingTips, goalEvaluation, report, speedMarkers, speedRange.high, speedRange.low, t])

  const markerMap = useMemo(() => {
    const next = new Map<string, ReportIssueMarker>()
    fillerMarkers.forEach((marker) => next.set(marker.id, marker))
    speedMarkers.forEach((marker) => next.set(marker.id, marker))
    return next
  }, [fillerMarkers, speedMarkers])

  const fillerMarkersByWord = useMemo(() => {
    const groups: Record<string, ReportIssueMarker[]> = {}
    fillerMarkers.forEach((marker) => {
      const word = marker.fillerWord ?? marker.label
      if (!groups[word]) groups[word] = []
      groups[word].push(marker)
    })
    return groups
  }, [fillerMarkers])

  const speedMarkersByPoint = useMemo(() => {
    const next = new Map<number, ReportIssueMarker>()
    speedMarkers.forEach((marker) => {
      if (marker.speedPointIndex !== undefined) {
        next.set(marker.speedPointIndex, marker)
      }
    })
    return next
  }, [speedMarkers])

  const scopedActiveMarkerId = activeMarkerId && markerMap.has(activeMarkerId) ? activeMarkerId : null
  const activeMarker = useMemo(
    () => (scopedActiveMarkerId ? markerMap.get(scopedActiveMarkerId) ?? null : null),
    [markerMap, scopedActiveMarkerId]
  )
  const defaultMockMarkerId = useMemo(() => {
    if (!report?.id.startsWith('mock-')) return null
    return fillerMarkers[0]?.id
      ?? speedMarkers.find((marker) => marker.kind !== 'speed-normal')?.id
      ?? null
  }, [fillerMarkers, report?.id, speedMarkers])

  useEffect(() => {
    transcriptRefs.current = []
  }, [report?.id])

  useEffect(() => {
    if (!report) return
    if (!report.id.startsWith('mock-')) {
      setActiveMarkerId(null)
      return
    }
    setActiveMarkerId(defaultMockMarkerId)
  }, [defaultMockMarkerId, report])

  useEffect(() => {
    if (!activeMarker || activeMarker.segmentIndex < 0) return
    const element = transcriptRefs.current[activeMarker.segmentIndex]
    element?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [activeMarker])

  const handleFillerClick = useCallback((word: string) => {
    const markers = fillerMarkersByWord[word]
    if (!markers?.length) return

    const currentIndex = activeMarker?.kind === 'filler' && activeMarker.fillerWord === word
      ? markers.findIndex((marker) => marker.id === activeMarker.id)
      : -1
    const nextMarker = markers[(currentIndex + 1) % markers.length]

    setActiveMarkerId(nextMarker.id)
  }, [activeMarker, fillerMarkersByWord])

  const handleSpeedMarkerClick = useCallback((markerId: string) => {
    setActiveMarkerId(markerId)
  }, [])

  const handleRetryPractice = useCallback(() => {
    if (!report || !activeMarker || activeMarker.kind === 'speed-normal') return
    const target = buildRetryPracticeTarget(report, activeMarker, speedRange)
    startRetryPractice(target)
    setScreen('practice')
  }, [activeMarker, report, setScreen, speedRange, startRetryPractice])

  const handleRetryAgain = useCallback(() => {
    if (!retryFeedback) return
    startRetryPractice(retryFeedback.target)
    setScreen('practice')
  }, [retryFeedback, setScreen, startRetryPractice])

  const renderSpeedDot = useCallback((props: unknown) => {
    const { cx, cy, index } = props as { cx?: number; cy?: number; index?: number }
    if (typeof cx !== 'number' || typeof cy !== 'number' || typeof index !== 'number') {
      return null
    }

    const marker = speedMarkersByPoint.get(index)
    if (!marker) return null

    const color = markerTone(marker.kind)
    const isActive = marker.id === scopedActiveMarkerId
    const isInteractive = marker.kind !== 'speed-normal'

    if (!isInteractive) {
      return (
        <circle
          cx={cx}
          cy={cy}
          r={2.5}
          fill="#93c5fd"
          fillOpacity={0.45}
          stroke="#fff"
          strokeWidth={1}
        />
      )
    }

    return (
      <g
        role="button"
        tabIndex={0}
        style={{ cursor: 'pointer' }}
        aria-label={t('report:issues.locateAria', { description: describeReportIssue(marker) })}
        onClick={() => handleSpeedMarkerClick(marker.id)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            handleSpeedMarkerClick(marker.id)
          }
        }}
      >
        {isActive && (
          <circle
            cx={cx}
            cy={cy}
            r={8}
            fill={`${color}22`}
            stroke={color}
            strokeWidth={1.5}
          />
        )}
        <circle
          cx={cx}
          cy={cy}
          r={isActive ? 5 : 3.5}
          fill={color}
          stroke="#fff"
          strokeWidth={1.5}
        />
      </g>
    )
  }, [handleSpeedMarkerClick, scopedActiveMarkerId, speedMarkersByPoint, t])

  const handleExportShareCard = useCallback(async (format: 'png' | 'svg') => {
    if (!report || !shareCardRef.current) return

    setShareExporting(format)
    setShareError(null)

    try {
      const filename = `${buildReportShareFilename(report)}.${format}`
      if (format === 'png') {
        await exportReportSharePng(shareCardRef.current, filename)
      } else {
        exportReportShareSvg(shareCardRef.current, filename)
      }
    } catch (error) {
      setShareError(error instanceof Error ? error.message : t('report:shareActions.errorFallback'))
    } finally {
      setShareExporting(null)
    }
  }, [report, t])

  if (!report) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-400">
        <p className="text-sm">{t('report:empty.title')}</p>
        <button
          onClick={() => setScreen('practice')}
          className="text-accent-blue text-sm"
        >
          {t('report:empty.action')}
        </button>
      </div>
    )
  }

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `talkfit-${report.id}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const copyText = () => {
    const text = [
      t('report:copySummaryText.title', { appName: t('common:appName') }),
      t('report:copySummaryText.date', { value: formatDate(report.date) }),
      t('report:copySummaryText.duration', { value: formatDuration(report.durationSeconds) }),
      t('report:copySummaryText.wpm', { value: report.avgWpm }),
      t('report:copySummaryText.fillers', { value: report.fillerCount }),
      t('report:copySummaryText.grade', { value: report.grade }),
      t('report:copySummaryText.topFiller', {
        value: report.topFiller ?? t('report:copySummaryText.none'),
      }),
    ].join('\n')
    navigator.clipboard.writeText(text)
  }

  return (
    <div className="bg-gray-50 min-h-full pb-4">
      {/* Header */}
      <div className="px-5 pt-5 pb-4 bg-white border-b border-gray-100">
        <h2 className="text-xl font-bold text-gray-900">{t('report:title')}</h2>
        <p className="text-xs text-gray-400 mt-0.5">
          {formatDate(report.date)} · {formatDuration(report.durationSeconds)}
        </p>
      </div>

      {retryReview && retryFeedback && (
        <div
          data-annotation-id="report-retry-feedback"
          className="mx-4 mt-4 mb-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] uppercase tracking-[0.18em] text-gray-400">
                {t('report:retryFeedback.eyebrow')}
              </p>
              <h3 className="mt-1 text-sm font-semibold text-gray-800">{retryReview.title}</h3>
              <p className="mt-1 text-[11px] leading-relaxed text-gray-500">{retryReview.body}</p>
            </div>
            <span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${
              retryReview.tone === 'green'
                ? 'bg-emerald-50 text-emerald-700'
                : 'bg-amber-50 text-amber-700'
            }`}>
              {retryFeedback.target.sessionTitle}
            </span>
          </div>

          <div className="mt-3 rounded-xl border border-gray-100 bg-gray-50 px-3 py-2.5">
            <p className="text-[10px] uppercase tracking-[0.14em] text-gray-400">
              {t('report:retryFeedback.originalSnippet')}
            </p>
            <p className="mt-1 text-[11px] leading-relaxed text-gray-700">
              「{retryFeedback.target.snippet}」
            </p>
          </div>

          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={handleRetryAgain}
              className="rounded-full bg-accent-blue px-3 py-2 text-[11px] font-semibold text-white"
            >
              {t('report:retryFeedback.retryAgain')}
            </button>
            <button
              type="button"
              onClick={clearRetryFeedback}
              className="rounded-full border border-gray-200 px-3 py-2 text-[11px] font-medium text-gray-500 hover:bg-gray-50"
            >
              {t('report:retryFeedback.dismiss')}
            </button>
          </div>
        </div>
      )}

      {goalEvaluation && (
        <div
          data-annotation-id="report-goal-summary"
          className="mx-4 mt-4 mb-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] uppercase tracking-[0.18em] text-gray-400">{t('report:header.goalEyebrow')}</p>
              <h3 className="text-sm font-semibold text-gray-800 mt-1">{activePracticeGoal.label}</h3>
              <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">
                {activePracticeGoal.description}
              </p>
            </div>
            <span className={`text-[10px] font-semibold px-2 py-1 rounded-full flex-shrink-0 ${
              goalEvaluation.success
                ? 'bg-emerald-50 text-emerald-700'
                : 'bg-amber-50 text-amber-700'
            }`}>
              {goalEvaluation.success ? t('report:header.goalAchieved') : t('report:header.goalRetry')}
            </span>
          </div>

          <div className="mt-3 rounded-xl border border-gray-100 bg-gray-50 px-3 py-2.5">
            <p className="text-[11px] font-semibold text-gray-700">{goalEvaluation.progressLabel}</p>
            <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">
              {goalEvaluation.statusText}
            </p>
            <p className="text-[11px] text-accent-blue mt-1.5 leading-relaxed">
              {goalEvaluation.nextAction}
            </p>
          </div>
        </div>
      )}

      {topHighlights.length > 0 && (
        <div
          data-annotation-id="report-top-highlights"
          className="mx-4 mb-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"
        >
          <div className="mb-3">
            <h3 className="text-sm font-semibold text-gray-700">{t('report:topHighlights.title')}</h3>
            <p className="text-[10px] text-gray-400 mt-0.5">
              {t('report:topHighlights.description')}
            </p>
          </div>
          <div className="space-y-2.5">
            {topHighlights.map((item) => (
              <HighlightCard
                key={item.id}
                label={item.label}
                title={item.title}
                body={item.body}
                tone={item.tone}
              />
            ))}
          </div>
        </div>
      )}

      {/* Score cards */}
      <div
        data-annotation-id="report-score-section"
        className="grid grid-cols-3 gap-2 px-4 mb-3"
      >
        <ScoreCard
          label={t('report:scoreCards.avgWpm')}
          value={report.avgWpm.toString()}
          unit={t('report:scoreCards.wpmUnit')}
          color="text-accent-blue"
          icon="📈"
        />
        <ScoreCard
          label={t('report:scoreCards.fillerCount')}
          value={report.fillerCount.toString()}
          color={fillerCountColor(report.fillerCount)}
          icon="✗"
        />
        <ScoreCard
          label={t('report:scoreCards.fluency')}
          value={report.grade}
          color={gradeColor(report.grade)}
          icon="✓"
        />
      </div>

      {coachingTips.length > 0 && (
        <div
          data-annotation-id="report-coaching-next-steps"
          className="mx-4 mb-3 bg-white rounded-2xl p-4 shadow-sm"
        >
          <div className="mb-3">
            <h3 className="text-sm font-semibold text-gray-700">{t('report:coaching.title')}</h3>
            <p className="text-[10px] text-gray-400 mt-0.5">
              {t('report:coaching.description')}
            </p>
          </div>
          <div className="space-y-2.5">
            {coachingTips.map((tip, index) => (
              <div
                key={tip.id}
                className={`rounded-xl border px-3 py-3 ${coachingTipClass(tip.tone)}`}
              >
                <div className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-white/80 text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                    {index + 1}
                  </span>
                  <div>
                    <p className="text-xs font-semibold">{tip.title}</p>
                    <p className="text-[11px] mt-1 leading-relaxed opacity-90">{tip.detail}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filler ranking */}
      {sortedFillers.length > 0 && (
        <div
          data-annotation-id="filler-ranking"
          className="mx-4 mb-3 bg-white rounded-2xl p-4 shadow-sm"
        >
          <div className="mb-3">
            <h3 className="text-sm font-semibold text-gray-700">{t('report:ranking.title')}</h3>
            <p className="text-[10px] text-gray-400 mt-0.5">
              {t('report:ranking.description')}
            </p>
          </div>
          <div className="space-y-2">
            {sortedFillers.slice(0, 6).map(([word, count], i) => {
              const pct = (count / maxFiller) * 100
              const color = i === 0 ? '#ef4444' : i <= 2 ? '#f59e0b' : '#10b981'
              const isActiveWord = activeMarker?.kind === 'filler' && activeMarker.fillerWord === word
              return (
                <button
                  key={word}
                  type="button"
                  aria-pressed={isActiveWord}
                  onClick={() => handleFillerClick(word)}
                  className={`w-full flex items-center gap-2 rounded-xl px-2 py-1.5 text-left transition-colors ${isActiveWord ? 'bg-red-50 ring-1 ring-red-100' : 'hover:bg-gray-50'}`}
                >
                  <span
                    className="w-5 h-5 rounded-full text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0"
                    style={{ background: color }}
                  >
                    {i + 1}
                  </span>
                  <div className="w-16 flex-shrink-0">
                    <span className="text-xs text-gray-700">{word}</span>
                    {isActiveWord && activeMarker && (
                      <p className="text-[10px] text-red-500 mt-0.5">
                        {t('report:ranking.occurrence', {
                          current: (activeMarker.occurrenceIndex ?? 0) + 1,
                          total: activeMarker.occurrenceCount ?? count,
                        })}
                      </p>
                    )}
                  </div>
                  <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                    <div
                      className="h-1.5 rounded-full transition-all"
                      style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${color}, ${color}88)` }}
                    />
                  </div>
                  <span className="text-xs font-bold w-5 text-right" style={{ color }}>
                    {count}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Speed curve */}
      {report.speedHistory.length > 1 && (
        <div
          data-annotation-id="speed-curve-chart"
          className="mx-4 mb-3 bg-white rounded-2xl p-4 shadow-sm"
        >
          <h3 className="text-sm font-semibold text-gray-700 mb-1">{t('report:speedCurve.title')}</h3>
          <p className="text-[10px] text-gray-400 mb-2">
            {t('report:speedCurve.description', {
              low: speedRange.low,
              high: speedRange.high,
            })}
          </p>
          <ResponsiveContainer width="100%" height={120}>
            <LineChart data={report.speedHistory} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="time"
                tick={{ fontSize: 9, fill: '#9ca3af' }}
                tickFormatter={(value) => formatDuration(Number(value))}
              />
              <YAxis tick={{ fontSize: 9, fill: '#9ca3af' }} domain={['auto', 'auto']} />
              <Tooltip
                formatter={(value) => [
                  t('report:speedCurve.tooltipValue', {
                    value: Array.isArray(value) ? value.join(', ') : value ?? '—',
                  }),
                  t('report:speedCurve.tooltipName'),
                ]}
                labelFormatter={(label) => formatDuration(Number(label ?? 0))}
                contentStyle={{ fontSize: 11, borderRadius: 8 }}
              />
              <ReferenceArea
                y1={speedRange.low}
                y2={speedRange.high}
                fill="#f0f9ff"
                fillOpacity={0.6}
              />
              <ReferenceLine y={speedRange.high} stroke="#ef4444" strokeDasharray="3 3" strokeWidth={1} />
              <ReferenceLine y={speedRange.low} stroke="#8b5cf6" strokeDasharray="3 3" strokeWidth={1} />
              <Line
                type="monotone"
                dataKey="wpm"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={renderSpeedDot}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Annotated transcript */}
      <div
        data-annotation-id="annotated-transcript"
        className="mx-4 mb-3 bg-white rounded-2xl p-4 shadow-sm"
      >
        <h3 className="text-sm font-semibold text-gray-700 mb-2">{t('report:transcript.title')}</h3>
        {activeMarker && (
          <div className={`mb-3 rounded-xl border px-3 py-2 ${markerBannerClass(activeMarker.kind)}`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold">
                  {t('report:transcript.positionedAt', {
                    time: formatDuration(Math.round(activeMarker.timestamp)),
                  })}
                </p>
                <p className="text-[11px] mt-0.5">
                  {describeReportIssue(activeMarker)}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  type="button"
                  onClick={handleRetryPractice}
                  className="rounded-full bg-white/85 px-2.5 py-1 text-[11px] font-semibold text-gray-700 hover:bg-white"
                >
                  {t('report:transcript.retry')}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveMarkerId(null)}
                  className="text-[11px] font-medium opacity-80 hover:opacity-100"
                >
                  {t('report:transcript.clear')}
                </button>
              </div>
            </div>
          </div>
        )}
        <div className="text-xs text-gray-700 leading-relaxed max-h-[220px] overflow-y-auto phone-scroll pr-1">
          {report.transcript.map((seg, i) => (
            <TranscriptBit
              key={i}
              ref={(element) => { transcriptRefs.current[i] = element }}
              segment={seg}
              isActive={activeMarker?.segmentIndex === i}
            />
          ))}
        </div>
        <div className="flex gap-3 mt-3">
          <Legend color="bg-red-100" label={t('report:transcript.legend.filler')} />
          <Legend lineColor="border-amber-400" label={t('report:transcript.legend.fast')} />
          <Legend lineColor="border-purple-400 border-dashed" label={t('report:transcript.legend.slow')} />
        </div>
      </div>

      {/* Share card preview */}
      {shareCardData && (
        <div data-annotation-id="report-share-preview" className="mx-4 mb-3 bg-white rounded-2xl p-4 shadow-sm">
          <div className="mb-3">
            <h3 className="text-sm font-semibold text-gray-700">{t('report:sharePreview.title')}</h3>
            <p className="text-[10px] text-gray-400 mt-0.5">
              {t('report:sharePreview.description')}
            </p>
          </div>
          <div className="rounded-[28px] border border-gray-200 bg-slate-50 px-4 py-5">
            <div className="mx-auto w-full max-w-[240px]">
              <ReportShareCard
                ref={shareCardRef}
                data={shareCardData}
                className="block w-full h-auto"
              />
            </div>
          </div>
          <p className="text-[10px] text-gray-400 mt-2">
            {t('report:sharePreview.footer')}
          </p>
        </div>
      )}

      {/* Share/export */}
      <div
        data-annotation-id="report-share-row"
        className="grid grid-cols-2 gap-2 mx-4"
      >
        <button
          onClick={copyText}
          className="py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-medium text-gray-700 flex items-center justify-center gap-1.5 hover:bg-gray-50 transition-colors"
        >
          <span>📋</span> {t('report:shareActions.copySummary')}
        </button>
        <button
          onClick={exportJSON}
          className="py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-medium text-gray-700 flex items-center justify-center gap-1.5 hover:bg-gray-50 transition-colors"
        >
          <span>⬇</span> {t('report:shareActions.exportJson')}
        </button>
        <button
          onClick={() => void handleExportShareCard('png')}
          disabled={!shareCardData || shareExporting !== null}
          className="py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-medium text-gray-700 flex items-center justify-center gap-1.5 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span>🖼</span> {shareExporting === 'png' ? t('report:shareActions.exporting') : t('report:shareActions.sharePng')}
        </button>
        <button
          onClick={() => void handleExportShareCard('svg')}
          disabled={!shareCardData || shareExporting !== null}
          className="py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-medium text-gray-700 flex items-center justify-center gap-1.5 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span>◇</span> {shareExporting === 'svg' ? t('report:shareActions.exporting') : t('report:shareActions.shareSvg')}
        </button>
      </div>
      {shareError && (
        <p className="mx-4 mt-2 text-[11px] text-red-500">
          {shareError}
        </p>
      )}
    </div>
  )
}

function markerTone(kind: ReportIssueMarker['kind']) {
  if (kind === 'filler') return '#ef4444'
  if (kind === 'speed-fast') return '#f59e0b'
  if (kind === 'speed-slow') return '#8b5cf6'
  return '#3b82f6'
}

function markerBannerClass(kind: ReportIssueMarker['kind']) {
  if (kind === 'filler') return 'bg-red-50 border-red-100 text-red-700'
  if (kind === 'speed-fast') return 'bg-amber-50 border-amber-100 text-amber-700'
  if (kind === 'speed-slow') return 'bg-purple-50 border-purple-100 text-purple-700'
  return 'bg-sky-50 border-sky-100 text-sky-700'
}

function coachingTipClass(tone: 'red' | 'amber' | 'blue' | 'green') {
  if (tone === 'red') return 'border-red-100 bg-red-50 text-red-700'
  if (tone === 'amber') return 'border-amber-100 bg-amber-50 text-amber-700'
  if (tone === 'green') return 'border-emerald-100 bg-emerald-50 text-emerald-700'
  return 'border-sky-100 bg-sky-50 text-sky-700'
}

type HighlightTone = 'red' | 'amber' | 'blue' | 'green'

function highlightCardClass(tone: HighlightTone) {
  if (tone === 'red') return 'border-red-100 bg-red-50'
  if (tone === 'amber') return 'border-amber-100 bg-amber-50'
  if (tone === 'green') return 'border-emerald-100 bg-emerald-50'
  return 'border-sky-100 bg-sky-50'
}

function highlightLabelClass(tone: HighlightTone) {
  if (tone === 'red') return 'text-red-500'
  if (tone === 'amber') return 'text-amber-500'
  if (tone === 'green') return 'text-emerald-500'
  return 'text-sky-500'
}

function HighlightCard({
  label,
  title,
  body,
  tone,
}: {
  label: string
  title: string
  body: string
  tone: HighlightTone
}) {
  return (
    <div className={`rounded-xl border px-3 py-3 ${highlightCardClass(tone)}`}>
      <p className={`text-[10px] font-semibold uppercase tracking-[0.16em] ${highlightLabelClass(tone)}`}>
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-gray-800">{title}</p>
      <p className="mt-1 text-[11px] leading-relaxed text-gray-600">{body}</p>
    </div>
  )
}

function ScoreCard({ label, value, unit, color, icon }: {
  label: string; value: string; unit?: string; color: string; icon: string
}) {
  return (
    <div className="bg-white rounded-2xl p-3 shadow-sm text-center">
      <div className="text-base mb-1">{icon}</div>
      <p className={`text-xl font-bold leading-none ${color}`}>
        {value}
        {unit && <span className="text-[10px] font-normal ml-0.5">{unit}</span>}
      </p>
      <p className="mt-1 min-h-[1.8rem] text-[10px] leading-snug text-gray-400">{label}</p>
    </div>
  )
}

const TranscriptBit = forwardRef<HTMLSpanElement, {
  segment: TranscriptSegment
  isActive: boolean
}>(function TranscriptBit({ segment, isActive }, ref) {
  const anchorStyle = { scrollMarginTop: '96px' }

  if (segment.isFiller) {
    return (
      <span
        ref={ref}
        style={anchorStyle}
        className={`inline border rounded px-0.5 mx-0.5 transition-colors ${isActive ? 'bg-red-100 text-red-700 border-red-300 ring-2 ring-red-200' : 'bg-red-50 text-red-600 border-red-200'}`}
      >
        {segment.text}
      </span>
    )
  }
  if (segment.isSpeedFast) {
    return (
      <span
        ref={ref}
        style={anchorStyle}
        className={`rounded px-0.5 mx-0.5 border-b-2 transition-colors ${isActive ? 'bg-amber-50 text-amber-900 border-amber-500 ring-2 ring-amber-200' : 'border-amber-400'}`}
      >
        {segment.text}
      </span>
    )
  }
  if (segment.isSpeedSlow) {
    return (
      <span
        ref={ref}
        style={anchorStyle}
        className={`rounded px-0.5 mx-0.5 border-b-2 border-dashed transition-colors ${isActive ? 'bg-purple-50 text-purple-900 border-purple-500 ring-2 ring-purple-200' : 'border-purple-400'}`}
      >
        {segment.text}
      </span>
    )
  }
  return (
    <span
      ref={ref}
      style={anchorStyle}
      className={isActive ? 'rounded px-0.5 mx-0.5 bg-sky-50 ring-2 ring-sky-100' : ''}
    >
      {segment.text}
    </span>
  )
})

TranscriptBit.displayName = 'TranscriptBit'

function Legend({ color, lineColor, label }: { color?: string; lineColor?: string; label: string }) {
  return (
    <div className="flex items-center gap-1">
      {color && <span className={`w-3 h-3 rounded ${color} border border-red-200`} />}
      {lineColor && <span className={`w-4 h-0 border-b-2 ${lineColor}`} />}
      <span className="text-[10px] text-gray-400">{label}</span>
    </div>
  )
}
