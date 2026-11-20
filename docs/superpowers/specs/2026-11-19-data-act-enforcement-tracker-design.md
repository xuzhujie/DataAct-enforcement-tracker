# Data Act enforcement tracker — 国别实施与执法看板

## Intent

为联网硬件与相关服务团队提供一个“先看国家，再看争议类型”的 Data Act 工作台。本轮以德国、荷兰、丹麦和芬兰为深度样本，把主管机构、投诉入口、国内罚则、已公开处罚和三类最相关争议放进同一条可核验记录；其余 EU 成员国保留可复制的数据结构、明确的待核验事项和覆盖队列。

产品不把“有投诉入口”“法律允许的最高罚款”和“已经实际处罚”合并成一个数字。每一项都要有独立字段、状态和来源。

## Goals

- 做出可运行的国别实施与执法首页，默认选中 Germany，并可切换至四个深度样本；其余 EU 国家仍在同一登记簿中可筛选、可追踪。
- 支持按国家、争议类型、核验状态和执法状态筛选。
- 用德国首条完整记录展示：
  - 主管机构：Bundesnetzagentur（BNetzA）；个人数据处理相关事项由 BfDI 参与/监督的边界单独标识。
  - 投诉入口：BNetzA Data Act 投诉门户及其按事项分流的表单。
  - 国内罚则：DADG §15 的 €5m / 2%（特定违法类型）、€500k、€100k、€50k 档位，显示适用范围。
  - 实际处罚：独立显示“截至当前官方来源核验，未定位到 BNetzA/BfDI 已公开的 Data Act 处罚决定”，而不是把空值误写成罚款为零。
  - 议题：设备数据访问、第三方共享、二手转让/设备转移。
- 延续相邻 DMA / DSA 看板的操作模式：摘要区、筛选、Dashboard / Country register / Cases / Timeline / Sources / Change log、数据新鲜度、来源列表和导出入口。
- 让后续国家扩展不需要改组件结构，只需增加国家记录、法规、主管机构、入口、事项映射和案件来源；本国映射未完成时也要保留显式的待核验事项记录。
- 保持每个国家的实施事实、法定罚款上限和实际公开处罚分栏；只有有足够官方证据时才从队列升级为部分核验或已核验。
- 队列国家可以挂载官方立法/协作线索备注，但备注不能填充主管机构、投诉入口、罚款上限或实际处罚字段，也不能把草案/合作协议解释为最终指定。
- DSA、DGA、GDPR 或一般数字政策材料可以作为 `research-lead` 进入维护队列，但不构成 Data Act 主管机关、投诉入口、国内罚则或实际案件证据；西班牙 BOE DSA 协作文本因此不再作为 Data Act 来源。
- 来源监测、法定罚款档位和实际执法案件是三个独立层级；来源监测行只表示页面可追踪，不代表已经有执法决定。
- 每个国家均有一个维护复核任务，按 `partial` / `queue` / `deep` 设定优先级和下次复核日，并列出待补字段与来源链接。

## Non-goals

- 首版不实现后端数据库、账号、权限、自动抓取或正式案件管理系统。
- 不把德国之外的国家状态猜成“已落实”或“无处罚”；未核验项必须显式标为“待补齐 / Pending verification”。
- 不把二手转让作为 Data Act 的独立违法类型下结论；它是一个需要按事实与条款映射的业务争议标签。
- 不提供法律意见，不替代官方决定、行政程序或民事救济。

## Anti-goals

- 不做营销型 landing page、夸大的“EU 罚款总额”或没有来源的 KPI。
- 不把投诉数量、案件数量、法定上限和实际罚款混在一个统计卡里。
- 不用空占位数据伪装为其他成员国的已核验监管事实。

## Approaches

### A — React + Vite + 本地结构化数据（已选）

当前仓库为空，采用 React + Vite + TypeScript，先用可迁移的本地数据模型落地。优点是可以快速复用 DMA / DSA 看板的密度和交互，也能把国家扩展设计成新增记录，而不是复制页面。后续可把 `src/data/` 平移到 SQLite / Postgres 或 API。

### B — Next.js + API / 数据库

适合长期生产化，但首版没有稳定后端数据源，容易把工作重心移到部署和数据服务，延迟德国工作台的验证。

### C — 纯 HTML/CSS/JS

适合一次性静态展示，但筛选、详情联动、导出和多国扩展会变得难以维护，不符合 tracker 的持续更新用途。

本次采用 A，因为它与相邻 DMA / DSA 项目技术栈和交互方式一致，且保留了未来接数据层的路径。

## Source and evidence policy

首版只把官方来源作为法律/监管事实的主来源：

- BNetzA Data Act 主页：<https://www.bundesnetzagentur.de/DE/Fachthemen/Digitales/DataAct/start.html>
- BNetzA 投诉门户：<https://www.bundesnetzagentur.de/DE/Fachthemen/Digitales/DataAct/Beschwerdeportal/start.html>
- BNetzA 2026-05-30 主管机关公告：<https://www.bundesnetzagentur.de/SharedDocs/Pressemitteilungen/DE/2026/20260530_DA.html>
- 德国法条 DADG §15：<https://www.gesetze-im-internet.de/dadg/__15.html>
- Data Act 正文（EUR-Lex）：<https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32023R2854>
- BNetzA / BfDI 数据保护协作说明：<https://www.bundesnetzagentur.de/DE/Fachthemen/Digitales/DataAct/Datenschutz/start.html>
- 荷兰《Uitvoeringswet dataverordening》（Staatsblad 2025, 372）：<https://zoek.officielebekendmakingen.nl/stb-2025-372.html>
- 荷兰 ACM Data Act 主管机关说明：<https://www.acm.nl/en/publications/acm-now-authorized-enforce-data-act>
- 荷兰 ACM 智能设备数据与报告入口：<https://www.acm.nl/en/online-platforms/data/data-smart-devices> · <https://www.acm.nl/nl/uw-melding-over-een-online-platform-clouddienst-data-uit-uw-slimme-apparaat>

每个国家、入口、罚则档位、处罚记录和争议映射均保存 `sourceUrl`、`sourceLabel`、`sourceType`、`lastVerifiedAt` 和 `evidenceStatus`。`sourceType = research-lead` 专门标记跨法规或待追踪的官方入口。没有公开处罚决定时用 `not_located`，避免把“未定位”误报成“确定为 0”。

## Germany seed facts

- Data Act 自 2025-09-12 起适用；德国的 DADG 于 2026-05-30 生效，BNetzA 成为德国 Data Act 主管机关/中央联络点。
- BNetzA 投诉门户说明：自然人和法人均可投诉；投诉只能通过网站提供的表单提交，不接受通过电子邮件提交的投诉；门户列出数据访问、数据使用与数据分享等入口，并说明 BNetzA 也可依职权开展监督程序。
- DADG §15(4) 规定多档最高罚款：特定违法类型最高 €5,000,000；部分违反产品设计、数据提供、使用/分享或可执行命令的事项最高 €500,000；其余指定事项最高 €100,000；其他违法事项最高 €50,000。
- DADG §15(5) 对 §15(2) No. 9 且全球总营业额超过 €250m 的法人/人员联合体，另设最高可达上一财年全球总营业额 2% 的上限。
- §15(7) 指定 BNetzA 为行政罚款主管机关。涉及个人数据的 Data Act 监督需按 DADG §3 / GDPR 责任边界处理，BfDI 参与相关数据保护判断。
- 实际处罚卡片必须显示“当前官方来源集合未定位到已公开处罚决定”，并显示最后核验日期；此卡不能展示一个未经来源支持的 €0 总额。

## Netherlands seed facts

- 荷兰《Uitvoeringswet dataverordening》于 2025-11-21 生效；ACM 是 Data Act 数据协调员和主要主管机关，AP 负责个人数据相关边界。
- ACM 的智能设备数据页面和中央报告表覆盖透明度、设备数据访问、第三方分享及云服务切换；涉及个人数据的报告可转交 AP。
- 荷兰国内罚则分开记录：ACM 最高为《刑法》第 23(4) 条第六类罚金或上一财年欧盟营业额 10%（取高者）；AP 在 Data Act 第 40(4) 范围内按 GDPR 第 83(5) 上限处理个人数据事项。
- 截至当前官方 ACM 页面与出版物索引核验，未定位到公开的 Data Act 处罚决定；一般 ACM 竞争/消费者罚款不计入 Data Act 实际处罚栏。

## Data model

```ts
type VerificationStatus = 'verified' | 'pending' | 'not_located' | 'not_applicable'
type CountryCoverage = 'deep' | 'partial' | 'queue' | 'planned'
type ImplementationStage = 'enacted' | 'legislative' | 'draft' | 'not_located'
type IssueType = 'device_access' | 'third_party_sharing' | 'second_hand_transfer'

interface CountryRecord {
  id: string
  name: string
  iso2: string
  flag: string
  coverage: CountryCoverage
  implementationStage: ImplementationStage
  coverageNote?: string
  implementingAct?: string
  implementingActUrl?: string
  applicableFrom?: string
  competentAuthorities: AuthorityRecord[]
  complaintRoutes: ComplaintRoute[]
  penaltySchedule: PenaltyTier[]
  enforcementSummary: EnforcementSummary
  enforcementCases: EnforcementCase[]
  issues: IssueRecord[]
  sources: SourceRecord[]
  lastVerifiedAt: string
}

interface EnforcementCase {
  id: string
  countryId: string
  authorityName: string
  decisionDate: string
  entity: string
  issue: string
  measure: string
  amountEur: number | null
  status: 'final' | 'under_review' | 'appeal' | 'unknown'
  sourceUrls: string[]
  evidence: string
}

interface SourceFreshness {
  status: 'current' | 'review' | 'stale' | 'unknown'
  daysOld: number | null
  note: string
}

interface ChangeLogEntry {
  id: string
  date: string
  countryId: string
  kind: 'new' | 'changed' | 'review'
  summary: string
  sourceUrls: string[]
  evidenceStatus: VerificationStatus
}

type SourceType = 'authority' | 'complaint-form' | 'statute' | 'eu-regulation' | 'joint-guidance' | 'eu-country-list' | 'research-lead'

interface EnforcementMonitor {
  id: string
  countryId: string
  sourceId: string
  url: string
  sourceType: SourceType
  status: 'active' | 'candidate'
  lastCheckedAt: string
  evidence: EvidenceMetadata
}

interface ReviewQueueItem {
  id: string
  countryId: string
  priority: 'high' | 'medium' | 'low'
  targetFields: string[]
  lastVerifiedAt: string
  nextReviewAt: string
  due: boolean
  sourceUrls: string[]
}

interface AuthorityRecord {
  name: string
  role: 'data_coordinator' | 'competent_authority' | 'data_protection'
  scope: string
  sourceUrl: string
}

interface ComplaintRoute {
  id: string
  label: string
  scope: string
  url: string
  submissionMode?: string
  status: VerificationStatus
}

interface PenaltyTier {
  label: string
  maximum: string
  legalBasis: string
  scope: string
  sourceUrl: string
}

interface EnforcementSummary {
  publishedPenaltyStatus: VerificationStatus
  publishedPenaltyCount: number | null
  publishedPenaltyAmountEur: number | null
  note: string
  sourceUrl: string
}

interface IssueRecord {
  issue: IssueType
  label: string
  euArticles: string[]
  nationalBasis?: string
  status: VerificationStatus
  evidenceSummary: string
  nextAction: string
  sourceUrls: string[]
}
```

The current EU-27 slice includes 6 `deep` records (Germany, Denmark, Finland, Lithuania, Malta, Netherlands), 21 `partial` records (Austria, Belgium, Bulgaria, Croatia, Cyprus, Czechia, Estonia, France, Greece, Hungary, Ireland, Italy, Latvia, Luxembourg, Poland, Portugal, Romania, Slovakia, Slovenia, Spain, Sweden), and no `queue` records. The country register keeps every Member State exactly once. `partial` records expose official clues and implementation stage while each authority, complaint route, statutory penalty and published-penalty field carries its own `verified`, `pending`, or `not_located` status; no country inherits another country’s legal facts. All 27 records expose the three hardware issue lenses; non-deep records mark them `pending` until the national implementation, authority and enforcement mapping is verified. Malta is the exception to the all-pending issue rule: its device-access and third-party-sharing lenses are verified against MDIA guidance, while second-hand transfer remains pending.

Second-batch evidence currently covers Italy, Belgium, Austria, Czechia, Hungary, Slovakia, Denmark, and Finland. Italy remains partial because the reviewed AGCOM 2026–2028 plan places the Data Act in its regulatory perimeter but does not establish a final Data Act designation, complaint route, or domestic penalty schedule. Belgium is partial because BIPT's role, 2026 work plan, and a government implementation draft are official but the final act and complete intake/penalty fields were not confirmed. Austria is partial because RTR records the statutory designation as outstanding, while DSB is retained only for the personal-data boundary. Czechia is partial because official RVIS minutes describe a Data Act implementation bill and a proposed CTU coordinator while noting that other roles remain uncertain. Hungary is partial because the official NAIH 2025 annual report says implementation bill T/13050 was submitted but not adopted and that authorities had not yet been finally designated. Slovakia is partial because official MIRRI material records a Data Act implementation-law workstream without a final authority or penalty framework. Denmark, Finland and Lithuania are deep records backed by enacted national laws, named supervisory authorities, official intake routes, and statutory penalty ceilings; Lithuania’s official RRT evidence is retained even where ministry/e-TAR endpoints return anti-bot responses. Ireland now records draft complaint procedures and draft penalty ceilings as pending, while Portugal and Romania remain on official implementation-plan/consultation evidence. Sweden records a live PTS intake and the government inquiry’s proposed penalty ceiling as pending; Malta is now deep because its enacted L.N. 222/2025, MDIA/MCA/IDPC competence split, complaint paths, statutory ceilings, and two hardware issue lenses are verified; its second-hand-transfer lens and public-penalty register remain open. None of these records has a publicly traceable Data Act penalty decision in the reviewed official source set; this is recorded as `not_located` or `pending`, not as zero.

The actual enforcement layer is intentionally separate from statutory tiers: `enforcementCases` only stores an authority decision or official announcement that can be traced to a source. An empty array renders “未定位到已公开决定” together with the last verification date and does not imply that no investigation or non-public proceeding exists.

The Cases tab also exposes an EU-wide register derived from all country `enforcementCases` arrays. It can be filtered by country, authority, issue type and case status, and its empty state explicitly distinguishes “no publicly traceable case is currently registered” from “no investigation or penalty exists”. The selected-country issue register remains a separate layer below source monitoring.

Source freshness is calculated against the registry `DATA_AS_OF` date: within 30 days is `current`, 31–90 days is `review`, over 90 days is `stale`, and missing, invalid, or future dates are `unknown`. The manual Change Log records `new`, `changed`, and `review` events with country IDs and official source URLs so evidence changes remain auditable.

The source monitoring layer derives one row per non-EU official source. Deep/partial authority, complaint, statute and joint-guidance sources are `active`; `research-lead` sources and queue-country leads are `candidate`. The layer retains source URL, source type, scope, last checked date and evidence metadata, but does not create an `EnforcementCase`.

The maintenance layer derives one `ReviewQueueItem` per country. Partial countries are high priority with a 30-day cadence, queue countries are medium priority with a 90-day cadence, and deep countries are low priority with a 60-day cadence. `due` is calculated from `nextReviewAt <= asOf`, independently from source freshness. Each item contains `targetFields` and `sourceUrls` so the next national-law review is actionable.

## Information architecture and visual direction

The accepted visual concept is a dense but calm public-sector legal-tech dashboard, inspired by the adjacent DMA / DSA trackers:

- White top navigation with active blue underline; tabs: Dashboard, Country register, Cases, Timeline, Sources, Change log, Maintenance.
- Dark navy title band with the title “Data Act enforcement tracker” and a one-line scope statement. No marketing eyebrow or decorative badge.
- Country selector / country queue directly below the title; Germany selected with a blue outline and partial/queue states visibly distinguished.
- Issue filter bar for Device data access, Third-party sharing and Second-hand transfer.
- Four evidence-oriented summary blocks: Competent authority, Complaint intake, Statutory maximum, Published penalties.
- Two-column body: country implementation table on the left, selected-country detail on the right.
- Germany detail tabs/sections: Overview, Issue matrix, Penalty ladder, Official sources.
- Penalty ladder shows statutory tiers separately from actual enforcement status.
- Cases includes a source-monitoring panel after the actual-case panel; Maintenance exposes country, priority and due filters.
- Cases begins with an EU-wide actual-case index filtered by country, authority, issue type and status, followed by source monitoring and the selected-country issue register; Maintenance exposes country, priority and due filters.
- Colors: deep navy `#122b50`, public-sector blue `#1e62d0`, true white surfaces, slate text, teal for verified, amber for pending, red only for penalty amounts. Borders are 1px and shadows are very light.
- Typography: Inter-like system sans, 28–36px page title, 14px body, 10–12px chrome labels; 8px spacing rhythm; medium 10px radii.
- Icons: Lucide-style outline icons for authority, inbox, gavel, database, filters and external links.

The concept image is a layout reference only; all UI copy, tables, filters and links are rendered as code-native components.

## Interactions

- Country selector changes the selected country and updates the summary/detail panel.
- Country register rows can be selected; Germany opens the complete detail view, while partial/queued countries show their verification state, pending issue lenses and expansion note.
- Issue filters update the visible matrix and issue-focused case list.
- Tabs switch between dashboard, country register, cases, timeline, sources, change log and maintenance without page reload.
- Maintenance filters keep country, priority and due status independent; source links open the official page for the next review.
- Case/issue rows open a detail drawer or inline expansion with legal basis, evidence note, next action and sources.
- Source links open official pages in a new tab; “copy reference” copies a concise country / legal reference string.
- Export buttons follow the DSA pattern and export the current filtered view as JSON and Markdown; CSV is optional if it does not complicate the first slice.
- Responsive layout keeps the country selector and filters horizontally scrollable on narrow screens, while the register/detail columns stack.

## Acceptance criteria

- `npm run build` and `npm run lint` pass; a small data-metrics test covers Germany’s penalty tiers and explicit not-located enforcement state.
- Desktop first viewport clearly separates authority, complaint intake, statutory maximum and actual published penalty.
- Germany can be selected, issue filters change visible content, and a source link opens the correct official page.
- Germany issue matrix visibly includes device data access, third-party sharing and second-hand transfer, each with status and source.
- Every EU country exposes the same three issue lenses; non-deep countries show explicit pending status, EU article anchors, source links and a next-action note instead of a misleading empty state.
- DADG §15 penalty tiers are rendered with the legal basis and not conflated with actual penalties.
- The EU-wide Cases tab keeps an empty public-case register honest when no traceable decision is currently in the registry, while retaining all four filters.
- Non-Germany entries are visibly marked as pending/queue rather than represented as verified facts.
- Mobile viewport has no horizontal page overflow; tables use a contained scroll region or stack cleanly.
- Browser verification checks page identity, non-blank render, console health, screenshot evidence and at least one filter/selection interaction.

## Open implementation calls

- Keep the first slice self-contained with local data; leave `data` object shapes ready for a future API.
- Use a single source of truth for labels, statuses, and links so the same facts render consistently in cards, tables and exports.
- Use `lastVerifiedAt = 2026-11-20` for the current registry review and display it as a freshness note, not as a legal effective date.
