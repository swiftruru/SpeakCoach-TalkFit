import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

export interface CommandPaletteAction {
  id: string
  title: string
  description: string
  section: string
  shortcut?: string
  keywords?: string[]
  onSelect: () => void
}

interface CommandPaletteModalProps {
  isOpen: boolean
  actions: CommandPaletteAction[]
  onClose: () => void
}

interface CommandPaletteGroup {
  section: string
  items: CommandPaletteAction[]
}

export function CommandPaletteModal({
  isOpen,
  actions,
  onClose,
}: CommandPaletteModalProps) {
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement | null>(null)

  const filteredActions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    if (!normalizedQuery) return actions

    return actions.filter((action) => {
      const haystack = [
        action.title,
        action.description,
        action.section,
        ...(action.keywords ?? []),
      ]
        .join(' ')
        .toLowerCase()

      return haystack.includes(normalizedQuery)
    })
  }, [actions, query])

  const groupedActions = useMemo<CommandPaletteGroup[]>(() => {
    return filteredActions.reduce<CommandPaletteGroup[]>((groups, action) => {
      const existingGroup = groups.find((group) => group.section === action.section)
      if (existingGroup) {
        existingGroup.items.push(action)
        return groups
      }

      groups.push({
        section: action.section,
        items: [action],
      })
      return groups
    }, [])
  }, [filteredActions])
  const resolvedActiveIndex = Math.min(activeIndex, Math.max(0, filteredActions.length - 1))

  useEffect(() => {
    if (!isOpen) return

    const frame = window.requestAnimationFrame(() => {
      inputRef.current?.focus()
      inputRef.current?.select()
    })

    return () => window.cancelAnimationFrame(frame)
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
        return
      }

      if (filteredActions.length === 0) return

      if (event.key === 'ArrowDown') {
        event.preventDefault()
        setActiveIndex((current) => (current + 1) % filteredActions.length)
        return
      }

      if (event.key === 'ArrowUp') {
        event.preventDefault()
        setActiveIndex((current) => (current - 1 + filteredActions.length) % filteredActions.length)
        return
      }

      if (event.key === 'Enter') {
        event.preventDefault()
        filteredActions[resolvedActiveIndex]?.onSelect()
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [filteredActions, isOpen, onClose, resolvedActiveIndex])

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-start justify-center px-4 py-16 md:px-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onClick={onClose}
        >
          <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" />

          <motion.div
            className="relative w-full max-w-3xl overflow-hidden rounded-[28px] border border-divider bg-bg-base shadow-2xl"
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="border-b border-divider px-6 py-5 md:px-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="mb-1 flex items-center gap-2">
                    <div className="h-3.5 w-1 rounded-full bg-accent-blue" />
                    <span className="text-xs font-semibold uppercase tracking-[0.2em] text-accent-blue-light">
                      Quick Actions
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-text-primary">快速操作</h2>
                  <p className="mt-1 text-sm text-text-secondary">
                    用關鍵字快速跳頁、切換展示狀態或執行常用操作。
                  </p>
                </div>

                <div className="flex items-center gap-2 text-xs text-text-muted">
                  <kbd className="rounded-lg border border-divider bg-bg-card px-2 py-1 font-semibold shadow-sm">
                    ⌘K
                  </kbd>
                  <span className="hidden md:inline">或 Ctrl+K</span>
                </div>
              </div>

              <div className="mt-4">
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(event) => {
                    setQuery(event.target.value)
                    setActiveIndex(0)
                  }}
                  placeholder="搜尋畫面、示範、全螢幕、輸出畫面..."
                  className="w-full rounded-2xl border border-divider bg-bg-surface px-4 py-3 text-sm text-text-primary outline-none transition-all placeholder:text-text-muted focus:border-accent-blue/40 focus:ring-4 focus:ring-accent-blue/10"
                />
              </div>
            </div>

            <div className="max-h-[68vh] overflow-y-auto px-4 py-4 md:px-6">
              {groupedActions.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-divider bg-bg-surface px-5 py-10 text-center">
                  <p className="text-sm font-medium text-text-primary">找不到符合的操作</p>
                  <p className="mt-1 text-sm text-text-secondary">
                    可以試試看搜尋「報告」、「示範」、「全螢幕」或「設定」。
                  </p>
                </div>
              ) : (
                <div className="space-y-5">
                  {groupedActions.map((group) => (
                    <div key={group.section}>
                      <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-text-muted">
                        {group.section}
                      </p>
                      <div className="space-y-1.5">
                        {group.items.map((action) => {
                          const flatIndex = filteredActions.findIndex((item) => item.id === action.id)
                          const isActive = flatIndex === resolvedActiveIndex

                          return (
                            <button
                              key={action.id}
                              onClick={() => {
                                action.onSelect()
                                onClose()
                              }}
                              onMouseEnter={() => setActiveIndex(flatIndex)}
                              className={`flex w-full items-start justify-between gap-4 rounded-2xl border px-4 py-3 text-left transition-all ${
                                isActive
                                  ? 'border-accent-blue/25 bg-accent-blue/10 shadow-[0_10px_24px_rgba(59,130,246,0.10)]'
                                  : 'border-transparent bg-bg-surface hover:border-divider hover:bg-bg-card'
                              }`}
                            >
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-text-primary">{action.title}</p>
                                <p className="mt-1 text-sm leading-relaxed text-text-secondary">
                                  {action.description}
                                </p>
                              </div>

                              {action.shortcut ? (
                                <kbd className="mt-0.5 flex-shrink-0 rounded-lg border border-divider bg-bg-card px-2 py-1 text-[11px] font-semibold text-text-secondary shadow-sm">
                                  {action.shortcut}
                                </kbd>
                              ) : null}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
