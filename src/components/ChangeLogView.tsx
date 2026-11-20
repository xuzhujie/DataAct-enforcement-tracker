import { ArrowUpRight, History } from 'lucide-react'
import { useMemo, useState } from 'react'
import type { ChangeLogEntry, ChangeLogKind, CountryRecord } from '../data/types'
import type { ChangeLogFilterState } from '../data/changelog'
import { filterChangeLog } from '../data/changelog'
import { formatDate } from '../lib/format'

interface ChangeLogViewProps {
  entries: ChangeLogEntry[]
  countries: CountryRecord[]
}

const kindLabels: Record<ChangeLogKind, string> = {
  new: '新增',
  changed: '变更',
  review: '待复核',
}

export default function ChangeLogView({ entries, countries }: ChangeLogViewProps) {
  const [filters, setFilters] = useState<ChangeLogFilterState>({ countryId: 'all', kind: 'all' })
  const visibleEntries = useMemo(() => filterChangeLog(entries, filters), [entries, filters])

  return (
    <section className="panel changelog-view" aria-labelledby="changelog-title">
      <div className="panel-heading">
        <div>
          <h2 id="changelog-title">变更日志 / Change log</h2>
          <p>手工记录登记簿的新增、变更与待复核事项；每条记录都保留官方来源。</p>
        </div>
        <History aria-hidden="true" size={22} strokeWidth={1.7} />
      </div>
      <div className="changelog-filters">
        <label>
          <span>国家</span>
          <select value={filters.countryId} onChange={(event) => setFilters({ ...filters, countryId: event.target.value })}>
            <option value="all">全部国家</option>
            <option value="eu">🇪🇺 全欧盟</option>
            {countries.map((country) => <option key={country.id} value={country.id}>{country.flag} {country.name}</option>)}
          </select>
        </label>
        <label>
          <span>变更类型</span>
          <select value={filters.kind} onChange={(event) => setFilters({ ...filters, kind: event.target.value as ChangeLogKind | 'all' })}>
            <option value="all">全部</option>
            <option value="new">新增</option>
            <option value="changed">变更</option>
            <option value="review">待复核</option>
          </select>
        </label>
        <span className="changelog-filters__count">{visibleEntries.length} 条记录</span>
      </div>
      {visibleEntries.length === 0 ? <div className="empty-state">当前筛选没有变更记录。</div> : (
        <ol className="changelog-list">
          {visibleEntries.map((entry) => {
            const country = countries.find((item) => item.id === entry.countryId)
            const countryLabel = entry.countryId === 'eu' ? '🇪🇺 全欧盟' : `${country?.flag ?? ''} ${country?.name ?? entry.countryId}`
            return (
              <li key={entry.id} className="changelog-item">
                <div className="changelog-item__topline">
                  <time dateTime={entry.date}>{formatDate(entry.date)}</time>
                  <span className={`changelog-kind changelog-kind--${entry.kind}`}>{kindLabels[entry.kind]}</span>
                  <strong>{countryLabel}</strong>
                </div>
                <p>{entry.summary}</p>
                <div className="changelog-item__sources">
                  {entry.sourceUrls.map((url, index) => <a key={url} href={url} target="_blank" rel="noreferrer">官方来源 {index + 1} <ArrowUpRight aria-hidden="true" size={12} /></a>)}
                </div>
              </li>
            )
          })}
        </ol>
      )}
    </section>
  )
}
