import { useEffect, useMemo } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'

interface KeyboardShortcutsModalProps {
  isOpen: boolean
  onClose: () => void
}

export function KeyboardShortcutsModal({
  isOpen,
  onClose,
}: KeyboardShortcutsModalProps) {
  const { t } = useTranslation(['common', 'shortcuts'])
  const shortcutGroups = useMemo(
    () => [
      {
        title: t('shortcuts:groups.showcase'),
        items: [
          { keys: ['⌘K', 'Ctrl+K'], description: t('shortcuts:items.palette') },
          { keys: ['D'], description: t('shortcuts:items.demo') },
          { keys: ['P'], description: t('shortcuts:items.presentation') },
          { keys: ['F'], description: t('shortcuts:items.fullscreen') },
          { keys: ['E'], description: t('shortcuts:items.capture') },
          { keys: ['A'], description: t('shortcuts:items.annotations') },
          { keys: ['X'], description: t('shortcuts:items.laserPointer') },
          { keys: ['C'], description: t('shortcuts:items.cursorBoost') },
          { keys: ['R'], description: t('shortcuts:items.reset') },
        ],
      },
      {
        title: t('shortcuts:groups.playback'),
        items: [
          { keys: ['←'], description: t('shortcuts:items.previous') },
          { keys: ['→'], description: t('shortcuts:items.next') },
          { keys: ['K'], description: t('shortcuts:items.pause') },
          { keys: ['Esc'], description: t('shortcuts:items.escape') },
        ],
      },
      {
        title: t('shortcuts:groups.site'),
        items: [
          { keys: ['?'], description: t('shortcuts:items.help') },
          { keys: ['T'], description: t('shortcuts:items.theme') },
          { keys: ['S'], description: t('shortcuts:items.story') },
          { keys: ['L'], description: t('shortcuts:items.link') },
        ],
      },
    ],
    [t]
  )

  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onClick={onClose}
        >
          <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" />

          <motion.div
            className="relative w-full max-w-3xl overflow-hidden rounded-3xl border border-divider bg-bg-base shadow-2xl"
            initial={{ scale: 0.96, opacity: 0, y: 8 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.96, opacity: 0, y: 8 }}
            transition={{ duration: 0.2 }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4 border-b border-divider px-8 py-6">
              <div>
                <div className="mb-1 flex items-center gap-2">
                  <div className="h-3.5 w-1 rounded-full bg-accent-blue" />
                  <span className="text-xs font-semibold uppercase tracking-[0.2em] text-accent-blue-light">
                    {t('shortcuts:eyebrow')}
                  </span>
                </div>
                <h2 className="text-xl font-bold text-text-primary">{t('shortcuts:title')}</h2>
                <p className="mt-1 text-sm text-text-secondary">
                  {t('shortcuts:description')}
                </p>
              </div>

              <button
                onClick={onClose}
                className="mt-1 flex h-8 w-8 items-center justify-center rounded-full border border-divider text-text-muted transition-all hover:border-text-secondary hover:text-text-primary"
              >
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="grid gap-4 px-8 py-6 md:grid-cols-3">
              {shortcutGroups.map((group) => (
                <div key={group.title} className="rounded-2xl border border-divider bg-bg-surface px-4 py-4">
                  <p className="text-sm font-semibold text-text-primary">{group.title}</p>
                  <div className="mt-4 space-y-3">
                    {group.items.map((item) => (
                      <div key={item.description} className="flex items-start gap-3">
                        <div className="flex min-w-[72px] flex-wrap gap-1">
                          {item.keys.map((key) => (
                            <kbd
                              key={key}
                              className="rounded-lg border border-divider bg-bg-card px-2 py-1 text-[11px] font-semibold text-text-secondary shadow-sm"
                            >
                              {key}
                            </kbd>
                          ))}
                        </div>
                        <p className="text-sm leading-relaxed text-text-secondary">{item.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
