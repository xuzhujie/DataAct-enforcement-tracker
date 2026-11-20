import assert from 'node:assert/strict'
import test from 'node:test'
import { COUNTRY_RECORDS, DATA_AS_OF, GERMANY_ID } from '../src/data/registry'
import { getCountryMetrics, getCoverageMetrics } from '../src/data/metrics'
import { formatCoverage, formatDate, formatIssueLabel, formatVerificationStatus } from '../src/lib/format'
import { buildCountryReference, DEFAULT_COUNTRY_FILTERS, filterCountries, filterIssues, formatCountryStatus } from '../src/lib/view-model'
import { buildJsonExport, buildMarkdownExport } from '../src/lib/export'
import { sortTimelineEvents } from '../src/lib/view-model'
import { CHANGE_LOG, filterChangeLog } from '../src/data/changelog'
import { getCurrentIsoDate, getSourceFreshness } from '../src/lib/freshness'
import { buildEnforcementMonitors } from '../src/data/monitoring'
import { buildReviewQueue, filterReviewQueue } from '../src/data/review-queue'
import { buildEnforcementCaseRegister, DEFAULT_ENFORCEMENT_CASE_FILTERS, filterEnforcementCases } from '../src/data/cases'
import { buildSourceManifest, validateRegistry } from '../src/data/registry-validation'
import { buildSourceHealthReport, isReachableHttpStatus } from '../src/data/source-health'
import { buildMaintenanceReport } from '../src/data/maintenance-report'
import { getCountryEvidenceStatus } from '../src/lib/field-status'
import type { EnforcementCase } from '../src/data/types'

test('Germany keeps EU application and German implementation dates separate', () => {
  const germany = COUNTRY_RECORDS.find((item) => item.id === GERMANY_ID)

  assert.ok(germany)
  assert.equal(germany.applicableFrom, '2025-09-12')
  assert.equal(germany.nationalActEffectiveFrom, '2026-05-30')
})

test('Germany exposes the four DADG §15 penalty tiers with a conditional 2% cap', () => {
  const germany = COUNTRY_RECORDS.find((item) => item.id === GERMANY_ID)

  assert.ok(germany)
  assert.deepEqual(germany.penaltySchedule.map((tier) => tier.label), ['€5m / 2%', '€500k', '€100k', '€50k'])
  assert.equal(germany.penaltySchedule[0].conditionalTurnoverCap, true)
  assert.match(germany.penaltySchedule[0].scope, /§15\(5\)/)
})

test('Germany does not turn an unlocated public penalty into a zero', () => {
  const germany = COUNTRY_RECORDS.find((item) => item.id === GERMANY_ID)

  assert.ok(germany)
  assert.equal(germany.enforcementSummary.publishedPenaltyStatus, 'not_located')
  assert.equal(germany.enforcementSummary.publishedPenaltyCount, null)
  assert.equal(getCountryMetrics(germany).publishedPenaltyLabel, '未定位到公开处罚决定')
})

test('Germany has five complaint routes and a pending second-hand transfer issue', () => {
  const germany = COUNTRY_RECORDS.find((item) => item.id === GERMANY_ID)

  assert.ok(germany)
  assert.equal(germany.complaintRoutes.length, 5)
  assert.equal(germany.issues.find((issue) => issue.issue === 'second_hand_transfer')?.status, 'pending')
})

test('the Netherlands records the enacted authority, reporting route, and domestic penalty caps', () => {
  const netherlands = COUNTRY_RECORDS.find((item) => item.id === 'nl')

  assert.ok(netherlands)
  assert.equal(netherlands.coverage, 'deep')
  assert.equal(netherlands.applicableFrom, '2025-09-12')
  assert.equal(netherlands.nationalActEffectiveFrom, '2025-11-21')
  assert.equal(netherlands.implementingAct, 'Uitvoeringswet dataverordening · Wet van 29 oktober 2025')
  assert.deepEqual(netherlands.competentAuthorities.map((authority) => authority.nameEn), [
    'Netherlands Authority for Consumers and Markets (ACM)',
    'Dutch Data Protection Authority (AP)',
  ])
  assert.ok(netherlands.complaintRoutes.some((route) => route.url.includes('uw-melding-over-een-online-platform')))
  assert.ok(netherlands.penaltySchedule.some((tier) => tier.label.includes('10% EU turnover')))
  assert.ok(netherlands.penaltySchedule.some((tier) => tier.label.includes('GDPR Art. 83(5)')))
  assert.equal(netherlands.enforcementSummary.publishedPenaltyStatus, 'not_located')
  assert.equal(netherlands.issues.find((issue) => issue.issue === 'device_access')?.status, 'verified')
  assert.equal(netherlands.issues.find((issue) => issue.issue === 'third_party_sharing')?.status, 'verified')
  assert.equal(netherlands.issues.find((issue) => issue.issue === 'second_hand_transfer')?.status, 'pending')
  assert.ok(netherlands.competentAuthorities.every((authority) => authority.evidence.sourceUrls.length > 0 && authority.evidence.lastVerifiedAt))
  assert.ok(netherlands.complaintRoutes.every((route) => route.evidence.sourceUrls.length > 0 && route.evidence.evidenceStatus === route.status))
  assert.ok(netherlands.penaltySchedule.every((tier) => tier.evidence.sourceUrls.includes(tier.sourceUrl)))
  assert.ok(netherlands.sources.some((source) => source.id === 'nl-implementing-act'))
})

test('the second country batch separates enacted Denmark and Finland from partial Belgium and Austria', () => {
  const italy = COUNTRY_RECORDS.find((item) => item.id === 'it')!
  const belgium = COUNTRY_RECORDS.find((item) => item.id === 'be')!
  const austria = COUNTRY_RECORDS.find((item) => item.id === 'at')!
  const denmark = COUNTRY_RECORDS.find((item) => item.id === 'dk')!
  const finland = COUNTRY_RECORDS.find((item) => item.id === 'fi')!

  assert.equal(italy.coverage, 'partial')
  assert.equal(italy.implementationStage, 'not_located')
  assert.ok(italy.sources.some((source) => source.id === 'it-agcom-data-act-ptpct-2026'))
  assert.match(italy.coverageNote ?? '', /主管机关|罚则/)

  assert.equal(belgium.coverage, 'partial')
  assert.equal(belgium.implementationStage, 'draft')
  assert.equal(belgium.competentAuthorities.length, 1)
  assert.equal(belgium.penaltySchedule.length, 0)
  assert.ok(belgium.sources.some((source) => source.id === 'be-bipt-data-act'))
  assert.match(belgium.coverageNote ?? '', /BIPT|草案/)

  assert.equal(austria.coverage, 'partial')
  assert.equal(austria.implementationStage, 'not_located')
  assert.ok(austria.competentAuthorities.some((authority) => authority.nameEn.includes('Data Protection Authority')))
  assert.equal(austria.complaintRoutes.length, 0)
  assert.equal(austria.penaltySchedule.length, 0)
  assert.match(austria.coverageNote ?? '', /尚未|指定/)

  assert.equal(denmark.coverage, 'deep')
  assert.equal(denmark.implementationStage, 'enacted')
  assert.ok(denmark.competentAuthorities.some((authority) => authority.nameEn.includes('Danish Agency for Digital Government')))
  assert.equal(denmark.complaintRoutes.length, 2)
  assert.ok(denmark.penaltySchedule.some((tier) => tier.legalBasis.includes('§10')))
  assert.equal(denmark.issues.find((issue) => issue.issue === 'device_access')?.status, 'verified')
  assert.equal(denmark.issues.find((issue) => issue.issue === 'second_hand_transfer')?.status, 'pending')

  assert.equal(finland.coverage, 'deep')
  assert.equal(finland.implementationStage, 'enacted')
  assert.ok(finland.competentAuthorities.some((authority) => authority.nameEn.includes('Traficom')))
  assert.ok(finland.complaintRoutes.some((route) => route.url.includes('customer-service-data-ai')))
  assert.ok(finland.penaltySchedule.some((tier) => tier.label.includes('4%')))
  assert.ok(finland.sources.some((source) => source.id === 'fi-data-supervision-law'))
})

test('the evidence refresh separates Spain Data Act guidance from the BOE DSA cooperation text', () => {
  const spain = COUNTRY_RECORDS.find((item) => item.id === 'es')!
  const italy = COUNTRY_RECORDS.find((item) => item.id === 'it')!
  const belgium = COUNTRY_RECORDS.find((item) => item.id === 'be')!
  const austria = COUNTRY_RECORDS.find((item) => item.id === 'at')!

  assert.equal(DATA_AS_OF, '2026-11-21')
  assert.ok(spain.sources.some((source) => source.id === 'es-data-act-guide' && source.sourceType === 'research-lead'))
  assert.ok(spain.sources.every((source) => source.id !== 'es-boe-cnmc-aepd-cooperation'))
  assert.match(spain.coverageNote ?? '', /Data Act 指南|未确认|主管机关/)

  assert.ok(italy.sources.some((source) => source.id === 'it-agcom-data-act-ptpct-2026' && source.sourceType === 'research-lead'))
  assert.match(italy.coverageNote ?? '', /AGCOM|未找到|指定/)
  assert.ok(belgium.sources.some((source) => source.id === 'be-bipt-work-plan-2026'))
  assert.ok(austria.sources.some((source) => source.id === 'at-rtr-data-act-newsletter-2026'))
})

test('new partial records retain draft implementation evidence without final legal facts', () => {
  const czechia = COUNTRY_RECORDS.find((item) => item.id === 'cz')!
  const hungary = COUNTRY_RECORDS.find((item) => item.id === 'hu')!
  const slovakia = COUNTRY_RECORDS.find((item) => item.id === 'sk')!

  assert.equal(czechia.implementationStage, 'legislative')
  assert.match(czechia.coverageNote ?? '', /RVIS|Data Act|草案/)
  assert.ok(czechia.sources.some((source) => source.id === 'cz-rvis-data-act-draft'))

  assert.equal(hungary.implementationStage, 'legislative')
  assert.match(hungary.coverageNote ?? '', /T\/13050|未通过|主管机关/)
  assert.ok(hungary.sources.some((source) => source.id === 'hu-naih-annual-report-2025'))

  assert.equal(slovakia.implementationStage, 'legislative')
  assert.match(slovakia.coverageNote ?? '', /MIRRI|实施法|Data Act/)
  assert.ok(slovakia.sources.some((source) => source.id === 'sk-mirri-data-act-law'))

  for (const country of [czechia, hungary, slovakia]) {
    if (country.id === 'cz') assert.equal(country.competentAuthorities.length, 1)
    else assert.equal(country.competentAuthorities.length, 0)
    if (country.id === 'cz') assert.equal(country.complaintRoutes.length, 1)
    else assert.equal(country.complaintRoutes.length, 0)
    assert.equal(country.penaltySchedule.length, 0)
    assert.deepEqual(country.enforcementCases, [])
  }
})

test('the remaining EU records distinguish twenty-two partial records from five deeply verified countries', () => {
  const expectedPartial = ['at', 'be', 'bg', 'hr', 'cy', 'cz', 'ee', 'fr', 'gr', 'hu', 'ie', 'it', 'lv', 'lu', 'mt', 'pl', 'pt', 'ro', 'sk', 'si', 'es', 'se']
  const expectedQueue: string[] = []

  assert.deepEqual(COUNTRY_RECORDS.filter((country) => country.coverage === 'partial').map((country) => country.id), expectedPartial)
  assert.deepEqual(COUNTRY_RECORDS.filter((country) => country.coverage === 'queue').map((country) => country.id), expectedQueue)
  assert.equal(COUNTRY_RECORDS.filter((country) => country.coverage === 'deep').length, 5)
  assert.equal(COUNTRY_RECORDS.length, 27)

  for (const countryId of ['ie', 'pt', 'ro', 'se']) {
    const country = COUNTRY_RECORDS.find((item) => item.id === countryId)!
    if (countryId === 'ie') assert.equal(country.competentAuthorities.length, 2)
    if (countryId === 'ro') assert.equal(country.competentAuthorities.length, 2)
    if (countryId === 'se') assert.equal(country.competentAuthorities.length, 1)
    if (countryId === 'pt') assert.equal(country.competentAuthorities.length, 0)
    if (countryId === 'se') assert.equal(country.complaintRoutes.length, 1)
    if (countryId === 'ie') assert.equal(country.complaintRoutes.length, 2)
    if (countryId === 'pt' || countryId === 'ro') assert.equal(country.complaintRoutes.length, 0)
    if (countryId === 'ie') assert.equal(country.penaltySchedule.length, 3)
    if (countryId === 'se') assert.equal(country.penaltySchedule.length, 1)
    if (countryId === 'pt' || countryId === 'ro') assert.equal(country.penaltySchedule.length, 0)
    assert.ok(country.sources.some((source) => source.sourceType !== 'eu-regulation' && source.sourceType !== 'eu-country-list'))
  }

  const malta = COUNTRY_RECORDS.find((country) => country.id === 'mt')!
  assert.equal(malta.coverage, 'partial')
  assert.equal(malta.implementationStage, 'enacted')
  assert.equal(malta.implementingAct, 'Fair Access to and Use of Data Regulations, 2025 · L.N. 222 of 2025')
  assert.equal(malta.implementingActUrl, 'https://legislation.mt/eli/ln/2025/222/eng')
  assert.ok(malta.competentAuthorities.some((authority) => authority.nameEn.includes('MDIA')))
  assert.ok(malta.competentAuthorities.some((authority) => authority.nameEn.includes('Malta Communications Authority')))
  assert.ok(malta.complaintRoutes.some((route) => route.url.includes('regulatory-complaints')))
  assert.ok(malta.complaintRoutes.some((route) => route.id === 'mt-mca-data-act-complaint'))
  assert.equal(malta.penaltySchedule.length, 3)

  for (const countryId of ['cz', 'hu', 'sk']) {
    const country = COUNTRY_RECORDS.find((item) => item.id === countryId)!
    assert.equal(country.coverage, 'partial')
    assert.equal(country.implementationStage, 'legislative')
    if (countryId === 'cz') assert.equal(country.competentAuthorities.length, 1)
    else assert.equal(country.competentAuthorities.length, 0)
    if (countryId === 'cz') assert.equal(country.complaintRoutes.length, 1)
    else assert.equal(country.complaintRoutes.length, 0)
    assert.equal(country.penaltySchedule.length, 0)
    assert.deepEqual(country.enforcementCases, [])
    assert.ok(country.sources.some((source) => source.sourceType === 'research-lead'))
  }

  assert.ok(COUNTRY_RECORDS.find((country) => country.id === 'cz')?.sources.some((source) => source.id === 'cz-rvis-data-act-draft'))
  assert.ok(COUNTRY_RECORDS.find((country) => country.id === 'cz')?.sources.some((source) => source.id === 'cz-ctu-data-act-future-role'))
  assert.ok(COUNTRY_RECORDS.find((country) => country.id === 'hu')?.sources.some((source) => source.id === 'hu-naih-annual-report-2025'))
  assert.ok(COUNTRY_RECORDS.find((country) => country.id === 'sk')?.sources.some((source) => source.id === 'sk-mirri-data-act-law'))

  assert.ok(COUNTRY_RECORDS.every((country) => country.sources.some((source) => source.sourceType !== 'eu-regulation' && source.sourceType !== 'eu-country-list')))
})

test('the next country evidence batch records official implementation signals without inventing final enforcement facts', () => {
  const bulgaria = COUNTRY_RECORDS.find((country) => country.id === 'bg')!
  const croatia = COUNTRY_RECORDS.find((country) => country.id === 'hr')!
  const cyprus = COUNTRY_RECORDS.find((country) => country.id === 'cy')!
  const malta = COUNTRY_RECORDS.find((country) => country.id === 'mt')!
  const lithuania = COUNTRY_RECORDS.find((country) => country.id === 'lt')!

  assert.equal(bulgaria.coverage, 'partial')
  assert.equal(bulgaria.implementationStage, 'legislative')
  assert.ok(bulgaria.sources.some((source) => source.id === 'bg-midt-data-act'))

  assert.equal(croatia.coverage, 'partial')
  assert.equal(croatia.implementationStage, 'legislative')
  assert.ok(croatia.sources.some((source) => source.id === 'hr-mpudt-data-act-plan'))

  assert.equal(cyprus.coverage, 'partial')
  assert.ok(cyprus.competentAuthorities.some((authority) => authority.nameEn.includes('Deputy Ministry of Research, Innovation and Digital Policy')))
  assert.equal(cyprus.complaintRoutes.length, 0)
  assert.equal(cyprus.penaltySchedule.length, 0)

  assert.equal(lithuania.coverage, 'deep')
  assert.ok(lithuania.competentAuthorities.some((authority) => authority.nameEn.includes('Communications Regulatory Authority of the Republic of Lithuania')))
  assert.ok(lithuania.complaintRoutes.some((route) => route.url.includes('duomenu-akto-prieziura')))
  assert.equal(lithuania.penaltySchedule.length, 2)

  assert.equal(malta.coverage, 'partial')
  assert.ok(malta.complaintRoutes.some((route) => route.url.includes('regulatory-complaints')))
  assert.ok(malta.sources.some((source) => source.id === 'mt-legal-notice-222-2025'))
  assert.equal(malta.enforcementSummary.publishedPenaltyStatus, 'not_located')
})

test('new official signals keep proposed authorities and live Swedish intake visibly pending or verified', () => {
  const belgium = COUNTRY_RECORDS.find((country) => country.id === 'be')!
  const czechia = COUNTRY_RECORDS.find((country) => country.id === 'cz')!
  const ireland = COUNTRY_RECORDS.find((country) => country.id === 'ie')!
  const poland = COUNTRY_RECORDS.find((country) => country.id === 'pl')!
  const portugal = COUNTRY_RECORDS.find((country) => country.id === 'pt')!
  const romania = COUNTRY_RECORDS.find((country) => country.id === 'ro')!
  const sweden = COUNTRY_RECORDS.find((country) => country.id === 'se')!

  assert.equal(getCountryEvidenceStatus(belgium, 'authority'), 'pending')
  assert.equal(getCountryEvidenceStatus(czechia, 'authority'), 'pending')
  assert.equal(getCountryEvidenceStatus(czechia, 'complaint_route'), 'pending')
  assert.equal(getCountryEvidenceStatus(ireland, 'authority'), 'pending')
  assert.equal(getCountryEvidenceStatus(ireland, 'complaint_route'), 'pending')
  assert.equal(getCountryEvidenceStatus(ireland, 'penalty_schedule'), 'pending')
  assert.equal(getCountryEvidenceStatus(romania, 'authority'), 'pending')
  assert.equal(getCountryEvidenceStatus(sweden, 'authority'), 'verified')
  assert.equal(getCountryEvidenceStatus(sweden, 'complaint_route'), 'verified')
  assert.equal(sweden.implementationStage, 'legislative')
  assert.equal(getCountryEvidenceStatus(sweden, 'penalty_schedule'), 'pending')
  assert.ok(poland.competentAuthorities.some((authority) => authority.nameEn.includes('UKE')))
  assert.equal(getCountryEvidenceStatus(poland, 'authority'), 'pending')
  assert.equal(getCountryEvidenceStatus(poland, 'complaint_route'), 'pending')
  const slovenia = COUNTRY_RECORDS.find((country) => country.id === 'si')!
  assert.equal(getCountryEvidenceStatus(slovenia, 'authority'), 'pending')
  assert.equal(slovenia.competentAuthorities.length, 2)
  assert.ok(portugal.sources.some((source) => source.id === 'pt-data-act-execution-plan'))
  assert.equal(portugal.competentAuthorities.length, 0)
  assert.equal(portugal.complaintRoutes.length, 0)
})

test('each country keeps unresolved enforcement fields explicit instead of using zero as a proxy for missing evidence', () => {
  for (const country of COUNTRY_RECORDS) {
    if (country.enforcementSummary.publishedPenaltyStatus !== 'verified') {
      assert.equal(country.enforcementSummary.publishedPenaltyCount, null)
      assert.equal(country.enforcementSummary.publishedPenaltyAmountEur, null)
    }

    for (const enforcementCase of country.enforcementCases) {
      assert.ok(enforcementCase.sourceUrls.length > 0)
      assert.equal(enforcementCase.evidence.evidenceStatus, 'verified')
    }
  }
})

test('partial countries expose field-level evidence status without upgrading overall coverage', () => {
  const cyprus = COUNTRY_RECORDS.find((country) => country.id === 'cy')!
  const malta = COUNTRY_RECORDS.find((country) => country.id === 'mt')!

  assert.equal(cyprus.coverage, 'partial')
  assert.equal(getCountryEvidenceStatus(cyprus, 'authority'), 'verified')
  assert.equal(getCountryEvidenceStatus(cyprus, 'complaint_route'), 'not_located')
  assert.equal(getCountryEvidenceStatus(cyprus, 'penalty_schedule'), 'not_located')
  assert.equal(getCountryEvidenceStatus(cyprus, 'published_penalty'), 'pending')

  assert.equal(getCountryEvidenceStatus(malta, 'authority'), 'verified')
  assert.equal(getCountryEvidenceStatus(malta, 'complaint_route'), 'verified')
  assert.equal(getCountryEvidenceStatus(malta, 'penalty_schedule'), 'verified')
  assert.equal(getCountryEvidenceStatus(malta, 'published_penalty'), 'not_located')
})

test('Germany legal facts retain source URLs, freshness, and evidence state', () => {
  const germany = COUNTRY_RECORDS.find((item) => item.id === GERMANY_ID)!

  assert.ok(germany.competentAuthorities.every((authority) => authority.evidence.sourceUrls.length > 0 && authority.evidence.lastVerifiedAt))
  assert.ok(germany.complaintRoutes.every((route) => route.evidence.sourceUrls.length > 0 && route.evidence.evidenceStatus === route.status))
  assert.ok(germany.penaltySchedule.every((tier) => tier.evidence.sourceUrls.includes(tier.sourceUrl)))
  assert.ok(germany.issues.every((issue) => issue.evidence.sourceUrls.length > 0 && issue.evidence.evidenceStatus === issue.status))
  assert.equal(germany.enforcementSummary.sourceUrls.length, 2)
  assert.ok(germany.sources.every((source) => !source.id.startsWith('nl-')))
})

test('France, Poland, and Spain are partial records with explicit implementation stages', () => {
  const france = COUNTRY_RECORDS.find((item) => item.id === 'fr')

  assert.ok(france)
  assert.equal(france.coverage, 'partial')
  assert.equal(france.implementationStage, 'draft')
  assert.equal(france.competentAuthorities.length, 1)
  assert.equal(getCountryEvidenceStatus(france, 'authority'), 'pending')
  assert.equal(france.complaintRoutes.length, 0)
  assert.equal(france.penaltySchedule.length, 0)
  assert.equal(france.enforcementSummary.publishedPenaltyStatus, 'pending')
  assert.match(france.coverageNote ?? '', /CNIL|DDADUE/)
  assert.ok(france.sources.some((source) => source.id === 'fr-cnil-data-act'))

  const poland = COUNTRY_RECORDS.find((item) => item.id === 'pl')
  const spain = COUNTRY_RECORDS.find((item) => item.id === 'es')

  assert.ok(poland)
  assert.ok(spain)
  assert.equal(poland.coverage, 'partial')
  assert.equal(poland.implementationStage, 'legislative')
  assert.match(poland.coverageNote ?? '', /议会|法案/)
  assert.ok(poland.sources.some((source) => source.id === 'pl-data-act-bill'))
  assert.equal(spain.coverage, 'partial')
  assert.equal(spain.implementationStage, 'not_located')
  assert.match(spain.coverageNote ?? '', /Data Act 指南|未确认|主管机关/)
  assert.ok(spain.sources.some((source) => source.id === 'es-data-act-guide'))
})

test('country register covers all 27 EU member states without inventing implementation facts', () => {
  const expectedIso2 = ['DE', 'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE']

  assert.deepEqual(COUNTRY_RECORDS.map((country) => country.iso2), expectedIso2)
  assert.equal(COUNTRY_RECORDS.length, 27)
  assert.equal(COUNTRY_RECORDS.filter((country) => country.coverage === 'deep').length, 5)
  assert.equal(COUNTRY_RECORDS.filter((country) => country.coverage === 'partial').length, 22)
  assert.equal(COUNTRY_RECORDS.filter((country) => country.coverage === 'queue').length, 0)
})

test('every EU country exposes the three hardware issue lenses with explicit pending status when national mapping is incomplete', () => {
  const issueTypes = ['device_access', 'third_party_sharing', 'second_hand_transfer']

  for (const country of COUNTRY_RECORDS) {
    assert.deepEqual(country.issues.map((issue) => issue.issue), issueTypes)
    assert.ok(country.issues.every((issue) => issue.sourceUrls.length > 0 && issue.evidence.sourceUrls.length > 0))

    if (country.coverage !== 'deep') {
      assert.ok(country.issues.every((issue) => issue.status === 'pending'))
      assert.ok(country.issues.every((issue) => issue.nationalBasis.includes('待补充本国法映射')))
    }
  }
})

test('coverage metrics keep deep, partial, and queue countries separate', () => {
  const metrics = getCoverageMetrics(COUNTRY_RECORDS)

  assert.equal(metrics.deepCount, 5)
  assert.equal(metrics.partialCount, 22)
  assert.equal(metrics.queueCount, 0)
  assert.equal(metrics.totalTrackedCountries, 27)
})

test('country registry filters are composable and keep missing facts distinct from verified absence', () => {
  assert.deepEqual(filterCountries(COUNTRY_RECORDS, { ...DEFAULT_COUNTRY_FILTERS, coverage: 'partial' }).map((country) => country.id), ['at', 'be', 'bg', 'hr', 'cy', 'cz', 'ee', 'fr', 'gr', 'hu', 'ie', 'it', 'lv', 'lu', 'mt', 'pl', 'pt', 'ro', 'sk', 'si', 'es', 'se'])
  assert.deepEqual(filterCountries(COUNTRY_RECORDS, { ...DEFAULT_COUNTRY_FILTERS, implementationStage: 'enacted' }).map((country) => country.id), ['de', 'dk', 'fi', 'lt', 'mt', 'nl'])
  assert.equal(filterCountries(COUNTRY_RECORDS, { ...DEFAULT_COUNTRY_FILTERS, authority: 'present' }).length, 16)
  assert.equal(filterCountries(COUNTRY_RECORDS, { ...DEFAULT_COUNTRY_FILTERS, complaintRoute: 'present' }).length, 10)
  assert.equal(filterCountries(COUNTRY_RECORDS, { ...DEFAULT_COUNTRY_FILTERS, penaltySchedule: 'present' }).length, 8)
  assert.deepEqual(filterCountries(COUNTRY_RECORDS, { ...DEFAULT_COUNTRY_FILTERS, publishedPenaltyStatus: 'not_located' }).map((country) => country.id), ['de', 'dk', 'fi', 'lt', 'mt', 'nl'])
  assert.equal(filterCountries(COUNTRY_RECORDS, { ...DEFAULT_COUNTRY_FILTERS, publishedPenaltyStatus: 'verified' }).length, 0)
  assert.deepEqual(filterCountries(COUNTRY_RECORDS, { ...DEFAULT_COUNTRY_FILTERS, coverage: 'partial', authority: 'missing' }).map((country) => country.id), ['bg', 'hr', 'ee', 'gr', 'hu', 'it', 'lv', 'lu', 'pt', 'sk', 'es'])
})

test('formatters keep legal dates readable and statuses explicit', () => {
  assert.equal(formatDate('2026-05-30'), '2026年5月30日')
  assert.equal(formatCoverage('partial'), '部分核验')
  assert.equal(formatVerificationStatus('not_located'), '未定位到公开记录')
  assert.equal(formatVerificationStatus('pending'), '待核验')
  assert.equal(formatIssueLabel('second_hand_transfer'), '二手转让 / 设备继受')
})

test('issue filtering respects the active issue set without mutating the registry', () => {
  const germany = COUNTRY_RECORDS.find((item) => item.id === GERMANY_ID)!
  const filtered = filterIssues(germany.issues, ['device_access', 'second_hand_transfer'])

  assert.deepEqual(filtered.map((issue) => issue.issue), ['device_access', 'second_hand_transfer'])
  assert.equal(germany.issues.length, 3)
  assert.equal(filterIssues(germany.issues, []).length, 0)
})

test('country view-models keep partial status and copy reference explicit', () => {
  const germany = COUNTRY_RECORDS.find((item) => item.id === GERMANY_ID)!
  const france = COUNTRY_RECORDS.find((item) => item.id === 'fr')!

  assert.equal(formatCountryStatus(germany), '已核验')
  assert.equal(formatCountryStatus(france), '部分核验')
  assert.equal(buildCountryReference(germany), '德国 Germany · Data Act · DADG · verified 2026-11-21')
  assert.match(buildCountryReference(france), /partial coverage/)
  assert.doesNotMatch(buildCountryReference(france), /verified/)
})

test('timeline events sort newest first without mutating the registry', () => {
  const germany = COUNTRY_RECORDS.find((item) => item.id === GERMANY_ID)!
  const sorted = sortTimelineEvents(germany.timeline)

  assert.equal(sorted[0].date, '2026-11-21')
  assert.equal(germany.timeline[0].date, '2026-11-21')
})

test('exports include only the active issue view and preserve source traceability', () => {
  const germany = COUNTRY_RECORDS.find((item) => item.id === GERMANY_ID)!
  const json = JSON.parse(buildJsonExport(germany, ['device_access'])) as { issues: Array<{ issue: string }>; country: string; changeLog: Array<{ countryId: string }>; sourceFreshness: Array<{ sourceId: string; status: string }> }
  const markdown = buildMarkdownExport(germany, ['device_access'])

  assert.equal(json.country, '德国')
  assert.deepEqual(json.issues.map((issue) => issue.issue), ['device_access'])
  assert.ok(json.changeLog.every((entry) => entry.countryId === 'de'))
  assert.ok(json.sourceFreshness.every((entry) => entry.sourceId && entry.status))
  assert.match(markdown, /DADG §15/)
  assert.match(markdown, /BNetzA/)
  assert.match(markdown, /www\.bundesnetzagentur\.de/)
})

test('actual enforcement cases stay separate from statutory penalties and remain honest when empty', () => {
  const germany = COUNTRY_RECORDS.find((item) => item.id === GERMANY_ID)!
  const denmark = COUNTRY_RECORDS.find((item) => item.id === 'dk')!
  const json = JSON.parse(buildJsonExport(germany, [])) as { enforcementCases: unknown[] }
  const markdown = buildMarkdownExport(denmark, [])

  assert.deepEqual(germany.enforcementCases, [])
  assert.deepEqual(denmark.enforcementCases, [])
  assert.deepEqual(json.enforcementCases, [])
  assert.match(markdown, /## 实际执法/)
  assert.match(markdown, /未定位到已公开的 Data Act 罚款决定/)
  assert.doesNotMatch(markdown, /0 项公开处罚决定/)
})

test('enforcement monitors follow official sources without inferring enforcement cases', () => {
  const monitors = buildEnforcementMonitors(COUNTRY_RECORDS, DATA_AS_OF)
  const germanyMonitor = monitors.find((monitor) => monitor.countryId === 'de' && monitor.sourceId === 'bnetza-complaint-portal')
  const queueMonitor = monitors.find((monitor) => monitor.countryId === 'bg' && monitor.sourceId === 'bg-crc-research-lead')
  const spainGuideMonitor = monitors.find((monitor) => monitor.countryId === 'es' && monitor.sourceId === 'es-data-act-guide')

  assert.ok(germanyMonitor)
  assert.equal(germanyMonitor.status, 'active')
  assert.equal(germanyMonitor.lastCheckedAt, DATA_AS_OF)
  assert.equal(germanyMonitor.url, 'https://www.bundesnetzagentur.de/DE/Fachthemen/Digitales/DataAct/Beschwerdeportal/start.html')
  assert.ok(germanyMonitor.evidence.sourceUrls.includes(germanyMonitor.url))

  assert.ok(queueMonitor)
  assert.equal(queueMonitor.status, 'candidate')
  assert.equal(queueMonitor.sourceType, 'research-lead')
  assert.ok(spainGuideMonitor)
  assert.equal(spainGuideMonitor.status, 'candidate')
  assert.ok(monitors.every((monitor) => !monitor.url.includes('european-union.europa.eu')))
  assert.deepEqual(COUNTRY_RECORDS.find((country) => country.id === 'de')?.enforcementCases, [])
})

test('EU-wide case register stays empty for the current official evidence set', () => {
  assert.deepEqual(buildEnforcementCaseRegister(COUNTRY_RECORDS), [])
  assert.deepEqual(filterEnforcementCases([], DEFAULT_ENFORCEMENT_CASE_FILTERS), [])
})

test('EU-wide empty case register stays separate from official source monitoring', () => {
  const cases = buildEnforcementCaseRegister(COUNTRY_RECORDS)
  const monitors = buildEnforcementMonitors(COUNTRY_RECORDS, DATA_AS_OF)

  assert.deepEqual(cases, [])
  assert.ok(monitors.length > 0)
  assert.ok(monitors.every((monitor) => !cases.some((item) => item.id === monitor.sourceId)))
})

test('EU-wide case register flattens, sorts, filters, and does not mutate country cases', () => {
  const makeCase = (overrides: Partial<EnforcementCase>): EnforcementCase => ({
    id: 'case-default',
    countryId: 'de',
    authorityName: 'BNetzA',
    decisionDate: '2026-01-01',
    entity: 'Example Mobility GmbH',
    issue: 'device_access',
    measure: '行政罚款',
    amountEur: 1000,
    status: 'final',
    sourceUrls: ['https://example.test/case'],
    evidence: {
      sourceUrls: ['https://example.test/case'],
      lastVerifiedAt: DATA_AS_OF,
      evidenceStatus: 'verified',
    },
    ...overrides,
  })
  const cases = [
    makeCase({ id: 'case-z', decisionDate: '2026-02-01' }),
    makeCase({ id: 'case-old', decisionDate: '2025-12-01', countryId: 'fr', authorityName: 'CNIL', issue: 'third_party_sharing', status: 'appeal' }),
    makeCase({ id: 'case-a', decisionDate: '2026-02-01', authorityName: 'ACM', issue: 'second_hand_transfer', status: 'under_review' }),
  ]
  const records = [
    { ...COUNTRY_RECORDS[0], enforcementCases: [cases[0], cases[1]] },
    { ...COUNTRY_RECORDS[1], enforcementCases: [cases[2]] },
  ]

  assert.deepEqual(buildEnforcementCaseRegister(records).map((item) => item.id), ['case-a', 'case-z', 'case-old'])
  assert.deepEqual(filterEnforcementCases(cases, { ...DEFAULT_ENFORCEMENT_CASE_FILTERS, countryId: 'de' }).map((item) => item.id), ['case-z', 'case-a'])
  assert.deepEqual(filterEnforcementCases(cases, { ...DEFAULT_ENFORCEMENT_CASE_FILTERS, authorityName: 'CNIL' }).map((item) => item.id), ['case-old'])
  assert.deepEqual(filterEnforcementCases(cases, { ...DEFAULT_ENFORCEMENT_CASE_FILTERS, issue: 'second_hand_transfer' }).map((item) => item.id), ['case-a'])
  assert.deepEqual(filterEnforcementCases(cases, { ...DEFAULT_ENFORCEMENT_CASE_FILTERS, status: 'appeal' }).map((item) => item.id), ['case-old'])
  assert.deepEqual(cases.map((item) => item.id), ['case-z', 'case-old', 'case-a'])
})

test('JSON and Markdown exports include monitors as a layer separate from actual cases', () => {
  const germany = COUNTRY_RECORDS.find((item) => item.id === GERMANY_ID)!
  const json = JSON.parse(buildJsonExport(germany, [])) as { enforcementMonitors: Array<{ sourceId: string }>; enforcementCases: unknown[] }
  const markdown = buildMarkdownExport(germany, [])

  assert.ok(json.enforcementMonitors.some((monitor) => monitor.sourceId === 'bnetza-complaint-portal'))
  assert.deepEqual(json.enforcementCases, [])
  assert.match(markdown, /## 官方来源监测/)
  assert.match(markdown, /bnetza-complaint-portal|BNetzA/)
})

test('review queue assigns deterministic priority, due dates, target fields, and source links', () => {
  const germany = COUNTRY_RECORDS.find((item) => item.id === GERMANY_ID)!
  const france = COUNTRY_RECORDS.find((item) => item.id === 'fr')!
  const bulgaria = COUNTRY_RECORDS.find((item) => item.id === 'bg')!
  const items = buildReviewQueue([
    { ...germany, lastVerifiedAt: '2026-08-01' },
    { ...france, lastVerifiedAt: '2026-10-01' },
    bulgaria,
  ], DATA_AS_OF)

  const germanyItem = items.find((item) => item.countryId === 'de')!
  const franceItem = items.find((item) => item.countryId === 'fr')!
  const bulgariaItem = items.find((item) => item.countryId === 'bg')!

  assert.equal(germanyItem.priority, 'low')
  assert.equal(germanyItem.nextReviewAt, '2026-09-30')
  assert.equal(germanyItem.due, true)
  assert.ok(germanyItem.targetFields.includes('实际处罚决定'))
  assert.ok(germanyItem.targetFields.includes('联网硬件争议映射'))
  assert.ok(germanyItem.sourceUrls.includes('https://www.bundesnetzagentur.de/DE/Fachthemen/Digitales/DataAct/start.html'))

  assert.equal(franceItem.priority, 'high')
  assert.equal(franceItem.nextReviewAt, '2026-10-31')
  assert.equal(franceItem.due, true)
  assert.ok(franceItem.targetFields.includes('主管机关'))
  assert.ok(franceItem.targetFields.includes('国内法定罚则'))

  assert.equal(bulgariaItem.priority, 'high')
  assert.equal(bulgariaItem.nextReviewAt, '2026-12-21')
  assert.equal(bulgariaItem.due, false)

  assert.equal(filterReviewQueue(items, { countryId: 'fr', priority: 'all', due: 'all' }).length, 1)
  assert.equal(filterReviewQueue(items, { countryId: 'all', priority: 'high', due: 'due' }).length, 1)
  assert.equal(filterReviewQueue(items, { countryId: 'all', priority: 'all', due: 'not-due' }).length, 1)
})

test('JSON and Markdown exports include the selected country review queue', () => {
  const france = COUNTRY_RECORDS.find((item) => item.id === 'fr')!
  const json = JSON.parse(buildJsonExport(france, [])) as { reviewQueue: Array<{ countryId: string; targetFields: string[] }> }
  const markdown = buildMarkdownExport(france, [])

  assert.equal(json.reviewQueue.length, 1)
  assert.equal(json.reviewQueue[0].countryId, 'fr')
  assert.ok(json.reviewQueue[0].targetFields.includes('主管机关'))
  assert.match(markdown, /## 维护复核队列/)
})

test('source freshness distinguishes current, review, stale, unknown, and future dates', () => {
  assert.equal(getCurrentIsoDate(new Date('2026-11-20T12:00:00.000Z')), '2026-11-20')
  assert.equal(getSourceFreshness('2026-11-19', '2026-11-20').status, 'current')
  assert.equal(getSourceFreshness('2026-09-01', '2026-11-20').status, 'review')
  assert.equal(getSourceFreshness('2026-05-01', '2026-11-20').status, 'stale')
  assert.equal(getSourceFreshness(undefined, '2026-11-20').status, 'unknown')
  assert.equal(getSourceFreshness('not-a-date', '2026-11-20').status, 'unknown')
  assert.equal(getSourceFreshness('2026-11-21', '2026-11-20').status, 'unknown')
  assert.match(getSourceFreshness('2026-11-21', '2026-11-20').note, /未来/)
})

test('change log entries are country-filterable and retain official source traceability', () => {
  assert.ok(CHANGE_LOG.length >= 8)
  assert.ok(CHANGE_LOG.every((entry) => COUNTRY_RECORDS.some((country) => country.id === entry.countryId)))
  assert.ok(CHANGE_LOG.every((entry) => entry.sourceUrls.length > 0 && entry.date && entry.evidenceStatus))
  assert.ok(filterChangeLog(CHANGE_LOG, { countryId: 'fr', kind: 'all' }).every((entry) => entry.countryId === 'fr'))
  assert.ok(filterChangeLog(CHANGE_LOG, { countryId: 'all', kind: 'review' }).every((entry) => entry.kind === 'review'))
  assert.ok(filterChangeLog(CHANGE_LOG, { countryId: 'all', kind: 'new' }).length > 0)
})

test('queue exports do not inherit Germany-specific legal claims', () => {
  const france = COUNTRY_RECORDS.find((item) => item.id === 'fr')!
  const markdown = buildMarkdownExport(france, [])

  assert.match(markdown, /# 法国 France · Data Act enforcement tracker/)
  assert.doesNotMatch(markdown, /France Germany/)
  assert.doesNotMatch(markdown, /DADG §15/)
  assert.match(markdown, /## 法定罚款档位/)
})

test('registry validation accepts the current EU-27 evidence set and produces a deduplicated source manifest', () => {
  assert.deepEqual(validateRegistry(COUNTRY_RECORDS), [])

  const manifest = buildSourceManifest(COUNTRY_RECORDS)
  assert.ok(manifest.length > 40)
  assert.equal(new Set(manifest.map((entry) => entry.url)).size, manifest.length)

  const germanyEntry = manifest.find((entry) => entry.url.includes('bundesnetzagentur.de/DE/Fachthemen/Digitales/DataAct/start.html'))
  assert.ok(germanyEntry)
  assert.ok(germanyEntry.countryIds.includes('de'))
  assert.ok(germanyEntry.sourceIds.includes('bnetza-data-act'))
})

test('registry validation rejects missing source traceability instead of silently passing incomplete records', () => {
  const brokenGermany = { ...COUNTRY_RECORDS.find((country) => country.id === GERMANY_ID)!, sources: [] }
  const issues = validateRegistry([brokenGermany, ...COUNTRY_RECORDS.filter((country) => country.id !== GERMANY_ID)])

  assert.ok(issues.some((issue) => issue.path === 'de.sources'))
  assert.ok(issues.some((issue) => issue.message.includes('source')))
})

test('registry validation rejects incomplete evidence and non-official case sources', () => {
  const germany = COUNTRY_RECORDS.find((country) => country.id === GERMANY_ID)!
  const researchLead = {
    ...germany.sources[0],
    id: 'research-lead-fixture',
    url: 'https://research.example.invalid/data-act-fixture',
    sourceType: 'research-lead' as const,
  }
  const brokenGermany = {
    ...germany,
    sources: [...germany.sources, researchLead],
    competentAuthorities: [{
      ...germany.competentAuthorities[0],
      evidence: { ...germany.competentAuthorities[0].evidence, sourceUrls: [], lastVerifiedAt: 'not-a-date' },
    }],
    enforcementCases: [{
      id: 'fixture-case',
      countryId: GERMANY_ID,
      authorityName: 'Fixture authority',
      decisionDate: 'not-a-date',
      entity: 'Fixture entity',
      issue: 'device_access' as const,
      measure: 'Fixture decision',
      amountEur: -1,
      status: 'final' as const,
      sourceUrls: [researchLead.url],
      evidence: { sourceUrls: [researchLead.url], lastVerifiedAt: '2026-11-20', evidenceStatus: 'verified' as const },
    }],
  }

  const issues = validateRegistry([brokenGermany, ...COUNTRY_RECORDS.filter((country) => country.id !== GERMANY_ID)])

  assert.ok(issues.some((issue) => issue.path.includes('competentAuthorities') && issue.message.includes('source URLs')))
  assert.ok(issues.some((issue) => issue.path.includes('competentAuthorities') && issue.message.includes('ISO')))
  assert.ok(issues.some((issue) => issue.path.includes('enforcementCases') && issue.message.includes('date')))
  assert.ok(issues.some((issue) => issue.path.includes('enforcementCases') && issue.message.includes('non-negative')))
  assert.ok(issues.some((issue) => issue.path.includes('enforcementCases') && issue.message.includes('official')))

  const falseZeroGermany = {
    ...germany,
    enforcementSummary: { ...germany.enforcementSummary, publishedPenaltyStatus: 'verified' as const },
  }
  const falseZeroIssues = validateRegistry([falseZeroGermany, ...COUNTRY_RECORDS.filter((country) => country.id !== GERMANY_ID)])
  assert.ok(falseZeroIssues.some((issue) => issue.path === 'de.enforcementSummary' && issue.message.includes('count, amount, or official case')))
})

test('source-health reports treat redirects as reachable and keep HTTP failures explicit', () => {
  assert.equal(isReachableHttpStatus(200), true)
  assert.equal(isReachableHttpStatus(307), true)
  assert.equal(isReachableHttpStatus(403), false)
  assert.equal(isReachableHttpStatus(null), false)

  const report = buildSourceHealthReport('2026-11-20T00:00:00.000Z', [
    { url: 'https://example.test/ok', label: 'ok', countryIds: ['de'], status: 200, ok: true, finalUrl: 'https://example.test/ok', contentType: 'text/html' },
    { url: 'https://example.test/redirect', label: 'redirect', countryIds: ['mt'], status: 307, ok: true, finalUrl: 'https://example.test/redirect', contentType: null },
    { url: 'https://example.test/blocked', label: 'blocked', countryIds: ['lt'], status: 403, ok: false, finalUrl: 'https://example.test/blocked', contentType: 'text/html', error: 'HTTP 403' },
  ], [])

  assert.equal(report.total, 3)
  assert.equal(report.okCount, 2)
  assert.equal(report.failedCount, 1)
  assert.equal(report.passed, false)
})

test('maintenance report aggregates evidence gaps, review due items, and source health without mutating the registry', () => {
  const sourceHealth = buildSourceHealthReport('2026-11-21T00:00:00.000Z', [
    { url: 'https://example.test/ok', label: 'ok', countryIds: ['de'], status: 200, ok: true, finalUrl: 'https://example.test/ok', contentType: 'text/html' },
    { url: 'https://example.test/blocked', label: 'blocked', countryIds: ['lt'], status: 403, ok: false, finalUrl: 'https://example.test/blocked', contentType: 'text/html', error: 'HTTP 403' },
  ], [])
  const report = buildMaintenanceReport(COUNTRY_RECORDS, DATA_AS_OF, '2026-11-21T00:00:00.000Z', {
    registryIssues: validateRegistry(COUNTRY_RECORDS),
    sourceHealth,
  })

  assert.equal(report.schemaVersion, 1)
  assert.equal(report.registry.countryCount, 27)
  assert.equal(report.registry.coverage.deepCount, 5)
  assert.equal(report.registry.coverage.partialCount, 22)
  assert.equal(report.registry.actualEnforcementCaseCount, 0)
  assert.equal(report.registry.validation.passed, true)
  assert.deepEqual(report.evidence.authority, {
    verified: 9,
    pending: 7,
    not_located: 11,
    not_applicable: 0,
    needsFollowUpCountryIds: ['be', 'bg', 'hr', 'cz', 'ee', 'fr', 'gr', 'hu', 'ie', 'it', 'lv', 'lu', 'pl', 'pt', 'ro', 'sk', 'si', 'es'],
  })
  assert.equal(report.evidence.complaint_route.verified, 7)
  assert.equal(report.evidence.complaint_route.pending, 3)
  assert.equal(report.evidence.complaint_route.not_located, 17)
  assert.equal(report.evidence.penalty_schedule.verified, 6)
  assert.equal(report.evidence.penalty_schedule.pending, 2)
  assert.equal(report.evidence.penalty_schedule.not_located, 19)
  assert.equal(report.evidence.published_penalty.not_located, 6)
  assert.equal(report.reviewQueue.total, 27)
  assert.equal(report.reviewQueue.items.length, 27)
  assert.deepEqual(report.sourceHealth?.failedSources.map((source) => source.url), ['https://example.test/blocked'])
  assert.equal(report.sourceHealth?.failedCount, 1)

  const staleFranceReport = buildMaintenanceReport(
    COUNTRY_RECORDS.map((country) => country.id === 'fr' ? { ...country, lastVerifiedAt: '2026-01-01' } : country),
    '2026-11-21',
    '2026-11-21T00:00:00.000Z',
  )
  assert.ok(staleFranceReport.reviewQueue.dueCountryIds.includes('fr'))
  assert.ok(staleFranceReport.reviewQueue.highPriorityDueCount >= 1)
})
