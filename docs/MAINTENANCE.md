# Data Act tracker maintenance

## What the dashboard distinguishes

- **Complaint route** is the public form or channel for a person or company to contact the competent authority. It is not evidence that a complaint was filed or that an authority opened a case.
- **Statutory penalty cap** is the maximum sanction supported by the applicable domestic law or official implementation text. It is not an amount imposed in a real case.
- **Actual public penalty** is populated only from an official decision, register entry, or official announcement that can be traced to a specific Data Act matter. An empty case register means that no publicly traceable decision was located in the reviewed official sources; it does not mean that no investigation exists.

The current snapshot is dated `2026-11-20`. It covers all 27 EU Member States, with 5 deep-verified records, 22 partial records, and no country hidden behind an invented zero or a synthetic enforcement case.

## Local checks

```bash
npm test
npm run lint
npm run build
npm run validate:registry
npm run check:sources -- --output source-health.json
```

`validate:registry` is deterministic and checks the EU-27 shape, source metadata, nested evidence references, issue lenses, implementation metadata, and case/source integrity. `check:sources` fetches each unique official URL twice at most, follows redirects, and writes a machine-readable report. It intentionally fails on network errors and non-2xx/3xx responses; a 403 or anti-bot response is a maintenance signal, not permission to silently downgrade or overwrite verified data.

## Weekly monitoring

`.github/workflows/data-act-source-monitor.yml` runs every Monday at 02:00 UTC and can also be started with `workflow_dispatch`. It validates the registry, checks all unique source URLs, uploads `source-health.json`, and creates or comments on one open GitHub issue titled `Data Act source check failed` when a run fails. The workflow does not mutate the registry or publish unverified facts.

The latest network-enabled run reached `72/80` URLs. Eight official endpoints remain maintenance signals: two Lithuanian EIMIN pages, the Romanian ANCOM consultation page, the Lithuanian e-TAR law page, two Cyprus government PDFs, the Irish government General Scheme page, and the French Legifrance PDF. Several return anti-bot `403` responses and one has intermittent network failure. The monitor keeps these failures visible; it does not replace primary evidence with an unverified mirror.

## Update protocol

1. Start from the country record and its source manifest; do not replace an official source with a search-result URL.
2. Record the field-level status (`verified`, `pending`, `not_located`, or `not_applicable`) and `lastVerifiedAt` for every change.
3. Keep complaint routes, statutory penalty caps, and actual public penalties in separate fields.
4. Add a case only when an official decision or official authority announcement identifies the Data Act matter, and register the supporting source as `official-decision`; keep the case register empty when no such record is found.
5. Run the local checks, review the source-health failures, and update the maintenance queue rather than filling gaps with zero values.
