import type { AnnotationItem } from '../types'

export const practiceAnnotations: AnnotationItem[] = [
  {
    id: 'retry-practice-banner',
    targetId: 'retry-practice-banner',
    title: '片段重練提示',
    description: '從報告頁指定問題片段後，這裡會顯示原始片段與重練提示，讓使用者不用重新找上下文，就能直接針對最需要修正的一小段再練一次。',
    type: 'feature',
  },
  {
    id: 'practice-badge',
    targetId: 'practice-badge',
    title: '錄音中指示燈',
    description: '紅點脈衝動畫，顯示目前錄音狀態。暫停時變為靜止灰色，停止後消失。',
    type: 'design',
  },
  {
    id: 'speed-gauge',
    targetId: 'speed-gauge',
    title: '語速儀表板',
    description: '圓弧儀表即時顯示語速（字／分鐘），依說話速度自動變色：綠色＝適中、紅色＝過快、紫色＝過慢，一眼確認說話節奏。',
    type: 'feature',
  },
  {
    id: 'live-stats',
    targetId: 'live-stats',
    title: '即時統計列',
    description: '三欄：贅字累計次數、目前最常出現的贅字、長停頓次數（超過 2 秒的靜默）。每偵測到一次贅字，對應數字會跳動一下。',
    type: 'feature',
  },
  {
    id: 'waveform',
    targetId: 'waveform',
    title: '聲波視覺化',
    description: '視覺化呈現麥克風收音狀態，說話時波形活躍，停頓時波形收斂，幫助使用者感知自己的發聲節奏。',
    type: 'design',
  },
  {
    id: 'live-transcript',
    targetId: 'live-transcript',
    title: '即時逐字稿',
    description: '語音辨識結果即時串流顯示。偵測到贅字的詞彙以紅色背景標記，語速過快的段落加底線。',
    type: 'feature',
  },
  {
    id: 'recording-controls',
    targetId: 'recording-controls',
    title: '錄音控制列',
    description: '三個按鈕：暫停／繼續、停止（結束並跳至報告）、回首頁。',
    type: 'feature',
  },
]
