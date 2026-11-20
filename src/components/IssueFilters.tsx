import { Check, ListFilter } from 'lucide-react'
import type { IssueType } from '../data/types'
import { formatIssueLabel } from '../lib/format'

interface IssueFiltersProps {
  activeIssues: IssueType[]
  onToggleIssue: (issue: IssueType) => void
  onClear: () => void
}

const issueTypes: IssueType[] = ['device_access', 'third_party_sharing', 'second_hand_transfer']

export default function IssueFilters({ activeIssues, onToggleIssue, onClear }: IssueFiltersProps) {
  return (
    <section className="issue-filters" aria-labelledby="issue-filter-title">
      <div className="issue-filters__label" id="issue-filter-title">
        <ListFilter aria-hidden="true" size={16} />
        <span>争议类型筛选</span>
      </div>
      <div className="issue-filters__options">
        {issueTypes.map((issue) => {
          const active = activeIssues.includes(issue)
          return (
            <button
              key={issue}
              type="button"
              className={`issue-filter ${active ? 'is-active' : ''}`}
              onClick={() => onToggleIssue(issue)}
              aria-pressed={active}
            >
              {active && <Check aria-hidden="true" size={13} strokeWidth={2.4} />}
              {formatIssueLabel(issue)}
            </button>
          )
        })}
      </div>
      <button type="button" className="link-button" onClick={onClear}>清除筛选</button>
    </section>
  )
}
