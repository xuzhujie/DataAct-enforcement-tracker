import { DATA_AS_OF } from './registry'
import { getCoverageMetrics } from './metrics'
import { buildReviewQueue } from './review-queue'
import { buildSourceManifest, type RegistryValidationIssue } from './registry-validation'
import type { SourceHealthReport } from './source-health'
import type { CountryRecord, ReviewQueueItem } from './types'
import { getCountryEvidenceStatus, type CountryEvidenceField } from '../lib/field-status'

export const MAINTENANCE_EVIDENCE_FIELDS: CountryEvidenceField[] = [
  'authority',
  'complaint_route',
  'penalty_schedule',
  'published_penalty',
]

export interface MaintenanceStatusCounts {
  verified: number
  pending: number
  not_located: number
  not_applicable: number
}

export interface MaintenanceEvidenceSummary extends MaintenanceStatusCounts {
  needsFollowUpCountryIds: string[]
}

export interface MaintenanceSourceFailure {
  url: string
  label: string
  countryIds: string[]
  status: number | null
  error?: string
}

export interface MaintenanceSourceHealthSummary {
  checkedAt: string
  passed: boolean
  total: number
  okCount: number
  failedCount: number
  failedSources: MaintenanceSourceFailure[]
}

export interface MaintenanceReport {
  schemaVersion: 1
  generatedAt: string
  asOf: string
  registry: {
    countryCount: number
    coverage: ReturnType<typeof getCoverageMetrics>
    sourceUrlCount: number
    actualEnforcementCaseCount: number
    validation: {
      passed: boolean
      issueCount: number
      issues: RegistryValidationIssue[]
    }
  }
  evidence: Record<CountryEvidenceField, MaintenanceEvidenceSummary>
  reviewQueue: {
    total: number
    dueCount: number
    highPriorityDueCount: number
    dueCountryIds: string[]
    items: ReviewQueueItem[]
  }
  sourceHealth: MaintenanceSourceHealthSummary | null
}

export interface MaintenanceReportOptions {
  registryIssues?: RegistryValidationIssue[]
  sourceHealth?: SourceHealthReport
}

function emptyStatusCounts(): MaintenanceStatusCounts {
  return {
    verified: 0,
    pending: 0,
    not_located: 0,
    not_applicable: 0,
  }
}

function buildEvidenceSummary(records: CountryRecord[], field: CountryEvidenceField): MaintenanceEvidenceSummary {
  const counts = emptyStatusCounts()
  const needsFollowUpCountryIds: string[] = []

  for (const record of records) {
    const status = getCountryEvidenceStatus(record, field)
    counts[status] += 1
    if (status !== 'verified' && status !== 'not_applicable') needsFollowUpCountryIds.push(record.id)
  }

  return { ...counts, needsFollowUpCountryIds }
}

function summarizeSourceHealth(sourceHealth?: SourceHealthReport): MaintenanceSourceHealthSummary | null {
  if (!sourceHealth) return null

  return {
    checkedAt: sourceHealth.checkedAt,
    passed: sourceHealth.passed,
    total: sourceHealth.total,
    okCount: sourceHealth.okCount,
    failedCount: sourceHealth.failedCount,
    failedSources: sourceHealth.sources
      .filter((source) => !source.ok)
      .map((source) => ({
        url: source.url,
        label: source.label,
        countryIds: source.countryIds,
        status: source.status,
        ...(source.error ? { error: source.error } : {}),
      })),
  }
}

export function buildMaintenanceReport(
  records: CountryRecord[],
  asOf = DATA_AS_OF,
  generatedAt = new Date().toISOString(),
  options: MaintenanceReportOptions = {},
): MaintenanceReport {
  const registryIssues = options.registryIssues ?? []
  const reviewQueue = buildReviewQueue(records, asOf)
  const dueItems = reviewQueue.filter((item) => item.due)
  const evidence = Object.fromEntries(
    MAINTENANCE_EVIDENCE_FIELDS.map((field) => [field, buildEvidenceSummary(records, field)]),
  ) as Record<CountryEvidenceField, MaintenanceEvidenceSummary>

  return {
    schemaVersion: 1,
    generatedAt,
    asOf,
    registry: {
      countryCount: records.length,
      coverage: getCoverageMetrics(records),
      sourceUrlCount: buildSourceManifest(records).length,
      actualEnforcementCaseCount: records.reduce((total, record) => total + record.enforcementCases.length, 0),
      validation: {
        passed: registryIssues.length === 0,
        issueCount: registryIssues.length,
        issues: registryIssues,
      },
    },
    evidence,
    reviewQueue: {
      total: reviewQueue.length,
      dueCount: dueItems.length,
      highPriorityDueCount: dueItems.filter((item) => item.priority === 'high').length,
      dueCountryIds: dueItems.map((item) => item.countryId),
      items: reviewQueue,
    },
    sourceHealth: summarizeSourceHealth(options.sourceHealth),
  }
}

