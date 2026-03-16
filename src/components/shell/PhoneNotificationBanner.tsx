import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { usePhoneNotificationStore } from '../../stores/phoneNotificationStore'

const AUTO_DISMISS_MS = 3200

export function PhoneNotificationBanner() {
  const notification = usePhoneNotificationStore((s) => s.notification)
  const dismiss = usePhoneNotificationStore((s) => s.dismiss)

  useEffect(() => {
    if (!notification) return
    const t = setTimeout(dismiss, AUTO_DISMISS_MS)
    return () => clearTimeout(t)
  }, [notification, dismiss])

  return (
    <AnimatePresence>
      {notification && (
        <motion.div
          key={notification.title + notification.body}
          className="absolute left-3 right-3 z-50"
          style={{ top: 52 }}
          initial={{ opacity: 0, y: -12, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.96 }}
          transition={{ type: 'spring', stiffness: 420, damping: 32 }}
          onClick={dismiss}
        >
          {/* iOS-style notification card */}
          <div
            className="rounded-2xl px-3 py-2.5 flex items-start gap-2.5 cursor-pointer select-none"
            style={{
              background: 'rgba(250,250,252,0.82)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              boxShadow: '0 4px 24px rgba(0,0,0,0.18), 0 1px 4px rgba(0,0,0,0.10)',
            }}
          >
            {/* App icon */}
            <img
              src="/app-icon.png"
              alt="TalkFit"
              className="w-9 h-9 rounded-xl flex-shrink-0 object-cover"
              style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.14)' }}
            />

            <div className="flex-1 min-w-0 pt-0.5">
              <div className="flex items-baseline justify-between gap-2 mb-0.5">
                <span className="text-[11px] font-semibold text-black/70 uppercase tracking-wide truncate">
                  說來話長 TalkFit
                </span>
                <span className="text-[10px] text-black/40 flex-shrink-0">剛剛</span>
              </div>
              <p className="text-[13px] font-semibold text-black/90 leading-snug">
                {notification.title}
              </p>
              <p className="text-[12px] text-black/60 leading-snug mt-0.5">
                {notification.body}
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
