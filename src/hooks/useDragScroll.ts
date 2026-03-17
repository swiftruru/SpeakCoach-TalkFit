import { useRef, useCallback, useState } from 'react'

export function useDragScroll() {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const isDragging = useRef(false)
  const startY = useRef(0)
  const startScrollTop = useRef(0)

  const [cursor, setCursor] = useState<{ x: number; y: number; visible: boolean; pressed: boolean }>({
    x: 0, y: 0, visible: false, pressed: false,
  })

  const getScroller = () =>
    wrapperRef.current?.querySelector<HTMLElement>('.phone-scroll') ?? null

  const getRelPos = (e: React.MouseEvent) => {
    const el = wrapperRef.current
    if (!el) return { x: 0, y: 0 }
    const rect = el.getBoundingClientRect()
    // Compensate for any CSS transform scale applied to an ancestor
    const scaleX = rect.width / el.offsetWidth
    const scaleY = rect.height / el.offsetHeight
    return {
      x: (e.clientX - rect.left) / scaleX,
      y: (e.clientY - rect.top) / scaleY,
    }
  }

  const onMouseEnter = useCallback((e: React.MouseEvent) => {
    const pos = getRelPos(e)
    setCursor({ x: pos.x, y: pos.y, visible: true, pressed: false })
  }, [])

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    const pos = getRelPos(e)
    setCursor((prev) => ({ ...prev, x: pos.x, y: pos.y, visible: true }))
    if (!isDragging.current) return
    const scroller = getScroller()
    if (!scroller) return
    scroller.scrollTop = startScrollTop.current + (startY.current - e.clientY)
  }, [])

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    const scroller = getScroller()
    if (!scroller) return
    isDragging.current = true
    startY.current = e.clientY
    startScrollTop.current = scroller.scrollTop
    document.body.style.userSelect = 'none'
    setCursor((prev) => ({ ...prev, pressed: true }))
  }, [])

  const onMouseUp = useCallback(() => {
    isDragging.current = false
    document.body.style.userSelect = ''
    setCursor((prev) => ({ ...prev, pressed: false }))
  }, [])

  const onMouseLeave = useCallback(() => {
    isDragging.current = false
    document.body.style.userSelect = ''
    setCursor((prev) => ({ ...prev, visible: false, pressed: false }))
  }, [])

  return { wrapperRef, cursor, onMouseEnter, onMouseMove, onMouseDown, onMouseUp, onMouseLeave }
}
