import type { IssueRecord, IssueType } from '../data/types'
import { filterIssues } from '../lib/view-model'
import StatusTag from './StatusTag'

interface IssueMatrixProps {
  countryName: string
  issues: IssueRecord[]
  activeIssues: IssueType[]
}

export default function IssueMatrix({ countryName, issues, activeIssues }: IssueMatrixProps) {
  const visibleIssues = filterIssues(issues, activeIssues)

  if (visibleIssues.length === 0) {
    return <div className="empty-state">清除筛选后可查看全部争议类型。</div>
  }

  return (
    <div className="matrix-wrap table-scroll">
      <table className="data-table issue-matrix">
        <caption>按争议类型查看{countryName} Data Act 条款、证据范围和下一步</caption>
        <thead>
          <tr>
            <th>字段</th>
            {visibleIssues.map((issue) => <th key={issue.issue}>{issue.label}</th>)}
          </tr>
        </thead>
        <tbody>
          <tr>
            <th scope="row">EU 条款</th>
            {visibleIssues.map((issue) => <td key={issue.issue}>{issue.euArticles.join(' · ')}</td>)}
          </tr>
          <tr>
            <th scope="row">{countryName}法映射</th>
            {visibleIssues.map((issue) => <td key={issue.issue}>{issue.nationalBasis}</td>)}
          </tr>
          <tr>
            <th scope="row">核验状态</th>
            {visibleIssues.map((issue) => <td key={issue.issue}><StatusTag status={issue.status} /></td>)}
          </tr>
          <tr>
            <th scope="row">证据 / 范围</th>
            {visibleIssues.map((issue) => <td key={issue.issue}>{issue.evidenceSummary}</td>)}
          </tr>
          <tr>
            <th scope="row">下一步</th>
            {visibleIssues.map((issue) => <td key={issue.issue}>{issue.nextAction}</td>)}
          </tr>
        </tbody>
      </table>
    </div>
  )
}
