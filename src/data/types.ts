export type VerificationStatus = 'verified' | 'pending' | 'not_located' | 'not_applicable'
export type CountryCoverage = 'deep' | 'partial' | 'queue' | 'planned'
export type ImplementationStage = 'enacted' | 'legislative' | 'draft' | 'not_located'
export type PresenceFilter = 'all' | 'present' | 'missing'
export type FieldFilter = PresenceFilter | VerificationStatus
export type PublishedPenaltyFilter = 'all' | VerificationStatus
export type IssueType = 'device_access' | 'third_party_sharing' | 'second_hand_transfer'
export type AuthorityRole = 'data_coordinator' | 'competent_authority' | 'data_protection'
export type AppTab = 'dashboard' | 'country-register' | 'cases' | 'timeline' | 'sources' | 'change-log' | 'maintenance'
export type SourceFreshnessStatus = 'current' | 'review' | 'stale' | 'unknown'
export type ChangeLogKind = 'new' | 'changed' | 'review'
export type EnforcementMonitorStatus = 'active' | 'candidate'

export interface SourceRecord {
  id: string
  label: string
  url: string
  sourceType: 'authority' | 'official-decision' | 'complaint-form' | 'statute' | 'eu-regulation' | 'joint-guidance' | 'eu-country-list' | 'research-lead'
  lastVerifiedAt: string
  evidenceStatus: VerificationStatus
  note?: string
}

export interface SourceFreshness {
  status: SourceFreshnessStatus
  daysSinceVerified: number | null
  note: string
}

export interface ChangeLogEntry {
  id: string
  date: string
  countryId: string
  kind: ChangeLogKind
  summary: string
  sourceUrls: string[]
  evidenceStatus: VerificationStatus
}

export interface EvidenceMetadata {
  sourceUrls: string[]
  lastVerifiedAt: string
  evidenceStatus: VerificationStatus
}

export interface AuthorityRecord {
  name: string
  nameEn: string
  role: AuthorityRole
  scope: string
  sourceUrl: string
  evidence: EvidenceMetadata
}

export interface ComplaintRoute {
  id: string
  label: string
  scope: string
  url: string
  submissionMode: string
  status: VerificationStatus
  evidence: EvidenceMetadata
}

export interface PenaltyTier {
  label: string
  maximum: string
  legalBasis: string
  scope: string
  sourceUrl: string
  conditionalTurnoverCap: boolean
  evidence: EvidenceMetadata
}

export interface EnforcementSummary {
  publishedPenaltyStatus: VerificationStatus
  publishedPenaltyCount: number | null
  publishedPenaltyAmountEur: number | null
  note: string
  lastVerifiedAt: string
  sourceUrls: string[]
}

export type EnforcementCaseStatus = 'final' | 'under_review' | 'appeal' | 'unknown'

export interface EnforcementCase {
  id: string
  countryId: string
  authorityName: string
  decisionDate: string
  entity: string
  issue: IssueType
  measure: string
  amountEur: number | null
  status: EnforcementCaseStatus
  sourceUrls: string[]
  evidence: EvidenceMetadata
}

export interface EnforcementCaseFilterState {
  countryId: string | 'all'
  authorityName: string | 'all'
  issue: IssueType | 'all'
  status: EnforcementCaseStatus | 'all'
}

export interface EnforcementMonitor {
  id: string
  countryId: string
  countryName: string
  sourceId: string
  label: string
  url: string
  sourceType: SourceRecord['sourceType']
  scope: string
  status: EnforcementMonitorStatus
  lastCheckedAt: string
  evidence: EvidenceMetadata
}

export type ReviewPriority = 'high' | 'medium' | 'low'
export type ReviewDueFilter = 'all' | 'due' | 'not-due'

export interface ReviewQueueItem {
  id: string
  countryId: string
  countryName: string
  priority: ReviewPriority
  reason: string
  targetFields: string[]
  lastVerifiedAt: string
  nextReviewAt: string
  due: boolean
  sourceUrls: string[]
}

export interface ReviewQueueFilterState {
  countryId: string | 'all'
  priority: ReviewPriority | 'all'
  due: ReviewDueFilter
}

export interface IssueRecord {
  issue: IssueType
  label: string
  euArticles: string[]
  nationalBasis: string
  status: VerificationStatus
  evidenceSummary: string
  nextAction: string
  sourceUrls: string[]
  evidence: EvidenceMetadata
}

export interface TimelineEvent {
  date: string
  label: string
  description: string
  kind: 'regulation' | 'authority' | 'verification'
  sourceUrl: string
  evidence: EvidenceMetadata
}

export interface CountryRecord {
  id: string
  name: string
  nameEn: string
  iso2: string
  flag: string
  coverage: CountryCoverage
  implementationStage: ImplementationStage
  coverageNote?: string
  implementingAct?: string
  implementingActUrl?: string
  applicableFrom?: string
  nationalActEffectiveFrom?: string
  competentAuthorities: AuthorityRecord[]
  complaintRoutes: ComplaintRoute[]
  penaltySchedule: PenaltyTier[]
  enforcementSummary: EnforcementSummary
  enforcementCases: EnforcementCase[]
  issues: IssueRecord[]
  timeline: TimelineEvent[]
  sources: SourceRecord[]
  lastVerifiedAt: string
}

export interface CountryMetrics {
  authorityCount: number
  complaintRouteCount: number
  penaltyTierCount: number
  publishedPenaltyLabel: string
  publishedPenaltyCount: number | null
  publishedPenaltyAmountEur: number | null
  verifiedIssueCount: number
  pendingIssueCount: number
  applicableFrom?: string
  nationalActEffectiveFrom?: string
}

export interface CoverageMetrics {
  totalTrackedCountries: number
  deepCount: number
  partialCount: number
  queueCount: number
  plannedCount: number
}

export interface CountryFilterState {
  coverage: CountryCoverage | 'all'
  implementationStage: ImplementationStage | 'all'
  authority: FieldFilter
  complaintRoute: FieldFilter
  penaltySchedule: FieldFilter
  publishedPenaltyStatus: PublishedPenaltyFilter
}
