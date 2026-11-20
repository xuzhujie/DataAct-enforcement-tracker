# EU-wide Case Register Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an EU-wide, filterable register for officially traceable Data Act enforcement cases without treating source monitoring or empty evidence as a case.

**Architecture:** Keep `CountryRecord.enforcementCases` as the single source of truth. Add pure case-register functions that flatten, deterministically sort, and filter those records; add a dedicated Cases-tab component that displays all-country filters and an honest empty state when the reviewed registry has no public cases. Preserve the existing selected-country case panel inside country detail.

**Tech Stack:** React 19, TypeScript, Vite, native CSS, Node test runner through `tsx`.

**Spec:** `docs/superpowers/specs/2026-11-19-data-act-enforcement-tracker-design.md`

## Global Constraints

- Only an official decision or official announcement with traceable source URLs may enter `enforcementCases`.
- Source monitoring remains a separate layer and never creates an `EnforcementCase`.
- An empty case register must say that no publicly traceable cases are currently registered; it must not claim that no investigation or penalty exists.
- Filters must support country, authority, issue type, and case status; all filters default to `all`.
- No backend, crawler, external publication, or new dependency is in scope.
- Use TDD: write a failing test, observe the failure, implement the smallest change, then run the full suite.

## Review Focus

- Empty registry: all 27 countries currently have zero registered public cases; the UI must remain useful and explicit rather than show a blank table.
- Deterministic ordering: future cases with the same decision date must sort consistently without mutating country records.
- Filter semantics: `all` must preserve all cases; country and authority filters must match exact IDs/names; issue and status filters must not leak unrelated cases.
- Layer separation: source monitors and issue records must not appear as enforcement cases in the EU-wide table.
- Responsive controls: the four filters and the case table must remain contained at narrow widths and preserve the existing no-page-overflow behavior.

### Task 1: Add the case register view-model and failing tests

**Files:**
- Create: `src/data/cases.ts`
- Modify: `src/data/types.ts`
- Test: `tests/data.test.ts`

**Interfaces:**
- `EnforcementCaseFilterState = { countryId: string | 'all'; authorityName: string | 'all'; issue: IssueType | 'all'; status: EnforcementCaseStatus | 'all' }`.
- `DEFAULT_ENFORCEMENT_CASE_FILTERS` has all four filters set to `all`.
- `buildEnforcementCaseRegister(records: CountryRecord[]): EnforcementCase[]` flattens all country cases and sorts by `decisionDate` descending, then `id` ascending.
- `filterEnforcementCases(cases: EnforcementCase[], filters: EnforcementCaseFilterState): EnforcementCase[]` applies exact-match filters and does not mutate input.

- [x] **Step 1: Write failing tests** for the empty EU registry, deterministic flatten/sort using two synthetic cases, each filter, and non-mutation.
- [x] **Step 2: Run `npm test`** and confirm the new imports/functions fail because the API does not exist.
- [x] **Step 3: Implement the types and pure functions** in `src/data/cases.ts`.
- [x] **Step 4: Run `npm test`** and confirm all tests pass.

### Task 2: Add the EU-wide Cases-tab component

**Files:**
- Create: `src/components/GlobalEnforcementCaseRegister.tsx`
- Modify: `src/App.tsx`
- Modify: `src/App.css`

**Interfaces:**
- `GlobalEnforcementCaseRegister({ records }: { records: CountryRecord[] })` owns local filter state and uses the Task 1 pure functions.
- The component exposes four labeled selects: 国家, 主管机关, 争议类型, 案件状态; it shows `显示 filtered / total` and a table with country, decision date, entity, authority, issue, measure, amount, status, and source.
- With zero public cases, it renders an explanatory empty state and keeps the filter controls visible.

- [x] **Step 1: Implement the component** with country options from all records, issue/status options from the type domain, authority options from registered cases, and explicit empty-state copy.
- [x] **Step 2: Add the component above source monitoring in the `cases` branch**; retain the selected-country issue register below.
- [x] **Step 3: Add responsive styles** using the existing panel/table conventions and a contained horizontal scroll region.
- [x] **Step 4: Run `npm run lint` and `npm run build`**.

### Task 3: Reconcile documentation and Native acceptance

**Files:**
- Modify: `docs/superpowers/specs/2026-11-19-data-act-enforcement-tracker-design.md`
- Modify: `.superpowers/sdd/2026-11-20-eu-wide-case-register/progress.md`
- Test: `tests/data.test.ts`

- [x] **Step 1: Add a regression assertion** that the case-register layer is empty for the current official evidence set while `buildEnforcementMonitors` still returns monitors.
- [x] **Step 2: Update the spec** to document the EU-wide case register and its empty-state boundary.
- [x] **Step 3: Run `npm test`, `npm run lint`, and `npm run build`**.
- [x] **Step 4: Use Native desktop and existing 390×844 acceptance** to verify all four filters, empty-state copy, table containment, and no console warning/error entries.
- [x] **Step 5: Mark this plan and ledger complete** with exact test/build/Native results.

## Final verification

- [x] All 27 country records remain unique and unchanged in coverage counts.
- [x] Case register returns zero current public cases without inventing one.
- [x] Synthetic case tests prove flattening, sorting, filtering, and input immutability.
- [x] Source monitoring remains separate from enforcement cases.
- [x] `npm test`, `npm run lint`, `npm run build`, and Native desktop/mobile checks pass.
