import type { CountryRecord, EnforcementCase, EnforcementCaseFilterState } from './types'

export const DEFAULT_ENFORCEMENT_CASE_FILTERS: EnforcementCaseFilterState = {
  countryId: 'all',
  authorityName: 'all',
  issue: 'all',
  status: 'all',
}

export function buildEnforcementCaseRegister(records: CountryRecord[]): EnforcementCase[] {
  return records
    .flatMap((record) => record.enforcementCases)
    .sort((left, right) => right.decisionDate.localeCompare(left.decisionDate) || left.id.localeCompare(right.id))
}

export function filterEnforcementCases(cases: EnforcementCase[], filters: EnforcementCaseFilterState): EnforcementCase[] {
  return cases.filter((item) => {
    if (filters.countryId !== 'all' && item.countryId !== filters.countryId) return false
    if (filters.authorityName !== 'all' && item.authorityName !== filters.authorityName) return false
    if (filters.issue !== 'all' && item.issue !== filters.issue) return false
    if (filters.status !== 'all' && item.status !== filters.status) return false
    return true
  })
}
