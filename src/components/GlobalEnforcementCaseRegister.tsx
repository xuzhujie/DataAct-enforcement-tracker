import { Filter, Gavel, Info } from 'lucide-react'
import { useMemo, useState } from 'react'
import type { CountryRecord, EnforcementCaseFilterState, EnforcementCaseStatus, IssueType } from '../data/types'
import { buildEnforcementCaseRegister, DEFAULT_ENFORCEMENT_CASE_FILTERS, filterEnforcementCases } from '../data/cases'
import { DATA_AS_OF } from '../data/registry'
import { formatDate, formatIssueLabel } from '../lib/format'
import StatusTag from './StatusTag'

const caseStatusLabels: Record<EnforcementCaseStatus, string> = {
  final: '最终决定',
  under_review: '审查中',
  appeal: '复议 / 上诉',
  unknown: '状态未明',
}

const issueTypes: IssueType[] = ['device_access', 'third_party_sharing', 'second_hand_transfer']
const caseStatuses: EnforcementCaseStatus[] = ['final', 'under_review', 'appeal', 'unknown']

export default function GlobalEnforcementCaseRegister({ records }: { records: CountryRecord[] }) {
  const [filters, setFilters] = useState<EnforcementCaseFilterState>(DEFAULT_ENFORCEMENT_CASE_FILTERS)
  const cases = useMemo(() => buildEnforcementCaseRegister(records), [records])
  const visibleCases = useMemo(() => filterEnforcementCases(cases, filters), [cases, filters])
  const countryNames = useMemo(() => new Map(records.map((record) => [record.id, record.name])), [records])
  const countryOptions = useMemo(
    () => records.map((record) => ({ id: record.id, name: record.name })).sort((left, right) => left.name.localeCompare(right.name, 'zh-CN')),
    [records],
  )
  const authorityOptions = useMemo(
    () => [...new Set(cases.map((item) => item.authorityName))].sort((left, right) => left.localeCompare(right, 'en')),
    [cases],
  )

  function updateFilters(patch: Partial<EnforcementCaseFilterState>) {
    setFilters((current) => ({ ...current, ...patch }))
  }

  return (
    <section className="panel global-case-register" aria-labelledby="global-case-register-title">
      <div className="panel-heading">
        <div>
          <h2 id="global-case-register-title">EU-wide 真实执法案件 / EU-wide Cases</h2>
          <p>只收录可由主管机关决定或官方公告追溯的 Data Act 案件；来源监测、法定罚款档位和事项登记不计入案件层。</p>
        </div>
        <Gavel aria-hidden="true" size={22} strokeWidth={1.7} />
      </div>
      <div className="case-register-filters">
        <div className="case-register-filters__label"><Filter aria-hidden="true" size={15} />筛选</div>
        <label>
          <span>国家</span>
          <select aria-label="案件国家筛选" value={filters.countryId} onChange={(event) => updateFilters({ countryId: event.target.value })}>
            <option value="all">全部国家</option>
            {countryOptions.map((country) => <option key={country.id} value={country.id}>{country.name}</option>)}
          </select>
        </label>
        <label>
          <span>主管机构</span>
          <select aria-label="案件主管机构筛选" value={filters.authorityName} onChange={(event) => updateFilters({ authorityName: event.target.value })}>
            <option value="all">全部机构</option>
            {authorityOptions.map((authority) => <option key={authority} value={authority}>{authority}</option>)}
          </select>
        </label>
        <label>
          <span>争议类型</span>
          <select aria-label="案件争议类型筛选" value={filters.issue} onChange={(event) => updateFilters({ issue: event.target.value as IssueType | 'all' })}>
            <option value="all">全部事项</option>
            {issueTypes.map((issue) => <option key={issue} value={issue}>{formatIssueLabel(issue)}</option>)}
          </select>
        </label>
        <label>
          <span>案件状态</span>
          <select aria-label="案件状态筛选" value={filters.status} onChange={(event) => updateFilters({ status: event.target.value as EnforcementCaseStatus | 'all' })}>
            <option value="all">全部状态</option>
            {caseStatuses.map((status) => <option key={status} value={status}>{caseStatusLabels[status]}</option>)}
          </select>
        </label>
        <span className="case-register-filters__count">显示 {visibleCases.length} / {cases.length} 条</span>
      </div>
      {visibleCases.length === 0 ? (
        <div className="enforcement-case-empty global-case-empty">
          <div className="actual-panel__icon"><Info aria-hidden="true" size={21} /></div>
          <div>
            {cases.length === 0 && <StatusTag status="pending" />}
            <strong>{cases.length === 0 ? '暂无可追溯的公开 Data Act 案件' : '当前筛选没有案件'}</strong>
            <p>{cases.length === 0
              ? `截至 ${formatDate(DATA_AS_OF)}，当前 EU-27 登记簿尚未收录可由官方决定或公告追溯的 Data Act 案件。这不等同于没有调查、程序或未公开处罚。`
              : '请调整国家、主管机构、争议类型或案件状态筛选。'}</p>
            <small>案件层与法定罚款上限、官方来源监测、联网硬件事项登记保持独立。</small>
          </div>
        </div>
      ) : (
        <div className="table-scroll">
          <table className="data-table enforcement-case-table global-case-table">
            <thead>
              <tr>
                <th>国家</th>
                <th>决定日期</th>
                <th>主体</th>
                <th>主管机构</th>
                <th>争议类型</th>
                <th>措施</th>
                <th>金额</th>
                <th>状态</th>
                <th aria-label="来源" />
              </tr>
            </thead>
            <tbody>
              {visibleCases.map((item) => (
                <tr key={item.id}>
                  <td>{countryNames.get(item.countryId) ?? item.countryId}</td>
                  <td>{formatDate(item.decisionDate)}</td>
                  <td><strong>{item.entity}</strong></td>
                  <td>{item.authorityName}</td>
                  <td>{formatIssueLabel(item.issue)}</td>
                  <td>{item.measure}</td>
                  <td>{item.amountEur === null ? '金额未公开' : `€${item.amountEur.toLocaleString('en-US')}`}</td>
                  <td><span className="case-status">{caseStatusLabels[item.status]}</span></td>
                  <td><a className="icon-link" href={item.sourceUrls[0]} target="_blank" rel="noreferrer" aria-label={`查看${item.entity}案件来源`}><Info aria-hidden="true" size={15} /></a></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
