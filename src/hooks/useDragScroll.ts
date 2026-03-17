import { useRef, useCallback } from 'react'

/**
 * Attach to a wrapper div. On drag, finds the first overflow-y-auto
 * descendant and scrolls it — works even when the inner element re-mounts.
 */
export function useDragScroll() {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const isDragging = useRef(false)
  const startY = useRef(0)
  const startScrollTop = useRef(0)

  const getScroller = () =>
    wrapperRef.current?.querySelector<HTMLElement>('.phone-scroll') ?? null

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    const scroller = getScroller()
    if (!scroller) return
    isDragging.current = true
    startY.current = e.clientY
    startScrollTop.current = scroller.scrollTop
    document.body.style.userSelect = 'none'
  }, [])

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging.current) return
    const scroller = getScroller()
    if (!scroller) return
    scroller.scrollTop = startScrollTop.current + (startY.current - e.clientY)
  }, [])

  const stopDrag = useCallback(() => {
    isDragging.current = false
    document.body.style.userSelect = ''
  }, [])

  return {
    wrapperRef,
    onMouseDown,
    onMouseMove,
    onMouseUp: stopDrag,
    onMouseLeave: stopDrag,
  }
}
