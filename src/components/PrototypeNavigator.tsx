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
    <div className="border-b border-divider bg-bg-surface/80 backdrop-blur-md">
      <div className="px-4 md:px-8 py-3">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-text-muted">
              <span>{isDemoActive ? '示範進度' : '章節導覽'}</span>
              <span className="h-1 w-1 rounded-full bg-border-divider" />
              <span>
                {isDemoActive
                  ? `${currentStepIndex + 1} / ${DEMO_STEPS.length}`
                  : `${chapterIndex + 1} / ${CHAPTERS.length}`}
              </span>
            </div>
            <p className="mt-1 text-sm font-semibold text-text-primary">
              {isDemoActive ? currentStep.title : activeChapter.label}
            </p>
            <p className="mt-0.5 text-xs text-text-secondary">
              {isDemoActive
                ? currentStep.description
                : activeChapter.summary}
            </p>
          </div>

          <p className="text-[11px] text-text-muted md:text-right">
            {isDemoActive
              ? '示範進行中，可從頂部按鈕停止；流程結束後也會自動收起'
              : '可直接切換章節，自由探索整個原型網站'}
          </p>
        </div>

        <div className="mt-3 overflow-x-auto">
          <div className="flex min-w-max gap-2">
            {CHAPTERS.map((chapter, index) => {
              const isActive = chapter.id === screen
              const isPassed = index < chapterIndex
              return (
                <button
                  key={chapter.id}
                  onClick={() => requestScreen(chapter.id)}
                  disabled={isDemoActive}
                  className={`rounded-full border px-3 py-1.5 text-xs transition-all ${
                    isActive
                      ? 'border-accent-blue/45 bg-accent-blue/10 text-accent-blue-light'
                      : isPassed
                      ? 'border-divider bg-bg-card text-text-secondary'
                      : 'border-divider text-text-muted hover:border-accent-blue/25 hover:text-text-primary'
                  } ${isDemoActive ? 'cursor-not-allowed opacity-55' : ''}`}
                >
                  <span className="mr-1.5 text-[10px] opacity-70">{index + 1}.</span>
                  {chapter.label}
                </button>
              )
            })}
          </div>
        </div>

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
