import { useState } from 'react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { useNavigationStore } from '../stores/navigationStore'
import { useHistoryStore } from '../stores/historyStore'
import { useSettingsStore } from '../stores/settingsStore'
import { BarChart, Bar, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { normalizeLanguage } from '../i18n'

function getGreeting(t: (key: string) => string) {
  const h = new Date().getHours()
  if (h < 12) return t('home:greeting.morning')
  if (h < 18) return t('home:greeting.afternoon')
  return t('home:greeting.evening')
}

function getTrendText(
  sessions: Array<{ fillerCount: number; topFiller?: string | null }>,
  t: (key: string, options?: Record<string, unknown>) => string
) {
  if (sessions.length === 0) return t('home:trend.noSessions')
  const recent = sessions.slice(0, 3)
  const avg = recent.reduce((sum, session) => sum + session.fillerCount, 0) / recent.length

  if (sessions.length >= 2) {
    const prev = sessions[1].fillerCount
    const curr = sessions[0].fillerCount
    if (curr < prev) return t('home:trend.improved')
    if (curr > prev) {
      return t('home:trend.needsAttention', {
        filler: sessions[0].topFiller ?? t('demo:sampleReplay.segments.fillerThen'),
      })
    }
  }

  return t('home:trend.average', { count: Math.round(avg) })
}

function buildWeeklyData(
  sessions: Array<{ date: string; fillerCount: number }>,
  t: (key: string) => string
) {
  const days = [
    t('home:weeklyChart.days.mon'),
    t('home:weeklyChart.days.tue'),
    t('home:weeklyChart.days.wed'),
    t('home:weeklyChart.days.thu'),
    t('home:weeklyChart.days.fri'),
    t('home:weeklyChart.days.sat'),
    t('home:weeklyChart.days.sun'),
  ]

  const result = days.map((label, index) => ({
    label,
    count: 0,
    practiced: false,
    dayIndex: (index + 1) % 7,
  }))

  const now = new Date()
  sessions.forEach((session) => {
    const date = new Date(session.date)
    const diffDays = Math.floor((now.getTime() - date.getTime()) / 86400000)
    if (diffDays < 7) {
      const dayOfWeek = date.getDay()
      const idx = dayOfWeek === 0 ? 6 : dayOfWeek - 1
      result[idx].count += session.fillerCount
      result[idx].practiced = true
    }
  })

  return result
}

export function HomeScreen() {
  const { t, i18n } = useTranslation(['home', 'common', 'demo'])
  const setScreen = useNavigationStore((s) => s.setScreen)
  const sessions = useHistoryStore((s) => s.sessions)
  const fillerWords = useSettingsStore((s) => s.fillerWords)
  const currentLanguage = normalizeLanguage(i18n.resolvedLanguage ?? i18n.language)
  const [referenceNow] = useState(() => Date.now())

  const thisWeekSessions = sessions.filter((session) => {
    const diffDays = Math.floor((referenceNow - new Date(session.date).getTime()) / 86400000)
    return diffDays < 7
  })

  const weekCount = thisWeekSessions.length
  const weekAvgFiller = weekCount > 0
    ? Math.round(thisWeekSessions.reduce((sum, session) => sum + session.fillerCount, 0) / weekCount)
    : 0

  const prevWeekSessions = sessions.filter((session) => {
    const diffDays = Math.floor((referenceNow - new Date(session.date).getTime()) / 86400000)
    return diffDays >= 7 && diffDays < 14
  })
  const prevAvg = prevWeekSessions.length > 0
    ? Math.round(prevWeekSessions.reduce((sum, session) => sum + session.fillerCount, 0) / prevWeekSessions.length)
    : null

  const trend = prevAvg !== null && weekAvgFiller > 0
    ? Math.round(((weekAvgFiller - prevAvg) / prevAvg) * 100)
    : null

  const weeklyData = buildWeeklyData(sessions, t)
  const tipFiller =
    sessions[0]?.topFiller ?? fillerWords.find((word) => word.enabled)?.word ?? t('demo:sampleReplay.segments.fillerThen')

  return (
    <div className="bg-gray-50 min-h-full pb-2">
      <div data-annotation-id="home-greeting" className="px-5 pt-5 pb-4">
        <p className="text-sm text-gray-500">{getGreeting(t)},</p>
        <h1 className="text-2xl font-bold text-gray-900 mt-0.5">{t('common:appNameShort')}</h1>
        <p className="text-xs text-gray-400 mt-1">{getTrendText(sessions, t)}</p>
      </div>

      <div data-annotation-id="home-stat-cards" className="px-4 grid grid-cols-3 gap-2 mb-4">
        <StatCard
          label={t('home:stats.weekPractice')}
          value={`${weekCount}`}
          unit={t('home:stats.sessionUnit')}
          color="text-accent-blue"
        />
        <StatCard
          label={t('home:stats.averageFillers')}
          value={weekAvgFiller > 0 ? `${weekAvgFiller}` : '—'}
          unit={t('home:stats.perSessionUnit')}
          color="text-accent-amber"
          compactUnit={currentLanguage === 'en'}
        />
        <StatCard
          label={t('home:stats.vsLastWeek')}
          value={trend !== null ? `${trend > 0 ? '+' : ''}${trend}%` : '—'}
          color={trend !== null ? (trend <= 0 ? 'text-accent-green' : 'text-accent-red') : 'text-gray-400'}
          sub={
            trend !== null
              ? trend <= 0
                ? t('home:stats.improving')
                : t('home:stats.needsWork')
              : t('home:stats.insufficient')
          }
        />
      </div>

      <div data-annotation-id="home-weekly-chart" className="mx-4 bg-white rounded-2xl p-4 mb-3 shadow-sm">
        <p className="text-xs font-medium text-gray-500 mb-3">{t('home:weeklyChart.title')}</p>
        <ResponsiveContainer width="100%" height={80}>
          <BarChart data={weeklyData} barSize={24}>
            <Tooltip
              cursor={false}
              content={({ active, payload }) => {
                if (active && payload?.length && payload[0].value) {
                  const tooltipCount = Number(payload[0].value)
                  return (
                    <div className="bg-gray-900 text-white text-xs px-2 py-1 rounded-lg">
                      {t('home:weeklyChart.tooltip', { count: tooltipCount })}
                    </div>
                  )
                }
                return null
              }}
            />
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
              {weeklyData.map((entry, index) => (
                <Cell
                  key={index}
                  fill={entry.practiced ? (entry.count > 20 ? '#f59e0b' : '#10b981') : '#e5e7eb'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="flex justify-between mt-1">
          {weeklyData.map((day) => (
            <span key={day.label} className="text-[10px] text-gray-400 w-[24px] text-center">{day.label}</span>
          ))}
        </div>
      </div>

      <div data-annotation-id="home-tip-card" className="mx-4 bg-blue-50 rounded-2xl p-4 mb-4">
        <div className="flex items-center gap-1.5 mb-1.5">
          <span className="text-[10px] font-semibold text-blue-500 uppercase tracking-wide">{t('home:tip.title')}</span>
        </div>
        <p className="text-sm text-blue-800 leading-relaxed">
          {t('home:tip.body', { filler: tipFiller })}
        </p>
      </div>

      <div data-annotation-id="home-record-btn" className="px-4">
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={() => setScreen('practice')}
          className="w-full py-4 bg-accent-blue text-white rounded-2xl font-semibold text-base shadow-lg shadow-blue-200 flex items-center justify-center gap-2"
        >
          <span className="w-3 h-3 bg-red-400 rounded-full animate-pulse" />
          {t('home:recordButton')}
        </motion.button>
      </div>
    </div>
  )
}

function StatCard({
  label,
  value,
  unit,
  color,
  sub,
  compactUnit = false,
}: {
  label: string
  value: string
  unit?: string
  color: string
  sub?: string
  compactUnit?: boolean
}) {
  return (
    <div className="bg-white rounded-2xl p-3 shadow-sm text-center">
      <p className="mb-1 min-h-[1.8rem] text-[10px] leading-snug text-gray-400">
        {label}
      </p>
      <p className={`text-xl font-bold leading-none ${color}`}>
        {value}
        {unit && (
          <span className={`text-[11px] font-normal ${compactUnit ? 'ml-1' : 'ml-0.5'}`}>
            {unit}
          </span>
        )}
      </p>
      {sub && (
        <p className="mt-1 min-h-[1.8rem] text-[10px] leading-snug text-gray-400">
          {sub}
        </p>
      )}
    </div>
  )
}
