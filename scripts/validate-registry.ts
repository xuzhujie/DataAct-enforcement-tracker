import { COUNTRY_RECORDS } from '../src/data/registry'
import { buildSourceManifest, validateRegistry } from '../src/data/registry-validation'

const issues = validateRegistry(COUNTRY_RECORDS)

if (issues.length > 0) {
  for (const issue of issues) console.error(`${issue.path}: ${issue.message}`)
  process.exitCode = 1
} else {
  const manifest = buildSourceManifest(COUNTRY_RECORDS)
  console.log(`Registry valid: ${COUNTRY_RECORDS.length} countries, ${manifest.length} unique evidence URLs.`)
}
