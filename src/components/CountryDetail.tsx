import { useState } from 'react'
import { ArrowUpRight, Copy, Flag, ShieldCheck } from 'lucide-react'
import type { CountryRecord, IssueType } from '../data/types'
import { formatDate } from '../lib/format'
import { buildCountryReference, formatImplementationStage } from '../lib/view-model'
import ComplaintRoutes from './ComplaintRoutes'
import CountryFieldStatus from './CountryFieldStatus'
import EnforcementCaseRegister from './EnforcementCaseRegister'
import IssueMatrix from './IssueMatrix'
import PenaltyLadder from './PenaltyLadder'
import SourceList from './SourceList'
import StatusTag from './StatusTag'

type DetailTab = 'overview' | 'issues' | 'penalties' | 'sources'

interface CountryDetailProps {
  record: CountryRecord
  activeIssues: IssueType[]
  initialTab?: DetailTab
}

const detailTabs: Array<{ id: DetailTab; label: string }> = [
  { id: 'overview', label: '总览' },
  { id: 'issues', label: '争议矩阵' },
  { id: 'penalties', label: '罚款档位' },
  { id: 'sources', label: '官方来源' },
]

export default function CountryDetail({ record, activeIssues, initialTab = 'overview' }: CountryDetailProps) {
  const [detailTab, setDetailTab] = useState<DetailTab>(initialTab)
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'error'>('idle')
  const coverageStatus = record.coverage === 'deep' ? 'verified' : 'pending'
  const coverageSummary = record.coverage === 'deep'
    ? '官方来源已进入登记簿'
    : record.coverage === 'partial'
      ? '已部分核验，保留未确认字段'
      : '下一轮补齐队列'
  const complaintPortal = record.sources.find((source) => source.id === 'bnetza-complaint-portal')
  const dataProtectionAuthorities = record.competentAuthorities.filter((authority) => authority.role === 'data_protection')
  const dataProtectionLabel = dataProtectionAuthorities.length
    ? dataProtectionAuthorities.map((authority) => authority.nameEn).join(' / ')
    : '待核验'
  const detailPanelId = `country-detail-panel-${record.id}`
  const activeTabId = `country-detail-tab-${record.id}-${detailTab}`

  async function copyReference() {
    const text = buildCountryReference(record)
    if (!navigator.clipboard?.writeText) {
      setCopyState('error')
      window.setTimeout(() => setCopyState('idle'), 1800)
      return
    }

    try {
      await navigator.clipboard.writeText(text)
      setCopyState('copied')
      window.setTimeout(() => setCopyState('idle'), 1800)
    } catch {
      setCopyState('error')
      window.setTimeout(() => setCopyState('idle'), 1800)
    }
  }

  return (
    <section className="panel country-detail" aria-labelledby="country-detail-title">
      <div className="country-detail__header">
        <div className="country-detail__identity">
          <span className="country-detail__flag" aria-hidden="true">{record.flag}</span>
          <div>
            <div className="eyebrow-line"><StatusTag status={coverageStatus} /><span>· {coverageSummary}</span></div>
            <h2 id="country-detail-title">{record.name} — Data Act enforcement</h2>
            <p>{record.implementingAct ?? '实施法待补齐'} · 主管机构：{record.competentAuthorities[0]?.nameEn ?? '待核验'}</p>
          </div>
        </div>
        <button type="button" className="secondary-button" onClick={copyReference}>
          <Copy aria-hidden="true" size={15} />
          {copyState === 'copied' ? '已复制' : copyState === 'error' ? '复制失败' : '复制参考'}
        </button>
      </div>

      {record.coverage === 'deep' && (
        <div className="detail-tabs" role="tablist" aria-label="国别详情">
          {detailTabs.map((tab) => {
            const tabId = `country-detail-tab-${record.id}-${tab.id}`
            return (
              <button
                key={tab.id}
                id={tabId}
                type="button"
                role="tab"
                aria-selected={detailTab === tab.id}
                aria-controls={detailPanelId}
                tabIndex={detailTab === tab.id ? 0 : -1}
                className={detailTab === tab.id ? 'is-active' : ''}
                onClick={() => setDetailTab(tab.id)}
              >
                {tab.label}
              </button>
            )
          })}
        </div>
      )}

      <div
        className="country-detail__body"
        id={detailPanelId}
        role={record.coverage === 'deep' ? 'tabpanel' : undefined}
        aria-labelledby={record.coverage === 'deep' ? activeTabId : undefined}
        tabIndex={record.coverage === 'deep' ? 0 : undefined}
      >
        {record.coverage !== 'deep' ? (
          <div className={`queue-detail queue-detail--${record.coverage}`}>
            <Flag aria-hidden="true" size={24} />
            <h3>{record.coverage === 'partial' ? `${record.name} 已完成部分核验` : `${record.name} 尚未进入深度核验`}</h3>
            <p>{record.coverageNote ?? '当前只登记国家覆盖队列，不填入未经核验的主管机构、投诉入口、罚款上限或实际处罚数字。'}</p>
            <p>{record.coverage === 'partial' ? '部分核验只代表已找到的官方线索，不等于完整的国内实施、投诉或执法核验。' : '队列备注只代表已找到的官方线索，不等于完整的国内实施、投诉或执法核验。'}</p>
            <div className="queue-detail__stage"><span>实施阶段</span><strong>{formatImplementationStage(record.implementationStage)}</strong></div>
            <StatusTag status="pending" />
            <CountryFieldStatus record={record} />
            <div className="section-heading-inline"><h3>争议矩阵 · {record.name}</h3><span>与顶部筛选联动</span></div>
            <IssueMatrix countryName={record.name} issues={record.issues} activeIssues={activeIssues} />
            <div className="queue-detail__sources">
              {record.sources.map((source) => (
                <a key={source.id} href={source.url} target="_blank" rel="noreferrer">
                  <span>{source.label}</span>
                  <StatusTag status={source.evidenceStatus} />
                  <ArrowUpRight size={13} />
                </a>
              ))}
            </div>
          </div>
        ) : (
          <>
            <div className="detail-meta-grid">
              <div><span>Data Act 适用日</span><strong>{formatDate(record.applicableFrom)}</strong></div>
              <div><span>国内实施法生效</span><strong>{formatDate(record.nationalActEffectiveFrom)}</strong></div>
              <div><span>已核验争议</span><strong>{record.issues.filter((issue) => issue.status === 'verified').length} / {record.issues.length}</strong></div>
              <div><span>个人数据边界</span><strong><ShieldCheck size={15} /> {dataProtectionLabel}</strong></div>
            </div>
            {detailTab === 'overview' && (
              <>
                <div className="section-heading-inline"><h3>争议矩阵 · {record.name}</h3><span>与顶部筛选联动</span></div>
                <IssueMatrix countryName={record.name} issues={record.issues} activeIssues={activeIssues} />
                <PenaltyLadder tiers={record.penaltySchedule} enforcement={record.enforcementSummary} enforcementCases={record.enforcementCases} />
                <EnforcementCaseRegister record={record} compact />
              </>
            )}
            {detailTab === 'issues' && <IssueMatrix countryName={record.name} issues={record.issues} activeIssues={activeIssues} />}
            {detailTab === 'penalties' && (
              <>
                <PenaltyLadder tiers={record.penaltySchedule} enforcement={record.enforcementSummary} enforcementCases={record.enforcementCases} />
                <ComplaintRoutes routes={record.complaintRoutes} portal={complaintPortal} />
              </>
            )}
            {detailTab === 'sources' && (
              <>
                <SourceList sources={record.sources} />
                <ComplaintRoutes routes={record.complaintRoutes} portal={complaintPortal} />
              </>
            )}
          </>
        )}
      </div>
    </section>
  )
}
