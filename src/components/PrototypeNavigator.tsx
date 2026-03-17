import { DEMO_STEPS } from '../demo/demoScript'
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

export function PrototypeNavigator() {
  const screen = useNavigationStore((s) => s.screen)
  const requestScreen = useNavigationStore((s) => s.requestScreen)
  const isDemoActive = useDemoStore((s) => s.isDemoActive)
  const currentStepIndex = useDemoStore((s) => s.currentStepIndex)

  const chapterIndex = Math.max(0, CHAPTERS.findIndex((chapter) => chapter.id === screen))
  const activeChapter = CHAPTERS[chapterIndex]
  const currentStep = DEMO_STEPS[currentStepIndex]
  const progress = isDemoActive
    ? ((currentStepIndex + 1) / DEMO_STEPS.length) * 100
    : ((chapterIndex + 1) / CHAPTERS.length) * 100

  return (
    <div className="w-[168px] rounded-[26px] border border-divider bg-bg-surface/88 px-4 py-4 shadow-sm backdrop-blur-md">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-text-muted">
            {isDemoActive ? '示範' : '導覽'}
          </p>
          <p className="mt-1 text-xl font-semibold text-text-primary">
            {isDemoActive
              ? `${currentStepIndex + 1} / ${DEMO_STEPS.length}`
              : `${chapterIndex + 1} / ${CHAPTERS.length}`}
          </p>
        </div>
        <span
          className={`mt-0.5 h-2.5 w-2.5 rounded-full ${
            isDemoActive ? 'bg-accent-amber' : 'bg-accent-blue'
          }`}
        />
      </div>

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

      <div className="mt-4 h-px bg-border-divider" />

      <div className="mt-3">
        <p className="text-sm font-semibold leading-snug text-text-primary">
          {isDemoActive ? currentStep.title : activeChapter.label}
        </p>
        <p className="mt-1.5 text-xs leading-relaxed text-text-secondary">
          {isDemoActive ? currentStep.description : activeChapter.summary}
        </p>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-black/5 dark:bg-white/10">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              isDemoActive ? 'bg-accent-amber' : 'bg-accent-blue'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  )
}
