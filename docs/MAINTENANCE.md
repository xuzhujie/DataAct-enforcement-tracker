# Data Act tracker maintenance

## What the dashboard distinguishes

- **Complaint route** is the public form or channel for a person or company to contact the competent authority. It is not evidence that a complaint was filed or that an authority opened a case.
- **Statutory penalty cap** is the maximum sanction supported by the applicable domestic law or official implementation text. It is not an amount imposed in a real case.
- **Actual public penalty** is populated only from an official decision, register entry, or official announcement that can be traced to a specific Data Act matter. An empty case register means that no publicly traceable decision was located in the reviewed official sources; it does not mean that no investigation exists.

The current registry snapshot is dated `2026-11-21`. It covers all 27 EU Member States, with 5 deep-verified records, 22 partial records, and no country hidden behind an invented zero or a synthetic enforcement case.

The field-level view is intentionally more granular than the coverage label: 9 country records have a verified authority field and 6 have an officially signalled but still pending authority; 7 have a verified public complaint route; 6 have a verified domestic penalty schedule; and the official Data Act case register currently contains 0 cases. The remaining fields are displayed as `pending` or `not_located`, not as zero.

## Local checks

```bash
npm test
npm run lint
npm run build
npm run validate:registry
npm run check:sources -- --output source-health.json
npm run report:maintenance -- --source-health source-health.json --output maintenance-report.json
```

`validate:registry` is deterministic and checks the EU-27 shape, source metadata, nested evidence references, issue lenses, implementation metadata, and case/source integrity. `check:sources` fetches each unique official URL twice at most, follows redirects, and writes a machine-readable report. It intentionally fails on network errors and non-2xx/3xx responses; a 403 or anti-bot response is a maintenance signal, not permission to silently downgrade or overwrite verified data.

`report:maintenance` builds a second machine-readable artifact: it summarizes coverage, field-level evidence gaps, actual case count, due review items, and any source-health failures. Its `asOf` value defaults to the current UTC date for review scheduling; use `--as-of YYYY-MM-DD` to reproduce a historical report. This review date is separate from the registry evidence snapshot date. The command is a reporting step only; it never writes legal facts back into the registry.

## Weekly monitoring

`.github/workflows/data-act-source-monitor.yml` runs every Monday at 02:00 UTC and can also be started with `workflow_dispatch`. It validates the registry, checks all unique source URLs, builds `maintenance-report.json`, and uploads both reports as an artifact. A failed source check creates or comments on the open issue `Data Act source check failed`; a due review queue creates or comments on `Data Act tracker maintenance review due`. The workflow does not mutate the registry or publish unverified facts.

The latest network-enabled run (2026-11-21) reached `81/89` URLs. Eight official endpoints remain maintenance signals: two Lithuanian EIMIN pages, the Romanian ANCOM consultation page, the Lithuanian e-TAR law page, two Cyprus government PDFs, the Irish government General Scheme page, and the French Legifrance PDF. Several return anti-bot `403` responses and one has intermittent network failure. The monitor keeps these failures visible; it does not replace primary evidence with an unverified mirror.

The remaining substantive queue is explicit: 12 countries still have no registrable Data Act-specific authority field, 20 have no public Data Act complaint route, and 21 have no domestic penalty schedule in the reviewed official sources. Belgium, Czechia, Ireland, Poland, Romania and Slovenia now show proposed/expected authorities as `pending`; Sweden has a live PTS complaint e-service but limited powers pending supplementary legislation; Malta now has verified MDIA/MCA/IDPC statutory penalty ceilings but still lacks a separate MCA Data Act intake form and any located public Data Act penalty decision; Portugal has an official implementation-plan signal only. These are not treated as final national law.

## Update protocol

1. Start from the country record and its source manifest; do not replace an official source with a search-result URL.
2. Record the field-level status (`verified`, `pending`, `not_located`, or `not_applicable`) and `lastVerifiedAt` for every change.
3. Keep complaint routes, statutory penalty caps, and actual public penalties in separate fields.
4. Add a case only when an official decision or official authority announcement identifies the Data Act matter, and register the supporting source as `official-decision`; keep the case register empty when no such record is found.
5. Run the local checks, review the source-health failures, and update the maintenance queue rather than filling gaps with zero values.
