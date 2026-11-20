import { publishedPenaltyLabel } from '../data/metrics'
import type { CountryFilterState, CountryRecord, ImplementationStage, IssueRecord, IssueType } from '../data/types'

export const DEFAULT_COUNTRY_FILTERS: CountryFilterState = {
  coverage: 'all',
  implementationStage: 'all',
  authority: 'all',
  complaintRoute: 'all',
  penaltySchedule: 'all',
  publishedPenaltyStatus: 'all',
}

function matchesPresence(count: number, filter: CountryFilterState['authority']): boolean {
  if (filter === 'all') return true
  return filter === 'present' ? count > 0 : count === 0
}

export function filterCountries(records: CountryRecord[], filters: CountryFilterState = DEFAULT_COUNTRY_FILTERS): CountryRecord[] {
  return records.filter((record) => {
    if (filters.coverage !== 'all' && record.coverage !== filters.coverage) return false
    if (filters.implementationStage !== 'all' && record.implementationStage !== filters.implementationStage) return false
    if (!matchesPresence(record.competentAuthorities.length, filters.authority)) return false
    if (!matchesPresence(record.complaintRoutes.length, filters.complaintRoute)) return false
    if (!matchesPresence(record.penaltySchedule.length, filters.penaltySchedule)) return false
    if (filters.publishedPenaltyStatus !== 'all' && record.enforcementSummary.publishedPenaltyStatus !== filters.publishedPenaltyStatus) return false
    return true
  })
}

export function filterIssues(issues: IssueRecord[], activeIssues: IssueType[]): IssueRecord[] {
  const activeSet = new Set(activeIssues)
  return issues.filter((issue) => activeSet.has(issue.issue))
}

export function formatCountryStatus(record: CountryRecord): string {
  if (record.coverage === 'deep') return '已核验'
  if (record.coverage === 'partial') return '部分核验'
  if (record.coverage === 'queue') return '待补齐'
  return '规划中'
}

export function formatImplementationStage(stage: ImplementationStage): string {
  const labels: Record<ImplementationStage, string> = {
    enacted: '已生效',
    legislative: '立法中',
    draft: '草案 / 项目',
    not_located: '未定位',
  }
  return labels[stage]
}

export function formatCountryImplementingAct(record: CountryRecord): string {
  return record.implementingAct?.split(' · ')[0] ?? 'TBD'
}

export function formatComplaintIntake(record: CountryRecord): string {
  if (record.complaintRoutes.length === 0) return record.coverage === 'queue' ? '—' : '待核验'
  return `${record.complaintRoutes.length} 个入口`
}

export function formatPublishedPenalties(record: CountryRecord): string {
  return publishedPenaltyLabel(record)
}

export function buildCountryReference(record: CountryRecord): string {
  const act = record.implementingAct?.split(' · ')[0] ?? 'implementation pending'
  const evidenceLabel = record.coverage === 'deep'
    ? 'verified'
    : record.coverage === 'partial'
      ? 'partial coverage'
      : record.coverage === 'queue'
        ? 'pending coverage'
        : 'planned'
  return `${record.name} ${record.nameEn} · Data Act · ${act} · ${evidenceLabel} ${record.lastVerifiedAt}`
}

export function sortTimelineEvents<T extends { date: string }>(events: T[]): T[] {
  return [...events].sort((left, right) => right.date.localeCompare(left.date))
}
