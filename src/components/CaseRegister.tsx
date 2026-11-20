import { ArrowUpRight, FileSearch } from 'lucide-react'
import type { CountryRecord, IssueType } from '../data/types'
import { filterIssues } from '../lib/view-model'
import StatusTag from './StatusTag'

interface CaseRegisterProps {
  record: CountryRecord
  activeIssues: IssueType[]
}

export default function CaseRegister({ record, activeIssues }: CaseRegisterProps) {
  const issues = filterIssues(record.issues, activeIssues)

  return (
    <section className="panel case-register" aria-labelledby="case-register-title">
      <div className="panel-heading">
        <div>
          <h2 id="case-register-title">事项登记 / Cases</h2>
          <p>把可核验的争议场景、条款线索和下一步放入同一条记录；不是法院或机关的正式案件 docket。</p>
        </div>
        <FileSearch aria-hidden="true" size={22} strokeWidth={1.7} />
      </div>
      {issues.length === 0 ? <div className="empty-state">当前国家没有可显示的事项，请清除筛选或先完成国家核验。</div> : (
        <div className="table-scroll">
          <table className="data-table case-table">
            <thead>
              <tr>
                <th>事项</th>
                <th>EU 条款</th>
                <th>{record.name}法映射</th>
                <th>状态</th>
                <th>证据 / 下一步</th>
                <th aria-label="来源" />
              </tr>
            </thead>
            <tbody>
              {issues.map((issue) => (
                <tr key={issue.issue}>
                  <td><strong>{issue.label}</strong></td>
                  <td>{issue.euArticles.join(' · ')}</td>
                  <td>{issue.nationalBasis}</td>
                  <td><StatusTag status={issue.status} /></td>
                  <td><span className="case-summary">{issue.evidenceSummary}<br /><b>下一步：</b>{issue.nextAction}</span></td>
                  <td><a className="icon-link" href={issue.sourceUrls[0]} target="_blank" rel="noreferrer" aria-label={`查看${issue.label}来源`}><ArrowUpRight size={15} /></a></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
