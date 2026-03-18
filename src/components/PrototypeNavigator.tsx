import { DEMO_STEPS, getDemoSteps } from '../demo/demoScript'
import { useDemoStore } from '../demo/demoStore'
import { useNavigationStore } from '../stores/navigationStore'
import type { Screen } from '../types'

const CHAPTERS: Array<{ id: Screen; label: string; summary: string }> = [
  { id: 'home', label: '首頁', summary: '先看近期練習總覽與提醒。' },
  { id: 'practice', label: '練習', summary: '聚焦練習中的儀表、目標與回饋。' },
  { id: 'report', label: '報告', summary: '查看分析結果、定位問題並重練。' },
  { id: 'history', label: '紀錄', summary: '回顧趨勢與每次練習表現。' },
  { id: 'settings', label: '設定', summary: '調整情境、目標與偵測規則。' },
]

interface PrototypeNavigatorProps {
  isSpotlightMode?: boolean
}

export function PrototypeNavigator({ isSpotlightMode = false }: PrototypeNavigatorProps) {
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

  const chapterIndex = Math.max(0, CHAPTERS.findIndex((chapter) => chapter.id === screen))
  const activeChapter = CHAPTERS[chapterIndex]
  const demoSteps = getDemoSteps(mode)
  const currentStep = demoSteps[currentStepIndex] ?? DEMO_STEPS[0]
  const progress = isDemoActive
    ? ((currentStepIndex + 1) / Math.max(demoSteps.length, 1)) * 100
    : ((chapterIndex + 1) / CHAPTERS.length) * 100
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
              {isDemoActive ? '示範' : '導覽'}
            </p>
            <p className="mt-1 text-xl font-semibold text-text-primary">
              {isDemoActive
                ? `${currentStepIndex + 1} / ${Math.max(demoSteps.length, 1)}`
                : `${chapterIndex + 1} / ${CHAPTERS.length}`}
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
            完整導覽
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
            {isDemoActive ? '結束示範' : '開始示範'}
          </button>
          <p className="mt-2 text-[11px] leading-relaxed text-text-secondary">
            不播放示範時，現在的畫面就是自由探索模式，可直接切換章節與閱讀說明。
          </p>
        </div>

        <div className="mt-4 h-px bg-border-divider" />

        {isDemoActive ? (
          <div className="mt-3">
            <p className="text-[11px] font-semibold tracking-[0.14em] text-text-muted uppercase">
              示範控制
            </p>
            <div className="mt-2 grid grid-cols-2 gap-1.5">
              <button
                onClick={() => currentStepIndex > 0 && goToStep(currentStepIndex - 1)}
                disabled={currentStepIndex === 0}
                className="rounded-xl bg-bg-card px-2.5 py-2 text-[11px] text-text-secondary transition-all hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-45"
              >
                上一步
              </button>
              <button
                onClick={togglePause}
                className="rounded-xl bg-bg-card px-2.5 py-2 text-[11px] text-text-secondary transition-all hover:text-text-primary"
              >
                {isDemoPaused ? '繼續播放' : '暫停播放'}
              </button>
              <button
                onClick={() => currentStepIndex < demoSteps.length - 1 && goToStep(currentStepIndex + 1)}
                disabled={currentStepIndex >= demoSteps.length - 1}
                className="rounded-xl bg-bg-card px-2.5 py-2 text-[11px] text-text-secondary transition-all hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-45"
              >
                下一步
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
          {CHAPTERS.map((chapter, index) => {
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
              當前說明
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
            {isDemoActive ? '示範中' : '自由探索'}
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
            {isDemoActive ? '展示提示' : '目前為自由探索'}
          </p>
          <p className="mt-1 text-[11px] leading-relaxed text-text-secondary">
            {isDemoActive
              ? '目前正在播放完整 App Demo；可使用上一頁、下一頁、暫停與倍速控制調整節奏。'
              : '不按示範時，原型網站預設就是自由探索，可直接切換章節、點註解卡或使用畫面連結。'}
          </p>
        </div>
      </div>
    </div>
  )
}
