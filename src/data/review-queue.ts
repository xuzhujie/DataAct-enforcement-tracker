import { DATA_AS_OF } from './registry'
import type { CountryRecord, ReviewPriority, ReviewQueueFilterState, ReviewQueueItem } from './types'

const reviewCadenceDays: Record<ReviewPriority, number> = {
  high: 30,
  medium: 90,
  low: 60,
}

function getPriority(record: CountryRecord): ReviewPriority {
  if (record.coverage === 'partial') return 'high'
  if (record.coverage === 'queue') return 'medium'
  return 'low'
}

function addDays(value: string, days: number, fallback: string): string {
  const date = new Date(`${value}T00:00:00Z`)
  if (Number.isNaN(date.getTime())) return fallback
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

function getTargetFields(record: CountryRecord): string[] {
  const fields: string[] = []
  if (record.competentAuthorities.length === 0) fields.push('主管机关')
  if (record.complaintRoutes.length === 0) fields.push('投诉入口')
  if (record.penaltySchedule.length === 0) fields.push('国内法定罚则')
  if (record.enforcementCases.length === 0 || record.enforcementSummary.publishedPenaltyStatus !== 'verified') fields.push('实际处罚决定')
  if (record.issues.length < 3 || record.issues.some((issue) => issue.status !== 'verified')) fields.push('联网硬件争议映射')
  if (fields.length === 0) fields.push('来源新鲜度')
  return fields
}

function getReason(record: CountryRecord, priority: ReviewPriority): string {
  if (record.coverage === 'partial') return '部分核验国家：优先补齐最终主管机关、投诉入口、国内法定罚则和公开处罚决定。'
  if (record.coverage === 'queue') return '待补齐国家：先核验 Data Act 专门主管机关，再补投诉入口、国内法定罚则和公开处罚决定。'
  return priority === 'low' ? '深度核验国家：定期复查官方来源与是否出现公开 Data Act 处罚决定。' : '定期复查官方来源。'
}

function getSourceUrls(record: CountryRecord): string[] {
  const urls = record.sources
    .filter((source) => source.sourceType !== 'eu-regulation' && source.sourceType !== 'eu-country-list')
    .map((source) => source.url)
  return urls.length > 0 ? [...new Set(urls)] : [...new Set(record.sources.map((source) => source.url))]
}

export function buildReviewQueue(records: CountryRecord[], asOf = DATA_AS_OF): ReviewQueueItem[] {
  return records.map((record) => {
    const priority = getPriority(record)
    const lastVerifiedAt = record.lastVerifiedAt || asOf
    const nextReviewAt = addDays(lastVerifiedAt, reviewCadenceDays[priority], asOf)
    return {
      id: `review:${record.id}`,
      countryId: record.id,
      countryName: record.name,
      priority,
      reason: getReason(record, priority),
      targetFields: getTargetFields(record),
      lastVerifiedAt,
      nextReviewAt,
      due: nextReviewAt <= asOf,
      sourceUrls: getSourceUrls(record),
    }
  })
}

export function filterReviewQueue(items: ReviewQueueItem[], filters: ReviewQueueFilterState): ReviewQueueItem[] {
  return items.filter((item) => {
    if (filters.countryId !== 'all' && item.countryId !== filters.countryId) return false
    if (filters.priority !== 'all' && item.priority !== filters.priority) return false
    if (filters.due === 'due' && !item.due) return false
    if (filters.due === 'not-due' && item.due) return false
    return true
  })
}
