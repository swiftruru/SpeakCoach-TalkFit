import { motion } from 'framer-motion'
import { useNavigationStore } from '../stores/navigationStore'
import { useHistoryStore } from '../stores/historyStore'
import { useSettingsStore } from '../stores/settingsStore'
import { BarChart, Bar, Cell, ResponsiveContainer, Tooltip } from 'recharts'

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return '早安'
  if (h < 18) return '下午好'
  return '晚上好'
}

function getTrendText(sessions: any[]) {
  if (sessions.length === 0) return '還沒有練習紀錄，今天開始吧！'
  const recent = sessions.slice(0, 3)
  const avg = recent.reduce((s, se) => s + se.fillerCount, 0) / recent.length
  if (sessions.length >= 2) {
    const prev = sessions[1].fillerCount
    const curr = sessions[0].fillerCount
    if (curr < prev) return '上次練習有進步，繼續保持！'
    if (curr > prev) return '試著注意「' + (sessions[0].topFiller ?? '贅字') + '」，你最常說它。'
  }
  return `平均贅字 ${Math.round(avg)} 次，繼續練習讓它降下來。`
}

function buildWeeklyData(sessions: any[]) {
  const days = ['一', '二', '三', '四', '五', '六', '日']
  const result = days.map((label, i) => {
    const dayIndex = (i + 1) % 7 // 一=1, ..., 日=0
    return { label, count: 0, practiced: false, dayIndex }
  })

  const now = new Date()
  sessions.forEach((s) => {
    const d = new Date(s.date)
    const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000)
    if (diffDays < 7) {
      const dayOfWeek = d.getDay()
      const idx = dayOfWeek === 0 ? 6 : dayOfWeek - 1
      result[idx].count += s.fillerCount
      result[idx].practiced = true
    }
  })
  return result
}

export function HomeScreen() {
  const setScreen = useNavigationStore((s) => s.setScreen)
  const sessions = useHistoryStore((s) => s.sessions)
  const fillerWords = useSettingsStore((s) => s.fillerWords)

  const thisWeekSessions = sessions.filter((s) => {
    const diffDays = Math.floor((Date.now() - new Date(s.date).getTime()) / 86400000)
    return diffDays < 7
  })

  const weekCount = thisWeekSessions.length
  const weekAvgFiller = weekCount > 0
    ? Math.round(thisWeekSessions.reduce((s, se) => s + se.fillerCount, 0) / weekCount)
    : 0

  const prevWeekSessions = sessions.filter((s) => {
    const diffDays = Math.floor((Date.now() - new Date(s.date).getTime()) / 86400000)
    return diffDays >= 7 && diffDays < 14
  })
  const prevAvg = prevWeekSessions.length > 0
    ? Math.round(prevWeekSessions.reduce((s, se) => s + se.fillerCount, 0) / prevWeekSessions.length)
    : null

  const trend = prevAvg !== null && weekAvgFiller > 0
    ? Math.round(((weekAvgFiller - prevAvg) / prevAvg) * 100)
    : null

  const weeklyData = buildWeeklyData(sessions)

  const tipFiller = sessions[0]?.topFiller ?? fillerWords.find((f) => f.enabled)?.word ?? '然後'

  return (
    <div className="bg-gray-50 min-h-full pb-2">
      {/* Header */}
      <div
        data-annotation-id="home-greeting"
        className="px-5 pt-5 pb-4"
      >
        <p className="text-sm text-gray-500">{getGreeting()}，</p>
        <h1 className="text-2xl font-bold text-gray-900 mt-0.5">說來話長</h1>
        <p className="text-xs text-gray-400 mt-1">{getTrendText(sessions)}</p>
      </div>

      {/* Stats */}
      <div
        data-annotation-id="home-stat-cards"
        className="px-4 grid grid-cols-3 gap-2 mb-4"
      >
        <StatCard label="本週練習" value={`${weekCount}`} unit="次" color="text-accent-blue" />
        <StatCard
          label="平均贅字"
          value={weekAvgFiller > 0 ? `${weekAvgFiller}` : '—'}
          unit="次/場"
          color="text-accent-amber"
        />
        <StatCard
          label="較上週"
          value={trend !== null ? `${trend > 0 ? '+' : ''}${trend}%` : '—'}
          color={trend !== null ? (trend <= 0 ? 'text-accent-green' : 'text-accent-red') : 'text-gray-400'}
          sub={trend !== null ? (trend <= 0 ? '持續進步中' : '需要加油') : '資料不足'}
        />
      </div>

      {/* Weekly bar chart */}
      <div data-annotation-id="home-weekly-chart" className="mx-4 bg-white rounded-2xl p-4 mb-3 shadow-sm">
        <p className="text-xs font-medium text-gray-500 mb-3">本週每日贅字次數</p>
        <ResponsiveContainer width="100%" height={80}>
          <BarChart data={weeklyData} barSize={24}>
            <Tooltip
              cursor={false}
              content={({ active, payload }) => {
                if (active && payload?.length && payload[0].value) {
                  return (
                    <div className="bg-gray-900 text-white text-xs px-2 py-1 rounded-lg">
                      {payload[0].value} 次贅字
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
                  fill={entry.practiced
                    ? entry.count > 20 ? '#f59e0b' : '#10b981'
                    : '#e5e7eb'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="flex justify-between mt-1">
          {weeklyData.map((d) => (
            <span key={d.label} className="text-[10px] text-gray-400 w-[24px] text-center">{d.label}</span>
          ))}
        </div>
      </div>

      {/* Tip card */}
      <div
        data-annotation-id="home-tip-card"
        className="mx-4 bg-blue-50 rounded-2xl p-4 mb-4"
      >
        <div className="flex items-center gap-1.5 mb-1.5">
          <span className="text-[10px] font-semibold text-blue-500 uppercase tracking-wide">今日提醒</span>
        </div>
        <p className="text-sm text-blue-800 leading-relaxed">
          試著意識到你最常說的贅字
          <span className="font-semibold">「{tipFiller}」</span>。
          說之前先停頓一秒，效果立竿見影。
        </p>
      </div>

      {/* Record button */}
      <div data-annotation-id="home-record-btn" className="px-4">
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={() => setScreen('practice')}
          className="w-full py-4 bg-accent-blue text-white rounded-2xl font-semibold text-base shadow-lg shadow-blue-200 flex items-center justify-center gap-2"
        >
          <span className="w-3 h-3 bg-red-400 rounded-full animate-pulse" />
          開始練習
        </motion.button>
      </div>
    </div>
  )
}

function StatCard({
  label, value, unit, color, sub
}: {
  label: string
  value: string
  unit?: string
  color: string
  sub?: string
}) {
  return (
    <div className="bg-white rounded-2xl p-3 shadow-sm text-center">
      <p className="text-[10px] text-gray-400 mb-1">{label}</p>
      <p className={`text-xl font-bold ${color}`}>
        {value}
        {unit && <span className="text-[11px] font-normal ml-0.5">{unit}</span>}
      </p>
      {sub && <p className="text-[10px] text-gray-400 mt-0.5">{sub}</p>}
    </div>
  )
}
