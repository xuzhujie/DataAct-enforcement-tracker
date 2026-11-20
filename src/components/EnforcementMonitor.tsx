import { ArrowUpRight, Radar } from 'lucide-react'
import type { EnforcementMonitor as EnforcementMonitorRecord } from '../data/types'
import { formatDate } from '../lib/format'

const statusLabels = {
  active: '主动监测',
  candidate: '候选来源',
} as const

export default function EnforcementMonitor({ monitors }: { monitors: EnforcementMonitorRecord[] }) {
  return (
    <section className="panel enforcement-monitor" aria-labelledby="enforcement-monitor-title">
      <div className="panel-heading">
        <div>
          <h2 id="enforcement-monitor-title">官方来源监测 / Source monitoring</h2>
          <p>按国家覆盖状态跟踪官方页面；候选来源只代表下一步研究入口，不代表已指定主管机关或已发生执法。</p>
        </div>
        <Radar aria-hidden="true" size={22} strokeWidth={1.7} />
      </div>
      {monitors.length === 0 ? (
        <div className="empty-state">当前国家没有可监测的官方来源。</div>
      ) : (
        <div className="monitor-grid">
          {monitors.map((monitor) => (
            <a key={monitor.id} className="monitor-card" href={monitor.url} target="_blank" rel="noreferrer">
              <div className="monitor-card__topline">
                <span className={`monitor-status monitor-status--${monitor.status}`}>{statusLabels[monitor.status]}</span>
                <ArrowUpRight aria-hidden="true" size={14} />
              </div>
              <strong>{monitor.countryName} · {monitor.label}</strong>
              <span className="monitor-card__scope">{monitor.scope}</span>
              <small>{monitor.sourceType} · 最后核验 {formatDate(monitor.lastCheckedAt)}</small>
            </a>
          ))}
        </div>
      )}
    </section>
  )
}
