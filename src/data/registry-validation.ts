import type { CountryRecord, EvidenceMetadata, SourceRecord, VerificationStatus } from './types'

const EXPECTED_EU_ISO2 = new Set([
  'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 'IE',
  'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE',
])
const VALID_VERIFICATION_STATUSES = new Set<VerificationStatus>(['verified', 'pending', 'not_located', 'not_applicable'])
const OFFICIAL_CASE_SOURCE_TYPES = new Set<SourceRecord['sourceType']>(['official-decision'])

export interface RegistryValidationIssue {
  path: string
  message: string
}

export interface SourceManifestEntry {
  url: string
  label: string
  sourceIds: string[]
  sourceTypes: SourceRecord['sourceType'][]
  countryIds: string[]
  lastVerifiedAt: string[]
  evidenceStatuses: VerificationStatus[]
}

function addIssue(issues: RegistryValidationIssue[], path: string, message: string): void {
  issues.push({ path, message })
}

function isValidUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

function isValidIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const parsed = new Date(`${value}T00:00:00Z`)
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value
}

function unique(values: string[]): string[] {
  return [...new Set(values)]
}

function collectReferencedUrls(record: CountryRecord): string[] {
  return unique([
    ...record.competentAuthorities.flatMap((authority) => [authority.sourceUrl, ...authority.evidence.sourceUrls]),
    ...record.complaintRoutes.flatMap((route) => [route.url, ...route.evidence.sourceUrls]),
    ...record.penaltySchedule.flatMap((tier) => [tier.sourceUrl, ...tier.evidence.sourceUrls]),
    ...record.enforcementSummary.sourceUrls,
    ...record.issues.flatMap((issue) => [...issue.sourceUrls, ...issue.evidence.sourceUrls]),
    ...record.timeline.flatMap((event) => [event.sourceUrl, ...event.evidence.sourceUrls]),
    ...record.enforcementCases.flatMap((enforcementCase) => [...enforcementCase.sourceUrls, ...enforcementCase.evidence.sourceUrls]),
  ].filter(Boolean))
}

function collectEvidenceEntries(record: CountryRecord): Array<{ path: string; evidence: EvidenceMetadata }> {
  return [
    ...record.competentAuthorities.map((authority, index) => ({ path: `${record.id}.competentAuthorities.${index}.evidence`, evidence: authority.evidence })),
    ...record.complaintRoutes.map((route, index) => ({ path: `${record.id}.complaintRoutes.${index}.evidence`, evidence: route.evidence })),
    ...record.penaltySchedule.map((tier, index) => ({ path: `${record.id}.penaltySchedule.${index}.evidence`, evidence: tier.evidence })),
    ...record.issues.map((issue, index) => ({ path: `${record.id}.issues.${index}.evidence`, evidence: issue.evidence })),
    ...record.timeline.map((event, index) => ({ path: `${record.id}.timeline.${index}.evidence`, evidence: event.evidence })),
    ...record.enforcementCases.map((enforcementCase, index) => ({ path: `${record.id}.enforcementCases.${index}.evidence`, evidence: enforcementCase.evidence })),
    {
      path: `${record.id}.enforcementSummary`,
      evidence: {
        sourceUrls: record.enforcementSummary.sourceUrls,
        lastVerifiedAt: record.enforcementSummary.lastVerifiedAt,
        evidenceStatus: record.enforcementSummary.publishedPenaltyStatus,
      },
    },
  ]
}

function validateEvidenceMetadata(issues: RegistryValidationIssue[], path: string, evidence: EvidenceMetadata): void {
  if (evidence.sourceUrls.length === 0) addIssue(issues, path, 'evidence must include source URLs')
  for (const url of evidence.sourceUrls) {
    if (!url || !isValidUrl(url)) addIssue(issues, path, 'evidence source URLs must be absolute HTTP(S) URLs')
  }
  if (!isValidIsoDate(evidence.lastVerifiedAt)) addIssue(issues, path, 'evidence lastVerifiedAt must be an ISO date')
  if (!VALID_VERIFICATION_STATUSES.has(evidence.evidenceStatus)) addIssue(issues, path, 'evidence status is invalid')
}

function validateSourceReference(issues: RegistryValidationIssue[], path: string, url: string, sourceUrls: Set<string>): void {
  if (!url || !isValidUrl(url)) {
    addIssue(issues, path, 'referenced URL must be an absolute HTTP(S) URL')
    return
  }
  if (!sourceUrls.has(url)) addIssue(issues, path, `referenced source URL is missing from country sources: ${url}`)
}

export function validateRegistry(records: CountryRecord[]): RegistryValidationIssue[] {
  const issues: RegistryValidationIssue[] = []

  if (records.length !== EXPECTED_EU_ISO2.size) {
    addIssue(issues, 'registry', `expected ${EXPECTED_EU_ISO2.size} EU countries, received ${records.length}`)
  }

  const ids = records.map((record) => record.id)
  const iso2s = records.map((record) => record.iso2)
  if (new Set(ids).size !== ids.length) addIssue(issues, 'registry.ids', 'country ids must be unique')
  if (new Set(iso2s).size !== iso2s.length) addIssue(issues, 'registry.iso2', 'country ISO2 codes must be unique')

  for (const iso2 of EXPECTED_EU_ISO2) {
    if (!iso2s.includes(iso2)) addIssue(issues, 'registry.iso2', `missing EU country ${iso2}`)
  }
  for (const iso2 of iso2s) {
    if (!EXPECTED_EU_ISO2.has(iso2)) addIssue(issues, 'registry.iso2', `unexpected country ${iso2}`)
  }

  for (const record of records) {
    if (record.sources.length === 0) {
      addIssue(issues, `${record.id}.sources`, 'country must retain at least one source record')
      continue
    }

    const sourceIds = record.sources.map((source) => source.id)
    if (new Set(sourceIds).size !== sourceIds.length) addIssue(issues, `${record.id}.sources`, 'source ids must be unique within a country')

    for (const source of record.sources) {
      if (!source.url || !isValidUrl(source.url)) addIssue(issues, `${record.id}.sources.${source.id}`, 'source URL must be an absolute HTTP(S) URL')
      if (!isValidIsoDate(source.lastVerifiedAt)) addIssue(issues, `${record.id}.sources.${source.id}`, 'source lastVerifiedAt must be an ISO date')
      if (!VALID_VERIFICATION_STATUSES.has(source.evidenceStatus)) addIssue(issues, `${record.id}.sources.${source.id}`, 'source evidenceStatus is invalid')
    }

    const sourceUrls = new Set(record.sources.map((source) => source.url))
    for (const entry of collectEvidenceEntries(record)) validateEvidenceMetadata(issues, entry.path, entry.evidence)
    for (const url of collectReferencedUrls(record)) {
      if (!sourceUrls.has(url)) addIssue(issues, `${record.id}.evidence`, `referenced source URL is missing from country sources: ${url}`)
    }

    for (const authority of record.competentAuthorities) validateSourceReference(issues, `${record.id}.competentAuthorities.${authority.nameEn}.sourceUrl`, authority.sourceUrl, sourceUrls)
    for (const route of record.complaintRoutes) validateSourceReference(issues, `${record.id}.complaintRoutes.${route.id}.url`, route.url, sourceUrls)
    for (const tier of record.penaltySchedule) validateSourceReference(issues, `${record.id}.penaltySchedule.${tier.label}.sourceUrl`, tier.sourceUrl, sourceUrls)
    for (const event of record.timeline) validateSourceReference(issues, `${record.id}.timeline.${event.label}.sourceUrl`, event.sourceUrl, sourceUrls)

    if (record.implementationStage === 'enacted' && (!record.implementingAct || !record.implementingActUrl)) {
      addIssue(issues, `${record.id}.implementation`, 'enacted records must identify the implementing act and its official URL')
    }
    if (record.implementingActUrl) validateSourceReference(issues, `${record.id}.implementingActUrl`, record.implementingActUrl, sourceUrls)
    if (record.enforcementSummary.publishedPenaltyStatus === 'verified'
      && record.enforcementSummary.publishedPenaltyCount === null
      && record.enforcementSummary.publishedPenaltyAmountEur === null
      && record.enforcementCases.length === 0) {
      addIssue(issues, `${record.id}.enforcementSummary`, 'verified published penalties must include a count, amount, or official case')
    }

    const issueTypes = record.issues.map((issue) => issue.issue)
    if (new Set(issueTypes).size !== issueTypes.length || issueTypes.length !== 3) {
      addIssue(issues, `${record.id}.issues`, 'country must expose exactly the three hardware issue lenses')
    }

    for (const enforcementCase of record.enforcementCases) {
      if (enforcementCase.countryId !== record.id) addIssue(issues, `${record.id}.enforcementCases.${enforcementCase.id}`, 'case countryId must match its parent country')
      if (!isValidIsoDate(enforcementCase.decisionDate)) addIssue(issues, `${record.id}.enforcementCases.${enforcementCase.id}`, 'case decision date must be an ISO date')
      if (enforcementCase.amountEur !== null && (!Number.isFinite(enforcementCase.amountEur) || enforcementCase.amountEur < 0)) {
        addIssue(issues, `${record.id}.enforcementCases.${enforcementCase.id}`, 'case amountEur must be non-negative or null')
      }
      if (enforcementCase.sourceUrls.length === 0 || enforcementCase.evidence.evidenceStatus !== 'verified') {
        addIssue(issues, `${record.id}.enforcementCases.${enforcementCase.id}`, 'actual enforcement cases require verified source evidence')
      }
      for (const url of enforcementCase.sourceUrls) {
        const source = record.sources.find((candidate) => candidate.url === url)
        if (source && !OFFICIAL_CASE_SOURCE_TYPES.has(source.sourceType)) {
          addIssue(issues, `${record.id}.enforcementCases.${enforcementCase.id}`, 'actual enforcement cases must use official authority/statute/guidance sources')
        }
      }
    }
  }

  return issues
}

export function buildSourceManifest(records: CountryRecord[]): SourceManifestEntry[] {
  const byUrl = new Map<string, SourceManifestEntry>()

  const add = (url: string, countryId: string, label: string, sourceId?: string, sourceType?: SourceRecord['sourceType'], lastVerifiedAt?: string, evidenceStatus?: VerificationStatus) => {
    if (!url) return
    const existing = byUrl.get(url) ?? {
      url,
      label,
      sourceIds: [],
      sourceTypes: [],
      countryIds: [],
      lastVerifiedAt: [],
      evidenceStatuses: [],
    }
    existing.label = existing.label || label
    if (sourceId && !existing.sourceIds.includes(sourceId)) existing.sourceIds.push(sourceId)
    if (sourceType && !existing.sourceTypes.includes(sourceType)) existing.sourceTypes.push(sourceType)
    if (!existing.countryIds.includes(countryId)) existing.countryIds.push(countryId)
    if (lastVerifiedAt && !existing.lastVerifiedAt.includes(lastVerifiedAt)) existing.lastVerifiedAt.push(lastVerifiedAt)
    if (evidenceStatus && !existing.evidenceStatuses.includes(evidenceStatus)) existing.evidenceStatuses.push(evidenceStatus)
    byUrl.set(url, existing)
  }

  for (const record of records) {
    for (const source of record.sources) add(source.url, record.id, source.label, source.id, source.sourceType, source.lastVerifiedAt, source.evidenceStatus)
    for (const authority of record.competentAuthorities) {
      add(authority.sourceUrl, record.id, authority.nameEn)
      authority.evidence.sourceUrls.forEach((url) => add(url, record.id, `${authority.nameEn} evidence`, undefined, undefined, authority.evidence.lastVerifiedAt, authority.evidence.evidenceStatus))
    }
    for (const route of record.complaintRoutes) {
      add(route.url, record.id, route.label)
      route.evidence.sourceUrls.forEach((url) => add(url, record.id, `${route.label} evidence`, undefined, undefined, route.evidence.lastVerifiedAt, route.evidence.evidenceStatus))
    }
    for (const tier of record.penaltySchedule) {
      add(tier.sourceUrl, record.id, tier.label)
      tier.evidence.sourceUrls.forEach((url) => add(url, record.id, `${tier.label} evidence`, undefined, undefined, tier.evidence.lastVerifiedAt, tier.evidence.evidenceStatus))
    }
    for (const issue of record.issues) {
      issue.sourceUrls.forEach((url) => add(url, record.id, `${issue.label} source`))
      issue.evidence.sourceUrls.forEach((url) => add(url, record.id, `${issue.label} evidence`, undefined, undefined, issue.evidence.lastVerifiedAt, issue.evidence.evidenceStatus))
    }
    for (const event of record.timeline) {
      add(event.sourceUrl, record.id, event.label)
      event.evidence.sourceUrls.forEach((url) => add(url, record.id, `${event.label} evidence`, undefined, undefined, event.evidence.lastVerifiedAt, event.evidence.evidenceStatus))
    }
    record.enforcementSummary.sourceUrls.forEach((url) => add(url, record.id, `${record.name} enforcement summary`))
    for (const enforcementCase of record.enforcementCases) {
      enforcementCase.sourceUrls.forEach((url) => add(url, record.id, enforcementCase.entity))
      enforcementCase.evidence.sourceUrls.forEach((url) => add(url, record.id, `${enforcementCase.entity} evidence`, undefined, undefined, enforcementCase.evidence.lastVerifiedAt, enforcementCase.evidence.evidenceStatus))
    }
  }

  return [...byUrl.values()].sort((left, right) => left.url.localeCompare(right.url))
}
