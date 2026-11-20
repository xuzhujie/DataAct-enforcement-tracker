import { Building2, Database, Gavel, Inbox } from 'lucide-react'
import type { CountryMetrics, CountryRecord, CoverageMetrics } from '../data/types'
import { formatCoverage, formatDate } from '../lib/format'

interface MetricStripProps {
  record: CountryRecord
  metrics: CountryMetrics
  coverageMetrics: CoverageMetrics
}

export default function MetricStrip({ record, metrics, coverageMetrics }: MetricStripProps) {
  const authority = record.competentAuthorities[0]
  const intake = record.complaintRoutes[0]
  const topTier = record.penaltySchedule[0]

  const blocks = [
    {
      label: '主管机构',
      value: authority?.nameEn ?? '待补齐',
      note: authority?.name ?? '暂无已核验主管机构',
      icon: Building2,
    },
    {
      label: '投诉入口',
      value: intake ? '在线投诉 / 报告' : '待补齐',
      note: intake ? `${metrics.complaintRouteCount} 个在线入口 · ${intake.submissionMode}` : '未填入未经核验的入口',
      icon: Inbox,
    },
    {
      label: '法定罚款上限',
      value: topTier?.label ?? '—',
      note: topTier?.maximum ?? '该国罚则待核验',
      icon: Gavel,
      accent: Boolean(topTier),
    },
    {
      label: '已公开处罚',
      value: metrics.publishedPenaltyLabel,
      note: `${formatCoverage(record.coverage)} · EU-27 ${coverageMetrics.deepCount} 已核验 / ${coverageMetrics.partialCount} 部分 / ${coverageMetrics.queueCount} 待补齐 · ${formatDate(record.lastVerifiedAt)}`,
      icon: Database,
    },
  ]

  return (
    <section className="metric-strip" aria-label={`${record.name} 核心指标`}>
      {blocks.map(({ label, value, note, icon: Icon, accent }) => (
        <article className="metric-block" key={label}>
          <div className="metric-block__topline">
            <span>{label}</span>
            <Icon aria-hidden="true" size={18} strokeWidth={1.7} />
          </div>
          <strong className={accent ? 'metric-block__value metric-block__value--penalty' : 'metric-block__value'}>{value}</strong>
          <p>{note}</p>
        </article>
      ))}
    </section>
  )
}
