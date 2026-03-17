import { motion, AnimatePresence } from 'framer-motion'
import { useDemoStore } from './demoStore'
import { DEMO_STEPS } from './demoScript'

export function DemoOverlay() {
  const isDemoActive = useDemoStore((s) => s.isDemoActive)
  const currentStepIndex = useDemoStore((s) => s.currentStepIndex)
  const stopDemo = useDemoStore((s) => s.stopDemo)
  const goToStep = useDemoStore((s) => s.goToStep)

  if (!isDemoActive) return null

  const step = DEMO_STEPS[currentStepIndex]
  const total = DEMO_STEPS.length

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10"
      style={{
        background: 'rgba(20, 21, 28, 0.97)',
        backdropFilter: 'blur(12px)',
      }}
    >
      <div className="flex items-center gap-6 px-8 py-3 max-w-screen-2xl mx-auto">
        {/* Step counter + dots */}
        <div className="flex-shrink-0 flex flex-col items-center gap-1.5 min-w-[72px]">
          <span className="text-[11px] font-semibold text-white/60 tracking-wide uppercase">
            {currentStepIndex + 1} / {total}
          </span>
          <div className="flex gap-1 flex-wrap justify-center" style={{ maxWidth: 72 }}>
            {DEMO_STEPS.map((_, i) => (
              <button
                key={i}
                onClick={() => goToStep(i)}
                title={DEMO_STEPS[i].title}
                className="w-1.5 h-1.5 rounded-full transition-all duration-200 hover:scale-125"
                style={{
                  backgroundColor:
                    i === currentStepIndex
                      ? '#f8f8f2'
                      : i < currentStepIndex
                      ? 'rgba(248,248,242,0.45)'
                      : 'rgba(255,255,255,0.15)',
                }}
              />
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="w-px self-stretch bg-white/10 flex-shrink-0" />

        {/* Title + description */}
        <div className="flex-1 min-w-0 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStepIndex}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25 }}
            >
              <p className="text-sm font-semibold text-white leading-tight truncate">
                {step?.title}
              </p>
              <p className="text-sm text-white/70 leading-snug mt-0.5 line-clamp-2">
                {step?.description}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation buttons */}
        <div className="flex-shrink-0 flex items-center gap-2">
          <button
            onClick={() => goToStep(Math.max(0, currentStepIndex - 1))}
            disabled={currentStepIndex === 0}
            className="w-7 h-7 rounded-full flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 disabled:opacity-20 disabled:cursor-not-allowed transition-all"
            title="上一步"
          >
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="15,18 9,12 15,6" />
            </svg>
          </button>
          <button
            onClick={() => goToStep(Math.min(total - 1, currentStepIndex + 1))}
            disabled={currentStepIndex === total - 1}
            className="w-7 h-7 rounded-full flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 disabled:opacity-20 disabled:cursor-not-allowed transition-all"
            title="下一步"
          >
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="9,18 15,12 9,6" />
            </svg>
          </button>

          {/* Divider */}
          <div className="w-px h-5 bg-white/10 mx-1" />

          <button
            onClick={stopDemo}
            className="flex items-center gap-1.5 text-[11px] px-3 py-1.5 rounded-full border border-white/20 text-white/60 hover:text-white hover:border-white/40 transition-all"
          >
            <svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
            停止示範
          </button>
        </div>
      </div>
    </div>
  )
}
