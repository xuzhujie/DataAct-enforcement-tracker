import { ArrowUpRight, Gavel, Info } from 'lucide-react'
import type { CountryRecord } from '../data/types'
import { formatDate } from '../lib/format'
import StatusTag from './StatusTag'

interface EnforcementCaseRegisterProps {
  record: CountryRecord
  compact?: boolean
}

const caseStatusLabels = {
  final: '最终决定',
  under_review: '审查中',
  appeal: '复议 / 上诉',
  unknown: '状态未明',
} as const

export default function EnforcementCaseRegister({ record, compact = false }: EnforcementCaseRegisterProps) {
  const cases = record.enforcementCases

  return (
    <section className={`panel enforcement-case-register ${compact ? 'enforcement-case-register--compact' : ''}`} aria-labelledby={`enforcement-case-register-title-${record.id}`}>
      <div className="panel-heading">
        <div>
          <h2 id={`enforcement-case-register-title-${record.id}`}>真实执法案件 / Enforcement cases</h2>
          <p>只登记可由官方决定或公告追溯的案件；法定罚款档位和实际处罚决定保持分离。</p>
        </div>
        <Gavel aria-hidden="true" size={22} strokeWidth={1.7} />
      </div>
      {cases.length === 0 ? (
        <div className="enforcement-case-empty">
          <div className="actual-panel__icon"><Info aria-hidden="true" size={21} /></div>
          <div>
            <StatusTag status={record.enforcementSummary.publishedPenaltyStatus} />
            <strong>{record.enforcementSummary.publishedPenaltyStatus === 'not_located' ? '未定位到已公开决定' : '案件核验待完成'}</strong>
            <p>{record.enforcementSummary.note}</p>
            <small>最后核验：{formatDate(record.enforcementSummary.lastVerifiedAt)}；空数组不等同于零案件。</small>
          </div>
        </div>
      ) : (
        <div className="table-scroll">
          <table className="data-table enforcement-case-table">
            <thead>
              <tr>
                <th>决定日期</th>
                <th>被处罚 / 被调查主体</th>
                <th>争议类型</th>
                <th>措施</th>
                <th>金额</th>
                <th>状态</th>
                <th aria-label="来源" />
              </tr>
            </thead>
            <tbody>
              {cases.map((item) => (
                <tr key={item.id}>
                  <td>{formatDate(item.decisionDate)}</td>
                  <td><strong>{item.entity}</strong><small>{item.authorityName}</small></td>
                  <td>{item.issue}</td>
                  <td>{item.measure}</td>
                  <td>{item.amountEur === null ? '金额未公开' : `€${item.amountEur.toLocaleString('en-US')}`}</td>
                  <td><span className="case-status">{caseStatusLabels[item.status]}</span></td>
                  <td><a className="icon-link" href={item.sourceUrls[0]} target="_blank" rel="noreferrer" aria-label={`查看${item.entity}案件来源`}><ArrowUpRight size={15} /></a></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
