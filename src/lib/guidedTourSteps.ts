export type GuidedTourPlacement = 'bottom' | 'right' | 'left'

export interface GuidedTourStep {
  id: string
  target: string
  titleKey: string
  descriptionKey: string
  placement: GuidedTourPlacement
  openMenu?: 'showcase' | 'system'
}

export const GUIDED_TOUR_STEPS: GuidedTourStep[] = [
  {
    id: 'topbar-actions',
    target: '[data-tour-target="topbar-actions"]',
    titleKey: 'guidedTour:steps.topbar.title',
    descriptionKey: 'guidedTour:steps.topbar.description',
    placement: 'bottom',
  },
  {
    id: 'showcase-tools',
    target: '[data-tour-target="topbar-showcase-menu"]',
    titleKey: 'guidedTour:steps.showcaseMenu.title',
    descriptionKey: 'guidedTour:steps.showcaseMenu.description',
    placement: 'bottom',
    openMenu: 'showcase',
  },
  {
    id: 'navigator',
    target: '[data-tour-target="prototype-navigator"]',
    titleKey: 'guidedTour:steps.navigator.title',
    descriptionKey: 'guidedTour:steps.navigator.description',
    placement: 'right',
  },
  {
    id: 'phone-stage',
    target: '[data-tour-target="phone-stage"]',
    titleKey: 'guidedTour:steps.phoneStage.title',
    descriptionKey: 'guidedTour:steps.phoneStage.description',
    placement: 'right',
  },
  {
    id: 'annotation-panel',
    target: '[data-tour-target="annotation-panel"]',
    titleKey: 'guidedTour:steps.annotationPanel.title',
    descriptionKey: 'guidedTour:steps.annotationPanel.description',
    placement: 'left',
  },
]
