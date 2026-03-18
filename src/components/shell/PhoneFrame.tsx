import { AnimatePresence, motion } from 'framer-motion'
import { StatusBar } from './StatusBar'
import { TabBar } from './TabBar'
import { PhoneNotificationBanner } from './PhoneNotificationBanner'
import { useDragScroll } from '../../hooks/useDragScroll'
import type { Screen } from '../../types'

interface PhoneFrameProps {
  screen: Screen
  isLaunching?: boolean
  children: React.ReactNode
}

// Shared style for physical side buttons
const SIDE_BTN = {
  position: 'absolute' as const,
  width: 5,
  background: '#c4856e',
}

// Rose gold metallic gradient — warm muted pink-bronze like Apple's finish
const ROSE_GOLD = `linear-gradient(
  155deg,
  #f5ddd6 0%,
  #e8c4ba 12%,
  #d4a090 28%,
  #c4856e 45%,
  #d0a090 60%,
  #e8c4ba 78%,
  #f5ddd6 100%
)`

export function PhoneFrame({ screen, isLaunching = false, children }: PhoneFrameProps) {
  const drag = useDragScroll()
  const outerR = 48  // outer frame radius
  const ringW = 4    // rose gold ring thickness
  const innerR = outerR - ringW  // black body radius = 44

  return (
    <div className="relative flex-shrink-0">
      {/*
        Two-layer shadow trick:
        1. filter:drop-shadow on outer — follows the actual rendered shape (no rectangular corner artefact)
        2. overflow:hidden on inner — clips all children to the rounded phone outline
      */}
      <div style={{ filter: 'drop-shadow(0 20px 48px rgba(0,0,0,0.38))' }}>
        <div
          style={{
            width: 375,
            height: 812,
            borderRadius: outerR,
            overflow: 'hidden',
          }}
        >
          {/* Rose gold metallic ring */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: ROSE_GOLD,
              borderRadius: outerR,
              padding: ringW,
            }}
          >
            {/* Black phone bezel */}
            <div
              style={{
                width: '100%',
                height: '100%',
                background: '#000',
                borderRadius: innerR,
                overflow: 'hidden',
                padding: 12,
                position: 'relative',
              }}
            >
              {/* Notch */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[120px] h-[30px] bg-black rounded-b-2xl z-20" />
              {/* Home bar */}
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-[120px] h-[4px] bg-black/20 rounded-full z-20" />

              {/* Inner screen */}
              <div
                className="w-full h-full bg-phone-inner relative"
                style={{ clipPath: `inset(0 round ${outerR - ringW - 12}px)` }}
              >
                <motion.div
                  className="w-full h-full flex flex-col"
                  animate={{
                    scale: isLaunching ? 1.012 : 1,
                    opacity: isLaunching ? 0.88 : 1,
                    filter: isLaunching ? 'blur(4px)' : 'blur(0px)',
                  }}
                  transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
                >
                  <StatusBar />
                  <PhoneNotificationBanner />

                  <div
                    ref={drag.wrapperRef}
                    className="flex-1 overflow-hidden relative phone-screen-area"
                    onMouseEnter={drag.onMouseEnter}
                    onMouseDown={drag.onMouseDown}
                    onMouseMove={drag.onMouseMove}
                    onMouseUp={drag.onMouseUp}
                    onMouseLeave={drag.onMouseLeave}
                  >
                    {/* Ripples */}
                    {drag.ripples.map((r) => (
                      <div
                        key={r.id}
                        data-capture-ignore
                        className="phone-ripple pointer-events-none absolute rounded-full"
                        style={{
                          width: 80, height: 80,
                          left: r.x, top: r.y,
                          background: 'rgba(255,255,255,0.35)',
                        }}
                      />
                    ))}

                    {/* Custom touch-point cursor */}
                    {drag.cursor.visible && (
                      <div
                        data-capture-ignore
                        className="pointer-events-none absolute z-50 rounded-full transition-[width,height,opacity] duration-100"
                        style={{
                          width: drag.cursor.pressed ? 58 : 48,
                          height: drag.cursor.pressed ? 58 : 48,
                          left: drag.cursor.x,
                          top: drag.cursor.y,
                          transform: 'translate(-50%, -50%)',
                          background: drag.cursor.pressed
                            ? 'rgba(255,255,255,0.38)'
                            : 'rgba(255,255,255,0.22)',
                          border: drag.cursor.pressed
                            ? '1.5px solid rgba(255,255,255,0.9)'
                            : '1.5px solid rgba(255,255,255,0.7)',
                          boxShadow: '0 2px 16px rgba(0,0,0,0.22)',
                        }}
                      />
                    )}
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={screen}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.2, ease: 'easeInOut' }}
                        className="absolute inset-0 overflow-y-auto phone-scroll"
                      >
                        {children}
                      </motion.div>
                    </AnimatePresence>
                  </div>

                  <TabBar />
                </motion.div>

                <AnimatePresence>
                  {isLaunching && (
                    <motion.div
                      className="absolute inset-0 z-40 flex flex-col items-center justify-center"
                      initial={{ opacity: 1 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.32, ease: 'easeOut' }}
                      style={{
                        background: `
                          radial-gradient(circle at 24% 18%, rgba(59,130,246,0.14), transparent 30%),
                          radial-gradient(circle at 78% 20%, rgba(251,191,36,0.14), transparent 26%),
                          linear-gradient(180deg, #fbfbfd 0%, #f1f5f9 100%)
                        `,
                      }}
                    >
                      <motion.div
                        initial={{ scale: 0.84, opacity: 0, y: 18 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 1.08, opacity: 0 }}
                        transition={{ duration: 0.52, ease: [0.22, 1, 0.36, 1] }}
                        className="rounded-[28px] bg-white/92 p-3 shadow-[0_16px_42px_rgba(148,163,184,0.28)]"
                      >
                        <img
                          src="/app-icon.png"
                          alt="TalkFit"
                          className="h-20 w-20 rounded-[22px] object-cover"
                        />
                      </motion.div>

                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ delay: 0.14, duration: 0.35, ease: 'easeOut' }}
                        className="mt-6 text-center"
                      >
                        <p className="text-[10px] uppercase tracking-[0.24em] text-slate-400">
                          Launching
                        </p>
                        <p className="mt-2 text-lg font-semibold tracking-[-0.02em] text-slate-900">
                          說來話長 TalkFit
                        </p>
                      </motion.div>

                      <motion.div
                        className="absolute inset-x-0 bottom-2.5 flex justify-center"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 8 }}
                        transition={{ delay: 0.18, duration: 0.28, ease: 'easeOut' }}
                      >
                        <div className="h-[5px] w-[132px] rounded-full bg-slate-900/70" />
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Side buttons */}
      {/* Left: silent switch */}
      <div style={{ ...SIDE_BTN, left: -5, top: 150, height: 28, borderRadius: '3px 0 0 3px' }} />
      {/* Left: volume up */}
      <div style={{ ...SIDE_BTN, left: -5, top: 220, height: 52, borderRadius: '3px 0 0 3px' }} />
      {/* Left: volume down */}
      <div style={{ ...SIDE_BTN, left: -5, top: 292, height: 52, borderRadius: '3px 0 0 3px' }} />
      {/* Right: power */}
      <div style={{ ...SIDE_BTN, right: -5, top: 200, height: 72, borderRadius: '0 3px 3px 0' }} />
    </div>
  )
}
