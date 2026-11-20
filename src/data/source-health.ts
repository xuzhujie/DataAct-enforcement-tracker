import type { RegistryValidationIssue } from './registry-validation'

export interface SourceHealthResult {
  url: string
  label: string
  countryIds: string[]
  status: number | null
  ok: boolean
  finalUrl: string | null
  contentType: string | null
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
