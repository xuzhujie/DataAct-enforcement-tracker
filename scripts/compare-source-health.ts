import { appendFile, readFile, writeFile } from 'node:fs/promises'
import { compareSourceHealthReports, type SourceHealthChange, type SourceHealthReport } from '../src/data/source-health'

function getArgument(name: string): string | undefined {
  const index = process.argv.indexOf(name)
  return index >= 0 ? process.argv[index + 1] : undefined
}

interface SourceChangeReport {
  schemaVersion: 1
  comparedAt: string
  baselineAvailable: boolean
  changes: SourceHealthChange[]
}

const currentPath = getArgument('--current')
if (!currentPath) throw new Error('Missing required --current path')

const previousPath = getArgument('--previous')
const outputPath = getArgument('--output')
const current = JSON.parse(await readFile(currentPath, 'utf8')) as SourceHealthReport
let previous: SourceHealthReport | undefined

if (previousPath) {
  try {
    previous = JSON.parse(await readFile(previousPath, 'utf8')) as SourceHealthReport
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
  }
}

const report: SourceChangeReport = {
  schemaVersion: 1,
  comparedAt: new Date().toISOString(),
  baselineAvailable: Boolean(previous),
  changes: compareSourceHealthReports(previous, current),
}

if (outputPath) await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8')

const changedCount = report.changes.filter((change) => change.kind === 'changed').length
const failedCount = report.changes.filter((change) => change.kind === 'failed').length
const recoveredCount = report.changes.filter((change) => change.kind === 'recovered').length

if (process.env.GITHUB_OUTPUT) {
  await appendFile(process.env.GITHUB_OUTPUT, [
    `change_count=${report.changes.length}`,
    `changed_count=${changedCount}`,
    `failed_count=${failedCount}`,
    `recovered_count=${recoveredCount}`,
    `baseline_available=${report.baselineAvailable}`,
  ].join('\n') + '\n', 'utf8')
}

console.log(`Source changes: ${report.changes.length} change(s); baseline ${report.baselineAvailable ? 'available' : 'not available'}.`)
for (const change of report.changes) console.log(`${change.kind}: ${change.url}`)
