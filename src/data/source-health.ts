import type { RegistryValidationIssue } from './registry-validation'

export interface SourceHealthResult {
  url: string
  label: string
  countryIds: string[]
  status: number | null
  ok: boolean
  finalUrl: string | null
  contentType: string | null
  contentHash?: string
  contentBytes?: number
  contentTruncated?: boolean
  error?: string
}

export interface SourceHealthReport {
  checkedAt: string
  passed: boolean
  registryIssues: RegistryValidationIssue[]
  total: number
  okCount: number
  failedCount: number
  sources: SourceHealthResult[]
}

export type SourceHealthChangeKind = 'added' | 'removed' | 'changed' | 'failed' | 'recovered'

export interface SourceHealthChange {
  url: string
  label: string
  countryIds: string[]
  kind: SourceHealthChangeKind
  previousOk?: boolean
  currentOk?: boolean
  previousHash?: string
  currentHash?: string
}

export function isReachableHttpStatus(status: number | null): boolean {
  return status !== null && status >= 200 && status < 400
}

export function buildSourceHealthReport(
  checkedAt: string,
  sources: SourceHealthResult[],
  registryIssues: RegistryValidationIssue[],
): SourceHealthReport {
  const okCount = sources.filter((source) => source.ok).length
  return {
    checkedAt,
    passed: registryIssues.length === 0 && okCount === sources.length,
    registryIssues,
    total: sources.length,
    okCount,
    failedCount: sources.length - okCount,
    sources,
  }
}

export function compareSourceHealthReports(
  previous: SourceHealthReport | undefined,
  current: SourceHealthReport,
): SourceHealthChange[] {
  if (!previous) return []

  const previousByUrl = new Map(previous.sources.map((source) => [source.url, source]))
  const currentByUrl = new Map(current.sources.map((source) => [source.url, source]))
  const urls = [...new Set([...previousByUrl.keys(), ...currentByUrl.keys()])].sort()
  const changes: SourceHealthChange[] = []

  for (const url of urls) {
    const before = previousByUrl.get(url)
    const after = currentByUrl.get(url)

    if (!before && after) {
      changes.push({
        url,
        label: after.label,
        countryIds: after.countryIds,
        kind: 'added',
        currentOk: after.ok,
        ...(after.contentHash ? { currentHash: after.contentHash } : {}),
      })
      continue
    }

    if (before && !after) {
      changes.push({
        url,
        label: before.label,
        countryIds: before.countryIds,
        kind: 'removed',
        previousOk: before.ok,
        ...(before.contentHash ? { previousHash: before.contentHash } : {}),
      })
      continue
    }

    if (!before || !after) continue

    if (before.ok !== after.ok) {
      changes.push({
        url,
        label: after.label,
        countryIds: after.countryIds,
        kind: after.ok ? 'recovered' : 'failed',
        previousOk: before.ok,
        currentOk: after.ok,
        ...(before.contentHash ? { previousHash: before.contentHash } : {}),
        ...(after.contentHash ? { currentHash: after.contentHash } : {}),
      })
      continue
    }

    if (before.ok && after.ok && before.contentHash && after.contentHash && before.contentHash !== after.contentHash) {
      changes.push({
        url,
        label: after.label,
        countryIds: after.countryIds,
        kind: 'changed',
        previousOk: before.ok,
        currentOk: after.ok,
        previousHash: before.contentHash,
        currentHash: after.contentHash,
      })
    }
  }

  return changes
}
