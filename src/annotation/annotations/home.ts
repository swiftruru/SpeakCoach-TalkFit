import type { AnnotationItem } from '../types'

export const homeAnnotations: AnnotationItem[] = [
  {
    id: 'home-greeting',
    targetId: 'home-greeting',
    title: '個人化問候',
    description: '根據時段顯示早安／下午好，並呈現近期練習趨勢文字（持續進步中 / 久沒練習了）。',
    type: 'feature',
  },
  {
    id: 'home-stat-cards',
    targetId: 'home-stat-cards',
    title: '本週統計卡片',
    description: '三欄顯示：本週練習次數、平均贅字次數／場、與上週相比的進退步幅度。數字顏色依好壞自動變色。',
    type: 'feature',
  },
  {
    id: 'home-weekly-chart',
    targetId: 'home-weekly-chart',
    title: '每日贅字長條圖',
    description: '長條圖呈現本週每天的贅字次數，一眼看出哪天練習了、表現如何。綠色代表當天有練習，灰色代表未練習。',
    type: 'feature',
  },
  {
    id: 'home-tip-card',
    targetId: 'home-tip-card',
    title: '今日練習提示',
    description: '依據歷史紀錄動態產生建議，例如「你最常說的贅字是『然後』，今天試著意識到它」。',
    type: 'feature',
  },
  {
    id: 'home-record-btn',
    targetId: 'home-record-btn',
    title: '開始練習按鈕',
    description: '主要行動按鈕，帶有輕觸彈跳動畫，回饋感接近原生 iOS 按鈕觸覺體驗。',
    type: 'design',
  },
]
