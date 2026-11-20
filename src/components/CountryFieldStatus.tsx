import { Building2, Database, Gavel, Inbox } from 'lucide-react'
import type { CountryEvidenceField } from '../lib/field-status'
import { getCountryEvidenceStatus } from '../lib/field-status'
import type { CountryRecord } from '../data/types'
import StatusTag from './StatusTag'

interface FieldCard {
  key: CountryEvidenceField
  label: string
  value: string
  detail: string
  icon: typeof Building2
}

export default function CountryFieldStatus({ record }: { record: CountryRecord }) {
  const fields: FieldCard[] = [
    {
      key: 'authority',
      label: '主管机构',
      value: record.competentAuthorities.length
        ? record.competentAuthorities.map((authority) => authority.nameEn).join(' / ')
        : '未定位',
      detail: record.competentAuthorities.length
        ? record.competentAuthorities.map((authority) => authority.scope).join('；')
        : '本轮没有可登记的官方主管机构证据。',
      icon: Building2,
    },
    {
      key: 'complaint_route',
      label: '投诉入口',
      value: record.complaintRoutes.length
        ? `${record.complaintRoutes.length} 个已登记入口`
        : '未定位',
      detail: record.complaintRoutes.length
        ? record.complaintRoutes.map((route) => route.label).join('；')
        : '本轮没有可登记的官方投诉入口。',
      icon: Inbox,
    },
    {
      key: 'penalty_schedule',
      label: '法定罚则',
      value: record.penaltySchedule.length
        ? record.penaltySchedule.map((tier) => tier.label).join(' / ')
        : '未定位',
      detail: record.penaltySchedule.length
        ? record.penaltySchedule.map((tier) => `${tier.maximum} · ${tier.legalBasis}`).join('；')
        : '本轮没有可登记的国内法定罚款档位。',
      icon: Gavel,
    },
    {
      key: 'published_penalty',
      label: '实际公开处罚',
      value: record.enforcementSummary.publishedPenaltyStatus === 'verified'
        ? record.enforcementSummary.publishedPenaltyCount === null
          ? '已核验（数量未披露）'
          : `${record.enforcementSummary.publishedPenaltyCount} 起已登记`
        : record.enforcementSummary.publishedPenaltyStatus === 'pending'
          ? '待核验'
          : record.enforcementSummary.publishedPenaltyStatus === 'not_applicable'
            ? '不适用'
            : '未定位到公开记录',
      detail: record.enforcementSummary.note,
      icon: Database,
    },
  ]

  return (
    <section className="country-field-status" aria-labelledby={`country-field-status-title-${record.id}`}>
      <div className="section-heading-inline">
        <h3 id={`country-field-status-title-${record.id}`}>字段级核验</h3>
        <span>不把未定位字段当作零值</span>
      </div>
      <div className="country-field-status__grid">
        {fields.map(({ key, label, value, detail, icon: Icon }) => (
          <article className="country-field-card" key={key}>
            <div className="country-field-card__topline">
              <span><Icon aria-hidden="true" size={15} />{label}</span>
              <StatusTag status={getCountryEvidenceStatus(record, key)} />
            </div>
            <strong>{value}</strong>
            <p>{detail}</p>
          </article>
        ))}
      </div>
    </section>
  )
}
