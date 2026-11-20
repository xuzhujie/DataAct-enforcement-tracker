import type { CountryRecord, EvidenceMetadata, VerificationStatus } from '../data/types'

export type CountryEvidenceField = 'authority' | 'complaint_route' | 'penalty_schedule' | 'published_penalty'

type EvidenceItem = { evidence: EvidenceMetadata }

function aggregateEvidenceStatus(items: EvidenceItem[]): VerificationStatus {
  if (items.length === 0) return 'not_located'

  const statuses = items.map((item) => item.evidence.evidenceStatus)
  if (statuses.every((status) => status === 'verified')) return 'verified'
  if (statuses.every((status) => status === 'not_applicable')) return 'not_applicable'
  if (statuses.every((status) => status === 'not_located')) return 'not_located'
  return 'pending'
}

export function getCountryEvidenceStatus(record: CountryRecord, field: CountryEvidenceField): VerificationStatus {
  if (field === 'published_penalty') return record.enforcementSummary.publishedPenaltyStatus
  if (field === 'authority') return aggregateEvidenceStatus(record.competentAuthorities)
  if (field === 'complaint_route') return aggregateEvidenceStatus(record.complaintRoutes)
  return aggregateEvidenceStatus(record.penaltySchedule)
}
