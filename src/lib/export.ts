import type { CountryRecord, IssueType } from '../data/types'
import { CHANGE_LOG } from '../data/changelog'
import { buildEnforcementMonitors } from '../data/monitoring'
import { buildReviewQueue } from '../data/review-queue'
import { getSourceFreshness } from './freshness'
import { filterIssues, formatComplaintRouteScope, getComplaintRouteScope } from './view-model'

function getExportPayload(record: CountryRecord, activeIssues: IssueType[]) {
  const issues = filterIssues(record.issues, activeIssues)
  return {
    country: record.name,
    countryEn: record.nameEn,
    countryId: record.id,
    coverage: record.coverage,
    implementationStage: record.implementationStage,
    lastVerifiedAt: record.lastVerifiedAt,
    applicableFrom: record.applicableFrom ?? null,
    nationalActEffectiveFrom: record.nationalActEffectiveFrom ?? null,
    implementingAct: record.implementingAct ?? null,
    competentAuthorities: record.competentAuthorities,
    complaintRoutes: record.complaintRoutes,
    penaltySchedule: record.penaltySchedule,
    enforcementSummary: record.enforcementSummary,
    enforcementCases: record.enforcementCases,
    enforcementMonitors: buildEnforcementMonitors([record]),
    reviewQueue: buildReviewQueue([record]),
    selectedIssueTypes: issues.map((issue) => issue.issue),
    issues,
    sources: record.sources,
    sourceFreshness: record.sources.map((source) => ({ sourceId: source.id, ...getSourceFreshness(source.lastVerifiedAt) })),
    changeLog: CHANGE_LOG.filter((entry) => entry.countryId === record.id),
  }
}

export function buildJsonExport(record: CountryRecord, activeIssues: IssueType[]): string {
  return JSON.stringify(getExportPayload(record, activeIssues), null, 2)
}

export function buildMarkdownExport(record: CountryRecord, activeIssues: IssueType[]): string {
  const payload = getExportPayload(record, activeIssues)
  const authorities = payload.competentAuthorities.length
    ? payload.competentAuthorities.map((authority) => `- ${authority.nameEn}：${authority.scope}`).join('\n')
    : '- 待补齐'
  const penalties = payload.penaltySchedule.length
    ? payload.penaltySchedule.map((tier) => `- **${tier.label}**：${tier.maximum}（${tier.legalBasis}）`).join('\n')
    : '- 待补齐'
  const issues = payload.issues.length
    ? payload.issues.map((issue) => `- **${issue.label}** · ${issue.euArticles.join('、')} · ${issue.status}\n  - ${issue.evidenceSummary}\n  - 下一步：${issue.nextAction}`).join('\n')
    : '- 当前筛选没有事项记录'
  const sources = payload.sources.map((source) => `- [${source.label}](${source.url})`).join('\n')
  const sourceFreshness = payload.sources.map((source) => `- [${source.label}](${source.url})：${getSourceFreshness(source.lastVerifiedAt).status} · ${source.lastVerifiedAt}`).join('\n')
  const changeLog = payload.changeLog.length
    ? payload.changeLog.map((entry) => `- ${entry.date} · ${entry.kind} · ${entry.summary}`).join('\n')
    : '- 当前国家没有变更日志记录'
  const enforcementCases = payload.enforcementCases.length
    ? payload.enforcementCases.map((item) => `- ${item.decisionDate} · ${item.entity} · ${item.measure} · ${item.amountEur === null ? '金额未公开' : `€${item.amountEur.toLocaleString('en-US')}`}`).join('\n')
    : `- ${payload.enforcementSummary.note}`
  const enforcementMonitors = payload.enforcementMonitors.length
    ? payload.enforcementMonitors.map((monitor) => `- [${monitor.label}](${monitor.url})：${monitor.status} · ${monitor.scope}`).join('\n')
    : '- 当前没有可监测的官方来源'
  const reviewQueue = payload.reviewQueue.map((item) => `- ${item.priority} · ${item.due ? '到期' : `下次复核 ${item.nextReviewAt}`} · 待补：${item.targetFields.join('、')}`).join('\n')
  const implementingActLabel = payload.implementingAct?.split(' · ')[0]
  const penaltyHeading = implementingActLabel
    ? `## 法定罚款档位（${implementingActLabel}）`
    : '## 法定罚款档位'

  return [
    `# ${payload.country} ${payload.countryEn} · Data Act enforcement tracker`,
    '',
    `- 覆盖状态：${payload.coverage}`,
    `- 实施法：${payload.implementingAct ?? '待补齐'}`,
    `- 最后核验：${payload.lastVerifiedAt}`,
    '',
    '## 主管机构',
    authorities,
    '',
    '## 投诉入口',
    payload.complaintRoutes.length ? payload.complaintRoutes.map((route) => `- [${route.label}](${route.url})【${formatComplaintRouteScope(getComplaintRouteScope(route))}】：${route.scope}`).join('\n') : '- 待补齐',
    '',
    penaltyHeading,
    penalties,
    '',
    '## 实际执法',
    enforcementCases,
    '',
    '## 官方来源监测',
    enforcementMonitors,
    '',
    '## 维护复核队列',
    reviewQueue,
    '',
    '## 争议事项',
    issues,
    '',
    '## 官方来源',
    sources,
    '',
    '## 来源新鲜度',
    sourceFreshness,
    '',
    '## 变更日志',
    changeLog,
  ].join('\n')
}
