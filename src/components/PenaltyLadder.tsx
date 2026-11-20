import { ArrowUpRight, Database, Gavel, Info } from 'lucide-react'
import type { EnforcementCase, EnforcementSummary, PenaltyTier } from '../data/types'
import { formatDate } from '../lib/format'
import StatusTag from './StatusTag'

interface PenaltyLadderProps {
  tiers: PenaltyTier[]
  enforcement: EnforcementSummary
  enforcementCases?: EnforcementCase[]
}

export default function PenaltyLadder({ tiers, enforcement, enforcementCases = [] }: PenaltyLadderProps) {
  return (
    <div className="penalty-grid">
      <section className="subpanel" aria-labelledby="penalty-tiers-title">
        <div className="subpanel-heading">
          <Database aria-hidden="true" size={20} strokeWidth={1.7} />
          <div>
            <h3 id="penalty-tiers-title">法定罚款档位</h3>
            <p>按违法类型适用的最高罚款，不是已实际作出的处罚。</p>
          </div>
        </div>
        {tiers.length === 0 ? <div className="empty-state empty-state--compact">该国罚则待补齐。</div> : (
          <div className="penalty-ladder">
            {tiers.map((tier, index) => (
              <div className={`penalty-tier ${index === 0 ? 'is-top-tier' : ''}`} key={tier.label}>
                <strong>{tier.label}</strong>
                <div>
                  <span>{tier.maximum}</span>
                  <small>{tier.legalBasis} · {tier.scope}</small>
                  <a href={tier.sourceUrl} target="_blank" rel="noreferrer">查看法条依据 <ArrowUpRight aria-hidden="true" size={11} /></a>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
      <section className="subpanel actual-panel" aria-labelledby="actual-enforcement-title">
        <div className="subpanel-heading">
          <Gavel aria-hidden="true" size={20} strokeWidth={1.7} />
          <div>
            <h3 id="actual-enforcement-title">实际执法 · 已公开处罚</h3>
            <p>只记录主管机关公开发布并可追溯的处罚决定；当前案件层 {enforcementCases.length ? `已登记 ${enforcementCases.length} 件` : '未定位到公开决定'}。</p>
          </div>
        </div>
        <div className="actual-panel__body">
          <div className="actual-panel__icon"><Info aria-hidden="true" size={24} /></div>
          <div>
            <StatusTag status={enforcement.publishedPenaltyStatus} />
            <strong>{enforcement.publishedPenaltyStatus === 'not_located' ? '未定位到公开处罚决定' : enforcement.publishedPenaltyStatus === 'pending' ? '实际处罚待核验' : '已记录公开处罚'}</strong>
            <p>{enforcement.note}</p>
            <small>最后核验：{formatDate(enforcement.lastVerifiedAt)}</small>
            <div className="actual-panel__sources">
              {enforcement.sourceUrls.map((sourceUrl, index) => (
                <a key={sourceUrl} href={sourceUrl} target="_blank" rel="noreferrer">官方来源 {index + 1} <ArrowUpRight aria-hidden="true" size={11} /></a>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
