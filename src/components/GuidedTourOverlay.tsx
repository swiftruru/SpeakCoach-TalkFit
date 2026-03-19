import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import type { GuidedTourStep } from '../lib/guidedTourSteps'

interface GuidedTourOverlayProps {
  isOpen: boolean
  step: GuidedTourStep
  stepIndex: number
  totalSteps: number
  targetRect: DOMRect | null
  onPrevious: () => void
  onNext: () => void
  onSkip: () => void
  onFinish: () => void
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(value, max))
}

export function GuidedTourOverlay({
  isOpen,
  step,
  stepIndex,
  totalSteps,
  targetRect,
  onPrevious,
  onNext,
  onSkip,
  onFinish,
}: GuidedTourOverlayProps) {
  const { t } = useTranslation(['common', 'guidedTour'])
  const cardRef = useRef<HTMLDivElement | null>(null)
  const [cardStyle, setCardStyle] = useState<CSSProperties>({})

  const title = t(step.titleKey)
  const description = t(step.descriptionKey)

  const spotlightRect = useMemo(() => {
    if (!targetRect) return null

    return {
      left: targetRect.left - 10,
      top: targetRect.top - 10,
      width: targetRect.width + 20,
      height: targetRect.height + 20,
      radius: 22,
    }
  }, [targetRect])

  useEffect(() => {
    if (!isOpen) return

    const updateCardPosition = () => {
      if (!cardRef.current) return

      const viewportPadding = 24
      const rect = targetRect
      const cardRect = cardRef.current.getBoundingClientRect()
      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight

      if (!rect) {
        setCardStyle({
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
        })
        return
      }

      const centeredTop = clamp(
        rect.top + rect.height / 2 - cardRect.height / 2,
        viewportPadding,
        viewportHeight - cardRect.height - viewportPadding
      )

      if (step.placement === 'bottom') {
        setCardStyle({
          left: clamp(
            rect.left + rect.width / 2 - cardRect.width / 2,
            viewportPadding,
            viewportWidth - cardRect.width - viewportPadding
          ),
          top: clamp(
            rect.bottom + 18,
            viewportPadding,
            viewportHeight - cardRect.height - viewportPadding
          ),
        })
        return
      }

      if (step.placement === 'left') {
        const preferredLeft = rect.left - cardRect.width - 24
        const fallbackLeft = rect.right + 24

        setCardStyle({
          left:
            preferredLeft >= viewportPadding
              ? preferredLeft
              : clamp(
                  fallbackLeft,
                  viewportPadding,
                  viewportWidth - cardRect.width - viewportPadding
                ),
          top: centeredTop,
        })
        return
      }

      const preferredLeft = rect.right + 24
      const fallbackLeft = rect.left - cardRect.width - 24

      setCardStyle({
        left:
          preferredLeft + cardRect.width <= viewportWidth - viewportPadding
            ? preferredLeft
            : clamp(
                fallbackLeft,
                viewportPadding,
                viewportWidth - cardRect.width - viewportPadding
              ),
        top: centeredTop,
      })
    }

    updateCardPosition()

    const resizeObserver = new ResizeObserver(() => {
      updateCardPosition()
    })

    if (cardRef.current) resizeObserver.observe(cardRef.current)

    window.addEventListener('resize', updateCardPosition)
    window.addEventListener('scroll', updateCardPosition, true)

    return () => {
      resizeObserver.disconnect()
      window.removeEventListener('resize', updateCardPosition)
      window.removeEventListener('scroll', updateCardPosition, true)
    }
  }, [isOpen, step.placement, targetRect])

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          data-capture-ignore
          data-capture-role="guided-tour-overlay"
          className="fixed inset-0 z-[70] isolate"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
        >
          <div className="absolute inset-0 z-0 bg-slate-950/38" />

          {spotlightRect && (
            <>
              <svg className="pointer-events-none absolute inset-0 z-[1] h-full w-full">
                <defs>
                  <mask id="guided-tour-mask">
                    <rect width="100%" height="100%" fill="white" />
                    <rect
                      x={spotlightRect.left}
                      y={spotlightRect.top}
                      width={spotlightRect.width}
                      height={spotlightRect.height}
                      rx={spotlightRect.radius}
                      fill="black"
                    />
                  </mask>
                </defs>
                <rect width="100%" height="100%" fill="rgba(15,23,42,0.56)" mask="url(#guided-tour-mask)" />
              </svg>

              <motion.div
                className="pointer-events-none absolute z-[1] rounded-[24px] border border-amber-300/95 shadow-[0_0_0_1px_rgba(251,191,36,0.18),0_18px_42px_rgba(249,115,22,0.18)]"
                style={{
                  left: spotlightRect.left,
                  top: spotlightRect.top,
                  width: spotlightRect.width,
                  height: spotlightRect.height,
                }}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.18 }}
              />
            </>
          )}

          <motion.div
            ref={cardRef}
            className="absolute z-[2] w-[320px] max-w-[calc(100vw-32px)] rounded-[28px] border border-white p-5 shadow-[0_22px_56px_rgba(15,23,42,0.28)] dark:border-slate-700"
            style={{
              ...cardStyle,
              backgroundColor: 'rgba(255,255,255,0.985)',
              opacity: 1,
            }}
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent-amber">
                  {t('guidedTour:eyebrow')}
                </p>
                <h3 className="mt-2 text-lg font-semibold leading-tight text-text-primary">
                  {title}
                </h3>
              </div>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-200">
                {t('guidedTour:progress', {
                  current: stepIndex + 1,
                  total: totalSteps,
                })}
              </span>
            </div>

            <p className="mt-3 text-sm leading-relaxed text-slate-700 dark:text-slate-200/90">
              {description}
            </p>

            <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-black/5 dark:bg-white/10">
              <div
                className="h-full rounded-full bg-accent-amber transition-all duration-300"
                style={{ width: `${((stepIndex + 1) / totalSteps) * 100}%` }}
              />
            </div>

            <div className="mt-5 flex items-center justify-between gap-3">
              <button
                onClick={onSkip}
                className="text-sm text-slate-500 transition-colors hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
              >
                {t('common:actions.skip')}
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={onPrevious}
                  disabled={stepIndex === 0}
                  className="rounded-full border border-slate-300 px-4 py-2 text-sm text-slate-700 transition-all hover:bg-slate-100 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-45 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-white"
                >
                  {t('common:actions.previous')}
                </button>
                <button
                  onClick={stepIndex === totalSteps - 1 ? onFinish : onNext}
                  className="rounded-full border border-accent-amber/40 bg-accent-amber/10 px-4 py-2 text-sm font-medium text-accent-amber transition-all hover:-translate-y-0.5 hover:shadow-sm"
                >
                  {stepIndex === totalSteps - 1
                    ? t('guidedTour:actions.finish')
                    : t('common:actions.next')}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
