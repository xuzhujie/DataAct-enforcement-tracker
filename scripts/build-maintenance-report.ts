import { appendFile, readFile, writeFile } from 'node:fs/promises'
import { COUNTRY_RECORDS } from '../src/data/registry'
import { buildMaintenanceReport } from '../src/data/maintenance-report'
import { validateRegistry } from '../src/data/registry-validation'
import type { SourceHealthReport } from '../src/data/source-health'

function getArgument(name: string): string | undefined {
  const index = process.argv.indexOf(name)
  return index >= 0 ? process.argv[index + 1] : undefined
}

async function readSourceHealth(path: string | undefined): Promise<SourceHealthReport | undefined> {
  if (!path) return undefined
  const raw = await readFile(path, 'utf8')
  return JSON.parse(raw) as SourceHealthReport
}

const outputPath = getArgument('--output')
const sourceHealthPath = getArgument('--source-health')
const asOf = getArgument('--as-of') ?? new Date().toISOString().slice(0, 10)
const sourceHealth = await readSourceHealth(sourceHealthPath)
const registryIssues = validateRegistry(COUNTRY_RECORDS)
const report = buildMaintenanceReport(COUNTRY_RECORDS, asOf, new Date().toISOString(), {
  registryIssues,
  sourceHealth,
})

if (outputPath) await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8')

if (process.env.GITHUB_OUTPUT) {
  await appendFile(process.env.GITHUB_OUTPUT, [
    `due_count=${report.reviewQueue.dueCount}`,
    `high_priority_due_count=${report.reviewQueue.highPriorityDueCount}`,
    `failed_source_count=${report.sourceHealth?.failedCount ?? 0}`,
  ].join('\n') + '\n', 'utf8')
}

console.log(`Maintenance report: ${report.registry.countryCount} countries, ${report.reviewQueue.dueCount} review item(s) due, ${report.registry.actualEnforcementCaseCount} actual case(s).`)
if (report.sourceHealth) console.log(`Source health summary: ${report.sourceHealth.okCount}/${report.sourceHealth.total} URLs reachable.`)

if (!report.registry.validation.passed) process.exitCode = 1
