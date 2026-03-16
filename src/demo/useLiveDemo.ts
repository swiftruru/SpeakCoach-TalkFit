import { useEffect, useRef } from 'react'
import { useDemoStore } from './demoStore'
import { DEMO_STEPS } from './demoScript'

export function useLiveDemo() {
  const isDemoActive = useDemoStore((s) => s.isDemoActive)
  const currentStepIndex = useDemoStore((s) => s.currentStepIndex)
  const goToStep = useDemoStore((s) => s.goToStep)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!isDemoActive) return

    const step = DEMO_STEPS[currentStepIndex]
    if (!step) return

    // Execute this step's side effects
    step.onEnter()

    // Schedule advance to next step (skip if infinite or last step)
    if (step.durationMs !== Infinity && currentStepIndex < DEMO_STEPS.length - 1) {
      timeoutRef.current = setTimeout(() => {
        goToStep(currentStepIndex + 1)
      }, step.durationMs)
    }

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [isDemoActive, currentStepIndex]) // eslint-disable-line react-hooks/exhaustive-deps
}
