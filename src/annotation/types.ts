export interface AnnotationItem {
  id: string
  targetId: string
  title: string
  description: string
  type: 'feature' | 'design' | 'tech'
}
