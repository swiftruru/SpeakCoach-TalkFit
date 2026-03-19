import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigationStore } from '../stores/navigationStore'
import { useHistoryStore } from '../stores/historyStore'
import { useReportStore } from '../stores/reportStore'
import {
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Area, AreaChart
} from 'recharts'
import { formatDate, formatDuration } from '../lib/speechAnalysis'
import { fillerBadgeStyle, gradeColor } from '../lib/grading'
import type { SessionSummary } from '../types'

export function HistoryScreen() {
  const { t } = useTranslation(['history'])
  const setScreen = useNavigationStore((s) => s.setScreen)
  const sessions = useHistoryStore((s) => s.sessions)
  const setReport = useReportStore((s) => s.setReport)
  const clearAll = useHistoryStore((s) => s.clearAll)
  const [compareIds, setCompareIds] = useState<string[]>([])

  const totalCount = sessions.length
  const totalMinutes = Math.round(sessions.reduce((s, se) => s + se.durationSeconds, 0) / 60)

  const allCounts: Record<string, number> = {}
  sessions.forEach((s) => {
    Object.entries(s.fillerCounts).forEach(([w, c]) => {
      allCounts[w] = (allCounts[w] ?? 0) + c
    })
  })
  const topFiller = Object.entries(allCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? t('history:summary.emptyValue')

  const trendData = [...sessions]
    .reverse()
    .slice(-10)
    .map((s, i) => ({
      index: i + 1,
      fillerCount: s.fillerCount,
      label: `#${sessions.length - sessions.indexOf(s)}`,
    }))

  const handleViewReport = (session: SessionSummary) => {
    setReport(session)
    setScreen('report')
  }

  const compareSessions = useMemo(
    () => compareIds
      .map((id) => sessions.find((session) => session.id === id) ?? null)
      .filter((session): session is SessionSummary => session !== null),
    [compareIds, sessions]
  )

  const compareSummary = useMemo(() => {
    if (compareSessions.length < 2) return null

    const [base, target] = compareSessions
    const fillerDelta = target.fillerCount - base.fillerCount
    const paceDelta = target.avgWpm - base.avgWpm
    const durationDelta = target.durationSeconds - base.durationSeconds

    return {
      base,
      target,
      fillerDelta,
      paceDelta,
      durationDelta,
    }
  }, [compareSessions])

  const compareHeadline = useMemo(() => {
    if (!compareSummary) return null

    const parts: string[] = []
    if (compareSummary.fillerDelta < 0) {
      parts.push(t('history:compare.headline.fillerBetter', { count: Math.abs(compareSummary.fillerDelta) }))
    } else if (compareSummary.fillerDelta > 0) {
      parts.push(t('history:compare.headline.fillerWorse', { count: compareSummary.fillerDelta }))
    }

    if (Math.abs(compareSummary.paceDelta) <= 5) {
      parts.push(t('history:compare.headline.paceSteady'))
    } else if (compareSummary.paceDelta > 0) {
      parts.push(t('history:compare.headline.paceFaster', { count: compareSummary.paceDelta }))
    } else {
      parts.push(t('history:compare.headline.paceSlower', { count: Math.abs(compareSummary.paceDelta) }))
    }

    return {
      title: compareSummary.fillerDelta <= 0
        ? t('history:compare.headline.titleImproved')
        : t('history:compare.headline.titleNeedsWork'),
      body: parts.join(' · '),
    }
  }, [compareSummary, t])

  const handleToggleCompare = (sessionId: string) => {
    setCompareIds((current) => {
      if (current.includes(sessionId)) {
        return current.filter((id) => id !== sessionId)
      }
      if (current.length < 2) {
        return [...current, sessionId]
      }
      return [current[1], sessionId]
    })
  }

  return (
    <div className="bg-gray-50 min-h-full pb-4">
      <div className="px-5 pt-5 pb-3">
        <h2 className="text-xl font-bold text-gray-900">{t('history:title')}</h2>
      </div>

      <div
        data-annotation-id="history-summary-cards"
        className="grid grid-cols-3 gap-2 px-4 mb-3"
      >
        <SummaryCard label={t('history:summary.totalPractice')} value={totalCount.toString()} color="text-accent-blue" />
        <SummaryCard label={t('history:summary.totalDuration')} value={`${totalMinutes}`} unit={t('history:summary.minutes')} color="text-accent-green" />
        <SummaryCard label={t('history:summary.topFiller')} value={topFiller} color="text-accent-amber" />
      </div>

      {trendData.length > 1 && (
        <div
          data-annotation-id="history-trend-chart"
          className="mx-4 mb-3 bg-white rounded-2xl p-4 shadow-sm"
        >
          <h3 className="text-sm font-semibold text-gray-700 mb-0.5">{t('history:trend.title')}</h3>
          {sessions.length >= 2 && (
            <p className="text-[10px] text-accent-green mb-2">
              {t('history:trend.reducedSinceFirst', {
                percent: Math.max(0, Math.round(((sessions[sessions.length - 1].fillerCount - sessions[0].fillerCount) / (sessions[sessions.length - 1].fillerCount || 1)) * -100)),
              })}
            </p>
          )}
          <ResponsiveContainer width="100%" height={100}>
            <AreaChart data={trendData} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="label" tick={{ fontSize: 9, fill: '#9ca3af' }} />
              <YAxis tick={{ fontSize: 9, fill: '#9ca3af' }} />
              <Tooltip
                formatter={(value) => [
                  t('history:trend.tooltipValue', { count: Number(value ?? 0) }),
                  t('history:trend.tooltipName'),
                ]}
                contentStyle={{ fontSize: 11, borderRadius: 8 }}
              />
              <Area
                type="monotone"
                dataKey="fillerCount"
                stroke="#10b981"
                strokeWidth={2}
                fill="url(#trendFill)"
                dot={{ r: 4, fill: '#fff', stroke: '#10b981', strokeWidth: 2 }}
                activeDot={{ r: 5 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      <div
        data-annotation-id="history-quick-compare"
        className="mx-4 mb-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-gray-700">{t('history:compare.title')}</h3>
            <p className="text-[10px] text-gray-400 mt-0.5">
              {compareSessions.length < 2
                ? t(
                    compareSessions.length === 0
                      ? 'history:compare.selectFirst'
                      : 'history:compare.selectSecond'
                  )
                : t('history:compare.ready')}
            </p>
          </div>
          {compareIds.length > 0 && (
            <button
              type="button"
              onClick={() => setCompareIds([])}
              className="text-[11px] font-medium text-gray-400 hover:text-gray-600"
            >
              {t('history:compare.clear')}
            </button>
          )}
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {compareSessions.length === 0 && (
            <span className="rounded-full border border-dashed border-gray-200 px-3 py-1.5 text-[11px] text-gray-400">
              {t('history:compare.emptyChip')}
            </span>
          )}
          {compareSessions.map((session, index) => (
            <span
              key={session.id}
              className="rounded-full bg-gray-100 px-3 py-1.5 text-[11px] font-medium text-gray-700"
            >
              {t('history:compare.selectedChip', {
                index: index + 1,
                title: session.title,
              })}
            </span>
          ))}
        </div>

        {compareSummary ? (
          <div className="mt-4 space-y-3">
            {compareHeadline && (
              <div className="rounded-xl border border-sky-100 bg-sky-50 px-3 py-3">
                <p className="text-[11px] font-semibold text-sky-700">{compareHeadline.title}</p>
                <p className="mt-1 text-[11px] leading-relaxed text-sky-700/90">{compareHeadline.body}</p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-2">
              <CompareSessionCard
                label={t('history:compare.base')}
                title={compareSummary.base.title}
                meta={formatDate(compareSummary.base.date)}
              />
              <CompareSessionCard
                label={t('history:compare.target')}
                title={compareSummary.target.title}
                meta={formatDate(compareSummary.target.date)}
              />
            </div>
            <div className="grid grid-cols-1 gap-2">
              <CompareMetricCard
                label={t('history:compare.metrics.fillers')}
                values={`${compareSummary.base.fillerCount} → ${compareSummary.target.fillerCount}`}
                change={describeCountChange(compareSummary.fillerDelta, t)}
                tone={compareSummary.fillerDelta <= 0 ? 'green' : 'red'}
              />
              <CompareMetricCard
                label={t('history:compare.metrics.pace')}
                values={`${compareSummary.base.avgWpm} → ${compareSummary.target.avgWpm}`}
                change={describePaceChange(compareSummary.paceDelta, t)}
                tone={Math.abs(compareSummary.paceDelta) <= 5 ? 'blue' : 'amber'}
              />
              <CompareMetricCard
                label={t('history:compare.metrics.duration')}
                values={`${formatDuration(compareSummary.base.durationSeconds)} → ${formatDuration(compareSummary.target.durationSeconds)}`}
                change={describeDurationChange(compareSummary.durationDelta, t)}
                tone="blue"
              />
            </div>
            <div className="rounded-xl border border-gray-100 bg-gray-50 px-3 py-2.5">
              <p className="text-[11px] font-semibold text-gray-700">
                {t('history:compare.topFillerLabel')}
              </p>
              <p className="mt-1 text-[11px] leading-relaxed text-gray-500">
                {t('history:compare.topFillerSummary', {
                  from: compareSummary.base.topFiller ?? t('history:summary.emptyValue'),
                  to: compareSummary.target.topFiller ?? t('history:summary.emptyValue'),
                })}
              </p>
            </div>
          </div>
        ) : compareSessions.length === 1 ? (
          <div className="mt-4 rounded-xl border border-dashed border-gray-200 bg-gray-50 px-3 py-3">
            <p className="text-[11px] font-semibold text-gray-700">
              {compareSessions[0].title}
            </p>
            <p className="mt-1 text-[11px] leading-relaxed text-gray-500">
              {t('history:compare.waitingBody')}
            </p>
          </div>
        ) : null}
      </div>

      <div data-annotation-id="history-list" className="px-4 space-y-2">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-sm font-semibold text-gray-700">{t('history:list.title')}</h3>
          {sessions.length > 0 && (
            <button
              onClick={() => window.confirm(t('history:list.clearConfirm')) && clearAll()}
              className="text-[11px] text-red-400"
            >
              {t('history:list.clearAll')}
            </button>
          )}
        </div>

        {sessions.length === 0 ? (
          <div className="text-center py-10 text-gray-400 text-sm">
            <p className="text-2xl mb-2">{t('history:list.emptyEmoji')}</p>
            <p>{t('history:list.emptyTitle')}</p>
            <button
              onClick={() => setScreen('practice')}
              className="mt-2 text-accent-blue text-xs"
            >
              {t('history:list.emptyAction')}
            </button>
          </div>
        ) : (
          sessions.map((session) => (
            <SessionItem
              key={session.id}
              session={session}
              onClick={() => handleViewReport(session)}
              onToggleCompare={() => handleToggleCompare(session.id)}
              isComparing={compareIds.includes(session.id)}
            />
          ))
        )}
      </div>
    </div>
  )
}

function SessionItem({
  session,
  onClick,
  onToggleCompare,
  isComparing,
}: {
  session: SessionSummary
  onClick: () => void
  onToggleCompare: () => void
  isComparing: boolean
}) {
  const { t } = useTranslation(['history'])

  return (
    <div className={`relative rounded-2xl bg-white p-3.5 shadow-sm transition-shadow hover:shadow-md ${isComparing ? 'ring-1 ring-accent-blue/30' : ''}`}>
      <button
        type="button"
        onClick={onClick}
        className="w-full pr-24 text-left"
      >
        <div className="mb-2 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-800">{session.title}</p>
            <p className="text-[11px] text-gray-400 mt-0.5">{formatDate(session.date)}</p>
          </div>
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${fillerBadgeStyle(session.fillerCount)}`}>
            {t('history:list.countBadge', { count: session.fillerCount })}
          </span>
        </div>
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-gray-500">
          <span><strong className="text-gray-700">{t('history:list.meta.wpm', { value: session.avgWpm })}</strong></span>
          <span><strong className="text-gray-700">{t('history:list.meta.duration', { value: formatDuration(session.durationSeconds) })}</strong></span>
          <span><strong className={gradeColor(session.grade)}>{t('history:list.meta.grade', { value: session.grade })}</strong></span>
        </div>
      </button>
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation()
          onToggleCompare()
        }}
        className={`absolute right-3 top-3 rounded-full px-3 py-1.5 text-[11px] font-medium transition-colors ${
          isComparing
            ? 'bg-accent-blue/10 text-accent-blue'
            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
        }`}
      >
        {isComparing ? t('history:compare.selectedButton') : t('history:compare.button')}
      </button>
    </div>
  )
}

function SummaryCard({ label, value, unit, color }: {
  label: string; value: string; unit?: string; color: string
}) {
  return (
    <div className="bg-white rounded-2xl p-3 shadow-sm text-center">
      <p className={`text-xl font-bold leading-none ${color}`}>
        {value}
        {unit && <span className="text-xs font-normal ml-0.5">{unit}</span>}
      </p>
      <p className="mt-1 min-h-[1.8rem] text-[10px] leading-snug text-gray-400">{label}</p>
    </div>
  )
}

function CompareSessionCard({
  label,
  title,
  meta,
}: {
  label: string
  title: string
  meta: string
}) {
  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50 px-3 py-3">
      <p className="text-[10px] uppercase tracking-[0.16em] text-gray-400">{label}</p>
      <p className="mt-1 text-sm font-semibold text-gray-800">{title}</p>
      <p className="mt-1 text-[11px] text-gray-500">{meta}</p>
    </div>
  )
}

function CompareMetricCard({
  label,
  values,
  change,
  tone,
}: {
  label: string
  values: string
  change: string
  tone: 'red' | 'amber' | 'blue' | 'green'
}) {
  return (
    <div className={`rounded-xl border px-3 py-3 ${compareMetricToneClass(tone)}`}>
      <p className="text-[10px] uppercase tracking-[0.16em] text-gray-400">{label}</p>
      <p className="mt-1 text-sm font-semibold text-gray-800">{values}</p>
      <p className="mt-1 text-[11px] leading-relaxed text-gray-600">{change}</p>
    </div>
  )
}

function compareMetricToneClass(tone: 'red' | 'amber' | 'blue' | 'green') {
  if (tone === 'red') return 'border-red-100 bg-red-50'
  if (tone === 'amber') return 'border-amber-100 bg-amber-50'
  if (tone === 'green') return 'border-emerald-100 bg-emerald-50'
  return 'border-sky-100 bg-sky-50'
}

function describeCountChange(delta: number, t: ReturnType<typeof useTranslation>['t']) {
  if (delta === 0) return t('history:compare.changes.sameCount')
  if (delta < 0) return t('history:compare.changes.fewerFillers', { count: Math.abs(delta) })
  return t('history:compare.changes.moreFillers', { count: delta })
}

function describePaceChange(delta: number, t: ReturnType<typeof useTranslation>['t']) {
  if (delta === 0) return t('history:compare.changes.samePace')
  if (delta < 0) return t('history:compare.changes.slower', { count: Math.abs(delta) })
  return t('history:compare.changes.faster', { count: delta })
}

function describeDurationChange(delta: number, t: ReturnType<typeof useTranslation>['t']) {
  if (delta === 0) return t('history:compare.changes.sameDuration')
  if (delta < 0) return t('history:compare.changes.shorter', { count: Math.abs(delta) })
  return t('history:compare.changes.longer', { count: delta })
}
