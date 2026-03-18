import { useEffect, useRef } from 'react'
import { useDemoStore } from './demoStore'
import { getDemoSteps } from './demoScript'

export function useLiveDemo() {
  const mode = useDemoStore((s) => s.mode)
  const isDemoActive = useDemoStore((s) => s.isDemoActive)
  const isDemoPaused = useDemoStore((s) => s.isDemoPaused)
  const currentStepIndex = useDemoStore((s) => s.currentStepIndex)
  const playbackRate = useDemoStore((s) => s.playbackRate)
  const goToStep = useDemoStore((s) => s.goToStep)
  const stopDemo = useDemoStore((s) => s.stopDemo)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!isDemoActive) return

    const steps = getDemoSteps(mode)
    const step = steps[currentStepIndex]
    if (!step) return

    step.onEnter()

    return () => {
      step.onExit?.()
    }
  }, [mode, isDemoActive, currentStepIndex])

  useEffect(() => {
    if (!isDemoActive || isDemoPaused) return

    const steps = getDemoSteps(mode)
    const step = steps[currentStepIndex]
    if (!step || step.durationMs === Infinity) return

    const durationMs = step.durationMs / playbackRate
    if (currentStepIndex < steps.length - 1) {
      timeoutRef.current = setTimeout(() => {
        goToStep(currentStepIndex + 1)
      }, durationMs)
    } else {
      timeoutRef.current = setTimeout(() => {
        stopDemo()
      }, durationMs)
    }

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [mode, isDemoActive, isDemoPaused, currentStepIndex, playbackRate, goToStep, stopDemo])
}
