import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSettingsStore } from '../stores/settingsStore'
import { useHistoryStore } from '../stores/historyStore'
import { useAnnotationGuideStore } from '../stores/annotationGuideStore'
import { LANGUAGE_OPTIONS } from '../i18n/config'
import { CATEGORY_COLORS, getDefaultFillerWords } from '../lib/fillerWords'
import {
  getPracticePresetList,
  getPresetCategoryLabels,
  type PracticePresetDefinition,
} from '../lib/practicePresets'
import {
  getPracticeGoalList,
  type PracticeGoalDefinition,
} from '../lib/practiceGoals'
import type { FillerWord } from '../types'

const SETTINGS_ADVANCED_TARGET_IDS = new Set([
  'filler-chip-editor',
  'settings-feedback',
  'settings-language',
])

export function SettingsScreen() {
  const { t, i18n } = useTranslation(['common', 'settings'])
  const settings = useSettingsStore()
  const clearAll = useHistoryStore((s) => s.clearAll)
  const pinnedAnnotationId = useAnnotationGuideStore((s) => s.pinnedId)
  const pinnedAnnotationSource = useAnnotationGuideStore((s) => s.source)
  const [newWord, setNewWord] = useState('')
  const [showAddInput, setShowAddInput] = useState(false)
  const [settingsMode, setSettingsMode] = useState<'recommended' | 'advanced'>('recommended')
  const presets = getPracticePresetList()
  const goals = getPracticeGoalList()
  const forcedSettingsMode = useMemo(() => {
    if (pinnedAnnotationSource !== 'demo' && pinnedAnnotationSource !== 'annotation') return null
    if (!pinnedAnnotationId) return null
    return SETTINGS_ADVANCED_TARGET_IDS.has(pinnedAnnotationId) ? 'advanced' : null
  }, [pinnedAnnotationId, pinnedAnnotationSource])
  const effectiveSettingsMode = forcedSettingsMode ?? settingsMode
  const showAdvancedSections = effectiveSettingsMode === 'advanced'

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
        <h2 className="text-xl font-bold text-gray-900">{t('common:screens.settings')}</h2>
      </div>

      <section data-annotation-id="settings-mode-toggle">
        <div className="mx-4 mb-1 rounded-2xl border border-gray-200 bg-white p-2 shadow-sm">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setSettingsMode('recommended')}
              className={`rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
                effectiveSettingsMode === 'recommended'
                  ? 'bg-accent-blue text-white shadow-sm'
                  : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
              }`}
            >
              {t('settings:mode.recommended')}
            </button>
            <button
              type="button"
              onClick={() => setSettingsMode('advanced')}
              className={`rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
                effectiveSettingsMode === 'advanced'
                  ? 'bg-accent-blue text-white shadow-sm'
                  : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
              }`}
            >
              {t('settings:mode.advanced')}
            </button>
          </div>
          <p className="mt-2 px-1 text-[11px] leading-relaxed text-gray-500">
            {effectiveSettingsMode === 'recommended'
              ? t('settings:mode.recommendedDescription')
              : t('settings:mode.advancedDescription')}
          </p>
        </div>
      </section>

      <section data-annotation-id="settings-detection-toggles">
        <SectionTitle>{t('settings:sections.detection')}</SectionTitle>
        <div className="mx-4 bg-white rounded-2xl shadow-sm divide-y divide-gray-50">
          <ToggleRow
            icon="✗"
            iconBg="bg-red-50"
            title={t('settings:detection.filler.title')}
            sub={t('settings:detection.filler.description')}
            value={settings.fillerDetectionEnabled}
            onChange={settings.setFillerDetectionEnabled}
          />
          <ToggleRow
            icon="📈"
            iconBg="bg-blue-50"
            title={t('settings:detection.speed.title')}
            sub={t('settings:detection.speed.description', {
              low: settings.speedRange.low,
              high: settings.speedRange.high,
            })}
            value={settings.speedMonitoringEnabled}
            onChange={settings.setSpeedMonitoringEnabled}
          />
          <ToggleRow
            icon="🔁"
            iconBg="bg-purple-50"
            title={t('settings:detection.repeat.title')}
            sub={t('settings:detection.repeat.description')}
            value={settings.repeatConnectorEnabled}
            onChange={settings.setRepeatConnectorEnabled}
          />
        </div>
      </section>

      <section data-annotation-id="settings-practice-presets">
        <SectionTitle>{t('settings:sections.presets')}</SectionTitle>
        <div className="mx-4 bg-white rounded-2xl shadow-sm p-4">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <p className="text-sm font-semibold text-gray-800">{t('settings:presets.title')}</p>
              <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">
                {t('settings:presets.description')}
              </p>
            </div>
            <span
              className={`text-[10px] font-semibold px-2 py-1 rounded-full flex-shrink-0 ${
                settings.preset === 'custom'
                  ? 'bg-amber-50 text-amber-700'
                  : 'bg-blue-50 text-blue-700'
              }`}
            >
              {settings.preset === 'custom'
                ? t('settings:presets.statusCustom')
                : t('settings:presets.statusApplied')}
            </span>
          </div>

          <div className="space-y-2.5">
            {presets.map((preset) => (
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
              <p className="text-[11px] font-semibold text-amber-800">{t('settings:presets.customTitle')}</p>
              <p className="text-[11px] text-amber-700 mt-0.5 leading-relaxed">
                {t('settings:presets.customDescription')}
              </p>
            </div>
          )}
        </div>
      </section>

      <section data-annotation-id="settings-practice-goal">
        <SectionTitle>{t('settings:sections.goal')}</SectionTitle>
        <div className="mx-4 bg-white rounded-2xl shadow-sm p-4">
          <div className="mb-3">
            <p className="text-sm font-semibold text-gray-800">{t('settings:goal.title')}</p>
            <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">
              {t('settings:goal.description')}
            </p>
          </div>

          <div className="space-y-2.5">
            {goals.map((goal) => (
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

      <section data-annotation-id="speed-range-slider">
        <SectionTitle>{t('settings:sections.speedRange')}</SectionTitle>
        <div className="mx-4 bg-white rounded-2xl shadow-sm p-4">
          <SpeedRangeSlider
            low={settings.speedRange.low}
            high={settings.speedRange.high}
            onChange={settings.setSpeedRange}
          />
        </div>
      </section>

      {showAdvancedSections && (
        <>
          <section data-annotation-id="filler-chip-editor">
            <SectionTitle>{t('settings:sections.defaultFillers')}</SectionTitle>
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
                    const missing = getDefaultFillerWords(settings.language).filter((f) => !currentWords.has(f.word))
                    if (missing.length === 0) return
                    settings.setFillerWords([...current, ...missing])
                  }}
                  className="text-xs border border-dashed border-gray-300 text-gray-400 rounded-full px-2.5 py-1 hover:border-accent-green hover:text-accent-green transition-colors"
                >
                  {t('settings:fillers.restoreDefault')}
                </button>
              </div>
            </div>
          </section>

          <section>
            <SectionTitle>{t('settings:sections.customFillers')}</SectionTitle>
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
                      placeholder={t('settings:fillers.placeholder')}
                      className="text-xs text-gray-800 bg-white border border-gray-200 rounded-full px-2.5 py-1 w-24 outline-none focus:border-accent-blue placeholder:text-gray-400"
                    />
                    <button
                      onClick={handleAddWord}
                      className="text-xs text-accent-blue font-medium"
                    >
                      {t('settings:fillers.add')}
                    </button>
                    <button
                      onClick={() => setShowAddInput(false)}
                      className="text-xs text-gray-400"
                    >
                      {t('settings:fillers.cancel')}
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowAddInput(true)}
                    className="text-xs border border-dashed border-gray-300 text-gray-400 rounded-full px-2.5 py-1 hover:border-accent-blue hover:text-accent-blue transition-colors"
                  >
                    {t('settings:fillers.addNew')}
                  </button>
                )}
              </div>
            </div>
          </section>

          <section data-annotation-id="settings-feedback">
            <SectionTitle>{t('settings:sections.feedback')}</SectionTitle>
            <div className="mx-4 bg-white rounded-2xl shadow-sm divide-y divide-gray-50">
              <ToggleRow
                icon="📳"
                iconBg="bg-amber-50"
                title={t('settings:feedback.haptic.title')}
                sub={t('settings:feedback.haptic.description')}
                value={settings.hapticEnabled}
                onChange={settings.setHapticEnabled}
              />
              <ToggleRow
                icon="🔊"
                iconBg="bg-green-50"
                title={t('settings:feedback.sound.title')}
                sub={t('settings:feedback.sound.description')}
                value={settings.soundEnabled}
                onChange={settings.setSoundEnabled}
              />
            </div>
          </section>

          <section data-annotation-id="settings-language">
            <SectionTitle>{t('common:languageToggle.label')}</SectionTitle>
            <div className="mx-4 bg-white rounded-2xl shadow-sm divide-y divide-gray-50">
              {LANGUAGE_OPTIONS.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => {
                    void i18n.changeLanguage(lang.code)
                  }}
                  className="w-full flex items-center justify-between px-4 py-3.5 text-left"
                >
                  <span className="text-sm text-gray-700">{t(`common:languages.${lang.code}`)}</span>
                  {settings.language === lang.code && (
                    <span className="text-accent-blue text-sm">✓</span>
                  )}
                </button>
              ))}
            </div>
          </section>

          <section>
            <SectionTitle>{t('settings:sections.data')}</SectionTitle>
            <div className="mx-4 bg-white rounded-2xl shadow-sm divide-y divide-gray-50">
              <button
                onClick={() => window.confirm(t('settings:data.clearConfirm')) && clearAll()}
                className="w-full flex items-center gap-3 px-4 py-3.5 text-left"
              >
                <span className="w-7 h-7 rounded-xl bg-red-50 flex items-center justify-center text-sm">🗑</span>
                <span className="text-sm text-red-500">{t('settings:data.clearAll')}</span>
              </button>
            </div>
          </section>
        </>
      )}

      <p className="text-center text-xs text-gray-400 mt-6">{t('settings:version', { appName: t('common:appName') })}</p>
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
    <div className="flex items-start gap-3 px-4 py-3.5">
      <div className={`w-7 h-7 rounded-xl ${iconBg} flex items-center justify-center text-sm flex-shrink-0`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-800 font-medium">{title}</p>
        <p className="mt-0.5 text-[11px] leading-relaxed text-gray-400">{sub}</p>
      </div>
      <div className="pt-0.5">
        <Toggle value={value} onChange={onChange} />
      </div>
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
  const { t } = useTranslation(['settings'])

  return (
    <div>
      <div className="flex justify-between text-xs text-gray-500 mb-3">
        <span>{t('settings:speedRange.slowThreshold')}</span>
        <span className="font-semibold text-accent-blue">{t('settings:speedRange.range', { low, high })}</span>
        <span>{t('settings:speedRange.fastThreshold')}</span>
      </div>
      <div className="mb-3">
        <label className="text-[11px] text-gray-400 mb-1 block">{t('settings:speedRange.slowLabel', { value: low })}</label>
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
        <label className="text-[11px] text-gray-400 mb-1 block">{t('settings:speedRange.fastLabel', { value: high })}</label>
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
        <span className="text-purple-500">{t('settings:speedRange.legendSlow')}</span>
        <span className="text-green-500">{t('settings:speedRange.legendNormal')}</span>
        <span className="text-red-500">{t('settings:speedRange.legendFast')}</span>
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
  const { t } = useTranslation(['settings'])
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
          {isActive ? t('settings:presets.activeBadge') : t('settings:presets.applyBadge')}
        </span>
      </div>

      <div className="mt-3 flex items-center gap-2 flex-wrap">
        <span className="text-[11px] font-medium text-gray-700">
          {t('settings:presets.speed', {
            low: preset.speedRange.low,
            high: preset.speedRange.high,
          })}
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
  const { t } = useTranslation(['settings'])

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
          {isActive ? t('settings:goal.activeBadge') : t('settings:goal.selectBadge')}
        </span>
      </div>

      <p
        className={`mt-2 text-[11px] ${
          isActive ? 'text-emerald-700' : 'text-gray-400'
        }`}
      >
        {goal.coachHint}
      </p>
    </button>
  )
}
