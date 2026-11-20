import {
  Building2,
  ClipboardList,
  Clock3,
  FileText,
  Gavel,
  History,
  LayoutDashboard,
  type LucideIcon,
} from 'lucide-react'
import type { AppTab } from '../data/types'

interface TopNavProps {
  activeTab: AppTab
  onSelectTab: (tab: AppTab) => void
}

const tabs: Array<{ id: AppTab; label: string; english: string; icon: LucideIcon }> = [
  { id: 'dashboard', label: '驾驶舱', english: 'Dashboard', icon: LayoutDashboard },
  { id: 'country-register', label: '国别登记', english: 'Country register', icon: Building2 },
  { id: 'cases', label: '事项登记', english: 'Cases', icon: Gavel },
  { id: 'timeline', label: '时间线', english: 'Timeline', icon: Clock3 },
  { id: 'sources', label: '官方来源', english: 'Sources', icon: FileText },
  { id: 'change-log', label: '变更日志', english: 'Change log', icon: History },
  { id: 'maintenance', label: '维护队列', english: 'Maintenance', icon: ClipboardList },
]

export default function TopNav({ activeTab, onSelectTab }: TopNavProps) {
  return (
    <nav className="top-nav" aria-label="Data Act tracker sections">
      <div className="top-nav__brand">
        <span className="brand-mark" aria-hidden="true">DA</span>
        <span>DATA ACT</span>
      </div>
      <div className="top-nav__tabs">
        {tabs.map(({ id, label, english, icon: Icon }) => (
          <button
            key={id}
            type="button"
            className={`top-nav__tab ${activeTab === id ? 'is-active' : ''}`}
            onClick={() => onSelectTab(id)}
            aria-current={activeTab === id ? 'page' : undefined}
          >
            <Icon aria-hidden="true" size={16} strokeWidth={1.8} />
            <span>
              <strong>{label}</strong>
              <small>{english}</small>
            </span>
          </button>
        ))}
      </div>
    </nav>
  )
}
