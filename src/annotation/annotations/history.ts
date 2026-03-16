import type { AnnotationItem } from '../types'

export const historyAnnotations: AnnotationItem[] = [
  {
    id: 'history-summary-cards',
    targetId: 'history-summary-cards',
    title: '整體統計卡片',
    description: '累計練習次數、總練習時長、最常出現的贅字，讓使用者一眼掌握整體訓練進度。',
    type: 'feature',
  },
  {
    id: 'history-trend-chart',
    targetId: 'history-trend-chart',
    title: '贅字趨勢圖',
    description: '折線圖呈現每次練習的贅字次數變化，讓長期進步趨勢一目了然。',
    type: 'feature',
  },
  {
    id: 'history-list',
    targetId: 'history-list',
    title: '練習紀錄列表',
    description: '每筆紀錄顯示標題、日期、贅字次數（顏色依多寡自動變色）、語速、時長、流暢度評分。點擊可查看完整報告。',
    type: 'feature',
  },
]
