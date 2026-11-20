import { createHash } from 'node:crypto'
import { writeFile } from 'node:fs/promises'
import { COUNTRY_RECORDS } from '../src/data/registry'
import { buildSourceManifest, validateRegistry, type SourceManifestEntry } from '../src/data/registry-validation'
import { buildSourceHealthReport, isReachableHttpStatus, type SourceHealthResult } from '../src/data/source-health'

function getArgument(name: string): string | undefined {
  const index = process.argv.indexOf(name)
  return index >= 0 ? process.argv[index + 1] : undefined
}

const FINGERPRINT_BYTE_LIMIT = 64 * 1024

async function readContentFingerprint(response: Response): Promise<Pick<SourceHealthResult, 'contentHash' | 'contentBytes' | 'contentTruncated'>> {
  if (!response.body) return {}

  const reader = response.body.getReader()
  const chunks: Buffer[] = []
  let totalBytes = 0
  let truncated = false

  try {
    while (totalBytes < FINGERPRINT_BYTE_LIMIT) {
      const { done, value } = await reader.read()
      if (done) break

      const remaining = FINGERPRINT_BYTE_LIMIT - totalBytes
      const chunk = Buffer.from(value.subarray(0, remaining))
      chunks.push(chunk)
      totalBytes += chunk.length

      if (value.length > remaining) {
        truncated = true
        break
      }
    }
  } finally {
    if (truncated || totalBytes >= FINGERPRINT_BYTE_LIMIT) await reader.cancel()
  }

  return {
    contentHash: createHash('sha256').update(Buffer.concat(chunks)).digest('hex'),
    contentBytes: totalBytes,
    contentTruncated: truncated || totalBytes >= FINGERPRINT_BYTE_LIMIT,
  }
}

async function checkSource(entry: SourceManifestEntry): Promise<SourceHealthResult> {
  let lastError = 'request failed'

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 15_000)

    try {
      const response = await fetch(entry.url, {
        method: 'GET',
        redirect: 'follow',
        headers: {
          Accept: 'text/html,application/pdf,application/json,*/*',
          'User-Agent': 'DataAct-enforcement-tracker-source-check/1.0',
          Range: 'bytes=0-2047',
        },
        signal: controller.signal,
      })
      let fingerprint: Pick<SourceHealthResult, 'contentHash' | 'contentBytes' | 'contentTruncated'> = {}
      try {
        fingerprint = await readContentFingerprint(response)
      } catch {
        // A body-read failure should not hide the HTTP result; the next run can retry the fingerprint.
      }
      const ok = isReachableHttpStatus(response.status)
      return {
        url: entry.url,
        label: entry.label,
        countryIds: entry.countryIds,
        status: response.status,
        ok,
        finalUrl: response.url,
        contentType: response.headers.get('content-type'),
        ...fingerprint,
        ...(ok ? {} : { error: `HTTP ${response.status}` }),
      }
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error)
    } finally {
      clearTimeout(timeout)
    }
  }

  return {
    url: entry.url,
    label: entry.label,
    countryIds: entry.countryIds,
    status: null,
    ok: false,
    finalUrl: null,
    contentType: null,
    error: `${lastError} (after 2 attempts)`,
  }
}

async function runPool(entries: SourceManifestEntry[], concurrency: number): Promise<SourceHealthResult[]> {
  const results: SourceHealthResult[] = []
  let nextIndex = 0

  const worker = async () => {
    while (nextIndex < entries.length) {
      const index = nextIndex
      nextIndex += 1
      results[index] = await checkSource(entries[index])
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, entries.length) }, () => worker()))
  return results
}

const outputPath = getArgument('--output')
const manifest = buildSourceManifest(COUNTRY_RECORDS)
const registryIssues = validateRegistry(COUNTRY_RECORDS)
const sources = await runPool(manifest, 6)
const report = buildSourceHealthReport(new Date().toISOString(), sources, registryIssues)

if (outputPath) await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8')

console.log(`Source health: ${report.okCount}/${sources.length} URLs returned 2xx or followed redirects.`)
if (registryIssues.length > 0) console.error(`Registry validation: ${registryIssues.length} issue(s).`)
for (const source of sources.filter((item) => !item.ok)) console.error(`${source.url} — ${source.error ?? 'request failed'}`)

if (!report.passed) process.exitCode = 1
