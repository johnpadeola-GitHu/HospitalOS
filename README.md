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

## This session's changes

**Favicon** — replaced the generic Vite starter icon with a red cross +
stethoscope on white (public/favicon.svg).

**Pricing engine** (src/engines/pricing/) — a real ENGINE like Help: owns its
own override store, imported BY every billing-relevant module. `priceFor(category,
code, defaultPrice)` is the seam every billing calculation and price-display now
reads through — override if the hospital has set one, catalogue default
otherwise. Wired into all five billing sources (lab, pharmacy, radiology,
theatre, accommodation) AND their display screens (Dispensing, Formulary,
Ward board, Theatre schedule, imaging request pickers).
Verified: overriding FBC's price changes what a NEW lab order actually bills
(2500 -> 3200), and resets cleanly. Pharmacy dispense charges at time-of-
transaction using the current effective price, so historical totals are never
rewritten retroactively.
Admin screen: Administration -> Pricing (src/engines/pricing/PricingConfig.jsx),
gated on the `system:configure` permission, every change audited.

**Notification bell** (src/layout/NotificationBell.jsx) — previously
decorative. Now sourced from booking requests: badge count = bookings still
"requested". Verified it does NOT auto-dismiss — only confirming or declining
a booking clears it from the bell.

**Tenant branding** (src/layout/TenantBrand.jsx) — each hospital's own logo +
name, top-right on every screen, distinct from the HospitalOS/AgoroX sidebar
branding. Reads live from Administration -> Settings (new logoUrl field);
falls back to an initials badge when no logo is set.

**Renal & dialysis** (src/modules/renal/) — new clinical module: haemodialysis
programme (vascular access, schedule, dry weight, per-session fluid-removal
calculation) and a CKD registry (eGFR-based staging, Stage 1–5). Overdue
dialysis sessions are the alert system's 11th source.

**Help engine restructured** — moved out of the Overview nav group entirely;
now a pinned, always-visible link at the bottom of the sidebar (outside the
scrollable workflow groups), reinforcing that it is a standalone engine, not a
workflow-group item. Content expanded from 23 to 35 articles across 9
categories (added "Platform & configuration"), covering every module built
this session: imaging sub-modules, biobanking, lab utilities scope, diagnostic
intelligence, renal, pricing, tenant branding, communication hub, bookings,
notifications, settlement, global search.

## This round's fixes and enrichment

**Bug fix: /help routing** — moving Help to the sidebar's pinned footer had
deleted its entry from NAV_GROUPS entirely, and since App.jsx generates routes
from ALL_ROUTES (derived from NAV_GROUPS), /help had no <Route> and fell
through to the catch-all placeholder. Fixed properly: /help is now an explicit,
ungated route in App.jsx, independent of the workflow-group nav data —
correct architecturally, since Help is documentation, not a permission-gated
work area. The topbar breadcrumb got a matching fix.

**Instruments gateway consolidated and massively expanded**
(src/modules/instruments/instrumentsService.js) — previously lab-analyzers
only. Now FOUR device categories, each on its real protocol:
- Laboratory analyzers — HL7 v2 / MLLP (unchanged, still posts into Lab)
- Imaging modalities — DICOM 3.0 C-STORE, posts into Radiology (moves a study
  to Performed with a series/image count)
- Radiotherapy systems — DICOM-RT, confirms fraction delivery into
  Radiotherapy directly
- Printers — IPP / raw socket / serial, confirms print jobs

18 devices spanning 2001–2023 purchase dates — legacy equipment (a 2001
dot-matrix ward printer, a 2007 CR reader, a manual Cobalt-60 unit, a 2009
chemistry analyzer) sits alongside modern equipment deliberately, because a
gateway that only speaks to new machines is not a working gateway for a real
hospital fleet. All four seams tested: DICOM correctly refuses a mismatched
modality, a wristband printer refuses a receipt job, radiotherapy fraction
counts increment correctly, errored/offline devices across all categories
still feed the Alerts system.

Removed the redundant thin "Administration -> Integrations (HL7/FHIR)" static
list screen; that nav entry now points at the same robust gateway (reachable
from both Diagnostics and Administration, since both audiences need it).

**Favicon redesigned** — rebuilt with precise rounded-rect geometry (was
hand-drawn paths with imprecise curves) and simplified the stethoscope to a
single continuous stroke, since fine detail turns to mud at actual favicon
render sizes (16–32px). White background kept as requested.

**Ethics committee deepened** (src/modules/academic/) — was a static list.
Now a real IRB workflow: Submitted → Under review → (Revisions | Approved |
Rejected), with a REQUIRED reviewer comment on every decision (you cannot
approve/reject/request-revisions with no reasoning recorded), full comment
history per submission, and a guard against reopening a finalised decision.
Verified: empty-comment decisions blocked, lifecycle transitions correct,
reopening blocked.

## On "beef up all modules" (item 4)

Read literally, this is a multi-session initiative — this build has 64 routes,
built incrementally across many rounds. Attempting a shallow pass over all of
them in one turn would produce filler, not enrichment, and risks bugs across
screens that currently work correctly.

This round's concrete installment: the Instruments Gateway (above) and Ethics
Committee (above) were taken from thin/static to genuinely robust, tested
workflows — that is the standard of "beefed up" being applied.

**Remaining thin modules**, roughly ranked by how much a UCH-Ibadan-scale
teaching/tertiary hospital would actually lean on them:
- Academic: Training, Logbooks, CME, Research (Ethics now done)
- Public health: Surveillance, Immunisation, Outreach, Reporting
- Operations: Scheduling, Facility, Support, Visitor
- Administration: Documents, Facilities

Suggest tackling these in focused batches (as this session did with
Instruments + Ethics) rather than all at once, so each gets real workflow
depth and testing rather than a cosmetic pass.

## This round — the three remaining "nationally acceptable" items

**FHIR interoperability** (src/engines/fhir/) — a standalone engine
generating HL7 FHIR R4 Bundles per patient: Patient, Condition,
AllergyIntolerance, DocumentReference, DiagnosticReport, correctly
cross-referenced and ICD-10 coded. Verified: round-trips as valid JSON,
correct resource types, correct Patient/{id} references.
Honest scope: a browser cannot host a live FHIR REST server — same
limitation as the instruments gateway. The mapping logic (the actual hard
part) is real and complete; only the transport is simulated via
file-download instead of a live endpoint. Administration → FHIR
interoperability.

**NPHCDA immunisation compliance** (src/modules/public-health/immunizationService.js)
— replaced coverage-bar decoration with the real National Programme on
Immunization schedule (21 doses across 11 antigen series: BCG, OPV, HepB,
Penta, PCV, Rotavirus, IPV, Vitamin A, Measles, Yellow Fever, Meningitis A),
tracked per child from date of birth. A dose is Due once a child reaches the
recommended age, Overdue past a 14-day grace window (NHMIS's own
definition). Coverage is reported per-antigen, the figure actually
submitted to NHMIS, not one blended number. Verified against realistic
ages: a 100-day-old with nothing recorded correctly shows 11 overdue doses.
13th alert source. Public health → Immunisation.

**NDPA privacy & consent tooling** (src/modules/privacy/) — consent
records (purpose, capture method, grant/withdrawal) and data-subject rights
requests (access/rectification/erasure/restriction/portability) under the
Nigeria Data Protection Act 2023. Every request gets an automatic 30-day
statutory response deadline; you cannot mark one Fulfilled or Declined
without a closing note. An overdue request is the 14th alert source.
Verified: the 30-day window computes exactly, the no-note guard holds.
Administration → Privacy & consent.

Total: 67 routes, 41 help articles, 14 alert sources.

## This round — tenant identity on generated documents

**Settings extended** with address, phone, and email — previously only
hospital name and logo existed, which was enough for the topbar badge but
not enough to identify a document as genuinely belonging to a hospital.

**Shared letterhead infrastructure** (src/lib/printable.jsx) — a
`Letterhead` component reading live from Administration -> Settings, and a
`PrintableOverlay` that renders any document full-page with the app chrome
hidden. Required adding real print CSS for the first time
(`@media print { .no-print { display: none } }`) and marking the sidebar,
topbar, and footer `.no-print` — previously printing anything would have
captured the whole app shell, not just the document.

**Three real printable documents, all reading the same live settings:**
- **Lab Result Report** (src/modules/lab/LabReportPrint.jsx) — full
  analyte table with reference ranges and flags, release info, letterhead.
  A "Print report" button appears next to "Released ✓" once a result is
  released.
- **Imaging Report** (src/modules/radiology/ImagingReportPrint.jsx) —
  shared across the generic Radiology screen AND Ultrasound/CT/MRI (all via
  ModalityWorkspace.jsx), so one component change covers every modality.
- **Payment Receipt** (src/modules/finance/ReceiptPrint.jsx) — available
  immediately after taking a payment in Billing, and reprintable any time
  from the Payments ledger.

Verified the actual mechanism: updated tenant settings (name, address,
phone, email) and confirmed the change is real and live — every document
reads through the identical `getSettings()` call the topbar badge uses, so
there is exactly one source of truth for a hospital's identity, not three
separately hardcoded copies.

**Housekeeping while in here:** fixed three more pre-existing unused
imports/variables in Billing.jsx found during this round's lint pass.
Warnings down to 38 (0 errors), from 51 at the start of last round's
housekeeping pass.

Total: 67 routes, 42 help articles, three PDF guides, three printable
letterhead document types.
