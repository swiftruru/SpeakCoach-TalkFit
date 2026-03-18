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
            <SessionItem key={session.id} session={session} onClick={() => handleViewReport(session)} />
          ))
        )}
      </div>
    </div>
  )
}

function SessionItem({ session, onClick }: { session: SessionSummary; onClick: () => void }) {
  const { t } = useTranslation(['history'])

  return (
    <button
      onClick={onClick}
      className="w-full bg-white rounded-2xl p-3.5 shadow-sm text-left hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between mb-2">
        <div>
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
