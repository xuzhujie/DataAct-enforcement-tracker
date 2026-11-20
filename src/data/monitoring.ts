import { DATA_AS_OF } from './registry'
import type { CountryRecord, EnforcementMonitor, EnforcementMonitorStatus, SourceRecord } from './types'

const monitorableSourceTypes: SourceRecord['sourceType'][] = [
  'authority',
  'complaint-form',
  'statute',
  'joint-guidance',
  'research-lead',
]

function getMonitorStatus(record: CountryRecord, source: SourceRecord): EnforcementMonitorStatus {
  if (record.coverage !== 'queue' && source.sourceType !== 'research-lead') return 'active'
  return 'candidate'
}

function getMonitorScope(source: SourceRecord): string {
  if (source.note) return source.note
  if (source.sourceType === 'complaint-form') return '持续核验官方投诉入口、受理范围与页面变更。'
  if (source.sourceType === 'statute') return '持续核验国内实施法、授权范围与法定罚则文本。'
  if (source.sourceType === 'authority') return '持续核验主管机关、数据协调员和监督公告。'
  return '持续核验官方状态页面；不据此推断已发生实际执法案件。'
}

export function buildEnforcementMonitors(records: CountryRecord[], asOf = DATA_AS_OF): EnforcementMonitor[] {
  return records.flatMap((record) => record.sources
    .filter((source) => monitorableSourceTypes.includes(source.sourceType))
    .map((source) => ({
      id: `${record.id}:${source.id}`,
      countryId: record.id,
      countryName: record.name,
      sourceId: source.id,
      label: source.label,
      url: source.url,
      sourceType: source.sourceType,
      scope: getMonitorScope(source),
      status: getMonitorStatus(record, source),
      lastCheckedAt: source.lastVerifiedAt || asOf,
      evidence: {
        sourceUrls: [source.url],
        lastVerifiedAt: source.lastVerifiedAt || asOf,
        evidenceStatus: source.evidenceStatus,
      },
    })))
}
