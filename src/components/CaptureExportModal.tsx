import { AnimatePresence, motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'

export type CapturePreset = 'showcase' | 'presentation' | 'phone'

interface CaptureExportModalProps {
  isOpen: boolean
  isExporting: boolean
  selectedPreset: CapturePreset
  onSelectPreset: (preset: CapturePreset) => void
  onExport: () => void
  onClose: () => void
}

export function CaptureExportModal({
  isOpen,
  isExporting,
  selectedPreset,
  onSelectPreset,
  onExport,
  onClose,
}: CaptureExportModalProps) {
  const { t } = useTranslation(['common', 'capture'])
  const capturePresets: Array<{ id: CapturePreset; title: string; description: string }> = [
    {
      id: 'showcase',
      title: t('capture:presets.showcase.title'),
      description: t('capture:presets.showcase.description'),
    },
    {
      id: 'presentation',
      title: t('capture:presets.presentation.title'),
      description: t('capture:presets.presentation.description'),
    },
    {
      id: 'phone',
      title: t('capture:presets.phone.title'),
      description: t('capture:presets.phone.description'),
    },
  ]

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-center justify-center p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onClick={onClose}
        >
          <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" />

          <motion.div
            className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-divider bg-bg-base shadow-2xl"
            initial={{ scale: 0.96, opacity: 0, y: 8 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.96, opacity: 0, y: 8 }}
            transition={{ duration: 0.2 }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="border-b border-divider px-8 py-6">
                <div className="mb-1 flex items-center gap-2">
                  <div className="h-3.5 w-1 rounded-full bg-accent-blue" />
                  <span className="text-xs font-semibold uppercase tracking-[0.2em] text-accent-blue-light">
                    {t('capture:eyebrow')}
                  </span>
                </div>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-text-primary">{t('capture:title')}</h2>
                  <p className="mt-1 text-sm text-text-secondary">
                    {t('capture:description')}
                  </p>
                </div>

                <button
                  onClick={onClose}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-divider text-text-muted transition-all hover:border-text-secondary hover:text-text-primary"
                >
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="space-y-3 px-8 py-6">
              {capturePresets.map((preset) => {
                const isSelected = preset.id === selectedPreset

                return (
                  <button
                    key={preset.id}
                    onClick={() => onSelectPreset(preset.id)}
                    className={`w-full rounded-2xl border px-4 py-4 text-left transition-all ${
                      isSelected
                        ? 'border-accent-blue/30 bg-accent-blue/10 shadow-[0_12px_28px_rgba(59,130,246,0.12)]'
                        : 'border-divider bg-bg-surface hover:bg-bg-card'
                    }`}
                  >
                    <p className="text-sm font-semibold text-text-primary">{preset.title}</p>
                    <p className="mt-1 text-sm leading-relaxed text-text-secondary">{preset.description}</p>
                  </button>
                )
              })}
            </div>

            <div className="flex items-center justify-between gap-3 border-t border-divider px-8 py-5">
              <p className="text-xs leading-relaxed text-text-muted">
                {t('capture:footer')}
              </p>
              <button
                onClick={onExport}
                disabled={isExporting}
                className="rounded-2xl border border-accent-blue/35 bg-accent-blue/12 px-4 py-2.5 text-sm font-semibold text-accent-blue-light transition-all hover:bg-accent-blue/16 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isExporting ? t('capture:exporting') : t('capture:download')}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
