import { DATA_AS_OF } from '../data/registry'
import type { SourceFreshness } from '../data/types'

const DAY_MS = 24 * 60 * 60 * 1000

function parseIsoDate(value?: string): number | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null
  const [year, month, day] = value.split('-').map(Number)
  const timestamp = Date.UTC(year, month - 1, day)
  const parsed = new Date(timestamp)
  if (parsed.getUTCFullYear() !== year || parsed.getUTCMonth() !== month - 1 || parsed.getUTCDate() !== day) return null
  return timestamp
}

export function getSourceFreshness(lastVerifiedAt?: string, asOf = DATA_AS_OF): SourceFreshness {
  const verifiedAt = parseIsoDate(lastVerifiedAt)
  const asOfAt = parseIsoDate(asOf)
  if (verifiedAt === null || asOfAt === null) {
    return { status: 'unknown', daysSinceVerified: null, note: '缺少有效核验日期' }
  }
  if (verifiedAt > asOfAt) {
    return { status: 'unknown', daysSinceVerified: null, note: '核验日期是未来日期，需复核' }
  }

  const daysSinceVerified = Math.floor((asOfAt - verifiedAt) / DAY_MS)
  if (daysSinceVerified <= 30) {
    return { status: 'current', daysSinceVerified, note: `距基准日 ${daysSinceVerified} 天` }
  }
  if (daysSinceVerified <= 90) {
    return { status: 'review', daysSinceVerified, note: `距基准日 ${daysSinceVerified} 天，建议复核` }
  }
  return { status: 'stale', daysSinceVerified, note: `距基准日 ${daysSinceVerified} 天，已过复核窗口` }
}
