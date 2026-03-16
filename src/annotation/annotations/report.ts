import type { AnnotationItem } from '../types'

export const reportAnnotations: AnnotationItem[] = [
  {
    id: 'report-score-section',
    targetId: 'report-score-section',
    title: '三項評分卡片',
    description: '本次練習的三個核心指標：平均語速（字／分）、贅字總數、流暢度評分（A+ ～ D）。綜合贅字頻率與語速表現自動評分。',
    type: 'feature',
  },
  {
    id: 'filler-ranking',
    targetId: 'filler-ranking',
    title: '贅字排行榜',
    description: '依出現次數排序所有贅字，橫向長度按比例縮放。前三名以警示色標記，幫助使用者識別最需改進的詞彙。',
    type: 'feature',
  },
  {
    id: 'speed-curve-chart',
    targetId: 'speed-curve-chart',
    title: '語速曲線',
    description: '折線圖呈現整場練習的語速變化。帶狀區域標示建議範圍（預設 120–180 字／分，可在設定調整），超速時以紅點標記。',
    type: 'feature',
  },
  {
    id: 'annotated-transcript',
    targetId: 'annotated-transcript',
    title: '逐字稿標記',
    description: '完整逐字稿，贅字以紅色背景高亮，語速過快的片段加橘色底線，方便事後覆盤確認問題所在。',
    type: 'feature',
  },
  {
    id: 'report-share-row',
    targetId: 'report-share-row',
    title: '分享 / 匯出',
    description: '匯出練習紀錄，或複製摘要文字，方便貼到筆記或傳給教練進行回饋。',
    type: 'feature',
  },
]
