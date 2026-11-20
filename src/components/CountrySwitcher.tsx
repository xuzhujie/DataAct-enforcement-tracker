import { CheckCircle2, ChevronDown, CircleDashed, Clock3 } from 'lucide-react'
import type { CountryRecord } from '../data/types'
import { formatCoverage } from '../lib/format'

interface CountrySwitcherProps {
  countries: CountryRecord[]
  selectedCountryId: string
  onSelectCountry: (countryId: string) => void
}

export default function CountrySwitcher({ countries, selectedCountryId, onSelectCountry }: CountrySwitcherProps) {
  const selected = countries.find((country) => country.id === selectedCountryId) ?? countries[0]

  return (
    <section className="country-switcher" aria-labelledby="country-switcher-title">
      <div className="country-switcher__select-wrap">
        <label id="country-switcher-title" htmlFor="country-select">国家</label>
        <div className="country-select-shell">
          <select
            id="country-select"
            value={selectedCountryId}
            onChange={(event) => onSelectCountry(event.target.value)}
            aria-label="选择国家"
          >
            {countries.map((country) => (
              <option key={country.id} value={country.id}>
                {country.flag} {country.name} · {country.nameEn}
              </option>
            ))}
          </select>
          <ChevronDown aria-hidden="true" size={16} />
        </div>
        <span className="country-switcher__hint">当前：{selected?.name ?? '—'}</span>
      </div>

      <div className="country-queue" role="list" aria-label="国家覆盖队列">
        {countries.map((country) => {
          const isSelected = country.id === selectedCountryId
          const isDeep = country.coverage === 'deep'
          const isPartial = country.coverage === 'partial'
          return (
            <div key={country.id} role="listitem" className="country-queue__entry">
              <button
                type="button"
                className={`country-queue__item ${isSelected ? 'is-selected' : ''}`}
                onClick={() => onSelectCountry(country.id)}
                aria-pressed={isSelected}
              >
                <span className="country-queue__flag" aria-hidden="true">{country.flag}</span>
                <span className="country-queue__name">
                  <strong>{country.name}</strong>
                  <small>{country.nameEn}</small>
                </span>
                {isDeep
                  ? <CheckCircle2 className="country-queue__status country-queue__status--verified" aria-label={formatCoverage(country.coverage)} size={15} />
                  : isPartial
                    ? <CircleDashed className="country-queue__status country-queue__status--partial" aria-label={formatCoverage(country.coverage)} size={15} />
                    : <Clock3 className="country-queue__status country-queue__status--pending" aria-label={formatCoverage(country.coverage)} size={15} />}
              </button>
            </div>
          )
        })}
      </div>
    </section>
  )
}
