import { useCallback, useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { useAppLanguage } from '../i18n/useAppLanguage'

type ModalTab = 'story' | 'about'

type FillerCategoryTone = 'red' | 'amber' | 'orange' | 'purple' | 'blue'

interface StoryHighlight {
  num: string
  text: string
}

interface StoryFillerCategory {
  label: string
  words: string[]
  tone: FillerCategoryTone
}

interface AboutCard {
  id: string
  emoji: string
  title: string
  body: string
}

interface Props {
  isOpen: boolean
  onClose: () => void
}

const FILLER_CATEGORY_TONES: Record<FillerCategoryTone, string> = {
  red: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
  amber: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  orange: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
  purple: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
  blue: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
}

const TECH_STACK = [
  { label: 'React 19', tone: 'blue' as const },
  { label: 'TypeScript', tone: 'blue' as const },
  { label: 'Vite', tone: 'amber' as const },
  { label: 'Zustand', tone: 'green' as const },
  { label: 'Framer Motion', tone: 'purple' as const },
  { label: 'Recharts', tone: 'orange' as const },
]

export function DesignStoryModal({ isOpen, onClose }: Props) {
  const { t } = useTranslation(['design', 'common'])
  const { currentLanguage, setLanguage } = useAppLanguage()
  const [activeTab, setActiveTab] = useState<ModalTab>('story')
  const nextLanguage = currentLanguage === 'zh-TW' ? 'en' : 'zh-TW'
  const nextLanguageLabel = nextLanguage === 'zh-TW'
    ? t('common:languageToggle.switchToZh')
    : t('common:languageToggle.switchToEn')
  const currentLanguageLabel = currentLanguage === 'zh-TW'
    ? t('common:languageToggle.zh')
    : t('common:languageToggle.en')

  const highlights = useMemo(() => {
    const value = t('design:story.highlights', { returnObjects: true })
    return Array.isArray(value) ? (value as StoryHighlight[]) : []
  }, [t])
  const fillerCategories = useMemo(() => {
    const value = t('design:story.fillerCategories', { returnObjects: true })
    return Array.isArray(value) ? (value as StoryFillerCategory[]) : []
  }, [t])
  const whyJoinParagraphs = useMemo(() => {
    const value = t('design:story.whyJoinParagraphs', { returnObjects: true })
    return Array.isArray(value) ? (value as string[]) : []
  }, [t])
  const aboutCards = useMemo(() => {
    const value = t('design:about.cards', { returnObjects: true })
    return Array.isArray(value) ? (value as AboutCard[]) : []
  }, [t])
  const techDetails = useMemo(() => {
    const value = t('design:about.techDetails', { returnObjects: true })
    return Array.isArray(value) ? (value as string[]) : []
  }, [t])

  const handleClose = useCallback(() => {
    setActiveTab('story')
    onClose()
  }, [onClose])

  useEffect(() => {
    if (!isOpen) return
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') handleClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [handleClose, isOpen])

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="safe-modal-shell fixed inset-0 z-50 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={handleClose}
        >
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

          <motion.div
            className="safe-modal-panel relative flex w-full max-w-4xl flex-col overflow-hidden rounded-[2rem] border border-divider bg-bg-base shadow-2xl sm:rounded-3xl"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.22 }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="grid flex-shrink-0 grid-cols-1 items-start gap-4 border-b border-divider px-5 pt-5 pb-4 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:px-8 sm:pt-6">
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-1 h-3.5 rounded-full bg-accent-purple" />
                  <span className="text-xs font-semibold text-accent-purple tracking-widest uppercase">
                    {t(`design:eyebrow.${activeTab}`)}
                  </span>
                </div>
                <h2 className="text-[2rem] font-bold leading-[1.08] text-text-primary sm:text-xl sm:leading-tight">
                  {t(`design:title.${activeTab}`)}
                </h2>
                <p className="mt-1 max-w-[28rem] text-sm leading-relaxed text-text-secondary sm:mt-0.5">
                  {t(`design:subtitle.${activeTab}`)}
                </p>
              </div>
              <div className="justify-self-start pt-0 sm:pt-1">
                <div className="flex items-center gap-1 rounded-2xl border border-divider bg-bg-surface p-1">
                  <button
                    onClick={() => setActiveTab('story')}
                    className={`rounded-xl px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-all ${
                      activeTab === 'story'
                        ? 'bg-accent-purple/12 text-accent-purple'
                        : 'text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    {t('design:tabs.story')}
                  </button>
                  <button
                    onClick={() => setActiveTab('about')}
                    className={`rounded-xl px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-all ${
                      activeTab === 'about'
                        ? 'bg-accent-blue/12 text-accent-blue-light'
                        : 'text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    {t('design:tabs.about')}
                  </button>
                </div>
              </div>
              <div className="mt-0 flex items-center justify-between gap-2 sm:mt-1 sm:justify-self-end">
                <button
                  onClick={() => setLanguage(nextLanguage)}
                  className="inline-flex min-w-0 items-center gap-2 rounded-full border border-divider bg-bg-surface px-3 py-1.5 text-xs font-medium text-text-secondary transition-all hover:border-accent-blue/30 hover:bg-accent-blue/10 hover:text-text-primary"
                  title={nextLanguageLabel}
                  aria-label={nextLanguageLabel}
                >
                  <LanguageIcon />
                  <span className="whitespace-nowrap">{t('common:languageToggle.label')}</span>
                  <span className="rounded-full bg-bg-card px-1.5 py-0.5 text-[10px] font-semibold text-text-primary">
                    {currentLanguageLabel}
                  </span>
                </button>
                <button
                  onClick={handleClose}
                  className="w-8 h-8 rounded-full border border-divider text-text-muted hover:text-text-primary hover:border-text-secondary transition-all flex items-center justify-center flex-shrink-0"
                  aria-label={t('common:actions.close')}
                >
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="phone-scroll flex-1 overflow-y-auto p-4 sm:p-6">
              {activeTab === 'story' ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  <div className="bg-bg-surface rounded-2xl border border-divider overflow-hidden flex flex-col">
                    <div className="px-5 pt-5 pb-3 border-b border-divider flex items-center gap-2">
                      <span className="text-base">💡</span>
                      <h3 className="text-sm font-bold text-text-primary">{t('design:story.ideaTitle')}</h3>
                    </div>
                    <div className="px-5 py-4 flex flex-col gap-5">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-accent-red flex-shrink-0" />
                          <p className="text-xs font-bold text-text-secondary tracking-wide">{t('design:story.problemLabel')}</p>
                        </div>
                        <p className="text-sm text-text-secondary leading-relaxed">
                          {t('design:story.problemBody')}
                        </p>
                      </div>

                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-accent-green flex-shrink-0" />
                          <p className="text-xs font-bold text-text-secondary tracking-wide">{t('design:story.solutionLabel')}</p>
                        </div>
                        <p className="text-sm text-text-secondary leading-relaxed">
                          {t('design:story.solutionBody')}
                        </p>
                      </div>

                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-accent-purple flex-shrink-0" />
                          <p className="text-xs font-bold text-text-secondary tracking-wide">{t('design:story.highlightsLabel')}</p>
                        </div>
                        <div className="flex flex-col gap-2">
                          {highlights.map(({ num, text }) => (
                            <div key={num} className="flex items-start gap-2.5">
                              <span className="text-[10px] font-bold text-accent-blue-light bg-accent-blue/10 rounded px-1.5 py-0.5 flex-shrink-0 mt-0.5 tabular-nums">
                                {num}
                              </span>
                              <p className="text-sm text-text-secondary leading-relaxed">{text}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-accent-amber flex-shrink-0" />
                          <p className="text-xs font-bold text-text-secondary tracking-wide">{t('design:story.fillerCategoriesLabel')}</p>
                        </div>
                        <div className="flex flex-col gap-2">
                          {fillerCategories.map(({ label, words, tone }) => (
                            <div key={label} className="flex items-start gap-2 flex-wrap">
                              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md flex-shrink-0 ${FILLER_CATEGORY_TONES[tone]}`}>
                                {label}
                              </span>
                              <span className="text-xs text-text-muted leading-5">{words.join('　')}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-bg-surface rounded-2xl border border-divider overflow-hidden flex flex-col">
                    <div className="px-5 pt-5 pb-3 border-b border-divider flex items-center gap-2">
                      <span className="text-base">🙋</span>
                      <h3 className="text-sm font-bold text-text-primary">{t('design:story.whyJoinTitle')}</h3>
                    </div>
                    <div className="px-5 py-4 flex flex-col gap-4">
                      <div className="rounded-xl bg-accent-blue/8 border border-accent-blue/20 px-4 py-3">
                        <p className="text-sm text-text-primary leading-relaxed font-medium">
                          {t('design:story.whyJoinLead')}
                        </p>
                      </div>
                      {whyJoinParagraphs.map((paragraph) => (
                        <p key={paragraph} className="text-sm text-text-secondary leading-relaxed">
                          {paragraph}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] gap-5">
                  <div className="flex flex-col gap-5">
                    {aboutCards.map((card) => (
                      <div
                        key={card.id}
                        className="bg-bg-surface rounded-2xl border border-divider px-5 py-4"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-base">{card.emoji}</span>
                          <h3 className="text-sm font-bold text-text-primary">{card.title}</h3>
                        </div>
                        <p className="mt-3 text-sm leading-relaxed text-text-secondary">
                          {card.body}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="bg-bg-surface rounded-2xl border border-divider overflow-hidden flex flex-col">
                    <div className="px-5 pt-5 pb-3 border-b border-divider flex items-center gap-2">
                      <span className="text-base">🛠️</span>
                      <h3 className="text-sm font-bold text-text-primary">{t('design:about.techTitle')}</h3>
                    </div>
                    <div className="px-5 py-4">
                      <div className="grid grid-cols-2 gap-2 mb-4">
                        {TECH_STACK.map((item) => (
                          <MetaPill key={item.label} label={item.label} tone={item.tone} />
                        ))}
                      </div>

                      <div className="space-y-2.5">
                        {techDetails.map((detail, index) => (
                          <div key={detail} className="flex items-start gap-2.5">
                            <span className="mt-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent-blue/10 text-[10px] font-bold text-accent-blue-light">
                              {index + 1}
                            </span>
                            <p className="text-sm leading-relaxed text-text-secondary">
                              {detail}
                            </p>
                          </div>
                        ))}
                      </div>

                      <div className="mt-5 rounded-2xl border border-accent-blue/15 bg-accent-blue/6 px-4 py-3">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-accent-blue-light">
                          {t('design:about.showcaseEyebrow')}
                        </p>
                        <p className="mt-2 text-sm leading-relaxed text-text-secondary">
                          {t('design:about.showcaseBody')}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-shrink-0 flex-col gap-2 border-t border-divider px-5 py-3 text-center sm:flex-row sm:items-center sm:justify-between sm:px-8 sm:text-left">
              <p className="text-[11px] text-text-muted">
                {t('common:appName')} · {t(`design:footer.${activeTab}`)}
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-end">
                <div className="hidden h-3 w-px bg-divider sm:block" />
                <span className="text-xs font-medium text-text-secondary">{t('design:footer.authorZh')}</span>
                <span className="text-[11px] text-text-muted tracking-wide">{t('design:footer.authorEn')}</span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function LanguageIcon() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 5h8" />
      <path d="M8 3v2c0 4.4-2 8.1-5 10" strokeLinecap="round" />
      <path d="M6 11c1.2 1.5 2.6 2.9 4.2 4" strokeLinecap="round" />
      <path d="M14 19l4.2-10.5L22.5 19" />
      <path d="M15.6 15h5.2" strokeLinecap="round" />
    </svg>
  )
}

function MetaPill({
  label,
  tone,
}: {
  label: string
  tone: 'blue' | 'green' | 'amber' | 'purple' | 'orange'
}) {
  const classes = {
    blue: 'bg-accent-blue/10 text-accent-blue-light',
    green: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300',
    amber: 'bg-accent-amber/12 text-accent-amber',
    purple: 'bg-accent-purple/12 text-accent-purple',
    orange: 'bg-orange-500/10 text-orange-600 dark:text-orange-300',
  } as const

  return (
    <div className={`rounded-xl px-3 py-2 text-center text-xs font-semibold ${classes[tone]}`}>
      {label}
    </div>
  )
}
