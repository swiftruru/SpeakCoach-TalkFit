import { useNavigationStore } from '../stores/navigationStore'
import { useReportStore } from '../stores/reportStore'
import { useSettingsStore } from '../stores/settingsStore'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ReferenceLine,
  ResponsiveContainer, CartesianGrid, ReferenceArea
} from 'recharts'
import { formatDuration, formatDate } from '../lib/speechAnalysis'
import { gradeColor, fillerCountColor } from '../lib/grading'
import type { TranscriptSegment } from '../types'

export function ReportScreen() {
  const setScreen = useNavigationStore((s) => s.setScreen)
  const report = useReportStore((s) => s.report)
  const speedRange = useSettingsStore((s) => s.speedRange)

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

  const sortedFillers = Object.entries(report.fillerCounts).sort((a, b) => b[1] - a[1])
  const maxFiller = sortedFillers[0]?.[1] ?? 1

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

      {/* Score cards */}
      <div
        data-annotation-id="report-score-section"
        className="grid grid-cols-3 gap-2 px-4 mt-4 mb-3"
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

      {/* Filler ranking */}
      {sortedFillers.length > 0 && (
        <div
          data-annotation-id="filler-ranking"
          className="mx-4 mb-3 bg-white rounded-2xl p-4 shadow-sm"
        >
          <h3 className="text-sm font-semibold text-gray-700 mb-3">贅字排行榜</h3>
          <div className="space-y-2">
            {sortedFillers.slice(0, 6).map(([word, count], i) => {
              const pct = (count / maxFiller) * 100
              const color = i === 0 ? '#ef4444' : i <= 2 ? '#f59e0b' : '#10b981'
              return (
                <div key={word} className="flex items-center gap-2">
                  <span
                    className="w-5 h-5 rounded-full text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0"
                    style={{ background: color }}
                  >
                    {i + 1}
                  </span>
                  <span className="text-xs text-gray-700 w-12 flex-shrink-0">{word}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                    <div
                      className="h-1.5 rounded-full transition-all"
                      style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${color}, ${color}88)` }}
                    />
                  </div>
                  <span className="text-xs font-bold w-5 text-right" style={{ color }}>
                    {count}
                  </span>
                </div>
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
            藍線為語速，灰色區域為建議範圍（{speedRange.low}–{speedRange.high} 字/分）
          </p>
          <ResponsiveContainer width="100%" height={120}>
            <LineChart data={report.speedHistory} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="time"
                tick={{ fontSize: 9, fill: '#9ca3af' }}
                tickFormatter={(v) => formatDuration(v)}
              />
              <YAxis tick={{ fontSize: 9, fill: '#9ca3af' }} domain={['auto', 'auto']} />
              <Tooltip
                formatter={(v: any) => [`${v} 字/分`, '語速']}
                labelFormatter={(l) => formatDuration(Number(l))}
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
                dot={{ r: 3, fill: '#3b82f6' }}
                activeDot={{ r: 5 }}
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
        <div className="text-xs text-gray-700 leading-relaxed">
          {report.transcript.map((seg, i) => (
            <TranscriptBit key={i} segment={seg} />
          ))}
        </div>
        <div className="flex gap-3 mt-3">
          <Legend color="bg-red-100" label="贅字" />
          <Legend lineColor="border-amber-400" label="語速過快" />
          <Legend lineColor="border-purple-400 border-dashed" label="語速偏慢" />
        </div>
      </div>

      {/* Share/export */}
      <div
        data-annotation-id="report-share-row"
        className="flex gap-2 mx-4"
      >
        <button
          onClick={copyText}
          className="flex-1 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-medium text-gray-700 flex items-center justify-center gap-1.5 hover:bg-gray-50 transition-colors"
        >
          <span>📋</span> 複製摘要
        </button>
        <button
          onClick={exportJSON}
          className="flex-1 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-medium text-gray-700 flex items-center justify-center gap-1.5 hover:bg-gray-50 transition-colors"
        >
          <span>⬇</span> 匯出 JSON
        </button>
      </div>
    </div>
  )
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

function TranscriptBit({ segment }: { segment: TranscriptSegment }) {
  if (segment.isFiller) {
    return (
      <span className="inline bg-red-50 text-red-600 border border-red-200 rounded px-0.5 mx-0.5">
        {segment.text}
      </span>
    )
  }
  if (segment.isSpeedFast) {
    return <span className="border-b-2 border-amber-400">{segment.text}</span>
  }
  if (segment.isSpeedSlow) {
    return <span className="border-b-2 border-dashed border-purple-400">{segment.text}</span>
  }
  return <span>{segment.text}</span>
}

function Legend({ color, lineColor, label }: { color?: string; lineColor?: string; label: string }) {
  return (
    <div className="flex items-center gap-1">
      {color && <span className={`w-3 h-3 rounded ${color} border border-red-200`} />}
      {lineColor && <span className={`w-4 h-0 border-b-2 ${lineColor}`} />}
      <span className="text-[10px] text-gray-400">{label}</span>
    </div>
  )
}
