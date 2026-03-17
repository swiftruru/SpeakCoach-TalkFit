import { formatDuration } from './speechAnalysis'
import type { SessionSummary, SpeedDataPoint, SpeedRange } from '../types'

export const REPORT_SHARE_CARD_WIDTH = 1080
export const REPORT_SHARE_CARD_HEIGHT = 1350

const CHART = {
  x: 26,
  y: 110,
  width: 394,
  height: 248,
}

export interface ReportShareMetric {
  label: string
  value: string
  accent: string
}

export interface ReportShareTopFiller {
  word: string
  count: number
  ratio: number
  accent: string
}

export interface ReportShareChartPoint {
  x: number
  y: number
  kind: 'normal' | 'fast' | 'slow'
}

export interface ReportShareCardData {
  title: string
  dateLabel: string
  durationLabel: string
  grade: string
  metrics: ReportShareMetric[]
  topFillers: ReportShareTopFiller[]
  insightTitle: string
  insightLines: string[]
  chartPath: string
  chartPoints: ReportShareChartPoint[]
  rangeBandY: number
  rangeBandHeight: number
  chartMinLabel: string
  chartMaxLabel: string
  chartStartLabel: string
  chartEndLabel: string
  footerNote: string
}

function formatShareDate(isoString: string) {
  const date = new Date(isoString)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${year}/${month}/${day} ${hours}:${minutes}`
}

function truncateText(text: string, maxChars: number) {
  if (text.length <= maxChars) return text
  return `${text.slice(0, Math.max(0, maxChars - 1)).trimEnd()}…`
}

function wrapText(text: string, maxCharsPerLine: number, maxLines: number) {
  const lines: string[] = []
  let cursor = 0

  while (cursor < text.length && lines.length < maxLines) {
    const next = text.slice(cursor, cursor + maxCharsPerLine)
    cursor += maxCharsPerLine

    if (lines.length === maxLines - 1 && cursor < text.length) {
      lines.push(truncateText(next + text.slice(cursor), maxCharsPerLine))
      return lines
    }

    lines.push(next)
  }

  return lines.length ? lines : ['持續練習，讓表達更穩定。']
}

function buildInsight(report: SessionSummary, speedRange: SpeedRange) {
  const fastCount = report.speedHistory.filter((point) => point.wpm > speedRange.high).length
  const slowCount = report.speedHistory.filter((point) => point.wpm < speedRange.low).length
  const topWord = report.topFiller

  let title = '維持目前的表達節奏'
  let body = '這次沒有明顯的贅字高峰，繼續把節奏穩定下來。'

  if (topWord) {
    const topCount = report.fillerCounts[topWord] ?? 0
    title = `先把「${topWord}」降下來`
    body = `這次共出現 ${topCount} 次，建議先修正這個最常出現的口頭禪。`
  }

  if (fastCount > 0 || slowCount > 0) {
    const speedSummary = [
      fastCount > 0 ? `偏快 ${fastCount} 段` : null,
      slowCount > 0 ? `偏慢 ${slowCount} 段` : null,
    ].filter(Boolean).join('、')

    body = topWord
      ? `${body} 語速方面有 ${speedSummary}，可優先重錄節奏最不穩的一段。`
      : `語速方面有 ${speedSummary}，建議先修正節奏波動最明顯的位置。`
  }

  return {
    title: truncateText(title, 18),
    lines: wrapText(body, 26, 2),
  }
}

function buildTopFillers(report: SessionSummary): ReportShareTopFiller[] {
  const fillers = Object.entries(report.fillerCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)

  const maxCount = fillers[0]?.[1] ?? 1
  const accents = ['#ef4444', '#f59e0b', '#10b981']

  return fillers.map(([word, count], index) => ({
    word,
    count,
    ratio: count / maxCount,
    accent: accents[index] ?? '#3b82f6',
  }))
}

function buildChart(history: SpeedDataPoint[], speedRange: SpeedRange) {
  const safeHistory = history.length > 0
    ? history
    : [
      { time: 0, wpm: speedRange.low },
      { time: 1, wpm: speedRange.high },
    ]

  const minWpm = Math.min(speedRange.low, ...safeHistory.map((point) => point.wpm))
  const maxWpm = Math.max(speedRange.high, ...safeHistory.map((point) => point.wpm))
  const paddedMin = Math.max(60, Math.floor((minWpm - 12) / 10) * 10)
  const paddedMax = Math.ceil((maxWpm + 12) / 10) * 10
  const lastTime = safeHistory[safeHistory.length - 1]?.time ?? 0
  const timeSpan = Math.max(lastTime, 1)
  const wpmSpan = Math.max(paddedMax - paddedMin, 1)

  const toX = (time: number) => CHART.x + (time / timeSpan) * CHART.width
  const toY = (wpm: number) => CHART.y + CHART.height - ((wpm - paddedMin) / wpmSpan) * CHART.height

  const points: ReportShareChartPoint[] = safeHistory.map((point) => ({
    x: toX(point.time),
    y: toY(point.wpm),
    kind: point.wpm > speedRange.high ? 'fast' : point.wpm < speedRange.low ? 'slow' : 'normal',
  }))

  const path = points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x.toFixed(1)} ${point.y.toFixed(1)}`).join(' ')
  const rangeTop = toY(speedRange.high)
  const rangeBottom = toY(speedRange.low)

  return {
    path,
    points,
    rangeBandY: Math.min(rangeTop, rangeBottom),
    rangeBandHeight: Math.abs(rangeBottom - rangeTop),
    minLabel: `${paddedMin}`,
    maxLabel: `${paddedMax}`,
    startLabel: formatDuration(safeHistory[0]?.time ?? 0),
    endLabel: formatDuration(lastTime),
  }
}

export function buildReportShareCardData(report: SessionSummary, speedRange: SpeedRange): ReportShareCardData {
  const insight = buildInsight(report, speedRange)
  const chart = buildChart(report.speedHistory, speedRange)
  const shareDate = formatShareDate(report.date)

  return {
    title: truncateText(report.title || '演講練習報告', 24),
    dateLabel: shareDate,
    durationLabel: formatDuration(report.durationSeconds),
    grade: report.grade,
    metrics: [
      { label: '平均語速', value: `${report.avgWpm}`, accent: '#2563eb' },
      { label: '贅字總數', value: `${report.fillerCount}`, accent: '#ef4444' },
      { label: '最常贅字', value: truncateText(report.topFiller ?? '無', 6), accent: '#f59e0b' },
    ],
    topFillers: buildTopFillers(report),
    insightTitle: insight.title,
    insightLines: insight.lines,
    chartPath: chart.path,
    chartPoints: chart.points,
    rangeBandY: chart.rangeBandY,
    rangeBandHeight: chart.rangeBandHeight,
    chartMinLabel: chart.minLabel,
    chartMaxLabel: chart.maxLabel,
    chartStartLabel: chart.startLabel,
    chartEndLabel: chart.endLabel,
    footerNote: `talkfit.swift.moe · ${shareDate} · ${report.avgWpm} 字/分`,
  }
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function serializeSvg(svg: SVGSVGElement) {
  const clone = svg.cloneNode(true) as SVGSVGElement
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
  clone.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink')

  if (!clone.getAttribute('viewBox')) {
    clone.setAttribute('viewBox', `0 0 ${REPORT_SHARE_CARD_WIDTH} ${REPORT_SHARE_CARD_HEIGHT}`)
  }
  if (!clone.getAttribute('width')) {
    clone.setAttribute('width', `${REPORT_SHARE_CARD_WIDTH}`)
  }
  if (!clone.getAttribute('height')) {
    clone.setAttribute('height', `${REPORT_SHARE_CARD_HEIGHT}`)
  }

  return `<?xml version="1.0" encoding="UTF-8"?>\n${new XMLSerializer().serializeToString(clone)}`
}

export function exportReportShareSvg(svg: SVGSVGElement, filename: string) {
  const markup = serializeSvg(svg)
  const blob = new Blob([markup], { type: 'image/svg+xml;charset=utf-8' })
  downloadBlob(blob, filename)
}

export async function exportReportSharePng(svg: SVGSVGElement, filename: string) {
  const markup = serializeSvg(svg)
  const svgBlob = new Blob([markup], { type: 'image/svg+xml;charset=utf-8' })
  const url = URL.createObjectURL(svgBlob)

  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = () => reject(new Error('分享卡圖像載入失敗'))
      img.src = url
    })

    const scale = 2
    const canvas = document.createElement('canvas')
    canvas.width = REPORT_SHARE_CARD_WIDTH * scale
    canvas.height = REPORT_SHARE_CARD_HEIGHT * scale

    const context = canvas.getContext('2d')
    if (!context) {
      throw new Error('無法建立分享卡畫布')
    }

    context.scale(scale, scale)
    context.fillStyle = '#f5f7fb'
    context.fillRect(0, 0, REPORT_SHARE_CARD_WIDTH, REPORT_SHARE_CARD_HEIGHT)
    context.drawImage(image, 0, 0, REPORT_SHARE_CARD_WIDTH, REPORT_SHARE_CARD_HEIGHT)

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((result) => {
        if (result) resolve(result)
        else reject(new Error('PNG 匯出失敗'))
      }, 'image/png')
    })

    downloadBlob(blob, filename)
  } finally {
    URL.revokeObjectURL(url)
  }
}

export function buildReportShareFilename(report: SessionSummary) {
  return `talkfit-${report.id}-share`
}
