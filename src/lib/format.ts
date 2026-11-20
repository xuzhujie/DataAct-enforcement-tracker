import type { CountryCoverage, IssueType, VerificationStatus } from '../data/types'

const statusLabels: Record<VerificationStatus, string> = {
  verified: '已核验',
  pending: '待核验',
  not_located: '未定位到公开记录',
  not_applicable: '不适用',
}

const coverageLabels: Record<CountryCoverage, string> = {
  deep: '已核验',
  partial: '部分核验',
  queue: '待补齐',
  planned: '规划中',
}

const issueLabels: Record<IssueType, string> = {
  device_access: '设备数据访问',
  third_party_sharing: '第三方共享',
  second_hand_transfer: '二手转让 / 设备继受',
}

export function formatDate(value?: string): string {
  if (!value) return '—'
  const [year, month, day] = value.split('-')
  return `${year}年${Number(month)}月${Number(day)}日`
}

export function formatVerificationStatus(status: VerificationStatus): string {
  return statusLabels[status]
}

export function formatCoverage(coverage: CountryCoverage): string {
  return coverageLabels[coverage]
}

export function formatIssueLabel(issue: IssueType): string {
  return issueLabels[issue]
}
