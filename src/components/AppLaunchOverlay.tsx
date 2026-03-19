import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'

interface AppLaunchOverlayProps {
  onComplete: () => void
}

const LAUNCH_DURATION_MS = 1500

export function AppLaunchOverlay({ onComplete }: AppLaunchOverlayProps) {
  const { t } = useTranslation(['common', 'launch'])

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const timer = window.setTimeout(() => {
      onComplete()
    }, LAUNCH_DURATION_MS)

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onComplete()
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.clearTimeout(timer)
      window.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [onComplete])

  return (
    <motion.div
      className="fixed inset-0 z-[120] overflow-hidden"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.28, ease: 'easeOut' } }}
      style={{
        background: `
          radial-gradient(circle at 18% 18%, rgba(59,130,246,0.16), transparent 34%),
          radial-gradient(circle at 82% 20%, rgba(244,114,182,0.15), transparent 30%),
          linear-gradient(180deg, rgba(250,250,252,0.98) 0%, rgba(241,245,249,0.98) 100%)
        `,
      }}
    >
      <button
        onClick={onComplete}
        className="absolute top-5 right-5 z-10 rounded-full border border-gray-300/75 bg-white/80 px-3 py-1.5 text-xs font-medium text-gray-600 shadow-sm backdrop-blur hover:bg-white"
      >
        {t('common:actions.skip')}
      </button>

      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.82, y: 18, rotate: -4 }}
          animate={{ opacity: 1, scale: 1, y: 0, rotate: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="rounded-[30px] bg-white/80 p-3 shadow-[0_18px_60px_rgba(15,23,42,0.16)] backdrop-blur"
        >
          <img
            src="/app-icon.png"
            alt="TalkFit"
            className="h-24 w-24 rounded-[24px] object-cover"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.36, duration: 0.45, ease: 'easeOut' }}
          className="mt-7"
        >
          <p className="text-[11px] uppercase tracking-[0.28em] text-gray-400">
            {t('launch:eyebrow')}
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-[-0.03em] text-gray-900">
            {t('common:appName')}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-gray-500">
            {t('launch:subtitle')}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.4, ease: 'easeOut' }}
          className="mt-12 flex items-center gap-2 text-[11px] text-gray-400"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-gray-300" />
          <span>{t('launch:opening')}</span>
        </motion.div>
      </div>
    </motion.div>
  )
}
