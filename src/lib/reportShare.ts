import i18n from '../i18n'
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
  const locale = i18n.resolvedLanguage === 'en' ? 'en-US' : 'zh-TW'
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date)
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

  return lines.length ? lines : [i18n.t('report:shareCard.fallbackBody')]
}

function buildInsight(report: SessionSummary, speedRange: SpeedRange) {
  const fastCount = report.speedHistory.filter((point) => point.wpm > speedRange.high).length
  const slowCount = report.speedHistory.filter((point) => point.wpm < speedRange.low).length
  const topWord = report.topFiller

  let title = i18n.t('report:shareCard.defaultInsightTitle')
  let body = i18n.t('report:shareCard.defaultInsightBody')

  if (topWord) {
    const topCount = report.fillerCounts[topWord] ?? 0
    title = i18n.t('report:shareCard.topFillerInsightTitle', { word: topWord })
    body = i18n.t('report:shareCard.topFillerInsightBody', { count: topCount })
  }

  if (fastCount > 0 || slowCount > 0) {
    const speedSummary = [
      fastCount > 0 ? i18n.t('report:shareCard.speedFastSegment', { count: fastCount }) : null,
      slowCount > 0 ? i18n.t('report:shareCard.speedSlowSegment', { count: slowCount }) : null,
    ].filter(Boolean).join('、')

    body = topWord
      ? i18n.t('report:shareCard.topWithSpeed', { body, summary: speedSummary })
      : i18n.t('report:shareCard.speedOnly', { summary: speedSummary })
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
    title: truncateText(report.title || i18n.t('report:shareCard.fallbackTitle'), 24),
    dateLabel: shareDate,
    durationLabel: formatDuration(report.durationSeconds),
    grade: report.grade,
    metrics: [
      { label: i18n.t('report:shareCard.metrics.avgWpm'), value: `${report.avgWpm}`, accent: '#2563eb' },
      { label: i18n.t('report:shareCard.metrics.fillerCount'), value: `${report.fillerCount}`, accent: '#ef4444' },
      { label: i18n.t('report:shareCard.metrics.topFiller'), value: truncateText(report.topFiller ?? i18n.t('report:shareCard.metrics.none'), 6), accent: '#f59e0b' },
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
    footerNote: i18n.t('report:shareCard.footer', { date: shareDate, wpm: report.avgWpm }),
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
      img.onerror = () => reject(new Error(i18n.t('report:shareCard.errors.imageLoad')))
      img.src = url
    })

    const scale = 2
    const canvas = document.createElement('canvas')
    canvas.width = REPORT_SHARE_CARD_WIDTH * scale
    canvas.height = REPORT_SHARE_CARD_HEIGHT * scale

    const context = canvas.getContext('2d')
    if (!context) {
      throw new Error(i18n.t('report:shareCard.errors.canvas'))
    }

    context.scale(scale, scale)
    context.fillStyle = '#f5f7fb'
    context.fillRect(0, 0, REPORT_SHARE_CARD_WIDTH, REPORT_SHARE_CARD_HEIGHT)
    context.drawImage(image, 0, 0, REPORT_SHARE_CARD_WIDTH, REPORT_SHARE_CARD_HEIGHT)

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((result) => {
        if (result) resolve(result)
        else reject(new Error(i18n.t('report:shareCard.errors.png')))
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
