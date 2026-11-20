import { ArrowUpRight, ChevronRight, ChevronsUpDown } from 'lucide-react'
import type { CountryRecord } from '../data/types'
import { EU_COUNTRIES_SOURCE_URL } from '../data/registry'
import { formatComplaintIntake, formatCountryImplementingAct, formatPublishedPenalties, formatCountryStatus, formatImplementationStage } from '../lib/view-model'

interface CountryRegisterProps {
  countries: CountryRecord[]
  totalCountryCount?: number
  selectedCountryId: string
  onSelectCountry: (countryId: string) => void
}

export default function CountryRegister({ countries, totalCountryCount = countries.length, selectedCountryId, onSelectCountry }: CountryRegisterProps) {
  return (
    <section className="panel country-register" aria-labelledby="country-register-title">
      <div className="panel-heading">
        <div>
          <h2 id="country-register-title">国别实施登记</h2>
          <p>用同一组字段比较成员国主管机构、入口和公开处罚状态。</p>
        </div>
        <span className="panel-heading__count">显示 {countries.length} / {totalCountryCount} 个 EU 成员国</span>
      </div>
      <div className="table-scroll">
        <table className="data-table country-table">
          <thead>
            <tr>
              <th>国家 <ChevronsUpDown aria-hidden="true" size={12} /></th>
              <th>实施法 <ChevronsUpDown aria-hidden="true" size={12} /></th>
              <th>投诉入口 <ChevronsUpDown aria-hidden="true" size={12} /></th>
              <th>公开处罚 <ChevronsUpDown aria-hidden="true" size={12} /></th>
              <th>状态 <ChevronsUpDown aria-hidden="true" size={12} /></th>
              <th>实施阶段 <ChevronsUpDown aria-hidden="true" size={12} /></th>
              <th aria-label="打开" />
            </tr>
          </thead>
          <tbody>
            {countries.length === 0 && (
              <tr>
                <td colSpan={7} className="empty-table-cell">没有匹配的国家；可以重置筛选条件。</td>
              </tr>
            )}
            {countries.map((country) => {
              const selected = country.id === selectedCountryId
              return (
                <tr key={country.id} className={selected ? 'is-selected' : ''}>
                  <td>
                    <button type="button" className="table-row-button" onClick={() => onSelectCountry(country.id)} aria-pressed={selected}>
                      <span className="table-country__flag" aria-hidden="true">{country.flag}</span>
                      <span>
                        <strong>{country.name}</strong>
                        <small>{country.nameEn}</small>
                      </span>
                    </button>
                  </td>
                  <td>{formatCountryImplementingAct(country)}</td>
                  <td>{formatComplaintIntake(country)}</td>
                  <td>{formatPublishedPenalties(country)}</td>
                  <td><span className={`coverage-tag coverage-tag--${country.coverage}`}>{formatCountryStatus(country)}</span></td>
                  <td>{formatImplementationStage(country.implementationStage)}</td>
                  <td>
                    <button type="button" className="icon-button" onClick={() => onSelectCountry(country.id)} aria-label={`查看${country.name}详情`}>
                      <ChevronRight aria-hidden="true" size={16} />
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <div className="panel-footnote">
        <span><span className="dot dot--teal" /> 已核验：来源已进入登记簿</span>
        <span><span className="dot dot--amber" /> 部分核验 / 待补齐：不填入猜测数据</span>
        <a href={EU_COUNTRIES_SOURCE_URL} target="_blank" rel="noreferrer">EU-27 名单 <ArrowUpRight size={13} /></a>
        <a href="https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32023R2854" target="_blank" rel="noreferrer">查看 EU 框架 <ArrowUpRight size={13} /></a>
      </div>
    </section>
  )
}
