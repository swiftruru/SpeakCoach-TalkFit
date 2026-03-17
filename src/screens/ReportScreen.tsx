import { forwardRef, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigationStore } from '../stores/navigationStore'
import { useReportStore } from '../stores/reportStore'
import { useSettingsStore } from '../stores/settingsStore'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ReferenceLine,
  ResponsiveContainer, CartesianGrid, ReferenceArea
} from 'recharts'
import { formatDuration, formatDate } from '../lib/speechAnalysis'
import { PRACTICE_GOALS, evaluatePracticeGoal } from '../lib/practiceGoals'
import { buildReportCoachingTips } from '../lib/reportCoaching'
import { buildFillerMarkers, buildSpeedMarkers, describeReportIssue } from '../lib/reportIssueMarkers'
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
  const setScreen = useNavigationStore((s) => s.setScreen)
  const report = useReportStore((s) => s.report)
  const configuredSpeedRange = useSettingsStore((s) => s.speedRange)
  const currentPracticeGoalId = useSettingsStore((s) => s.practiceGoalId)
  const [activeMarkerId, setActiveMarkerId] = useState<string | null>(null)
  const transcriptRefs = useRef<Array<HTMLSpanElement | null>>([])
  const shareCardRef = useRef<SVGSVGElement | null>(null)
  const [shareExporting, setShareExporting] = useState<'png' | 'svg' | null>(null)
  const [shareError, setShareError] = useState<string | null>(null)

  const speedRange = report?.speedRangeSnapshot ?? configuredSpeedRange
  const practiceGoalId = report?.practiceGoalId ?? currentPracticeGoalId
  const activePracticeGoal = PRACTICE_GOALS[practiceGoalId]
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

  useEffect(() => {
    transcriptRefs.current = []
  }, [report?.id])

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
        aria-label={`${describeReportIssue(marker)}，定位逐字稿`}
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
  }, [handleSpeedMarkerClick, scopedActiveMarkerId, speedMarkersByPoint])

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
      setShareError(error instanceof Error ? error.message : '分享卡匯出失敗')
    } finally {
      setShareExporting(null)
    }
  }, [report])

  if (!report) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-400">
        <p className="text-sm">尚無分析報告</p>
        <button
          onClick={() => setScreen('practice')}
          className="text-accent-blue text-sm"
        >
          開始練習
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
    const text = `TalkFit 練習報告
日期：${formatDate(report.date)}
時長：${formatDuration(report.durationSeconds)}
語速：${report.avgWpm} 字/分
贅字：${report.fillerCount} 次
評分：${report.grade}
最常贅字：${report.topFiller ?? '無'}
`
    navigator.clipboard.writeText(text)
  }

  return (
    <div className="bg-gray-50 min-h-full pb-4">
      {/* Header */}
      <div className="px-5 pt-5 pb-4 bg-white border-b border-gray-100">
        <h2 className="text-xl font-bold text-gray-900">練習報告</h2>
        <p className="text-xs text-gray-400 mt-0.5">
          {formatDate(report.date)} · {formatDuration(report.durationSeconds)}
        </p>
      </div>

      {goalEvaluation && (
        <div
          data-annotation-id="report-goal-summary"
          className="mx-4 mt-4 mb-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] uppercase tracking-[0.18em] text-gray-400">本次練習目標</p>
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
              {goalEvaluation.success ? '已達標' : '再練一次'}
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

      {/* Score cards */}
      <div
        data-annotation-id="report-score-section"
        className="grid grid-cols-3 gap-2 px-4 mb-3"
      >
        <ScoreCard
          label="平均語速"
          value={report.avgWpm.toString()}
          unit="字/分"
          color="text-accent-blue"
          icon="📈"
        />
        <ScoreCard
          label="贅字總數"
          value={report.fillerCount.toString()}
          color={fillerCountColor(report.fillerCount)}
          icon="✗"
        />
        <ScoreCard
          label="流暢度"
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
            <h3 className="text-sm font-semibold text-gray-700">下一輪先改這 3 件事</h3>
            <p className="text-[10px] text-gray-400 mt-0.5">
              先把注意力放在最有機會立刻進步的三件事，不要一次改太多。
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
            <h3 className="text-sm font-semibold text-gray-700">贅字排行榜</h3>
            <p className="text-[10px] text-gray-400 mt-0.5">
              點同一個贅字可依序跳到每一次出現的位置
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
                        第 {(activeMarker.occurrenceIndex ?? 0) + 1} / {activeMarker.occurrenceCount ?? count} 次
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
          <h3 className="text-sm font-semibold text-gray-700 mb-1">語速曲線</h3>
          <p className="text-[10px] text-gray-400 mb-2">
            藍線為語速，灰色區域為建議範圍（{speedRange.low}–{speedRange.high} 字/分），僅凸顯偏快或偏慢點位供定位
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
                formatter={(value) => [`${Array.isArray(value) ? value.join(', ') : value ?? '—'} 字/分`, '語速']}
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
        <h3 className="text-sm font-semibold text-gray-700 mb-2">逐字稿標記</h3>
        {activeMarker && (
          <div className={`mb-3 rounded-xl border px-3 py-2 ${markerBannerClass(activeMarker.kind)}`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold">
                  已定位到 {formatDuration(Math.round(activeMarker.timestamp))}
                </p>
                <p className="text-[11px] mt-0.5">
                  {describeReportIssue(activeMarker)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveMarkerId(null)}
                className="text-[11px] font-medium opacity-80 hover:opacity-100"
              >
                清除
              </button>
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
          <Legend color="bg-red-100" label="贅字" />
          <Legend lineColor="border-amber-400" label="語速過快" />
          <Legend lineColor="border-purple-400 border-dashed" label="語速偏慢" />
        </div>
      </div>

      {/* Share card preview */}
      {shareCardData && (
        <div className="mx-4 mb-3 bg-white rounded-2xl p-4 shadow-sm">
          <div className="mb-3">
            <h3 className="text-sm font-semibold text-gray-700">分享卡匯出</h3>
            <p className="text-[10px] text-gray-400 mt-0.5">
              專用版面會整理重點指標、Top 贅字與語速節奏，適合貼到作品集與 hackathon 成果頁
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
            `PNG` 適合直接分享；`SVG` 適合後續排版或再編修。
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
          <span>📋</span> 複製摘要
        </button>
        <button
          onClick={exportJSON}
          className="py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-medium text-gray-700 flex items-center justify-center gap-1.5 hover:bg-gray-50 transition-colors"
        >
          <span>⬇</span> 匯出 JSON
        </button>
        <button
          onClick={() => void handleExportShareCard('png')}
          disabled={!shareCardData || shareExporting !== null}
          className="py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-medium text-gray-700 flex items-center justify-center gap-1.5 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span>🖼</span> {shareExporting === 'png' ? '匯出中…' : '分享卡 PNG'}
        </button>
        <button
          onClick={() => void handleExportShareCard('svg')}
          disabled={!shareCardData || shareExporting !== null}
          className="py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-medium text-gray-700 flex items-center justify-center gap-1.5 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span>◇</span> {shareExporting === 'svg' ? '匯出中…' : '分享卡 SVG'}
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

function ScoreCard({ label, value, unit, color, icon }: {
  label: string; value: string; unit?: string; color: string; icon: string
}) {
  return (
    <div className="bg-white rounded-2xl p-3 shadow-sm text-center">
      <div className="text-base mb-1">{icon}</div>
      <p className={`text-xl font-bold ${color}`}>
        {value}
        {unit && <span className="text-[10px] font-normal ml-0.5">{unit}</span>}
      </p>
      <p className="text-[10px] text-gray-400 mt-0.5">{label}</p>
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
