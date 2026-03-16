import type { AnnotationItem } from '../types'

export const settingsAnnotations: AnnotationItem[] = [
  {
    id: 'settings-detection-toggles',
    targetId: 'settings-detection-toggles',
    title: '偵測功能開關',
    description: '分別控制：贅字偵測、語速監控、重複連接詞標記。關閉後該功能在練習中不作用，但歷史紀錄保留。',
    type: 'feature',
  },
  {
    id: 'filler-chip-editor',
    targetId: 'filler-chip-editor',
    title: '贅字清單',
    description: '分為「預設清單」與「自訂清單」兩區塊。點擊 chip 切換啟用/停用；點擊 × 刪除；「↺ 還原預設」只補回被刪除的預設詞，不影響自訂清單。',
    type: 'feature',
  },
  {
    id: 'speed-range-slider',
    targetId: 'speed-range-slider',
    title: '語速範圍調整',
    description: '雙滑桿調整「偏慢」與「偏快」門檻（預設 120–180 字/分）。調整後立即反映在練習畫面的語速儀表板與報告的語速曲線。',
    type: 'feature',
  },
  {
    id: 'settings-feedback',
    targetId: 'settings-feedback',
    title: '回饋方式',
    description: '觸覺震動或音效提示，於偵測到贅字時給予即時反饋。兩者可依個人偏好擇一開啟。',
    type: 'design',
  },
  {
    id: 'settings-language',
    targetId: 'settings-language',
    title: '辨識語言',
    description: '串接 Apple Intelligence 的語音辨識框架，支援繁體中文、粵語、英文等多語言。辨識在裝置本機執行，音訊不上傳雲端，符合隱私設計原則。',
    type: 'feature',
  },
  {
    id: 'settings-microphone',
    targetId: 'settings-microphone',
    title: '輸入裝置',
    description: '選擇語音辨識使用的麥克風裝置。連接耳機或外部麥克風時可在此切換，確保收音品質。',
    type: 'feature',
  },
]
