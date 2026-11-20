import { ArrowUpRight, Inbox } from 'lucide-react'
import type { ComplaintRoute, SourceRecord } from '../data/types'
import { formatComplaintRouteScope, getComplaintRouteScope } from '../lib/view-model'
import StatusTag from './StatusTag'

export default function ComplaintRoutes({ routes, portal }: { routes: ComplaintRoute[]; portal?: Pick<SourceRecord, 'label' | 'url' | 'note'> }) {
  return (
    <section className="subpanel complaint-routes" aria-labelledby="complaint-routes-title">
      <div className="subpanel-heading">
        <Inbox aria-hidden="true" size={20} strokeWidth={1.7} />
        <div>
          <h3 id="complaint-routes-title">投诉入口</h3>
          <p>按 Data Act 事项分流的在线表单与主管机关入口。</p>
        </div>
      </div>
      {routes.length === 0 && !portal ? <div className="empty-state empty-state--compact">该国投诉入口待补齐。</div> : (
        <div className="route-list">
          {portal && (
            <a href={portal.url} target="_blank" rel="noreferrer" className="route-item route-item--portal">
              <div>
                <strong>{portal.label}</strong>
                <span>主管机关 Data Act 投诉总入口</span>
                <small>{portal.note ?? '查看主管机关公布的分流表单与投诉说明'}</small>
              </div>
              <div className="route-item__meta"><ArrowUpRight aria-hidden="true" size={15} /></div>
            </a>
          )}
          {routes.map((route) => (
            <a key={route.id} href={route.url} target="_blank" rel="noreferrer" className="route-item">
              <div>
                <strong>{route.label}</strong>
                <span>{route.scope}</span>
                <small>{formatComplaintRouteScope(getComplaintRouteScope(route))} · {route.submissionMode}</small>
              </div>
              <div className="route-item__meta">
                <StatusTag status={route.status} />
                <ArrowUpRight aria-hidden="true" size={15} />
              </div>
            </a>
          ))}
        </div>
      )}
    </section>
  )
}
