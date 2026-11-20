# Data Act enforcement tracker completion plan

## Goal

把当前 EU-27 Data Act enforcement tracker 从“德国 + 少数国家深度核验、其余国家待补”推进到可持续维护的国别实施与执法看板：每个成员国都要有官方证据入口、字段级核验状态、主管机关/投诉入口/国内罚则/实际处罚的清晰区分，并能通过自动化检查发现来源失效与待复核国家。

## Scope and evidence policy

- 只把官方法规、政府/监管机关页面、官方立法流程文件和官方决定写入 `verified` 字段。
- 法案草案、立法计划、研究机构汇总和新闻只作为 `pending`/`research-lead`，不得冒充已生效国内法或已指定主管机关。
- “投诉入口”“法定罚款上限”“实际处罚”是三个独立字段；没有公开官方案件时保留空案件集，并显示“未发现公开可追溯案件”，不推断为没有调查或处罚。
- 每个国家至少保留一条官方 Data Act 证据或官方实施状态证据；仍缺主管机关、投诉或罚则的国家必须在看板上明确标为未定位/待核验。

## Implementation tasks

### 1. EU-27 evidence backfill

- Audit all 27 country records and normalize source metadata, evidence status, and coverage notes.
- Add official sources found for Bulgaria, Croatia, Cyprus, Estonia, Greece, Italy, Latvia, Lithuania, Luxembourg, Malta, and Slovenia; keep proposals and implementation plans at their correct status.
- Upgrade Lithuania and Malta where official competent-authority and complaint routes are sufficiently evidenced; add Cyprus’s official designation while leaving unresolved penalty fields explicit.
- Add a pure field-completeness helper so the UI can distinguish verified, pending, not located, and not applicable values without turning “no source found” into a zero.
- Preserve the actual enforcement case register as an official-decision-only register; do not create synthetic cases.

### 2. Maintenance and source-health automation

- Add a deterministic registry validation script checking EU-27 uniqueness, source presence, valid status combinations, and case/source integrity.
- Add a source-health script that checks every unique evidence URL with timeouts, redirect handling, and a machine-readable report; it must fail on network or HTTP errors.
- Add an optional weekly GitHub Actions workflow with `workflow_dispatch`, artifact upload, and an issue notification on failures. It must not mutate the registry or publish unverified data.
- Keep the existing in-app review queue and make its “due” calculation usable for current-date review while retaining deterministic test injection.

### 3. Tests and UI verification

- Add/update data tests for the newly verified/pending country records, field-level completeness, and the zero-synthetic-case invariant.
- Add script tests or fixture checks for source validation and source-health report parsing.
- Run `npm test`, `npm run lint`, and `npm run build`.
- If rendered UI changes, use Native browser QA at desktop and mobile widths; verify filters, empty states, no horizontal overflow, and no console errors.

### 4. GitHub clone and handoff

- After local verification, push the completed changes to `https://github.com/xuzhujie/DataAct-enforcement-tracker` using the existing temporary Git metadata because the workspace’s `.git` path is restricted.
- Fresh-clone the remote into a temporary directory and rerun tests/lint/build to prove the remote contains the completed tree.
- Report remaining gaps explicitly: countries whose authority/complaint/penalty evidence is still not located, absence of publicly traceable official Data Act cases, and the need for the scheduled workflow to run in GitHub Actions.
