import { ArrowUpRight, Link2 } from 'lucide-react'
import type { SourceRecord } from '../data/types'
import { formatDate } from '../lib/format'
import { getSourceFreshness } from '../lib/freshness'

const freshnessLabels = {
  current: '新鲜',
  review: '建议复核',
  stale: '已过期',
  unknown: '日期未知',
} as const

export default function SourceList({ sources }: { sources: SourceRecord[] }) {
  return (
    <section className="source-panel" aria-labelledby="source-list-title">
      <div className="subpanel-heading">
        <Link2 aria-hidden="true" size={20} strokeWidth={1.7} />
        <div>
          <h3 id="source-list-title">官方来源</h3>
          <p>所有登记字段回链到官方页面，按最后核验日期区分新鲜度。</p>
        </div>
      </div>
      <div className="source-grid">
        {sources.map((source) => (
          <a key={source.id} href={source.url} target="_blank" rel="noreferrer" className="source-card">
            <span className="source-card__label">{source.label} <ArrowUpRight aria-hidden="true" size={13} /></span>
            <small>{source.sourceType} · <span className={`source-freshness source-freshness--${getSourceFreshness(source.lastVerifiedAt).status}`}>{freshnessLabels[getSourceFreshness(source.lastVerifiedAt).status]}</span> · {formatDate(source.lastVerifiedAt)}</small>
            {source.note && <p>{source.note}</p>}
          </a>
        ))}
      </div>
    </section>
  )
}
