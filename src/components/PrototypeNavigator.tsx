import { getDemoSteps } from '../demo/demoScript'
import { useDemoStore } from '../demo/demoStore'
import { useTranslation } from 'react-i18next'
import { useNavigationStore } from '../stores/navigationStore'
import type { Screen } from '../types'

interface PrototypeNavigatorProps {
  isSpotlightMode?: boolean
}

export function PrototypeNavigator({ isSpotlightMode = false }: PrototypeNavigatorProps) {
  const { t } = useTranslation(['common', 'navigator'])
  const screen = useNavigationStore((s) => s.screen)
  const requestScreen = useNavigationStore((s) => s.requestScreen)
  const mode = useDemoStore((s) => s.mode)
  const isDemoActive = useDemoStore((s) => s.isDemoActive)
  const isDemoPaused = useDemoStore((s) => s.isDemoPaused)
  const currentStepIndex = useDemoStore((s) => s.currentStepIndex)
  const startDemo = useDemoStore((s) => s.startDemo)
  const setMode = useDemoStore((s) => s.setMode)
  const goToStep = useDemoStore((s) => s.goToStep)
  const stopDemo = useDemoStore((s) => s.stopDemo)
  const togglePause = useDemoStore((s) => s.togglePause)
  const playbackRate = useDemoStore((s) => s.playbackRate)
  const cyclePlaybackRate = useDemoStore((s) => s.cyclePlaybackRate)
  const chapters: Array<{ id: Screen; label: string; summary: string }> = [
    {
      id: 'home',
      label: t('navigator:chapters.home.label'),
      summary: t('navigator:chapters.home.summary'),
    },
    {
      id: 'practice',
      label: t('navigator:chapters.practice.label'),
      summary: t('navigator:chapters.practice.summary'),
    },
    {
      id: 'report',
      label: t('navigator:chapters.report.label'),
      summary: t('navigator:chapters.report.summary'),
    },
    {
      id: 'history',
      label: t('navigator:chapters.history.label'),
      summary: t('navigator:chapters.history.summary'),
    },
    {
      id: 'settings',
      label: t('navigator:chapters.settings.label'),
      summary: t('navigator:chapters.settings.summary'),
    },
  ]

  const chapterIndex = Math.max(0, chapters.findIndex((chapter) => chapter.id === screen))
  const activeChapter = chapters[chapterIndex]
  const demoSteps = getDemoSteps(mode)
  const currentStep = demoSteps[currentStepIndex] ?? demoSteps[0] ?? { title: '', description: '' }
  const progress = isDemoActive
    ? ((currentStepIndex + 1) / Math.max(demoSteps.length, 1)) * 100
    : ((chapterIndex + 1) / chapters.length) * 100
  const summaryTitle = isDemoActive ? currentStep.title : activeChapter.label
  const summaryDescription = isDemoActive ? currentStep.description : activeChapter.summary

  return (
    <div className="flex w-[344px] items-start gap-3">
      <div
        className={`w-[168px] rounded-[26px] border border-divider bg-bg-surface/88 px-4 py-4 shadow-sm backdrop-blur-md transition-all ${
          isSpotlightMode ? 'opacity-70' : ''
        }`}
      >
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-text-muted">
              {isDemoActive ? t('navigator:modeLabel.demo') : t('navigator:modeLabel.guide')}
            </p>
            <p className="mt-1 text-xl font-semibold text-text-primary">
              {isDemoActive
                ? `${currentStepIndex + 1} / ${Math.max(demoSteps.length, 1)}`
                : `${chapterIndex + 1} / ${chapters.length}`}
            </p>
          </div>
          <span
            className={`mt-0.5 h-2.5 w-2.5 rounded-full ${
              isDemoActive ? 'bg-accent-amber' : 'bg-accent-blue'
            }`}
          />
        </div>

        <div className="mt-4">
          <p className="text-[11px] font-semibold tracking-[0.14em] text-text-muted uppercase">
            {t('navigator:completeDemo')}
          </p>
          <button
            onClick={() => {
              if (isDemoActive) {
                stopDemo()
                return
              }

              setMode('demo')
              startDemo()
            }}
            className={`mt-2 w-full rounded-2xl border px-3 py-3 text-sm font-semibold shadow-sm transition-all duration-150 active:scale-[0.985] ${
              isDemoActive
                ? 'border-accent-amber/35 bg-accent-amber/12 text-accent-amber shadow-[0_10px_22px_rgba(245,158,11,0.16)]'
                : 'border-accent-blue/30 bg-accent-blue/12 text-accent-blue-light hover:-translate-y-0.5 hover:shadow-md'
            }`}
          >
            {isDemoActive ? t('common:actions.stopDemo') : t('common:actions.startDemo')}
          </button>
          <p className="mt-2 text-[11px] leading-relaxed text-text-secondary">
            {t('navigator:exploreHint')}
          </p>
        </div>

        <div className="mt-4 h-px bg-border-divider" />

        {isDemoActive ? (
          <div className="mt-3">
            <p className="text-[11px] font-semibold tracking-[0.14em] text-text-muted uppercase">
              {t('navigator:controlsLabel')}
            </p>
            <div className="mt-2 grid grid-cols-2 gap-1.5">
              <button
                onClick={() => currentStepIndex > 0 && goToStep(currentStepIndex - 1)}
                disabled={currentStepIndex === 0}
                className="rounded-xl bg-bg-card px-2.5 py-2 text-[11px] text-text-secondary transition-all hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-45"
              >
                {t('common:actions.previousStep')}
              </button>
              <button
                onClick={togglePause}
                className="rounded-xl bg-bg-card px-2.5 py-2 text-[11px] text-text-secondary transition-all hover:text-text-primary"
              >
                {isDemoPaused ? t('common:actions.resume') : t('common:actions.pause')}
              </button>
              <button
                onClick={() => currentStepIndex < demoSteps.length - 1 && goToStep(currentStepIndex + 1)}
                disabled={currentStepIndex >= demoSteps.length - 1}
                className="rounded-xl bg-bg-card px-2.5 py-2 text-[11px] text-text-secondary transition-all hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-45"
              >
                {t('common:actions.nextStep')}
              </button>
              <button
                onClick={cyclePlaybackRate}
                className="rounded-xl bg-bg-card px-2.5 py-2 text-[11px] text-text-secondary transition-all hover:text-text-primary"
              >
                {playbackRate}x
              </button>
            </div>
          </div>
        ) : null}

        <div className="mt-4 h-px bg-border-divider" />

        <div className="mt-4 flex flex-col gap-2">
          {chapters.map((chapter, index) => {
            const isActive = chapter.id === screen
            const isPassed = index < chapterIndex
            return (
              <button
                key={chapter.id}
                onClick={() => requestScreen(chapter.id)}
                disabled={isDemoActive}
                className={`flex items-center gap-2.5 rounded-2xl px-3 py-2.5 text-left text-sm transition-all ${
                  isActive
                    ? 'bg-accent-blue/10 text-accent-blue-light'
                    : isPassed
                    ? 'text-text-secondary'
                    : 'text-text-muted hover:bg-bg-card hover:text-text-primary'
                } ${isDemoActive ? 'cursor-not-allowed opacity-60' : ''}`}
              >
                <span
                  className={`h-2 w-2 rounded-full flex-shrink-0 ${
                    isActive
                      ? isDemoActive ? 'bg-accent-amber' : 'bg-accent-blue'
                      : isPassed
                      ? 'bg-text-muted/50'
                      : 'bg-border-divider'
                  }`}
                />
                <span className="truncate">{chapter.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      <div
        data-prototype-summary-card
        className={`w-[163px] rounded-[24px] border border-divider bg-bg-surface/92 px-4 py-4 shadow-sm backdrop-blur-md transition-all ${
          isSpotlightMode
            ? 'border-accent-amber/35 shadow-[0_16px_34px_rgba(249,115,22,0.14)]'
            : ''
        }`}
      >
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-[11px] uppercase tracking-[0.16em] text-text-muted">
              {t('navigator:summaryLabel')}
            </p>
            <p className="mt-1 text-sm font-semibold leading-snug text-text-primary">
              {summaryTitle}
            </p>
          </div>
          <span
            className={`mt-0.5 rounded-full px-2 py-1 text-[10px] ${
              isDemoActive
                ? 'bg-accent-amber/12 text-accent-amber'
                : 'bg-emerald-500/12 text-emerald-600 dark:text-emerald-300'
            }`}
            >
            {isDemoActive ? t('navigator:status.demo') : t('navigator:status.explore')}
          </span>
        </div>

        <p className="mt-3 text-xs leading-relaxed text-text-secondary">
          {summaryDescription}
        </p>

        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-black/5 dark:bg-white/10">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              isDemoActive ? 'bg-accent-amber' : 'bg-accent-blue'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="mt-4 rounded-2xl bg-bg-card px-3 py-2.5">
          <p className="text-[11px] font-medium text-text-primary">
            {isDemoActive ? t('navigator:callout.demoTitle') : t('navigator:callout.exploreTitle')}
          </p>
          <p className="mt-1 text-[11px] leading-relaxed text-text-secondary">
            {isDemoActive
              ? t('navigator:callout.demoBody')
              : t('navigator:callout.exploreBody')}
          </p>
        </div>
      </div>
    </div>
  )
}
