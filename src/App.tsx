import { useMemo, useState } from 'react'
import AppShell from './components/AppShell'
import CountrySwitcher from './components/CountrySwitcher'
import CountryDetail from './components/CountryDetail'
import CountryRegister from './components/CountryRegister'
import CaseRegister from './components/CaseRegister'
import ChangeLogView from './components/ChangeLogView'
import ExportActions from './components/ExportActions'
import EnforcementMonitor from './components/EnforcementMonitor'
import GlobalEnforcementCaseRegister from './components/GlobalEnforcementCaseRegister'
import IssueFilters from './components/IssueFilters'
import MetricStrip from './components/MetricStrip'
import MaintenanceView from './components/MaintenanceView'
import RegistryFilters from './components/RegistryFilters'
import TimelineView from './components/TimelineView'
import TopNav from './components/TopNav'
import type { AppTab, CountryFilterState, IssueType } from './data/types'
import { CHANGE_LOG } from './data/changelog'
import { COUNTRY_RECORDS, GERMANY_ID } from './data/registry'
import { buildEnforcementMonitors } from './data/monitoring'
import { buildReviewQueue } from './data/review-queue'
import { getCountryMetrics, getCoverageMetrics } from './data/metrics'
import { DEFAULT_COUNTRY_FILTERS, filterCountries } from './lib/view-model'
import { getCurrentIsoDate } from './lib/freshness'

const ALL_ISSUES: IssueType[] = ['device_access', 'third_party_sharing', 'second_hand_transfer']

export default function App() {
  const [selectedCountryId, setSelectedCountryId] = useState(GERMANY_ID)
  const [activeTab, setActiveTab] = useState<AppTab>('dashboard')
  const [activeIssues, setActiveIssues] = useState<IssueType[]>(ALL_ISSUES)
  const [registryFilters, setRegistryFilters] = useState<CountryFilterState>(DEFAULT_COUNTRY_FILTERS)

  const selectedCountry = useMemo(
    () => COUNTRY_RECORDS.find((country) => country.id === selectedCountryId) ?? COUNTRY_RECORDS[0],
    [selectedCountryId],
  )
  const filteredCountries = useMemo(() => filterCountries(COUNTRY_RECORDS, registryFilters), [registryFilters])
  const coverageMetrics = useMemo(() => getCoverageMetrics(COUNTRY_RECORDS), [])
  const reviewQueue = buildReviewQueue(COUNTRY_RECORDS, getCurrentIsoDate())

  function toggleIssue(issue: IssueType) {
    setActiveIssues((current) => current.includes(issue) ? current.filter((item) => item !== issue) : [...current, issue])
  }

  return (
    <AppShell>
      <TopNav activeTab={activeTab} onSelectTab={setActiveTab} />
      <header className="hero-band">
        <div className="page-width hero-band__inner">
          <div>
            <h1>Data Act enforcement tracker</h1>
            <p>欧盟 Data Act 国别实施、投诉入口、国内法定罚款与实际执法记录，聚焦联网硬件与相关服务。</p>
          </div>
          <div className="hero-band__meta">
            <span>中文主界面</span>
            <span>官方来源优先</span>
          </div>
        </div>
      </header>
      <main className="page-width app-main">
        <CountrySwitcher
          countries={COUNTRY_RECORDS}
          selectedCountryId={selectedCountryId}
          onSelectCountry={setSelectedCountryId}
        />
        <IssueFilters
          activeIssues={activeIssues}
          onToggleIssue={toggleIssue}
          onClear={() => setActiveIssues(ALL_ISSUES)}
        />
        <RegistryFilters
          filters={registryFilters}
          onChange={setRegistryFilters}
          onReset={() => setRegistryFilters(DEFAULT_COUNTRY_FILTERS)}
          resultCount={filteredCountries.length}
          totalCount={COUNTRY_RECORDS.length}
        />
        <ExportActions record={selectedCountry} activeIssues={activeIssues} />
        <MetricStrip record={selectedCountry} metrics={getCountryMetrics(selectedCountry)} coverageMetrics={coverageMetrics} />
        {activeTab === 'dashboard' && (
          <div className="workbench-grid">
            <CountryRegister countries={filteredCountries} totalCountryCount={COUNTRY_RECORDS.length} selectedCountryId={selectedCountryId} onSelectCountry={setSelectedCountryId} />
            <CountryDetail record={selectedCountry} activeIssues={activeIssues} />
          </div>
        )}
        {activeTab === 'country-register' && (
          <div className="stacked-view">
            <CountryRegister countries={filteredCountries} totalCountryCount={COUNTRY_RECORDS.length} selectedCountryId={selectedCountryId} onSelectCountry={setSelectedCountryId} />
            <CountryDetail record={selectedCountry} activeIssues={activeIssues} />
          </div>
        )}
        {activeTab === 'sources' && <CountryDetail record={selectedCountry} activeIssues={activeIssues} initialTab="sources" />}
        {activeTab === 'cases' && (
          <div className="stacked-view">
            <GlobalEnforcementCaseRegister records={COUNTRY_RECORDS} />
            <EnforcementMonitor monitors={buildEnforcementMonitors([selectedCountry])} />
            <CaseRegister record={selectedCountry} activeIssues={activeIssues} />
          </div>
        )}
        {activeTab === 'timeline' && <TimelineView events={selectedCountry.timeline} />}
        {activeTab === 'change-log' && <ChangeLogView entries={CHANGE_LOG} countries={COUNTRY_RECORDS} />}
        {activeTab === 'maintenance' && <MaintenanceView items={reviewQueue} />}
      </main>
    </AppShell>
  )
}
