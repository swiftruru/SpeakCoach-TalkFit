import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { AnnotationItem } from './types'
import type { Screen } from '../types'

const ANNOTATIONS_PER_PAGE = 4

interface AnnotationPanelProps {
  screen: Screen
  activeId: string | null
  pinnedId: string | null
  isSpotlightMode?: boolean
  onHoverItem: (id: string | null) => void
  onTogglePin: (id: string) => void
  onNavigate: (screen: Screen) => void
}

export function AnnotationPanel({
  screen,
  activeId,
  pinnedId,
  isSpotlightMode = false,
  onHoverItem,
  onTogglePin,
  onNavigate,
}: AnnotationPanelProps) {
  const { t } = useTranslation(['common', 'annotation'])
  const annotations = useMemo(() => {
    const value = t(`annotation:items.${screen}`, { returnObjects: true })
    return Array.isArray(value) ? (value as AnnotationItem[]) : []
  }, [screen, t])
  const screenLabels: Record<Screen, string> = {
    home: t('common:screenTabs.home'),
    practice: t('common:screenTabs.practice'),
    report: t('common:screenTabs.report'),
    history: t('common:screenTabs.history'),
    settings: t('common:screenTabs.settings'),
  }
  const typeBadge: Record<AnnotationItem['type'], { label: string; cls: string }> = {
    feature: { label: t('annotation:types.feature'), cls: 'bg-blue-50 text-blue-600' },
    design: { label: t('annotation:types.design'), cls: 'bg-purple-50 text-purple-600' },
    tech: { label: t('annotation:types.tech'), cls: 'bg-amber-50 text-amber-600' },
  }
  const [manualPageIndexByScreen, setManualPageIndexByScreen] = useState<Record<Screen, number>>({
    home: 0,
    practice: 0,
    report: 0,
    history: 0,
    settings: 0,
  })
  const totalPages = Math.max(1, Math.ceil(annotations.length / ANNOTATIONS_PER_PAGE))
  const activeItemIndex = activeId
    ? annotations.findIndex((item) => item.targetId === activeId)
    : -1
  const activePageIndex =
    activeItemIndex >= 0 ? Math.floor(activeItemIndex / ANNOTATIONS_PER_PAGE) : null
  const manualPageIndex = manualPageIndexByScreen[screen] ?? 0
  const pageIndex = activePageIndex ?? Math.min(manualPageIndex, totalPages - 1)
  const pagedAnnotations = annotations.slice(
    pageIndex * ANNOTATIONS_PER_PAGE,
    (pageIndex + 1) * ANNOTATIONS_PER_PAGE
  )

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Panel header — tab nav */}
      <div className={`flex-shrink-0 px-3 pt-3 pb-0 transition-opacity ${isSpotlightMode && activeId ? 'opacity-55' : ''}`}>
        <div className="flex flex-wrap gap-0.5">
          {(Object.entries(screenLabels) as [Screen, string][]).map(([id, label]) => (
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
        {totalPages > 1 && (
          <div className="mb-3 flex items-center justify-between rounded-2xl border border-divider bg-bg-card px-3 py-2">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-text-muted">
                {t('annotation:pagination.label')}
              </p>
              <p className="mt-0.5 text-xs text-text-secondary">
                {t('annotation:pagination.status', { page: pageIndex + 1, total: totalPages })}
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setManualPageIndexByScreen((current) => ({
                  ...current,
                  [screen]: Math.max(0, manualPageIndex - 1),
                }))}
                disabled={pageIndex === 0 || activePageIndex !== null}
                className="rounded-full border border-divider px-2.5 py-1 text-[11px] text-text-secondary transition-all hover:bg-bg-surface disabled:cursor-not-allowed disabled:opacity-45"
              >
                {t('common:actions.previous')}
              </button>
              <button
                onClick={() => setManualPageIndexByScreen((current) => ({
                  ...current,
                  [screen]: Math.min(totalPages - 1, manualPageIndex + 1),
                }))}
                disabled={pageIndex >= totalPages - 1 || activePageIndex !== null}
                className="rounded-full border border-divider px-2.5 py-1 text-[11px] text-text-secondary transition-all hover:bg-bg-surface disabled:cursor-not-allowed disabled:opacity-45"
              >
                {t('common:actions.next')}
              </button>
            </div>
          </div>
        )}

        {pagedAnnotations.map((item) => {
          const isHighlighted = activeId === item.targetId
          const isPinned = pinnedId === item.targetId
          return (
            <div
              key={item.id}
              data-annotation-card-for={item.targetId}
              onMouseEnter={() => onHoverItem(item.targetId)}
              onMouseLeave={() => onHoverItem(null)}
              onClick={() => onTogglePin(item.targetId)}
              className={`rounded-xl p-3.5 border cursor-pointer transition-all duration-200 ${
                isHighlighted
                  ? 'bg-amber-50 border-amber-200 shadow-[0_12px_28px_rgba(249,115,22,0.12)] dark:bg-amber-500/10 dark:border-amber-400/30'
                  : 'bg-bg-card border-divider'
              } ${isSpotlightMode && activeId && !isHighlighted && !isPinned ? 'opacity-40 scale-[0.985]' : ''}`}
            >
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <span className={`text-sm font-medium ${isHighlighted ? 'text-amber-800 dark:text-amber-200' : 'text-text-primary'}`}>
                  {item.title}
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onTogglePin(item.targetId)
                    }}
                    className={`rounded-full px-1.5 py-0.5 text-[10px] transition-all ${
                      isPinned
                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-200'
                        : 'bg-bg-card2 text-text-muted hover:text-text-primary'
                    }`}
                    title={isPinned ? t('annotation:pinButton.unpinTitle') : t('annotation:pinButton.pinTitle')}
                  >
                    {isPinned ? t('annotation:pinButton.pinned') : t('annotation:pinButton.pin')}
                  </button>
                  <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full flex-shrink-0 ${typeBadge[item.type].cls}`}>
                    {typeBadge[item.type].label}
                  </span>
                </div>
              </div>
              <p className="text-sm text-text-secondary leading-relaxed">
                {item.description}
              </p>
            </div>
          )
        })}
      </div>

      {/* Footer hint */}
      <div className={`px-5 py-3 flex-shrink-0 border-t border-divider transition-opacity ${isSpotlightMode && activeId ? 'opacity-45' : ''}`}>
        <p className="text-[11px] text-text-muted">
          {t('annotation:footer', {
            appName: t('common:appName'),
            madeWithReact: t('common:madeWithReact'),
          })}
        </p>
      </div>
    </div>
  )
}
