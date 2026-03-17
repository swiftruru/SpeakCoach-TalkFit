import { AnimatePresence, motion } from 'framer-motion'
import { StatusBar } from './StatusBar'
import { TabBar } from './TabBar'
import { PhoneNotificationBanner } from './PhoneNotificationBanner'
import { useDragScroll } from '../../hooks/useDragScroll'
import type { Screen } from '../../types'

interface PhoneFrameProps {
  screen: Screen
  children: React.ReactNode
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

export function PhoneFrame({ screen, children }: PhoneFrameProps) {
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
                className="w-full h-full bg-phone-inner flex flex-col relative"
                style={{ clipPath: `inset(0 round ${outerR - ringW - 12}px)` }}
              >
                <StatusBar />
                <PhoneNotificationBanner />

                <div
                  ref={drag.wrapperRef}
                  className="flex-1 overflow-hidden relative"
                  style={{ cursor: 'none' }}
                  onMouseEnter={drag.onMouseEnter}
                  onMouseDown={drag.onMouseDown}
                  onMouseMove={drag.onMouseMove}
                  onMouseUp={drag.onMouseUp}
                  onMouseLeave={drag.onMouseLeave}
                >
                  {/* Custom touch-point cursor */}
                  {drag.cursor.visible && (
                    <div
                      className="pointer-events-none absolute z-50 rounded-full transition-[width,height,opacity] duration-100"
                      style={{
                        width: drag.cursor.pressed ? 36 : 28,
                        height: drag.cursor.pressed ? 36 : 28,
                        left: drag.cursor.x,
                        top: drag.cursor.y,
                        transform: 'translate(-50%, -50%)',
                        background: drag.cursor.pressed
                          ? 'rgba(255,255,255,0.28)'
                          : 'rgba(255,255,255,0.18)',
                        boxShadow: drag.cursor.pressed
                          ? '0 0 0 1.5px rgba(255,255,255,0.45)'
                          : '0 0 0 1px rgba(255,255,255,0.30)',
                        backdropFilter: 'blur(1px)',
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
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
