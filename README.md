# HospitalOS

Tertiary referral hospital platform. React + Vite, deploys to Cloudflare Pages.

## Run
    npm install
    npm run dev

Build: `npm run build` → output `dist`.

## Structure
    src/nav/navGroups.js          NAV_GROUPS + ALL_ROUTES (single source of truth)
    src/nav/Sidebar.jsx           Collapsible sidebar, active highlight, live alert badge
    src/layout/AppLayout.jsx      Sidebar + topbar + content outlet
    src/pages/ModulePlaceholder.jsx  Stub for un-built modules
    src/lib/ui.jsx                Shared primitives (Button, Modal, Field, badges)
    src/modules/                  Built feature modules

## Built modules
- Dashboard (/) — live overview: patient counts, bed occupancy, clinic queue,
  lab pipeline, active alerts. Cards link into modules.
- Registration & ADT (/patients/adt) — register, admit / transfer / discharge.
- Wards & bed management (/wards) — live bed board, occupancy per ward.
- Outpatient / GOPD (/outpatient) — clinic queue: Waiting → Vitals →
  With doctor → Completed.
- Blood bank & transfusion (/blood-bank) — unit inventory by group with expiry
  and reorder flags; ABO/Rh-aware crossmatch → issue → transfuse lifecycle;
  low group stock and near-expiry units raise alerts.
- Theatre & day surgery (/theatre) — surgical case scheduling with theatre +
  surgeon assignment; lifecycle Scheduled → In theatre → Recovery → Completed;
  procedures become billable once the case enters theatre.
- Finance / Payments (/finance/payments) — hospital-wide receipts ledger reading
  billing payment history; collected/outstanding summary.
- Finance / Claims (/finance/claims) — NHIS/HMO claim lifecycle Submitted →
  Approved/Rejected → Paid, with lifecycle guards and value summary.
- Maternity & neonatology (/maternity) — labour board (Admitted → First stage →
  Second stage → Delivered), delivery recording with mode and newborn(s)
  including twins; a low-Apgar (<7) newborn raises a critical alert.
- Specialist clinics (/specialties) — department registry of all 21 specialties
  (11 medical incl. Geriatrics/Cardiology/Neurology, 10 surgical) as filterable
  departments, not separate nav items; referral flow Referred → Scheduled → Seen
  with live open-referral counts per department.
- Oncology (/oncology) — cancer registry with primary site + TNM stage on a
  treatment pathway (chemo/radiotherapy/surgery/palliative); chemo cycle tracking
  with auto-remission on completion; overdue cycles raise an alert.
- Intelligence / Reports (/intelligence/reports) — printable operations report
  compiling patient, diagnostics, ward, ED, finance, and pharmacy aggregates.
- Intelligence / Forecasting (/intelligence/forecasting) — illustrative
  projections: 7-day bed occupancy, revenue run-rate, and risk indicators.
- Operations admin — Scheduling & rosters (/ops/scheduling), Facility & waste
  (/ops/facility), Support services (/ops/support), Visitor & security
  (/ops/visitor).
- System admin — Facilities & sites (/system/facilities), Settings
  (/system/settings), Security & audit log (/system/security), Documents &
  templates (/system/documents), Integrations HL7/FHIR (/system/integration).
- Academic — Training & rotations (/academic/training), Clinical logbooks
  (/academic/logbooks), CME (/academic/cme), Research & trials
  (/academic/research), Ethics committee (/academic/ethics).
- Public health — Disease surveillance (/public-health/surveillance) with
  notifiable-disease outbreak signals feeding Alerts; Immunisation coverage
  (/public-health/immunisation); Outreach (/public-health/outreach); National
  reporting IDSR/NHMIS (/public-health/reporting).
- Radiotherapy (/radiotherapy) — treatment courses with fraction tracking and
  dose totals; over-delivery guarded.
- Rehabilitation & therapy (/rehab) — physio/OT/speech referrals with session
  tracking.
- Point of care testing (/poct) — bedside result log with flagging.
- Pharmacy / Formulary (/pharmacy/formulary) — full drug formulary with NAFDAC
  numbers and pricing.
- Finance / Procurement (/finance/procurement) — purchase orders Draft →
  Ordered → Received; Stores & assets (/finance/stores) with reorder flags.
- Overview / My patients (/patients/mine) — active caseload; Worklist
  (/worklist) — outstanding lab + radiology tasks hospital-wide.
- Instruments gateway (/instruments) — analyzer registry (Sysmex, Roche Cobas,
  BD BACTEC, Mindray, Abbott) with AE titles, host:port, protocol and handled
  test codes; HL7 message log; simulated ORU^R01 receipt posts results straight
  into Laboratory via the same entry point as manual entry. Errored/offline
  analyzers raise alerts. Real MLLP listening is server-side; postResultMessage()
  is the seam a live listener calls.
- Laboratory (/lab) — catalogue with reference ranges; lifecycle
  Ordered → Collected → Resulted → Verified; auto-flag; criticals marked.
- Alerts & critical values (/alerts) — hospital-wide critical feed + acknowledge;
  live badge on the sidebar.
- Pharmacy / Dispensing (/pharmacy/dispensing) — dispense to a patient
  decrements stock (oversell + out-of-stock guarded); recent-dispense log.
- Pharmacy / Inventory (/pharmacy/inventory) — stock management + restock.
  Restocking above reorder level clears that drug's alert automatically.
- Finance / Billing (/finance/billing) — per-patient accounts aggregating lab,
  pharmacy, and radiology charges; payments (Cash/Card/Transfer/NHIS) net to a
  balance with an overpayment guard; receipts; billed/collected/outstanding.
- Radiology & imaging (/radiology) — study lifecycle Requested → Scheduled →
  Performed → Reported across modalities (X-ray, USG, CT, MRI, Mammo); urgent
  findings raise a critical alert; performed studies become billable charges.
- ICU / HDU critical care (/critical-care) — per-bed vitals board reading
  occupied ICU/HDU beds; each vital flagged against critical thresholds; a bed
  with any critical vital is "unstable" and raises an alert. Recording improved
  vitals clears it. 
- Emergency & observation (/emergency) — triage board ordered by ESI acuity
  (1–5), stage flow Waiting → In treatment → Observation, disposition
  (admit/discharge/transfer); supports unregistered patients.
- System / Users & roles (/system/users) — user directory, 8 built-in roles with
  a permission matrix mapped to nav groups; add users, change roles, activate/
  deactivate (last Super Admin protected).
- Operations — CSSD & sterile supply (/ops/cssd, cycle board Loaded →
  Sterilizing → Ready → Issued); Biomedical engineering (/ops/biomedical,
  equipment register with maintenance status); Ambulance & fleet (/ops/fleet,
  vehicle availability). listOpsIssues() ready as an alert source.
- Intelligence / Analytics & KPIs (/intelligence/analytics) — cross-module KPIs
  (occupancy, lab completion, ED load, revenue, low stock) and breakdowns (ward
  occupancy, lab stages, radiology modality, ED dispositions). Reads all
  services; owns no data.

## Access control
The app runs as a current user (AuthContext). Roles carry permission keys that
match nav-group ids, so the sidebar hides groups a role can't access and routes
are gated (NoAccess page) off the same permission set. A topbar user switcher
(demo) lets you see gating change per role. When a real login lands, it sets the
current user and all gating enforces automatically — no per-route wiring.

## Cross-module wiring
- ADT + bed board share bedService.js — a bed cannot be double-booked.
- Outpatient, Laboratory, Pharmacy reuse patientService for patient lookup.
- Alerts aggregates labService.listCriticalOrders() (critical) and
  pharmacyService.listLowStock() (low = warning, out = critical), sorted
  critical-first. Restock clears low-stock alerts live (no manual step).
- Alerts now has 9 sources (lab critical, pharmacy stock, radiology urgent
  findings, operations equipment/vehicle issues, critical-care unstable vitals, blood-bank low/expiry, maternity low-Apgar, oncology overdue-chemo, public-health outbreak signals); Billing has 3 (lab, pharmacy,
  radiology). Both stayed source-agnostic: each new source was one mapper/feed,
  no aggregator changes.
- systemService roles map to nav-group permission keys, ready for a future auth
  layer to gate the sidebar and routes off one source.
- Dashboard composes reads from all services; no data layer of its own.

All data layers are in-memory but shaped as async APIs, so they swap to
D1/Workers with no UI change.

## Adding a module
1. Build the component under src/modules/<area>/.
2. Add one line to the MODULES map in App.jsx: "/route/path": Component.
Nav and routing already resolve from navGroups.js — no other wiring.

## Notes
- Standalone project. Laboratory + Pharmacy are native routes.
- "Coming Soon" badges: group headers only (Academic, Public health).
- Design language follows LabOS (periwinkle bg, slate-blue ink, Inter + JetBrains Mono).


## Design language
Refreshed to match the LabOS visual language:
- lucide-react icon on every nav group AND every leaf item (62 distinct icons)
- PageHeader primitive: boxed accent icon + group eyebrow + bold 22px title + actions
- Topbar: Ctrl+K search affordance, Online status pill, notification bell, gradient avatar
- StatCard: 26px mono figures with semantic tone (good/warn/bad/accent) + sub-labels
- recharts for real line/bar charts (Dashboard activity trend, lab pipeline)
- Lighter surfaces (#F4F6FA bg, white cards), soft shadows, Inter 400-700
Tokens live in src/index.css; primitives in src/lib/ui.jsx — edit those to cascade
changes across all 53 screens.

## Authentication & platform admin
Sign-in replaces the old dev switcher. Demo credentials:
- Hospital staff: any @hospitalos.ng address / password `demo`
- Platform admin: `support@agorox.africa` / password `agorox`

Only support@agorox.africa carries `platformAdmin: true`, which reveals the
Hospital/Platform toggle in the topbar. setView("platform") is a no-op for every
other account. The Platform view covers tenant management (plans, seats, MRR,
suspend/activate), platform health, feature flags per tier, and deployments.

SECURITY: credentials are checked client-side — fine for preview, NOT secure. A
browser cannot keep a secret. When the Workers/D1 backend lands, signIn() posts
to an auth endpoint and the returned JWT drives the same context; nothing
downstream changes.

## Help
Overview -> Help & documentation: searchable articles covering every workflow.
Content lives in src/modules/help/helpContent.js.

## RBAC (src/lib/rbac.js)
Two levels:
- **Areas** gate nav groups and routes — can this role reach Pharmacy at all?
- **Actions** gate buttons — `"<area>:<action>"`, e.g. `patient-care:discharge`.
  Roles may grant `"<area>:*"` for all actions in an area, or `"*"` (super-admin).

Separation of duties is enforced, not decorative:
- Nurse can admit and record vitals, but **cannot discharge**
- Lab scientist can collect and result; **verify** is a distinct grant
- Cashier can take payments and file claims, but **cannot approve** them
- Pharmacist cannot reach Diagnostics at all

Use `can(area)` for routes/nav and `may("area:action")` for buttons, both from
useAuth(). `denied(permission)` records a refused attempt to the audit log.

## Immutable audit (src/lib/audit.js)
Append-only by construction: entries are frozen on write, the internal array is
never returned by reference, and there is **no update or delete API**. Each entry
is hash-chained to its predecessor (`prevHash` + FNV-1a digest), so:
- editing any past record breaks verification **at that record**
- deleting a record breaks verification **at the next one**

`verifyChain()` recomputes the whole chain; System -> Security & audit shows a
live integrity banner, filters by action/actor/text, and displays each hash.
Sign-ins, failed sign-ins, denials, admissions, transfers, discharges, lab
collection/verification and claim decisions are all recorded.

LIMITS: this is tamper-**evident**, not tamper-proof — a browser cannot stop
someone with devtools. Real immutability needs server-side append-only storage;
the same chain design carries over and detects rows edited directly in D1.

## Medical records (src/modules/records/)
The clinical record — previously missing entirely.
- **Patient chart** (/records): notes, problem list, allergies, results history
- **Notes** use SOAP structure and are **frozen on write**. No edit, no delete.
  Corrections are amendments referencing the original; both stay visible.
- **Problem list**: ICD-10 coded diagnoses (active / chronic / resolved)
- **Allergies**: `checkAllergy()` is called by dispensing — a match warns, and a
  **severe allergy blocks dispensing** with no UI override.

## Accommodation tiers (src/modules/wards/bedService.js)
Seven tiers with nightly rates: General ₦15k, Semi-Private ₦35k, Private ₦60k,
Suite ₦120k, VIP ₦220k, Executive ₦350k, Critical Care ₦180k.
Occupancy is timestamped on admission; `listBillableBedNights()` feeds Billing as
a fifth revenue source (whole nights, minimum one).

## Help & documentation
23 articles across 8 categories with a landing page (topic cards), category
browse, article view with breadcrumbs, related-article links, and full-text
search that reaches into tables. Body blocks support paragraphs, subheadings,
bullets, numbered steps, note/warning callouts, and tables.
Content lives in src/modules/help/helpContent.js — add to ARTICLES and it appears
automatically under its category.

## Naming
The "System" sidebar group is labelled **Administration**. The permission key
remains `system` — RBAC and route guards reference it, and renaming the key would
ripple through every role definition for no benefit.

## Help engine (src/engines/help/)
Help is now a standalone ENGINE, not a module. It owns no clinical data and
imports from no module — the dependency runs one way.
- `registerArticles()` / `registerCategory()` — any module contributes its own
  docs at import time, so a module ships its help with it.
- `useHelp().openHelp(id)` + `<HelpLink articleId="..." />` — contextual help:
  a question mark beside a control opens the exact article explaining it.
- `searchWithExcerpt()` — powers the global search's documentation results.

## Global search (src/layout/GlobalSearch.jsx)
Previously a decorative span. Now a real command palette: Ctrl+K / Cmd+K, arrow
keys, Enter to open. Searches three sources at once — navigation (permission
filtered, you cannot jump to an area you cannot reach), patients, and the full
documentation with excerpts.

## Lab catalogue (src/modules/lab/catalogue.js)
41 tests / 83 analytes across 8 disciplines: Clinical Chemistry, Haematology,
Microbiology, Serology & Immunology, Endocrinology, Molecular Diagnostics,
Histopathology & Cytology, Transfusion Medicine. Each test carries specimen type,
turnaround time, price, and per-analyte reference + panic ranges.
Reference ranges are adult defaults — production should make these configurable
per lab and per demographic.

## Settlement & usage (src/modules/platform/settlementService.js)
AgoroX revenue side, inside the Platform view (support@agorox.africa only).
- **Settlement**: 3.25% platform fee on hospital collections, per cycle, with a
  Pending → Processing → Settled lifecycle, payout destination, and fee trend.
- **Usage metering**: per-tenant seats, encounters, lab orders, storage, API
  calls — the evidence behind an invoice — plus seat under-utilisation flagged
  as a churn signal.

## Footer
Every page: "Powered by AgoroX Technologies · v1.0.0 · © 2026. All Rights
Reserved." with Privacy Policy · EULA · IP Policy · Contact Support.
Links are placeholders pending real policy pages.

## Five new modules (this session)

- **Lab utilities** (/lab-utilities) — 7 clinical calculators (eGFR CKD-EPI,
  Cockcroft-Gault, BMI, BSA, maintenance fluids, anion gap, corrected calcium),
  9 unit converters (glucose, creatinine, bilirubin, etc.), a critical-value
  quick-reference card, and a specimen tube guide. Pure functions, no persistence.
- **Biobanking** (/biobank) — long-term specimen repository distinct from the
  active lab worklist: storage unit + capacity tracking (4 units), consent basis
  per specimen, research-use flagging.
- **Diagnostic intelligence** (/diagnostic-intel) — read-only cross-diagnostic
  analytics over Laboratory + Radiology + Blood Bank: completion rates, most-
  ordered tests, department load, declared-vs-actual turnaround, and positivity
  rates for qualitative screens. Owns no data of its own.
- **Communication hub** (/communication) — SMS/WhatsApp/Email/In-app delivery
  queue with templates, live status (queued -> delivered), and compose.
- **Online bookings** (/bookings) — patient-facing appointment requests.
  Confirming and checking in a booking calls the SAME checkInVisit() the
  Outpatient queue uses, so a booking becoming a visit is a real integration,
  not a separate list that happens to look similar. Verified: registering a
  patient, booking, confirming and checking in measurably grows the Outpatient
  queue count.

Catalogue expanded 5 -> 41 tests / 83 analytes across 8 disciplines (see
src/modules/lab/catalogue.js).

## Imaging sub-modules (Ultrasound / CT / MRI)

Three dedicated screens under Diagnostics, each a filtered lens on the SAME
study records radiologyService and the generic Radiology worklist use — not a
parallel system. Verified: a study created via the MRI screen is immediately
visible in listStudies() and the generic Radiology worklist.

Catalogue expanded from 8 to 27 imaging protocols:
- Ultrasound (8): abdominal, obstetric, pelvic, thyroid, Doppler/vascular,
  echocardiogram, FAST trauma scan, breast
- CT (6): head, chest, abdomen & pelvis, spine, angiography, KUB stone protocol
- MRI (6): brain, spine, knee, abdomen, pelvis, MRCP
- General Radiography (6) and Mammography (1) round out the set

Each modality carries technical parameters captured at the "performed" stage
(src/modules/radiology/radiologyService.js TECH_FIELDS): Ultrasound records
probe + Doppler use; CT records contrast + slice thickness; MRI records
sequence protocol + field strength. These are shown on the study row and feed
the eventual report — informational, not separately billed.

Shared workspace component: src/modules/imaging/ModalityWorkspace.jsx. Adding
a fourth modality (e.g. Nuclear Medicine) is a new MODALITIES entries + one
thin wrapper screen, not a rebuild.
