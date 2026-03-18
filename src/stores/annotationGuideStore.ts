import { create } from 'zustand'

export type AnnotationGuideSource = 'phone' | 'annotation' | 'demo'

interface AnnotationGuideState {
  pinnedId: string | null
  source: AnnotationGuideSource | null
  pin: (id: string, source?: AnnotationGuideSource) => void
  clear: () => void
}

export const useAnnotationGuideStore = create<AnnotationGuideState>((set) => ({
  pinnedId: null,
  source: null,
  pin: (id, source = 'phone') => set({ pinnedId: id, source }),
  clear: () => set({ pinnedId: null, source: null }),
}))
