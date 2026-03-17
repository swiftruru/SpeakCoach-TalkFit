import { useState } from 'react'
import { useSettingsStore } from '../stores/settingsStore'
import { useHistoryStore } from '../stores/historyStore'
import { CATEGORY_COLORS, DEFAULT_FILLER_WORDS } from '../lib/fillerWords'
import {
  getPresetCategoryLabels,
  PRACTICE_PRESET_LIST,
  type PracticePresetDefinition,
} from '../lib/practicePresets'
import {
  PRACTICE_GOAL_LIST,
  PRACTICE_GOALS,
  type PracticeGoalDefinition,
} from '../lib/practiceGoals'
import type { FillerWord } from '../types'

const LANGUAGES = [
  { code: 'zh-TW', label: '繁體中文' },
  { code: 'zh-HK', label: '粵語' },
  { code: 'en-US', label: 'English' },
]

export function SettingsScreen() {
  const settings = useSettingsStore()
  const clearAll = useHistoryStore((s) => s.clearAll)
  const [newWord, setNewWord] = useState('')
  const [showAddInput, setShowAddInput] = useState(false)


  const handleAddWord = () => {
    if (newWord.trim()) {
      settings.addFillerWord(newWord.trim())
      setNewWord('')
      setShowAddInput(false)
    }
  }

  return (
    <div className="bg-gray-50 min-h-full pb-8">
      <div className="px-5 pt-5 pb-3">
        <h2 className="text-xl font-bold text-gray-900">設定</h2>
      </div>

      {/* Detection toggles */}
      <section data-annotation-id="settings-detection-toggles">
        <SectionTitle>偵測設定</SectionTitle>
        <div className="mx-4 bg-white rounded-2xl shadow-sm divide-y divide-gray-50">
          <ToggleRow
            icon="✗"
            iconBg="bg-red-50"
            title="贅字偵測"
            sub="偵測填充音和連接贅詞"
            value={settings.fillerDetectionEnabled}
            onChange={settings.setFillerDetectionEnabled}
          />
          <ToggleRow
            icon="📈"
            iconBg="bg-blue-50"
            title="語速監控"
            sub={`建議範圍 ${settings.speedRange.low}–${settings.speedRange.high} 字/分`}
            value={settings.speedMonitoringEnabled}
            onChange={settings.setSpeedMonitoringEnabled}
          />
          <ToggleRow
            icon="🔁"
            iconBg="bg-purple-50"
            title="重複連接詞"
            sub="標記連續使用相同連接詞"
            value={settings.repeatConnectorEnabled}
            onChange={settings.setRepeatConnectorEnabled}
          />
        </div>
      </section>

      {/* Practice presets */}
      <section data-annotation-id="settings-practice-presets">
        <SectionTitle>練習情境</SectionTitle>
        <div className="mx-4 bg-white rounded-2xl shadow-sm p-4">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <p className="text-sm font-semibold text-gray-800">一鍵套用情境設定</p>
              <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">
                會同步調整語速區間與預設贅字類型。若你後續手動調整語速或贅字清單，系統會自動切換為自訂設定。
              </p>
            </div>
            <span
              className={`text-[10px] font-semibold px-2 py-1 rounded-full flex-shrink-0 ${
                settings.preset === 'custom'
                  ? 'bg-amber-50 text-amber-700'
                  : 'bg-blue-50 text-blue-700'
              }`}
            >
              {settings.preset === 'custom' ? '自訂中' : '已套用'}
            </span>
          </div>

          <div className="space-y-2.5">
            {PRACTICE_PRESET_LIST.map((preset) => (
              <PresetCard
                key={preset.id}
                preset={preset}
                isActive={settings.preset === preset.id}
                onClick={() => settings.applyPreset(preset.id)}
              />
            ))}
          </div>

          {settings.preset === 'custom' && (
            <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5">
              <p className="text-[11px] font-semibold text-amber-800">目前使用自訂設定</p>
              <p className="text-[11px] text-amber-700 mt-0.5 leading-relaxed">
                重新點選任一情境卡片，即可快速回到對應的語速與贅字偵測組合。
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Practice goal */}
      <section data-annotation-id="settings-practice-goal">
        <SectionTitle>練習目標</SectionTitle>
        <div className="mx-4 bg-white rounded-2xl shadow-sm p-4">
          <div className="mb-3">
            <p className="text-sm font-semibold text-gray-800">每次練習先選一個目標</p>
            <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">
              練習中會持續顯示進度，結束後報告也會直接告訴你這次有沒有達標，以及下一輪最該先修的地方。
            </p>
          </div>

          <div className="space-y-2.5">
            {PRACTICE_GOAL_LIST.map((goal) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                isActive={settings.practiceGoalId === goal.id}
                onClick={() => settings.setPracticeGoalId(goal.id)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Speed range slider */}
      <section data-annotation-id="speed-range-slider">
        <SectionTitle>語速範圍</SectionTitle>
        <div className="mx-4 bg-white rounded-2xl shadow-sm p-4">
          <SpeedRangeSlider
            low={settings.speedRange.low}
            high={settings.speedRange.high}
            onChange={settings.setSpeedRange}
          />
        </div>
      </section>

      {/* Default filler words */}
      <section data-annotation-id="filler-chip-editor">
        <SectionTitle>預設贅字清單</SectionTitle>
        <div className="mx-4 bg-white rounded-2xl shadow-sm p-4">
          <div className="flex flex-wrap gap-2">
            {settings.fillerWords.filter((fw) => fw.category !== 'custom').map((fw) => (
              <FillerChip
                key={fw.word}
                fw={fw}
                onToggle={() => settings.toggleFillerWord(fw.word)}
                onRemove={() => settings.removeFillerWord(fw.word)}
              />
            ))}
            <button
              onClick={() => {
                const current = settings.fillerWords
                const currentWords = new Set(current.map((f) => f.word))
                const missing = DEFAULT_FILLER_WORDS.filter((f) => !currentWords.has(f.word))
                if (missing.length === 0) return
                settings.setFillerWords([...current, ...missing])
              }}
              className="text-xs border border-dashed border-gray-300 text-gray-400 rounded-full px-2.5 py-1 hover:border-accent-green hover:text-accent-green transition-colors"
            >
              ↺ 還原預設
            </button>
          </div>
        </div>
      </section>

      {/* Custom filler words */}
      <section>
        <SectionTitle>自訂贅字清單</SectionTitle>
        <div className="mx-4 bg-white rounded-2xl shadow-sm p-4">
          <div className="flex flex-wrap gap-2">
            {settings.fillerWords.filter((fw) => fw.category === 'custom').map((fw) => (
              <FillerChip
                key={fw.word}
                fw={fw}
                onToggle={() => settings.toggleFillerWord(fw.word)}
                onRemove={() => settings.removeFillerWord(fw.word)}
              />
            ))}
            {showAddInput ? (
              <div className="flex items-center gap-1">
                <input
                  autoFocus
                  value={newWord}
                  onChange={(e) => setNewWord(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddWord()}
                  placeholder="輸入贅字"
                  className="text-xs text-gray-800 bg-white border border-gray-200 rounded-full px-2.5 py-1 w-20 outline-none focus:border-accent-blue placeholder:text-gray-400"
                />
                <button
                  onClick={handleAddWord}
                  className="text-xs text-accent-blue font-medium"
                >
                  加入
                </button>
                <button
                  onClick={() => setShowAddInput(false)}
                  className="text-xs text-gray-400"
                >
                  取消
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowAddInput(true)}
                className="text-xs border border-dashed border-gray-300 text-gray-400 rounded-full px-2.5 py-1 hover:border-accent-blue hover:text-accent-blue transition-colors"
              >
                + 新增
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Feedback */}
      <section data-annotation-id="settings-feedback">
        <SectionTitle>回饋方式</SectionTitle>
        <div className="mx-4 bg-white rounded-2xl shadow-sm divide-y divide-gray-50">
          <ToggleRow
            icon="📳"
            iconBg="bg-amber-50"
            title="觸覺震動提醒"
            sub="偵測到贅字時輕震提醒"
            value={settings.hapticEnabled}
            onChange={settings.setHapticEnabled}
          />
          <ToggleRow
            icon="🔊"
            iconBg="bg-green-50"
            title="音效提示"
            sub="用輕柔音效取代震動"
            value={settings.soundEnabled}
            onChange={settings.setSoundEnabled}
          />
        </div>
      </section>

      {/* Language */}
      <section data-annotation-id="settings-language">
        <SectionTitle>語言</SectionTitle>
        <div className="mx-4 bg-white rounded-2xl shadow-sm divide-y divide-gray-50">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => settings.setLanguage(lang.code)}
              className="w-full flex items-center justify-between px-4 py-3.5 text-left"
            >
              <span className="text-sm text-gray-700">{lang.label}</span>
              {settings.language === lang.code && (
                <span className="text-accent-blue text-sm">✓</span>
              )}
            </button>
          ))}
        </div>
      </section>

      {/* Data */}
      <section>
        <SectionTitle>資料</SectionTitle>
        <div className="mx-4 bg-white rounded-2xl shadow-sm divide-y divide-gray-50">
          <button
            onClick={() => confirm('確認清除所有練習紀錄？') && clearAll()}
            className="w-full flex items-center gap-3 px-4 py-3.5 text-left"
          >
            <span className="w-7 h-7 rounded-xl bg-red-50 flex items-center justify-center text-sm">🗑</span>
            <span className="text-sm text-red-500">清除所有紀錄</span>
          </button>
        </div>
      </section>

      <p className="text-center text-xs text-gray-400 mt-6">說來話長 TalkFit v1.0</p>
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 pt-4 pb-1.5">
      {children}
    </p>
  )
}

function ToggleRow({
  icon, iconBg, title, sub, value, onChange
}: {
  icon: string
  iconBg: string
  title: string
  sub: string
  value: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3.5">
      <div className={`w-7 h-7 rounded-xl ${iconBg} flex items-center justify-center text-sm flex-shrink-0`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-800 font-medium">{title}</p>
        <p className="text-[11px] text-gray-400 truncate">{sub}</p>
      </div>
      <Toggle value={value} onChange={onChange} />
    </div>
  )
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!value)}
      className={`relative w-10 h-6 rounded-full transition-colors flex-shrink-0 ${
        value ? 'bg-accent-blue' : 'bg-gray-200'
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
          value ? 'translate-x-4' : 'translate-x-0'
        }`}
      />
    </button>
  )
}

function FillerChip({ fw, onToggle, onRemove }: {
  fw: FillerWord
  onToggle: () => void
  onRemove: () => void
}) {
  return (
    <div
      className={`flex items-center gap-1 text-xs rounded-full px-2.5 py-1 border cursor-pointer select-none transition-all ${
        fw.enabled
          ? CATEGORY_COLORS[fw.category] ?? 'bg-gray-100 text-gray-700 border-gray-200'
          : 'bg-gray-50 text-gray-300 border-gray-200 line-through'
      }`}
      onClick={onToggle}
    >
      <span>{fw.word}</span>
      <button
        onClick={(e) => { e.stopPropagation(); onRemove() }}
        className="ml-0.5 text-[10px] text-current opacity-50 hover:opacity-100"
      >
        ×
      </button>
    </div>
  )
}

function SpeedRangeSlider({
  low, high, onChange
}: {
  low: number
  high: number
  onChange: (range: { low: number; high: number }) => void
}) {
  return (
    <div>
      <div className="flex justify-between text-xs text-gray-500 mb-3">
        <span>偏慢門檻</span>
        <span className="font-semibold text-accent-blue">{low} – {high} 字/分</span>
        <span>偏快門檻</span>
      </div>
      <div className="mb-3">
        <label className="text-[11px] text-gray-400 mb-1 block">偏慢門檻：{low} 字/分</label>
        <input
          type="range"
          min={60}
          max={high - 10}
          step={5}
          value={low}
          onChange={(e) => onChange({ low: Number(e.target.value), high })}
          className="w-full accent-purple-500"
        />
      </div>
      <div>
        <label className="text-[11px] text-gray-400 mb-1 block">偏快門檻：{high} 字/分</label>
        <input
          type="range"
          min={low + 10}
          max={300}
          step={5}
          value={high}
          onChange={(e) => onChange({ low, high: Number(e.target.value) })}
          className="w-full accent-red-500"
        />
      </div>
      <div className="flex justify-between text-[10px] text-gray-400 mt-2">
        <span className="text-purple-500">⬤ 偏慢</span>
        <span className="text-green-500">⬤ 適中</span>
        <span className="text-red-500">⬤ 偏快</span>
      </div>
    </div>
  )
}

function PresetCard({
  preset,
  isActive,
  onClick,
}: {
  preset: PracticePresetDefinition
  isActive: boolean
  onClick: () => void
}) {
  const categoryLabels = getPresetCategoryLabels(preset.enabledCategories)

  return (
    <button
      onClick={onClick}
      className={`w-full rounded-2xl border p-3 text-left transition-all ${
        isActive
          ? 'border-accent-blue bg-blue-50/70 shadow-sm'
          : 'border-gray-200 bg-gray-50 hover:border-blue-200 hover:bg-blue-50/40'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-800">{preset.label}</p>
          <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">{preset.description}</p>
        </div>
        <span
          className={`text-[10px] font-semibold px-2 py-1 rounded-full flex-shrink-0 ${
            isActive
              ? 'bg-blue-100 text-blue-700'
              : 'bg-white text-gray-400 border border-gray-200'
          }`}
        >
          {isActive ? '目前使用' : '套用'}
        </span>
      </div>

      <div className="mt-3 flex items-center gap-2 flex-wrap">
        <span className="text-[11px] font-medium text-gray-700">
          語速 {preset.speedRange.low}–{preset.speedRange.high} 字/分
        </span>
      </div>

      <div className="mt-2.5 flex flex-wrap gap-1.5">
        {categoryLabels.map((label) => (
          <span
            key={label}
            className={`text-[10px] px-2 py-1 rounded-full ${
              isActive
                ? 'bg-white text-blue-700 border border-blue-100'
                : 'bg-white text-gray-500 border border-gray-200'
            }`}
          >
            {label}
          </span>
        ))}
      </div>
    </button>
  )
}

function GoalCard({
  goal,
  isActive,
  onClick,
}: {
  goal: PracticeGoalDefinition
  isActive: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full rounded-2xl border p-3 text-left transition-all ${
        isActive
          ? 'border-accent-green bg-emerald-50/80 shadow-sm'
          : 'border-gray-200 bg-gray-50 hover:border-emerald-200 hover:bg-emerald-50/40'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-800">{goal.label}</p>
          <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">{goal.description}</p>
        </div>
        <span
          className={`text-[10px] font-semibold px-2 py-1 rounded-full flex-shrink-0 ${
            isActive
              ? 'bg-emerald-100 text-emerald-700'
              : 'bg-white text-gray-400 border border-gray-200'
          }`}
        >
          {isActive ? '本次目標' : '選擇'}
        </span>
      </div>

      <p
        className={`mt-2 text-[11px] ${
          isActive ? 'text-emerald-700' : 'text-gray-400'
        }`}
      >
        {PRACTICE_GOALS[goal.id].coachHint}
      </p>
    </button>
  )
}
