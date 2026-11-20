# Data Act Enforcement Tracker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (native) to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Chinese-first React + Vite Data Act country implementation and enforcement dashboard with Germany and the Netherlands as fully verified seed records and a transparent expansion queue for the remaining EU countries.

**Architecture:** Use a small React app composed from reusable view components and a typed local registry. Keep country facts, issue mappings, complaint routes, penalty tiers, enforcement status, milestones, and source records in `src/data/`; derive summary metrics with pure functions; keep all filters and selected-country state in `App.tsx`. The UI follows the adjacent DMA/DSA tracker skeleton but separates complaint intake, statutory maximums, and published penalties.

**Tech Stack:** React 19, TypeScript 5, Vite 7, `lucide-react`, native CSS, Node test runner through `tsx`.

**Spec:** `docs/superpowers/specs/2026-11-19-data-act-enforcement-tracker-design.md`

## Global Constraints

- The default UI is Chinese-first, while official institution names and legal references remain in English/German where helpful.
- Germany and the Netherlands are the fully verified (`deep`) country records in the current snapshot; the remaining countries must be visibly marked pending/queue and must not contain guessed authority or penalty facts.
- Complaint intake, statutory fine ceilings, and published actual penalties are separate data fields and separate UI sections.
- `not_located` means “not located in the current reviewed official source set,” never a verified zero.
- Second-hand transfer is a fact-dependent issue label, not a standalone Data Act offence claim.
- `applicableFrom` and `nationalActEffectiveFrom` are separate dates: 2025-09-12 for the EU Data Act, 2026-05-30 for the German DADG/BNetzA milestone, and 2025-11-21 for the Dutch Uitvoeringswet dataverordening milestone.
- All authority, complaint route, penalty, issue, enforcement, and timeline facts carry source metadata and a last-verified date.
- Use code-native UI for all labels, tables, controls, and links; generated concept images are reference-only.
- Use the accepted visual concepts at `/Users/xuzhujie/.codex/generated_images/01a1f451-68dc-70b1-9b86-56957f9e28a5/exec-701de3fa-54a5-4f99-8a28-35d3811ea30e.png` and `/Users/xuzhujie/.codex/generated_images/01a1f451-68dc-70b1-9b86-56957f9e28a5/exec-024297ad-0d8e-4879-af03-c18a064b84f3.png` as visual references.
- Official source URLs are the source of truth; visible UI must not imply legal advice or guaranteed case outcomes.

## Review Focus

- All 25 non-Germany/non-Netherlands EU Member States must render as queue records with no verified-country treatment or fake zeroes; test a queue record and both deep records in Task 2.
- Germany’s conditional 2% turnover maximum must not be displayed as a universal fine cap; test the exact penalty ladder in Task 1.
- A missing published penalty record must remain distinct from a published zero amount; test the `not_located` state and metric formatter in Task 1.
- A second-hand transfer issue must show a pending/fact-dependent mapping rather than a definitive violation; test issue filtering and status rendering in Task 1/Task 3.
- Narrow screens must not overflow the page when tables and country tabs are wider than the viewport; test the responsive layout in Task 5 and Browser QA.

---

### Task 1: Scaffold the Vite app and build the typed regulatory registry

**Files:**
- Create: `package.json`
- Create: `index.html`
- Create: `vite.config.ts`
- Create: `tsconfig.json`
- Create: `tsconfig.app.json`
- Create: `tsconfig.node.json`
- Create: `src/vite-env.d.ts`
- Create: `src/main.tsx`
- Create: `src/data/types.ts`
- Create: `src/data/registry.ts`
- Create: `src/data/metrics.ts`
- Create: `tests/data.test.ts`

**Interfaces:**
- Produces `CountryRecord`, `AuthorityRecord`, `ComplaintRoute`, `PenaltyTier`, `EnforcementSummary`, `IssueRecord`, `TimelineEvent`, and `SourceRecord` from `src/data/types.ts`.
- Produces `COUNTRY_RECORDS`, `EU_COUNTRY_NAMES`, `GERMANY_ID`, and source constants from `src/data/registry.ts`.
- Produces pure `getCountryMetrics(record)` and `getCoverageMetrics(records)` functions from `src/data/metrics.ts`.

- [ ] **Step 1: Create the minimal Vite/TypeScript package manifest and run the initial dependency install.**

  Use scripts `dev`, `build`, `lint` (`tsc -b`), `test` (`tsx --test tests/data.test.ts`), and `preview`; dependencies are React, React DOM, Vite, TypeScript, `lucide-react`, and `tsx` as a dev dependency.

- [ ] **Step 2: Write failing data tests for the Germany seed and queue invariants.**

  Add tests asserting:

  ```ts
  const germany = COUNTRY_RECORDS.find((item) => item.id === 'de')!

  assert.equal(germany.applicableFrom, '2025-09-12')
  assert.equal(germany.nationalActEffectiveFrom, '2026-05-30')
  assert.deepEqual(germany.penaltySchedule.map((tier) => tier.label), ['€5m / 2%', '€500k', '€100k', '€50k'])
  assert.equal(germany.penaltySchedule[0].conditionalTurnoverCap, true)
  assert.equal(germany.enforcementSummary.publishedPenaltyStatus, 'not_located')
  assert.equal(germany.enforcementSummary.publishedPenaltyCount, null)
  assert.equal(germany.complaintRoutes.length, 5)
  assert.equal(germany.issues.find((issue) => issue.issue === 'second_hand_transfer')?.status, 'pending')
  assert.equal(COUNTRY_RECORDS.find((item) => item.id === 'fr')?.coverage, 'queue')
  ```

- [ ] **Step 3: Implement `src/data/types.ts` with explicit evidence and status types.**

  Define `VerificationStatus = 'verified' | 'pending' | 'not_located' | 'not_applicable'`, `CountryCoverage = 'deep' | 'queue' | 'planned'`, `IssueType = 'device_access' | 'third_party_sharing' | 'second_hand_transfer'`, and the interfaces needed by the UI. `SourceRecord` must include `id`, `label`, `url`, `sourceType`, `lastVerifiedAt`, `evidenceStatus`, and optional `note`. `EnforcementSummary` must use nullable count/amount fields so `not_located` cannot become a zero by accident.

- [ ] **Step 4: Implement `src/data/registry.ts` with official Germany data and an explicit country queue.**

  Add the official URLs and the Germany record:

  - BNetzA Data Act page and complaint portal.
  - BNetzA “Beschwerde über Datenzugang, Datennutzung und Datenweitergabe” form.
  - BNetzA forms for Chapter V exceptional-need data requests, Chapter VI switching, Chapter VII third-country requests, and follow-up submissions.
  - `DADG §15` on `gesetze-im-internet.de`.
  - BNetzA 2026-05-30 competent-authority announcement.
  - BNetzA/BfDI data-protection cooperation page.
  - EUR-Lex Data Act text.

  Set BNetzA as Germany’s primary competent authority/data coordinator, BfDI as the separate personal-data supervision role, and keep BfDI out of the complaint-route count. Set the five complaint routes to the verified online form URLs and note that the portal says complaints are not accepted by email. Encode the four §15 tiers exactly:

  - `€5m / 2%`: §15(2) No. 9; conditional alternative for qualifying entities under §15(5), not a universal cap.
  - `€500k`: §15(1) No. 2 and §15(2) Nos. 1, 2, 6, 7, 12, 13.
  - `€100k`: §15(1) No. 1, §15(2) Nos. 8, 10, 11, 14, 16–19, 22, 23, 25, and §15(3).
  - `€50k`: remaining listed §15(2) offences.

  Add issue records with conservative mappings: device access is verified against BNetzA’s complaint categories and Articles 3/4; third-party sharing is verified as a complaint category but the tier remains conduct-dependent; second-hand transfer is pending and explicitly says it is not a standalone offence in the seed model. Add timeline events for 2024-01-11 EU entry into force, 2025-09-12 application, 2026-05-30 DADG/BNetzA milestone, and 2026-11-19 last verification.

Add queue records for the remaining 25 EU Member States after Germany and the Netherlands with bilingual names, flags, ISO2 codes and coverage only, `pending` status, no guessed authority, no guessed penalty tiers, and source links pointing to the EU country list and EU Data Act framework. The Netherlands record is the second deep sample, backed by the enacted Uitvoeringswet dataverordening, ACM/AP authority split, ACM reporting route, domestic penalty caps, and explicit `not_located` public-penalty status.

- [ ] **Step 5: Implement pure metric derivation in `src/data/metrics.ts`.**

  `getCountryMetrics(record)` returns authority count, complaint-route count, penalty-tier count, published-penalty display status, verified/pending issue counts, and the two milestone dates. `getCoverageMetrics(records)` returns total country names, deep records, queued records, and planned records. Preserve `null` for unpublished penalty counts and use a `publishedPenaltyLabel()` helper that returns “未定位到公开处罚决定” for `not_located`.

- [ ] **Step 6: Run the data tests and type/build checks.**

  Run `npm test`, `npm run lint`, and `npm run build`. Expected: the new registry tests pass and the empty shell compiles.

- [ ] **Step 7: Commit the scaffold and registry.**

  ```bash
  git add package.json package-lock.json index.html vite.config.ts tsconfig*.json src/main.tsx src/data tests/data.test.ts
  git commit -m "feat: add Data Act country registry and Germany seed"
  ```

### Task 2: Build the app shell, filters, and selected-country state

**Files:**
- Create: `src/App.tsx`
- Create: `src/components/AppShell.tsx`
- Create: `src/components/TopNav.tsx`
- Create: `src/components/CountrySwitcher.tsx`
- Create: `src/components/IssueFilters.tsx`
- Create: `src/components/StatusTag.tsx`
- Create: `src/lib/format.ts`
- Modify: `src/main.tsx`

**Interfaces:**
- `AppShell` consumes selected `CountryRecord`, `activeTab`, `activeIssues`, `onSelectCountry`, `onToggleIssue`, and `onSelectTab`.
- `CountrySwitcher` consumes `CountryRecord[]`, `selectedCountryId`, and `onSelectCountry`.
- `IssueFilters` consumes `IssueType[]` and returns toggled issue filters.
- `StatusTag` consumes `VerificationStatus` and renders the Chinese label/color variant.

- [ ] **Step 1: Implement the app composition with local state.**

  In `src/App.tsx`, initialize `selectedCountryId = 'de'`, `activeTab = 'dashboard'`, and all three issue filters selected. Derive the selected record from `COUNTRY_RECORDS`; if a queue country is selected, render the pending state rather than falling back to Germany. Keep all state local and URL-independent for v1.

- [ ] **Step 2: Implement the top navigation and title band.**

  Use the concept’s white navigation row and navy title band. Tabs are `Dashboard`, `Country register`, `Cases`, `Timeline`, and `Sources`, with Chinese labels and small English sublabels where space allows. The title is exactly `Data Act enforcement tracker`; the subtitle explains national implementation, complaint intake, statutory fines, and actual enforcement for connected hardware.

- [ ] **Step 3: Implement country and issue controls.**

  The country switcher shows all 27 EU Member States with Germany selected by default; it supports horizontal scrolling on narrow screens. The issue filter bar toggles Device data access, Third-party sharing, and Second-hand transfer, and includes a clear-filters action that restores all three.

- [ ] **Step 4: Add formatter helpers and status variants.**

  In `src/lib/format.ts`, implement `formatDate`, `formatCurrencyMaximum`, `formatCoverage`, `formatVerificationStatus`, and `formatIssueLabel`. In `StatusTag`, map verified to teal, pending to amber, not-located to slate/blue-gray, and not-applicable to muted gray; never use red for a missing penalty.

- [ ] **Step 5: Render the app shell with placeholder content slots and verify state changes manually.**

  Run `npm run dev`, confirm the page loads, select France, toggle one issue filter, then return to Germany and clear filters. The selected country and filter controls must update without runtime errors before the detail components are added.

### Task 3: Implement dashboard metrics, country register, Germany detail, and sources

**Files:**
- Create: `src/components/MetricStrip.tsx`
- Create: `src/components/CountryRegister.tsx`
- Create: `src/components/CountryDetail.tsx`
- Create: `src/components/IssueMatrix.tsx`
- Create: `src/components/PenaltyLadder.tsx`
- Create: `src/components/SourceList.tsx`
- Create: `src/components/ComplaintRoutes.tsx`
- Modify: `src/App.tsx`

**Interfaces:**
- `MetricStrip` consumes `CountryMetrics` and `CountryRecord`.
- `CountryRegister` consumes `CountryRecord[]`, `selectedCountryId`, and `onSelectCountry`.
- `CountryDetail` consumes a `CountryRecord`, selected `IssueType[]`, and renders its own local detail tabs.
- `IssueMatrix` consumes `IssueRecord[]` and an issue filter set.
- `PenaltyLadder` consumes `PenaltyTier[]` and `EnforcementSummary`.
- `SourceList` consumes `SourceRecord[]`; `ComplaintRoutes` consumes `ComplaintRoute[]`.

- [ ] **Step 1: Build the four evidence-oriented metric blocks.**

  Render “主管机构”, “投诉入口”, “法定罚款上限”, and “已公开处罚” separately. Germany must show BNetzA, the BNetzA complaint portal, `€5m / 2%` with a condition note, and `未定位到公开处罚决定`. Queue countries show pending values rather than zeroes.

- [ ] **Step 2: Build the country implementation register.**

  Render columns for country, implementing act, complaint intake, published penalties, and status. The selected Germany row has a blue selection background; queue rows show `TBD / 待补齐`, em dash for unverified values, and an amber pending tag. Row selection updates the detail panel.

- [ ] **Step 3: Build the Germany issue matrix.**

  Use a table, not a card grid, with rows for EU articles, national basis, verification status, evidence/scope, and next action. Filter columns/rows based on the active issue set. Keep second-hand transfer visibly pending and include the caveat that it is not a standalone offence claim.

- [ ] **Step 4: Build the statutory penalty ladder and actual-enforcement panel.**

  Render the four tier rows with legal basis and scope. Make the first row’s 2% conditional wording explicit. Beside it, render the actual enforcement panel with the `not_located` message, last verified date, and source link; do not render a zero total.

- [ ] **Step 5: Build complaint route and official source sections.**

  Show the primary BNetzA complaint portal plus the five form routes, each with scope and external-link icon. Show BNetzA, DADG §15, BNetzA/BfDI note, and EUR-Lex sources in the Sources tab and below the selected-country detail. All links use `target="_blank"` and `rel="noreferrer"`.

- [ ] **Step 6: Add “copy reference” behavior.**

  Implement a button that copies a concise string such as `Germany · Data Act · DADG §15 · verified 2026-11-19` via `navigator.clipboard.writeText`, with an inline success state that resets after a short timeout. It must fail gracefully when clipboard access is unavailable.

- [ ] **Step 7: Run the data tests, build, and manual dashboard interaction check.**

  Run `npm test`, `npm run lint`, `npm run build`; then verify Germany/France selection, issue toggling, source links, and the copy-reference state in the running app.

### Task 4: Add cases, timeline, sources navigation, and lightweight exports

**Files:**
- Create: `src/components/CaseRegister.tsx`
- Create: `src/components/TimelineView.tsx`
- Create: `src/components/ExportActions.tsx`
- Modify: `src/App.tsx`
- Modify: `src/data/metrics.ts`

**Interfaces:**
- `CaseRegister` consumes `IssueRecord[]`, selected issue filters, and the selected country.
- `TimelineView` consumes `TimelineEvent[]` and renders chronological milestones.
- `ExportActions` consumes the currently selected `CountryRecord` and active issue filters, and exposes `onExportMarkdown` and `onExportJson` callbacks.

- [ ] **Step 1: Implement the Cases tab as an issue/evidence register.**

  Each row shows issue type, label, EU articles, national basis, status, evidence summary, next action, and source links. Label the view as `争议/事项登记` so it is not mistaken for a court or agency case docket.

- [ ] **Step 2: Implement the Timeline tab as regulatory and implementation milestones.**

  Render Germany’s four timeline events in reverse chronological order with date, event type, description, and source. Do not invent a penalty event; the last event remains a verification/update milestone.

- [ ] **Step 3: Implement Sources as a dedicated tab and reusable section.**

  The Sources tab groups sources by official authority, statute, EU legal text, and cooperation note. It reuses the same `SourceRecord` objects as the detail panel so there is no duplicate URL list.

- [ ] **Step 4: Add JSON and Markdown exports for the current view.**

  JSON exports the selected country record plus `selectedIssueTypes`; Markdown exports a concise summary with authority, complaint portal, penalty ladder, actual penalty status, issues, and source URLs. Use browser download APIs only; no backend or file-system writes.

- [ ] **Step 5: Run tests/build and verify exports contain the selected country and filter state.**

  Export Germany with only `device_access` selected and assert via a quick manual check that the file contains Germany, the selected issue, DADG §15, and the official source URL.

### Task 5: Apply the accepted visual system and responsive behavior

**Files:**
- Create: `src/index.css`
- Create: `src/App.css`
- Modify: `index.html`
- Modify: component files from Tasks 2–4 only where class names/semantic wrappers are needed.

**Interfaces:**
- CSS tokens are shared through `:root` variables; components use semantic class names instead of one-off inline styles for repeated patterns.

- [ ] **Step 1: Implement the desktop design tokens and layout primitives.**

  Use true white surfaces, navy `#122b50`, blue `#1e62d0`, slate text, teal verified, amber pending, and red only for penalty amounts. Establish max width, 1px borders, 10px radii, subtle shadows, 8px spacing rhythm, and deliberate font sizes for navigation, labels, body text, tables, and buttons.

- [ ] **Step 2: Style the first viewport to match the accepted concept.**

  Match the reference hierarchy: quiet navigation, navy title band, country switcher, issue filter row, four metric blocks, two-column register/detail layout, and visible issue/penalty sections. Keep controls code-native and do not add an eyebrow, marketing badge, or decorative chart.

- [ ] **Step 3: Add responsive breakpoints and accessible interaction states.**

  At tablet widths, stack the country register/detail columns; at mobile widths, make country controls horizontally scrollable, constrain tables to contained overflow, and stack metric blocks. Add visible focus styles, `aria-pressed` to issue toggles, `aria-current` to active tabs, and `prefers-reduced-motion` handling.

- [ ] **Step 4: Run the build and inspect desktop/mobile screenshots.**

  Run `npm run lint` and `npm run build`; capture a desktop screenshot around 1440×960 and a mobile screenshot around 390×844 for Browser QA.

### Task 6: Browser verification and final regression pass

**Files:**
- Modify: any implementation files needed to fix findings from rendered QA.
- Do not commit: screenshots, traces, temporary reports, or scratch scripts.

**Interfaces:**
- Target flow: app loads → Germany dashboard renders → switch to France → toggle off third-party sharing → open Cases → return to Germany → open DADG §15 source.

- [ ] **Step 1: Start the Vite dev server and load the app in Browser/IAB.**

  Use the Browser path first. Verify URL, page title, meaningful DOM content, no framework error overlay, and no relevant console errors.

- [ ] **Step 2: Exercise the core interaction flow.**

  Select France and confirm its queue/pending state; reselect Germany and confirm the BNetzA/DADG detail; toggle the issue filter and confirm the matrix/case list changes; switch to Cases and Timeline; open an official source in a new tab; click copy reference and confirm its success state.

- [ ] **Step 3: Verify responsive layout.**

  Inspect desktop at the concept’s 1440×960 scale and a mobile-sized viewport. Confirm there is no page-level horizontal overflow, no clipped primary content, visible focus/selected states, and readable table text.

- [ ] **Step 4: Inspect the accepted concept and the latest browser screenshot with `view_image`.**

  Compare at least five points: title/nav hierarchy, country/issue control placement, metric separation, penalty ladder vs actual enforcement separation, issue matrix density, typography/color tokens, and mobile stacking. Record any mismatch and fix it before handoff.

- [ ] **Step 5: Run final verification commands.**

  Run `npm test`, `npm run lint`, and `npm run build` fresh after all QA fixes. Report exact pass/fail evidence and any remaining intentional limitation.

- [ ] **Step 6: Commit the verified implementation.**

  ```bash
  git add .
  git commit -m "feat: build Data Act enforcement dashboard"
  ```

