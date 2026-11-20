import { Download } from 'lucide-react'
import type { CountryRecord, IssueType } from '../data/types'
import { buildJsonExport, buildMarkdownExport } from '../lib/export'

interface ExportActionsProps {
  record: CountryRecord
  activeIssues: IssueType[]
}

function downloadText(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8` })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 0)
}

export default function ExportActions({ record, activeIssues }: ExportActionsProps) {
  return (
    <div className="export-actions" aria-label="导出当前筛选视图">
      <span>导出当前视图</span>
      <button type="button" className="secondary-button secondary-button--small" onClick={() => downloadText(`${record.id}-data-act.json`, buildJsonExport(record, activeIssues), 'application/json')}>
        <Download aria-hidden="true" size={14} /> JSON
      </button>
      <button type="button" className="secondary-button secondary-button--small" onClick={() => downloadText(`${record.id}-data-act.md`, buildMarkdownExport(record, activeIssues), 'text/markdown')}>
        <Download aria-hidden="true" size={14} /> Markdown
      </button>
    </div>
  )
}
