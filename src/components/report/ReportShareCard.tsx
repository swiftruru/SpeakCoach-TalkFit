import { forwardRef } from 'react'
import { useTranslation } from 'react-i18next'
import {
  REPORT_SHARE_CARD_HEIGHT,
  REPORT_SHARE_CARD_WIDTH,
  type ReportShareCardData,
} from '../../lib/reportShare'

interface ReportShareCardProps {
  data: ReportShareCardData
  className?: string
}

const FONT_STACK = 'SF Pro Display, PingFang TC, Noto Sans TC, system-ui, sans-serif'

export const ReportShareCard = forwardRef<SVGSVGElement, ReportShareCardProps>(function ReportShareCard(
  { data, className },
  ref
) {
  const { t } = useTranslation(['report'])
  const fillerRows = data.topFillers.length > 0
    ? data.topFillers
    : [{ word: t('report:shareCard.metrics.none'), count: 0, ratio: 0.2, accent: '#cbd5e1' }]

  return (
    <svg
      ref={ref}
      viewBox={`0 0 ${REPORT_SHARE_CARD_WIDTH} ${REPORT_SHARE_CARD_HEIGHT}`}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={t('report:shareCard.ariaLabel')}
      className={className}
      preserveAspectRatio="xMidYMin meet"
    >
      <defs>
        <linearGradient id="share-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f8fbff" />
          <stop offset="55%" stopColor="#eef6ff" />
          <stop offset="100%" stopColor="#fef3f2" />
        </linearGradient>
        <linearGradient id="share-panel" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.96" />
          <stop offset="100%" stopColor="#f8fbff" stopOpacity="0.94" />
        </linearGradient>
        <linearGradient id="chart-stroke" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#2563eb" />
          <stop offset="100%" stopColor="#0ea5e9" />
        </linearGradient>
        <filter id="card-shadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="18" stdDeviation="26" floodColor="#0f172a" floodOpacity="0.10" />
        </filter>
      </defs>

      <rect width="1080" height="1350" fill="url(#share-bg)" />
      <circle cx="924" cy="140" r="178" fill="#dbeafe" fillOpacity="0.55" />
      <circle cx="152" cy="1180" r="196" fill="#fee2e2" fillOpacity="0.48" />
      <circle cx="870" cy="1236" r="92" fill="#d1fae5" fillOpacity="0.6" />

      <rect
        x="52"
        y="52"
        width="976"
        height="1246"
        rx="44"
        fill="url(#share-panel)"
        stroke="#dbe5f0"
        filter="url(#card-shadow)"
      />

      <g transform="translate(92 92)" fontFamily={FONT_STACK}>
        <g>
          <rect x="0" y="0" width="178" height="42" rx="21" fill="#dbeafe" />
          <text x="18" y="27" fontSize="18" fontWeight="700" fill="#1d4ed8">
            {t('report:shareCard.reportBadge')}
          </text>

          <text x="0" y="98" fontSize="52" fontWeight="800" fill="#0f172a">
            {data.title}
          </text>
          <text x="0" y="142" fontSize="24" fill="#64748b">
            {data.dateLabel} ・ {t('report:shareCard.duration', { value: data.durationLabel })}
          </text>

          <g transform="translate(720 4)">
            <rect x="0" y="0" width="164" height="164" rx="34" fill="#0f172a" />
            <text x="82" y="54" textAnchor="middle" fontSize="20" fontWeight="700" fill="#cbd5e1">
              {t('report:shareCard.gradeLabel')}
            </text>
            <text x="82" y="118" textAnchor="middle" fontSize="58" fontWeight="800" fill="#ffffff">
              {data.grade}
            </text>
          </g>
        </g>

        <g transform="translate(0 208)">
          {data.metrics.map((metric, index) => (
            <g key={metric.label} transform={`translate(${index * 292} 0)`}>
              <rect x="0" y="0" width="268" height="138" rx="28" fill="#ffffff" stroke="#e5edf5" />
              <circle cx="44" cy="38" r="9" fill={metric.accent} fillOpacity="0.18" />
              <text x="62" y="44" fontSize="18" fontWeight="700" fill="#64748b">
                {metric.label}
              </text>
              <text x="24" y="102" fontSize="46" fontWeight="800" fill="#0f172a">
                {metric.value}
              </text>
            </g>
          ))}
        </g>

        <g transform="translate(0 386)">
          <rect x="0" y="0" width="884" height="188" rx="30" fill="#0f172a" />
          <text x="34" y="46" fontSize="20" fontWeight="700" fill="#93c5fd">
            {t('report:shareCard.insightLabel')}
          </text>
          <text x="34" y="94" fontSize="40" fontWeight="800" fill="#ffffff">
            {data.insightTitle}
          </text>
          {data.insightLines.map((line, index) => (
            <text key={`${line}-${index}`} x="34" y={138 + index * 28} fontSize="24" fill="#cbd5e1">
              {line}
            </text>
          ))}
          <g transform="translate(646 30)">
            <circle cx="98" cy="64" r="58" fill="#1d4ed8" fillOpacity="0.18" />
            <path
              d="M54 88c18-54 46-84 85-84 21 0 39 10 52 27"
              fill="none"
              stroke="#93c5fd"
              strokeWidth="10"
              strokeLinecap="round"
            />
            <circle cx="132" cy="38" r="13" fill="#f59e0b" />
            <circle cx="186" cy="32" r="8" fill="#10b981" fillOpacity="0.8" />
          </g>
        </g>

        <g transform="translate(0 620)">
          <rect x="0" y="0" width="404" height="240" rx="30" fill="#ffffff" stroke="#e5edf5" />
          <text x="28" y="42" fontSize="22" fontWeight="700" fill="#0f172a">
            {t('report:shareCard.topFillersTitle')}
          </text>
          {fillerRows.map((item, index) => (
            <g key={`${item.word}-${index}`} transform={`translate(28 ${78 + index * 52})`}>
              <text x="0" y="20" fontSize="20" fontWeight="700" fill="#334155">
                {item.word}
              </text>
              <text x="318" y="20" fontSize="18" fontWeight="700" fill={item.accent} textAnchor="end">
                {t('report:shareCard.countUnit', { count: item.count })}
              </text>
              <rect x="0" y="30" width="318" height="10" rx="5" fill="#e2e8f0" />
              <rect x="0" y="30" width={Math.max(38, 318 * item.ratio)} height="10" rx="5" fill={item.accent} />
            </g>
          ))}
        </g>

        <g transform="translate(438 620)">
          <rect x="0" y="0" width="446" height="420" rx="30" fill="#ffffff" stroke="#e5edf5" />
          <text x="28" y="42" fontSize="22" fontWeight="700" fill="#0f172a">
            {t('report:shareCard.paceTitle')}
          </text>
          <text x="28" y="72" fontSize="18" fill="#64748b">
            {t('report:shareCard.paceDescription')}
          </text>

          <rect x="26" y={data.rangeBandY} width="394" height={data.rangeBandHeight} rx="18" fill="#eff6ff" />
          <line x1="26" y1="198" x2="420" y2="198" stroke="#e2e8f0" strokeWidth="1.5" />
          <line x1="26" y1="278" x2="420" y2="278" stroke="#e2e8f0" strokeWidth="1.5" />
          <line x1="26" y1="358" x2="420" y2="358" stroke="#e2e8f0" strokeWidth="1.5" />

          <path d={data.chartPath} fill="none" stroke="url(#chart-stroke)" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
          {data.chartPoints.map((point, index) => (
            <circle
              key={`point-${index}`}
              cx={point.x}
              cy={point.y}
              r={point.kind === 'normal' ? 4 : 7}
              fill={point.kind === 'fast' ? '#f59e0b' : point.kind === 'slow' ? '#8b5cf6' : '#60a5fa'}
              stroke="#ffffff"
              strokeWidth="2"
            />
          ))}

          <text x="24" y="122" fontSize="18" fontWeight="700" fill="#64748b">
            {data.chartMaxLabel}
          </text>
          <text x="24" y="364" fontSize="18" fontWeight="700" fill="#64748b">
            {data.chartMinLabel}
          </text>
          <text x="26" y="398" fontSize="18" fill="#64748b">
            {data.chartStartLabel}
          </text>
          <text x="420" y="398" fontSize="18" fill="#64748b" textAnchor="end">
            {data.chartEndLabel}
          </text>
        </g>

        <g transform="translate(0 1080)">
          <rect x="0" y="0" width="884" height="120" rx="30" fill="#f8fafc" stroke="#e2e8f0" />
          <text x="30" y="50" fontSize="22" fontWeight="700" fill="#0f172a">
            {t('report:shareCard.brandTitle')}
          </text>
          <text x="30" y="82" fontSize="20" fill="#64748b">
            {t('report:shareCard.brandBody')}
          </text>
          <text x="854" y="82" textAnchor="end" fontSize="18" fontWeight="700" fill="#2563eb">
            {data.footerNote}
          </text>
        </g>
      </g>
    </svg>
  )
})
