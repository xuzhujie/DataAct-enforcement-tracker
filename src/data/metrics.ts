import type { CountryMetrics, CountryRecord, CoverageMetrics } from './types'

export function publishedPenaltyLabel(record: CountryRecord): string {
  if (record.enforcementSummary.publishedPenaltyStatus === 'not_located') {
    return '未定位到公开处罚决定'
  }
  if (record.enforcementSummary.publishedPenaltyStatus === 'pending') {
    return '待核验'
  }
  if (record.enforcementSummary.publishedPenaltyCount === 0) {
    return '已核验：0 项公开处罚'
  }
  return `${record.enforcementSummary.publishedPenaltyCount ?? '—'} 项公开处罚`
}

export function getCountryMetrics(record: CountryRecord): CountryMetrics {
  return {
    authorityCount: record.competentAuthorities.length,
    complaintRouteCount: record.complaintRoutes.length,
    penaltyTierCount: record.penaltySchedule.length,
    publishedPenaltyLabel: publishedPenaltyLabel(record),
    publishedPenaltyCount: record.enforcementSummary.publishedPenaltyCount,
    publishedPenaltyAmountEur: record.enforcementSummary.publishedPenaltyAmountEur,
    verifiedIssueCount: record.issues.filter((issue) => issue.status === 'verified').length,
    pendingIssueCount: record.issues.filter((issue) => issue.status === 'pending').length,
    applicableFrom: record.applicableFrom,
    nationalActEffectiveFrom: record.nationalActEffectiveFrom,
  }
}

export function getCoverageMetrics(records: CountryRecord[]): CoverageMetrics {
  return {
    totalTrackedCountries: records.length,
    deepCount: records.filter((record) => record.coverage === 'deep').length,
    partialCount: records.filter((record) => record.coverage === 'partial').length,
    queueCount: records.filter((record) => record.coverage === 'queue').length,
    plannedCount: records.filter((record) => record.coverage === 'planned').length,
  }
}
