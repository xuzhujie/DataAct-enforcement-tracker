# Data Act tracker expansion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkboxes for tracking.

**Goal:** 按 1→5 完成 Data Act 国别实施与执法看板扩展：升级西班牙/法国/波兰，补第二批成员国，支持部分核验与跨国筛选，建立真实处罚案件层，并接入来源新鲜度与变更日志。

**Architecture:** 保留现有 React + Vite + TypeScript 本地登记簿，把国别实施事实、处罚案件、来源新鲜度和变更日志拆成独立类型与纯函数。看板继续以国家为主实体，但允许 `partial` 国家展示已确认的部分事实，同时严格保留投诉入口、法定上限和实际处罚的分栏。

**Tech Stack:** React 19, TypeScript 5, Vite 7, `lucide-react`, native CSS, Node test runner through `tsx`.

**Spec:** `docs/superpowers/specs/2026-11-19-data-act-enforcement-tracker-design.md`

## Global Constraints

- 官方来源优先；每个新增主管机构、投诉入口、罚则、案件和变更记录都必须保存来源 URL、核验日期和证据状态。
- `partial` 只表示已核验部分事实，不得显示为完整国内实施；草案、议会材料、合作协议不得自动升级为最终生效法或完整主管机关指定。
- 投诉入口、法定罚款上限、公开处罚案件始终使用独立字段和独立状态。
- `not_located` 不是零处罚；没有公开决定时，案件数组可以为空，但必须显示核验范围和最后核验日期。
- 二手转让保持事实依赖型争议标签，不把它写成独立违法类型。
- 不引入后端、自动抓取或未经用户请求的外部发布；本轮先做可维护的本地证据层和手工变更日志。
- 使用 TDD：每个行为变更先写失败测试、确认失败，再实现最小代码并跑完整测试/构建。

## Review Focus

- `partial` 国家必须同时保留已确认线索和未确认字段；测试西班牙、法国、波兰不会出现假主管机关或罚款数字。
- 跨国筛选不能把空值当成“没有”；测试投诉入口、罚则和实际处罚状态的筛选边界。
- 处罚案件为空时，界面必须显示“未定位/暂无已公开决定”，不得渲染为 0 项案件的确定结论。
- 来源新鲜度以来源最后核验日期计算，缺失日期和未来日期都不能静默归类为新鲜。
- 变更日志的来源链接和国家筛选必须与当前登记簿一致，不能显示已经删除或不存在的国家。

---

### Task 1: Upgrade Spain, France, and Poland to partial coverage

**Files:**
- Modify: `src/data/types.ts`
- Modify: `src/data/registry.ts`
- Modify: `src/data/metrics.ts`
- Modify: `src/lib/format.ts`
- Modify: `src/lib/view-model.ts`
- Modify: `src/components/CountryDetail.tsx`
- Modify: `src/components/CountryRegister.tsx`
- Modify: `src/components/CountrySwitcher.tsx`
- Test: `tests/data.test.ts`

**Interfaces:**
- Produces `CountryCoverage = 'deep' | 'partial' | 'queue' | 'planned'` and `ImplementationStage = 'enacted' | 'legislative' | 'draft' | 'not_located'`.
- Produces `CountryRecord.implementationStage` and `CountryRecord.coverageNote`.
- `formatCountryStatus`, `formatCoverage`, and coverage metrics expose partial state without treating it as deep.

- [x] **Step 1: Write failing tests** for Spain/France/Poland `partial` coverage, implementation stage, official source presence, and empty authority/route/penalty fields where final designation is not verified.
- [x] **Step 2: Run `npm test`** and confirm the new assertions fail because the current records are queue-only.
- [x] **Step 3: Implement the partial model** and move only the three countries to `partial`; retain official CNIL/Sénat, Polish government, and BOE sources as evidence notes.
- [x] **Step 4: Update UI labels and detail behavior** so partial countries show available notes and sources but do not expose deep-only tabs or complete metrics.
- [x] **Step 5: Run the full suite** with `npm test`, `npm run lint`, and `npm run build`.

### Task 2: Research and add the second country batch

**Files:**
- Modify: `src/data/registry.ts`
- Modify: `src/data/types.ts`
- Modify: `tests/data.test.ts`
- Modify: `docs/superpowers/specs/2026-11-19-data-act-enforcement-tracker-design.md`
- Modify: `.superpowers/sdd/2026-11-19-data-act-enforcement-tracker/progress.md`

**Interfaces:**
- Adds official-source records for Italy, Belgium, Austria, Denmark, and Finland.
- Each country must become `deep`, `partial`, or remain `queue` based on final official evidence; no country is upgraded merely because a secondary source names a likely regulator.

- [x] **Step 1: Research official national sources** for implementing act/effective date, data coordinator and competent authorities, device-data complaint route, domestic penalty ceiling, and public Data Act decisions.
- [x] **Step 2: Write failing country-batch tests** asserting the verified stage and that unresolved fields remain null/empty.
- [x] **Step 3: Implement the second batch** with per-country sources, evidence metadata, issue mappings for device access/third-party sharing/second-hand transfer, and `not_located` enforcement status where necessary.
- [x] **Step 4: Reconcile EU-27 coverage metrics and queue invariants** so every member state remains represented exactly once.
- [x] **Step 5: Run tests, type checks, build, and a country-switch browser pass** for at least one newly upgraded country and one unchanged queue country.

### Task 3: Add partial coverage and cross-country filters

**Files:**
- Create: `src/components/RegistryFilters.tsx`
- Modify: `src/App.tsx`
- Modify: `src/data/metrics.ts`
- Modify: `src/lib/view-model.ts`
- Modify: `src/components/CountryRegister.tsx`
- Modify: `src/components/MetricStrip.tsx`
- Modify: `src/components/StatusTag.tsx`
- Modify: `src/App.css`
- Test: `tests/data.test.ts`

**Interfaces:**
- `filterCountries(records, filters)` filters by coverage, implementation stage, authority presence, complaint-route presence, penalty-schedule presence, and published-penalty status without converting nulls to false facts.
- `CoverageMetrics` includes `partialCount`.
- `RegistryFilters` emits controlled filter state to `CountryRegister` and exposes a reset action.

- [x] **Step 1: Write failing pure-function tests** for filter combinations, null-safe penalty status, and partial/deep display labels.
- [x] **Step 2: Run tests to confirm the filter API is missing.**
- [x] **Step 3: Implement pure filters and controlled UI state** in `App.tsx` / `RegistryFilters.tsx`.
- [x] **Step 4: Add visible table columns** for coverage and implementation stage, preserving the 27-country total separately from the filtered result count.
- [x] **Step 5: Verify mobile wrapping, table scrolling, filter reset, and no console errors in Native browser QA.**

### Task 4: Build the actual enforcement case layer

**Files:**
- Modify: `src/data/types.ts`
- Modify: `src/data/registry.ts`
- Create: `src/components/EnforcementCaseRegister.tsx`
- Modify: `src/components/CountryDetail.tsx`
- Modify: `src/components/PenaltyLadder.tsx`
- Modify: `src/components/CaseRegister.tsx`
- Modify: `src/lib/export.ts`
- Test: `tests/data.test.ts`

**Interfaces:**
- Adds `EnforcementCase` with country, authority, decision date, entity, issue, measure, amount, status, source URLs, and evidence metadata.
- `CountryRecord.enforcementCases` stores only publicly traceable decisions.
- `EnforcementCaseRegister` renders exact cases or an explicit `not_located` empty state; it never fabricates a case from `publishedPenaltyCount`.

- [x] **Step 1: Write failing tests** for an empty official-case set, nullable amounts, export preservation, and a fully sourced case fixture if research finds one.
- [x] **Step 2: Run tests to verify the case layer is absent.**
- [x] **Step 3: Add the type, registry field, case component, and actual-enforcement tab/section.**
- [x] **Step 4: Update JSON/Markdown exports** to include cases separately from statutory penalty tiers.
- [x] **Step 5: Verify Germany, Netherlands, and one partial country in browser QA; confirm no “0 penalty” inference.**

### Task 5: Add source freshness and a change log

**Files:**
- Modify: `src/data/types.ts`
- Create: `src/data/changelog.ts`
- Create: `src/lib/freshness.ts`
- Create: `src/components/ChangeLogView.tsx`
- Modify: `src/components/SourceList.tsx`
- Modify: `src/components/TopNav.tsx`
- Modify: `src/App.tsx`
- Modify: `src/App.css`
- Modify: `src/lib/export.ts`
- Test: `tests/data.test.ts`

**Interfaces:**
- `getSourceFreshness(lastVerifiedAt, asOf)` returns `current | review | stale | unknown` with explicit future-date handling.
- `ChangeLogEntry` stores date, country ID, change kind, summary, source URLs, and evidence status.
- `CHANGE_LOG` and `ChangeLogView` expose “新增 / 变更 / 待复核” views with country filtering.

- [x] **Step 1: Write failing freshness and change-log tests** for current, review, stale, unknown, future dates, country filtering, and source traceability.
- [x] **Step 2: Run tests to confirm the new helpers and view are missing.**
- [x] **Step 3: Implement freshness classification, initial change-log entries, and source freshness badges.**
- [x] **Step 4: Add the Change Log navigation/view and include it in exports without changing existing tabs’ semantics.**
- [x] **Step 5: Run full tests/build and browser QA for freshness filters, change-log country filter, source links, and responsive layout.**

## Final verification

- [x] `npm test`
- [x] `npm run lint`
- [x] `npm run build`
- [x] Native browser QA at desktop and 390×844: Germany, Netherlands, Spain, France, Poland, one second-batch country, one unchanged queue country, all cross-country filters, cases, sources, changelog, exports, no overflow, and zero console errors.
- [x] Update the SDD ledger with exact counts, changed files, known evidence gaps, and the fact that no Git commit is available in the current read-only metadata setup.
