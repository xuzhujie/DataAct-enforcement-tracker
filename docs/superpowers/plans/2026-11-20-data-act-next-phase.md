# Data Act tracker next-phase expansion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 完成 Data Act enforcement tracker 的下一阶段：修正并补齐 Italy/Belgium/Austria 及 France/Poland/Spain 的官方证据，覆盖剩余 EU 国家，建立官方来源执法监测层和可维护的复核队列，并通过 Native 桌面/移动端验收。

**Architecture:** 保留现有 React + Vite + TypeScript 本地登记簿。国家记录继续是事实主实体；来源记录增加“研究线索”类型以区分 Data Act 证据与 DSA/DGA/一般数字政策材料；执法监测和维护队列均由国家记录派生的纯函数生成，不把“来源存在”推断为“已处罚”，也不把“未定位”转换成零值。

**Tech Stack:** React 19, TypeScript 5, Vite 7, `lucide-react`, native CSS, Node test runner through `tsx`.

**Spec:** `docs/superpowers/specs/2026-11-19-data-act-enforcement-tracker-design.md`

## Global Constraints

- 官方来源优先；每个新增国家状态、主管机关线索、投诉入口、罚则和维护事件都必须保留 URL、核验日期和证据状态。
- DSA、DGA、GDPR、一般数字政策页面可以作为 `research-lead`，但不能作为 Data Act 主管机关、投诉入口或国内罚则的证据。
- `partial` 只表示已核验部分事实；草案、政府拟议、咨询文本和待立法指定不能升级为最终生效的主管机关或罚款数字。
- 投诉入口、法定罚款上限、公开处罚案件保持三层独立；没有公开处罚决定时使用 `not_located`，不显示为 0。
- “官方来源监测”只展示可追踪的官方页面，不虚构案件、处罚金额或自动抓取结果。
- 维护队列的 `due` 只由复核日期计算，不由来源新鲜度标签推断；每个队列项必须说明待补字段和来源入口。
- 使用 TDD：每个行为变更先写失败测试、确认失败，再实现最小代码并跑完整测试/构建。
- 不引入后端、自动抓取或未经用户请求的外部发布；本轮先建立手工可维护的本地证据与监测结构。

## Review Focus

- 西班牙不得继续引用 BOE 的 DSA 合作协议作为 Data Act 主管机关证据；只能保留西班牙政府 Data Act 指南及明确标注的研究线索。
- Italy、Belgium、Austria 的“已知状态”和“尚未定位”要拆开记录；不把 AGCOM/BIPT/RTR 的监管关注或拟议指定写成已完成国内实施。
- 五个新增部分覆盖国家（Ireland、Lithuania、Portugal、Romania、Sweden）必须保留官方状态依据；Malta 已因主管机关、投诉路径、国内罚则和两条设备争议链完成核验而升级为 `deep`，其二手转让与公开处罚字段仍保持未确认。
- 其余排队国家仍必须出现在 EU-27 登记簿，并有清楚的研究入口或“未定位”说明；不得因 DGA/DSA 页面出现而升级覆盖状态。
- 监测视图和维护视图要支持筛选、来源链接、状态解释，并在移动宽度 390×844 下无横向溢出。

---

### Task 1: Refresh official evidence and correct the first two batches

**Files:**
- Modify: `src/data/registry.ts`
- Modify: `src/data/types.ts`
- Modify: `src/data/changelog.ts`
- Modify: `tests/data.test.ts`
- Modify: `docs/superpowers/specs/2026-11-19-data-act-enforcement-tracker-design.md`

**Interfaces:**
- `SourceRecord.sourceType` gains `research-lead` so cross-regulation material is visible but not promoted to a legal fact.
- Spain uses the official Spanish-government Data Act guide and drops the DSA cooperation text as a Data Act source.
- Italy/Belgium/Austria retain unresolved fields as empty and describe their official current status in `coverageNote`/sources.
- The original Task 2 estimate was 4 deep, 11 partial, 12 queue; the current registry supersedes that estimate with 6 deep, 21 partial, 0 queue after the full EU-27 evidence refresh.

- [x] **Step 1: Write failing evidence tests** for Spain’s source taxonomy/correction, Italy/Belgium/Austria status notes, and six-country count expectations.
- [x] **Step 2: Run the focused tests** and confirm the old Spain source/counts fail.
- [x] **Step 3: Update official source records** with 2026-11-20 review dates and preserve separate complaint, statute, and enforcement fields.
- [x] **Step 4: Update the spec and change log** with the evidence boundary and links.
- [x] **Step 5: Run the full suite** before starting the next task.

### Task 2: Expand the remaining EU member states with honest coverage states

**Files:**
- Modify: `src/data/registry.ts`
- Modify: `src/data/types.ts`
- Modify: `tests/data.test.ts`
- Modify: `docs/superpowers/specs/2026-11-19-data-act-enforcement-tracker-design.md`

**Interfaces:**
- Promote Ireland, Lithuania, Portugal, Romania, and Sweden to `partial` only on official evidence; Malta can be promoted to `deep` only after its enacted authority, complaint, penalty and issue-lens evidence is reconciled; unresolved fields remain explicit.
- Keep every unresolved field visible with official research-lead sources and explicit non-Data-Act caveats; the current snapshot has no queue records, but 21 partial records retain field-level gaps.
- Malta's MDIA/MCA/IDPC competence split, complaint routes, statutory penalty layers, and device-access/third-party-sharing issue lenses are now verified; keep second-hand transfer and public penalty decisions explicitly pending/not located.

- [x] **Step 1: Write failing tests** for country coverage, EU-27 uniqueness, and no false authorities/penalties on draft-only evidence.
- [x] **Step 2: Run tests** to confirm the pre-refresh coverage assumptions fail before registry changes.
- [x] **Step 3: Add official national sources and notes** for all eighteen countries, using `research-lead` for DGA/DSA/general-policy material.
- [x] **Step 4: Reconcile metrics, filters, and coverage notes** so partial/queue semantics remain null-safe.
- [x] **Step 5: Run tests, lint, and build** before adding new UI views.

### Task 3: Add an official-source enforcement monitoring layer

**Files:**
- Modify: `src/data/types.ts`
- Create: `src/data/monitoring.ts`
- Create: `src/components/EnforcementMonitor.tsx`
- Modify: `src/App.tsx`
- Modify: `src/App.css`
- Modify: `src/lib/export.ts`
- Modify: `tests/data.test.ts`

**Interfaces:**
- Adds `EnforcementMonitor` with country, source, scope, status, last checked date, and evidence metadata.
- `buildEnforcementMonitors(records, asOf)` returns active monitors for deep/partial official authority/statute/complaint sources and candidate monitors for queue research leads; it never returns an enforcement case.
- JSON/Markdown exports include monitoring rows separately from `enforcementCases` and statutory `penaltySchedule`.

- [x] **Step 1: Write failing pure-function/export tests** for source traceability, active/candidate status, and no-case inference.
- [x] **Step 2: Run focused tests** and confirm the monitoring API is absent.
- [x] **Step 3: Implement the monitor builder and source-linked component** with explicit empty-case language.
- [x] **Step 4: Add the monitor view to Cases and exports** without changing actual-case semantics.
- [x] **Step 5: Run full tests/lint/build** and inspect the desktop/mobile monitor layout.

### Task 4: Add the review queue and maintenance view

**Files:**
- Create: `src/data/review-queue.ts`
- Create: `src/components/MaintenanceView.tsx`
- Modify: `src/data/types.ts`
- Modify: `src/components/TopNav.tsx`
- Modify: `src/App.tsx`
- Modify: `src/App.css`
- Modify: `src/lib/export.ts`
- Modify: `tests/data.test.ts`

**Interfaces:**
- Adds `ReviewQueueItem`, `ReviewPriority`, `buildReviewQueue`, and `filterReviewQueue`.
- Partial records are high priority, queue records medium priority, and deep records receive lower-priority source/enforcement rechecks; `targetFields` and source URLs remain explicit.
- Adds `AppTab = 'maintenance'` and a filterable view for country, priority, and due status.

- [x] **Step 1: Write failing tests** for cadence, due calculation, priority, country/priority/due filtering, and source links.
- [x] **Step 2: Run tests** and confirm the maintenance API/view is absent.
- [x] **Step 3: Implement pure queue functions** with deterministic date calculations and no mutation of country records.
- [x] **Step 4: Implement the navigation/view and export section** with visible counts and unresolved target fields.
- [x] **Step 5: Run full tests/lint/build** and inspect responsive wrapping.

### Task 5: Reconcile documentation and complete Native QA

**Files:**
- Modify: `docs/superpowers/specs/2026-11-19-data-act-enforcement-tracker-design.md`
- Modify: `.superpowers/sdd/2026-11-20-data-act-next-phase/progress.md`
- Test: `tests/data.test.ts`

- [x] **Step 1: Update the SDD ledger** with each task’s test gate, final counts, evidence gaps, and no-commit ruling.
- [x] **Step 2: Run `npm test`, `npm run lint`, and `npm run build`**; record exact results.
- [x] **Step 3: Use Native browser QA** at desktop and 390×844 for source correction, six promoted countries, an unchanged queue country, monitor statuses, maintenance filters, exports, no overflow, and no console error/warn entries.
- [x] **Step 4: Fix any issues found by QA and rerun the affected tests/build.** No UI issues were found.
- [x] **Step 5: Mark the plan and ledger complete only after all evidence and UI checks pass.**

## Final verification

- [x] `npm test`
- [x] `npm run lint`
- [x] `npm run build`
- [x] Native desktop/mobile QA and console review
- [x] EU-27 count/uniqueness confirmed; the current refreshed metrics are 6 deep / 21 partial / 0 queue
- [x] Source links and cross-regulation labels verified
- [x] No Git commit claimed; workspace ledger records the environment limitation
