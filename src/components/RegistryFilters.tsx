import { Filter, RotateCcw } from 'lucide-react'
import type { ChangeEvent } from 'react'
import type { ComplaintRouteScope, CountryFilterState, FieldFilter } from '../data/types'
import { formatCoverage, formatVerificationStatus } from '../lib/format'
import { formatComplaintRouteScope, formatImplementationStage } from '../lib/view-model'

interface RegistryFiltersProps {
  filters: CountryFilterState
  onChange: (filters: CountryFilterState) => void
  onReset: () => void
  resultCount: number
  totalCount: number
}

function selectValue<T extends string>(value: T, onChange: (value: T) => void) {
  return {
    value,
    onChange: (event: ChangeEvent<HTMLSelectElement>) => onChange(event.target.value as T),
  }
}

export default function RegistryFilters({ filters, onChange, onReset, resultCount, totalCount }: RegistryFiltersProps) {
  function update<K extends keyof CountryFilterState>(key: K, value: CountryFilterState[K]) {
    onChange({ ...filters, [key]: value })
  }

  return (
    <section className="registry-filters" aria-labelledby="registry-filters-title">
      <div className="registry-filters__heading">
        <span className="registry-filters__label" id="registry-filters-title"><Filter aria-hidden="true" size={15} /> 国别筛选</span>
        <span className="registry-filters__count">显示 {resultCount} / {totalCount} 个成员国</span>
        <button type="button" className="link-button registry-filters__reset" onClick={onReset}>
          <RotateCcw aria-hidden="true" size={13} /> 重置
        </button>
      </div>
      <div className="registry-filters__options">
        <label>
          <span>覆盖状态</span>
          <select {...selectValue(filters.coverage, (value) => update('coverage', value))}>
            <option value="all">全部</option>
            <option value="deep">{formatCoverage('deep')}</option>
            <option value="partial">{formatCoverage('partial')}</option>
            <option value="queue">{formatCoverage('queue')}</option>
            <option value="planned">{formatCoverage('planned')}</option>
          </select>
        </label>
        <label>
          <span>实施阶段</span>
          <select {...selectValue(filters.implementationStage, (value) => update('implementationStage', value))}>
            <option value="all">全部</option>
            <option value="enacted">{formatImplementationStage('enacted')}</option>
            <option value="legislative">{formatImplementationStage('legislative')}</option>
            <option value="draft">{formatImplementationStage('draft')}</option>
            <option value="not_located">{formatImplementationStage('not_located')}</option>
          </select>
        </label>
        <PresenceSelect label="主管机构" value={filters.authority} onChange={(value) => update('authority', value)} />
        <PresenceSelect label="投诉入口" value={filters.complaintRoute} onChange={(value) => update('complaintRoute', value)} />
        <ComplaintRouteScopeSelect value={filters.complaintRouteScope} onChange={(value) => update('complaintRouteScope', value)} />
        <PresenceSelect label="法定罚则" value={filters.penaltySchedule} onChange={(value) => update('penaltySchedule', value)} />
        <label>
          <span>公开处罚状态</span>
          <select {...selectValue(filters.publishedPenaltyStatus, (value) => update('publishedPenaltyStatus', value))}>
            <option value="all">全部</option>
            <option value="verified">已核验</option>
            <option value="pending">待核验</option>
            <option value="not_located">未定位到公开记录</option>
            <option value="not_applicable">不适用</option>
          </select>
        </label>
      </div>
    </section>
  )
}

function ComplaintRouteScopeSelect({ value, onChange }: { value: ComplaintRouteScope | 'all'; onChange: (value: ComplaintRouteScope | 'all') => void }) {
  return (
    <label>
      <span>入口范围</span>
      <select {...selectValue(value, onChange)}>
        <option value="all">全部</option>
        <option value="general_data_act">{formatComplaintRouteScope('general_data_act')}</option>
        <option value="personal_data_boundary">{formatComplaintRouteScope('personal_data_boundary')}</option>
      </select>
    </label>
  )
}

function PresenceSelect({ label, value, onChange }: { label: string; value: FieldFilter; onChange: (value: FieldFilter) => void }) {
  return (
    <label>
      <span>{label}</span>
      <select {...selectValue(value, onChange)}>
        <option value="all">全部</option>
        <option value="present">已登记</option>
        <option value="missing">未登记</option>
        <option value="verified">{formatVerificationStatus('verified')}</option>
        <option value="pending">{formatVerificationStatus('pending')}</option>
        <option value="not_located">{formatVerificationStatus('not_located')}</option>
        <option value="not_applicable">{formatVerificationStatus('not_applicable')}</option>
      </select>
    </label>
  )
}
