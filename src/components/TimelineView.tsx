import { ArrowUpRight, CalendarDays, CircleDot } from 'lucide-react'
import type { TimelineEvent } from '../data/types'
import { formatDate } from '../lib/format'
import { sortTimelineEvents } from '../lib/view-model'

const kindLabels: Record<TimelineEvent['kind'], string> = {
  regulation: '欧盟法规',
  authority: '国内实施',
  verification: '来源核验',
}

export default function TimelineView({ events }: { events: TimelineEvent[] }) {
  const sortedEvents = sortTimelineEvents(events)

  return (
    <section className="panel timeline-view" aria-labelledby="timeline-title">
      <div className="panel-heading">
        <div>
          <h2 id="timeline-title">监管时间线 / Timeline</h2>
          <p>只记录法规适用、主管机关建立和来源核验节点；不把未发布的处罚写成事件。</p>
        </div>
        <CalendarDays aria-hidden="true" size={22} strokeWidth={1.7} />
      </div>
      {sortedEvents.length === 0 ? <div className="empty-state">该国时间线待补齐。</div> : (
        <ol className="timeline-list">
          {sortedEvents.map((event) => (
            <li key={`${event.date}-${event.label}`} className="timeline-item">
              <div className="timeline-item__marker"><CircleDot aria-hidden="true" size={18} /></div>
              <div className="timeline-item__content">
                <div className="timeline-item__topline"><time dateTime={event.date}>{formatDate(event.date)}</time><span>{kindLabels[event.kind]}</span></div>
                <h3>{event.label}</h3>
                <p>{event.description}</p>
                <a href={event.sourceUrl} target="_blank" rel="noreferrer">官方来源 <ArrowUpRight size={13} /></a>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}
