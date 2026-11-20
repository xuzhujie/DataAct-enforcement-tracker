import { ArrowUpRight, ClipboardList, Filter } from 'lucide-react'
import { useMemo, useState } from 'react'
import type { ReviewPriority, ReviewQueueFilterState, ReviewQueueItem } from '../data/types'
import { filterReviewQueue } from '../data/review-queue'
import { formatDate } from '../lib/format'

const priorityLabels: Record<ReviewPriority, string> = {
  high: '高 · 部分核验',
  medium: '中 · 待补齐',
  low: '低 · 定期复查',
}

const dueLabels = {
  all: '全部',
  due: '已到期',
  'not-due': '未到期',
} as const

export default function MaintenanceView({ items }: { items: ReviewQueueItem[] }) {
  const [filters, setFilters] = useState<ReviewQueueFilterState>({ countryId: 'all', priority: 'all', due: 'all' })
  const filteredItems = useMemo(() => filterReviewQueue(items, filters), [filters, items])
  const countryOptions = useMemo(
    () => items.map((item) => ({ id: item.countryId, name: item.countryName })).sort((left, right) => left.name.localeCompare(right.name, 'zh-CN')),
    [items],
  )

  function updateFilters(patch: Partial<ReviewQueueFilterState>) {
    setFilters((current) => ({ ...current, ...patch }))
  }

  return (
    <section className="panel maintenance-view" aria-labelledby="maintenance-view-title">
      <div className="panel-heading">
        <div>
          <h2 id="maintenance-view-title">维护复核队列 / Maintenance</h2>
          <p>把未确认的主管机关、投诉入口、国内罚则和公开处罚决定拆成可执行的复核任务；到期状态按日期计算。</p>
        </div>
        <ClipboardList aria-hidden="true" size={22} strokeWidth={1.7} />
      </div>
      <div className="maintenance-filters">
        <div className="maintenance-filters__label"><Filter aria-hidden="true" size={15} />筛选</div>
        <label>
          <span>国家</span>
          <select value={filters.countryId} onChange={(event) => updateFilters({ countryId: event.target.value })}>
            <option value="all">全部国家</option>
            {countryOptions.map((country) => <option key={country.id} value={country.id}>{country.name}</option>)}
          </select>
        </label>
        <label>
          <span>优先级</span>
          <select value={filters.priority} onChange={(event) => updateFilters({ priority: event.target.value as ReviewPriority | 'all' })}>
            <option value="all">全部</option>
            <option value="high">高 · 部分核验</option>
            <option value="medium">中 · 待补齐</option>
            <option value="low">低 · 定期复查</option>
          </select>
        </label>
        <label>
          <span>复核状态</span>
          <select value={filters.due} onChange={(event) => updateFilters({ due: event.target.value as ReviewQueueFilterState['due'] })}>
            {Object.entries(dueLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
        <span className="maintenance-filters__count">显示 {filteredItems.length} / {items.length}</span>
      </div>
      {filteredItems.length === 0 ? (
        <div className="empty-state">当前筛选没有复核任务。</div>
      ) : (
        <ul className="review-list">
          {filteredItems.map((item) => (
            <li className="review-item" key={item.id}>
              <div className="review-item__heading">
                <div>
                  <span className={`review-priority review-priority--${item.priority}`}>{priorityLabels[item.priority]}</span>
                  <h3>{item.countryName}</h3>
                </div>
                <span className={`review-due ${item.due ? 'review-due--due' : ''}`}>{item.due ? '已到期' : `下次复核 ${formatDate(item.nextReviewAt)}`}</span>
              </div>
              <p>{item.reason}</p>
              <div className="review-targets"><span>待补字段</span>{item.targetFields.map((field) => <b key={field}>{field}</b>)}</div>
              <div className="review-item__footer">
                <small>上次核验：{formatDate(item.lastVerifiedAt)}</small>
                <div className="review-item__sources">
                  {item.sourceUrls.slice(0, 3).map((url) => <a key={url} href={url} target="_blank" rel="noreferrer">来源 <ArrowUpRight aria-hidden="true" size={12} /></a>)}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
