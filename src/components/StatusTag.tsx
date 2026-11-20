import { CheckCircle2, Clock3, Info, MinusCircle } from 'lucide-react'
import type { VerificationStatus } from '../data/types'
import { formatVerificationStatus } from '../lib/format'

const statusIcons = {
  verified: CheckCircle2,
  pending: Clock3,
  not_located: Info,
  not_applicable: MinusCircle,
} as const

export default function StatusTag({ status }: { status: VerificationStatus }) {
  const Icon = statusIcons[status]
  return (
    <span className={`status-tag status-tag--${status}`}>
      <Icon aria-hidden="true" size={13} strokeWidth={2} />
      {formatVerificationStatus(status)}
    </span>
  )
}
