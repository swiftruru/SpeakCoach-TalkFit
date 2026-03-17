import { useRef, useEffect } from 'react'
import type { AnnotationItem } from './types'
import type { Screen } from '../types'
import { homeAnnotations } from './annotations/home'
import { practiceAnnotations } from './annotations/practice'
import { reportAnnotations } from './annotations/report'
import { historyAnnotations } from './annotations/history'
import { settingsAnnotations } from './annotations/settings'

const SCREEN_ANNOTATIONS: Record<Screen, AnnotationItem[]> = {
  home: homeAnnotations,
  practice: practiceAnnotations,
  report: reportAnnotations,
  history: historyAnnotations,
  settings: settingsAnnotations,
}

const SCREEN_LABELS: Record<Screen, string> = {
  home: '首頁',
  practice: '練習中',
  report: '分析報告',
  history: '歷史紀錄',
  settings: '設定',
}

const TYPE_BADGE: Record<AnnotationItem['type'], { label: string; cls: string }> = {
  feature: { label: '功能', cls: 'bg-blue-50 text-blue-600' },
  design: { label: '設計', cls: 'bg-purple-50 text-purple-600' },
  tech: { label: '技術', cls: 'bg-amber-50 text-amber-600' },
}

interface AnnotationPanelProps {
  screen: Screen
  hoveredId: string | null
  onHoverItem: (id: string | null) => void
  onNavigate: (screen: Screen) => void
}

export function AnnotationPanel({ screen, hoveredId, onHoverItem, onNavigate }: AnnotationPanelProps) {
  const annotations = SCREEN_ANNOTATIONS[screen] ?? []
  const itemRefs = useRef<Record<string, HTMLDivElement | null>>({})

  // Auto-scroll to hovered item when phone element is hovered
  useEffect(() => {
    if (hoveredId) {
      const el = itemRefs.current[hoveredId]
      el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }, [hoveredId])

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Panel header — tab nav */}
      <div className="flex-shrink-0 px-3 pt-3 pb-0">
        <div className="flex flex-wrap gap-0.5">
          {(Object.entries(SCREEN_LABELS) as [Screen, string][]).map(([id, label]) => (
            <button
              key={id}
              onClick={() => onNavigate(id)}
              className={`text-xs px-3 py-1.5 rounded-lg transition-all ${
                screen === id
                  ? 'bg-accent-blue/10 text-accent-blue-light font-medium'
                  : 'text-text-muted hover:text-text-secondary hover:bg-bg-card'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="w-full h-px bg-border-divider flex-shrink-0 mt-2" />

      {/* Annotation list */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2 phone-scroll">
        {annotations.map((item) => {
          const isHighlighted = hoveredId === item.targetId
          return (
            <div
              key={item.id}
              ref={(el) => { itemRefs.current[item.targetId] = el }}
              data-annotation-card-for={item.targetId}
              onMouseEnter={() => onHoverItem(item.targetId)}
              onMouseLeave={() => onHoverItem(null)}
              className={`rounded-xl p-3.5 border cursor-pointer transition-all duration-200 ${
                isHighlighted
                  ? 'bg-amber-50 border-amber-200 shadow-[0_12px_28px_rgba(249,115,22,0.12)] dark:bg-amber-500/10 dark:border-amber-400/30'
                  : 'bg-bg-card border-divider'
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <span className={`text-sm font-medium ${isHighlighted ? 'text-amber-800 dark:text-amber-200' : 'text-text-primary'}`}>
                  {item.title}
                </span>
                <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full flex-shrink-0 ${TYPE_BADGE[item.type].cls}`}>
                  {TYPE_BADGE[item.type].label}
                </span>
              </div>
              <p className="text-sm text-text-secondary leading-relaxed">
                {item.description}
              </p>
            </div>
          )
        })}
      </div>

      {/* Footer hint */}
      <div className="px-5 py-3 flex-shrink-0 border-t border-divider">
        <p className="text-[11px] text-text-muted">
          說來話長 TalkFit · Made with React
        </p>
      </div>
    </div>
  )
}
