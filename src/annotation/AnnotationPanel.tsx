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
}

export function AnnotationPanel({ screen, hoveredId, onHoverItem }: AnnotationPanelProps) {
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
      {/* Panel header */}
      <div className="px-5 pt-5 pb-3 flex-shrink-0">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full bg-accent-blue" />
          <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
            說明面板
          </span>
        </div>
        <h2 className="text-lg font-semibold text-text-primary">
          {SCREEN_LABELS[screen]}
        </h2>
      </div>

      <div className="w-full h-px bg-border-divider flex-shrink-0" />

      {/* Annotation list */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2 phone-scroll">
        {annotations.map((item) => {
          const isHighlighted = hoveredId === item.targetId
          return (
            <div
              key={item.id}
              ref={(el) => { itemRefs.current[item.targetId] = el }}
              onMouseEnter={() => onHoverItem(item.targetId)}
              onMouseLeave={() => onHoverItem(null)}
              className={`rounded-xl p-3.5 border cursor-default transition-all duration-200 ${
                isHighlighted
                  ? 'bg-accent-blue/10 border-accent-blue/40 shadow-sm'
                  : 'bg-bg-card border-divider'
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <span className={`text-sm font-medium ${isHighlighted ? 'text-accent-blue-light' : 'text-text-primary'}`}>
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
          說來話長 TalkFit · React Prototype
        </p>
      </div>
    </div>
  )
}
