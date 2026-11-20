# Data Act queue closure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the current EU-27 evidence audit by rechecking the remaining queue countries against primary sources, upgrading only countries with an official Data Act implementation signal, and leaving the rest explicitly queued without invented authorities, complaint routes, penalties, or cases.

**Architecture:** Keep the existing React + Vite + TypeScript registry as the single source of truth. Add only source records and coverage metadata for evidence that is directly supported by official national material. Monitoring, review queue, filters, and exports continue to derive from the registry and preserve the separation between complaint intake, statutory penalties, and actual enforcement decisions.

**Tech Stack:** React 19, TypeScript 5, Vite 7, `lucide-react`, native CSS, Node test runner through `tsx`.

**Spec:** `docs/superpowers/specs/2026-11-19-data-act-enforcement-tracker-design.md`

## Global Constraints

- Use primary official sources for legal status, authority designations, complaint routes, penalty rules, and enforcement decisions.
- Do not treat DGA, DSA, GDPR, general digital-policy pages, or a regulator’s generic homepage as a Data Act authority or penalty source. Such material stays `research-lead`.
- `partial` means an official Data Act implementation signal exists, not that the country has a final authority, complaint portal, or penalty schedule.
- Keep complaint entry, statutory maximum, and actual public penalty as independent fields; unresolved values remain empty or `not_located`, never zero.
- Preserve the 27-country directory exactly once and keep queue countries visible with an explicit next-research note.
- Use TDD: write/update failing tests first, run the focused test to confirm the gap, then implement the smallest registry change and run the full suite.
- No backend, crawler, external publication, or Git commit is in scope.

## Review Focus

- Czechia: use the official RVIS minutes and official Data Act materials to record legislative status, but do not treat the proposed CTU/UOOU/DIA roles as final designations.
- Hungary: use the official NAIH annual report to record that an implementation bill was submitted but not adopted and that authority designation remained unresolved.
- Slovakia: use the official MIRRI announcement/organisation document to record an implementation-law workstream, without filling final authority or penalty fields.
- Bulgaria, Croatia, Cyprus, Estonia, Greece, Italy, Latvia, Luxembourg, and Slovenia remain queue unless a primary source establishes more than a general policy or DGA/DSA role.
- Reconcile count assertions, coverage filters, implementation-stage filters, monitor status, maintenance priority, exports, and documentation with the final evidence boundary.

### Task 1: Add failing tests for the queue-closure decisions

**Files:**
- Modify: `tests/data.test.ts`

- [x] Update expected partial/queue counts and order for Czechia, Hungary, and Slovakia.
- [x] Add assertions that those three countries are `partial` with `legislative` stage, but still have empty final authority, complaint, penalty, and case layers.
- [x] Add assertions for the new official source IDs and preserve queue-source invariants for the remaining countries.
- [x] Run the focused tests and confirm they fail against the current registry.

### Task 2: Reconcile official national evidence in the registry

**Files:**
- Modify: `src/data/registry.ts`
- Modify: `src/data/changelog.ts`

- [x] Add Czech official RVIS and CTU source records with explicit draft/uncertain-role notes.
- [x] Add the official Hungarian NAIH 2025 annual-report source and update the existing NAIH note to distinguish Data Act implementation from DGA.
- [x] Add the official Slovak MIRRI implementation-law announcement and retain the organisational coordination document as supporting evidence.
- [x] Upgrade Czechia, Hungary, and Slovakia to `partial` / `legislative` without inventing authorities, complaint routes, penalties, or enforcement cases.
- [x] Keep the other nine queue countries as queue and retain their official research leads and caveats.
- [x] Add a dated change-log entry with source URLs and evidence status.

### Task 3: Reconcile derived views and documentation

**Files:**
- Modify: `docs/superpowers/specs/2026-11-19-data-act-enforcement-tracker-design.md`
- Modify: `tests/data.test.ts`

- [x] Update the EU-27 coverage statement and implementation-stage examples to the final counts.
- [x] Verify monitoring treats new research-lead sources as candidate monitors and does not infer cases.
- [x] Verify review queue priority/cadence, country filters, source lists, and JSON/Markdown exports remain consistent.

### Task 4: Full verification and Native acceptance

**Files:**
- Modify: `.superpowers/sdd/2026-11-20-data-act-queue-closure/progress.md`

- [x] Run `npm test`, `npm run lint`, and `npm run build`.
- [x] Use Native desktop and 390×844 checks for the revised country counts, partial/queue filters, source labels, maintenance view, exports, overflow, and console warnings/errors.
- [x] Record exact verification results and unresolved evidence gaps in the SDD ledger.
- [x] Mark this plan complete only after the full suite and Native checks pass.

## Final verification

- [x] EU-27 count and uniqueness remain 27.
- [x] Coverage and queue counts match the final evidence decisions.
- [x] No queue or draft-only country contains an invented final authority, complaint route, statutory penalty, or enforcement case.
- [x] Complaint portal, statutory cap, and actual penalty remain separately represented.
- [x] `npm test`, `npm run lint`, `npm run build`, and Native desktop/mobile QA pass.
