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

## This round — ten new departments

Answering directly: Private Suite existed only as a billing tier (fixed);
Geriatrics existed only as an outpatient clinic tag (fixed); Nutrition &
Dietetics was genuinely absent (built). Full sweep of everything else
checked against a UCH-Ibadan-scale department list turned up seven more
real gaps — all ten built this round, all tested end-to-end.

**New nav group: Specialty services** (src/nav/navGroups.js) — added to
AREAS in rbac.js and granted to doctor and nurse roles (verified: pharmacist
correctly cannot see it). Houses:
- **Nutrition & dietetics** — referral-driven from Renal/Oncology/ICU/
  Geriatrics, BMI auto-calculated, therapeutic diet types including renal-
  restricted and enteral/parenteral.
- **Sickle cell centre** — genotype registry, crisis log across 6 crisis
  types, hydroxyurea and transfusion-programme tracking. A severe active
  crisis is a new critical alert source — verified end-to-end.
- **Dental & oral health** — clinic queue + procedure log, 8 priced
  procedures.
- **Infection Prevention & Control** — distinct from Public Health's
  community disease surveillance: hospital-acquired infection cases and
  isolation precautions. Outbreak threshold (3+ same-type open cases)
  verified to trigger correctly and raises a critical alert.
- **Medical social services** — discharge planning and indigent patient
  support case tracking.
- **Occupational health** — staff (not patient) fitness-to-work and
  workplace injury log.
- **Chaplaincy & pastoral care** — visit request queue.

**Three additions to Patient care:**
- **Geriatric unit** — a real admitting ward with a Comprehensive
  Geriatric Assessment (falls risk score, medication count, cognitive
  screen, frailty level) on admission, distinct from the Geriatrics
  outpatient clinic tag. High falls risk or polypharmacy (5+ meds) is a
  new alert source — verified.
- **Mental health unit** — a real psychiatric ward with admission status
  (voluntary/involuntary), a changeable observation level, and toggleable
  risk flags, distinct from the Psychiatry outpatient clinic tag. Constant
  observation or any risk flag is a new critical alert source — verified.
- **VIP services** — the actual care differentiation Private/VIP/
  Executive Suite patients get beyond the room: consultant of choice,
  concierge contact, dietary preference, and a real privacy flag.

Alert sources: 14 → 18. One genuine bug caught and fixed during
integration: a naming collision (`alertFromOutbreak`) with the existing
Public Health outbreak mapper, resolved by renaming the new IPC-specific
one — caught by the build failing, not silently.

Housekeeping: found and fixed the same "dead top-level error banner"
pattern from last round's Renal.jsx fix, this time in SocialWork.jsx and
Geriatric.jsx — wired both `refresh()` calls to actually populate the
error state on failure instead of leaving it permanently empty.

**Help & documentation updated per-instruction:** 54 → 64 articles, all 10
new modules covered, plus corrected two facts that had drifted out of date
— the alerts article's source table (was showing 11, actually 18) and the
orientation article's sidebar group count (was ten, now eleven).

Total: 77 routes, 64 help articles, 18 alert sources, 0 lint errors.

## This round — onboarding, demo, and data migration

**1. Fail-safe onboarding** (src/engines/onboarding/) — a new engine, same
pattern as Help/Pricing/FHIR/Results. Sign-up and demo start are both
all-or-nothing: full validation runs before a single record is written, so
a failed signup leaves no orphaned tenant or account behind — verified
directly (a rejected signup leaves the tenant count unchanged).

**Renamed the three free tiers**: Starter (2.75% commission, <50 beds),
Growth (2.25%, 50–149 beds), Scale (1.75%, 150+ beds) — lower commission
for larger volume is the standard SaaS curve and reads immediately.
Enterprise is the flat \u20a64,500,000/year tier, created as
status "pending-payment" since no live payment gateway exists yet — a
platform admin confirms it manually from Platform → Tenants, reusing the
existing tenant-status-cycle action rather than a new one.

**The 30-day demo is a real, enforced expiry**, not decorative: verified
that signing in with an expired demo account is refused outright with a
clear message, while a non-expired demo signs in normally. A demo banner
shows days remaining once signed in.

**Refactored account storage** (src/auth/accountsStore.js) out of
AuthContext into its own module so the onboarding engine can create real,
sign-in-capable accounts — the same "plain module, mutated by whoever
needs to" pattern as every other engine.

Every signup and demo appears immediately in Platform → Tenants (billing
type, commission rate or flat plan, days remaining if a demo), visible only
to the platform admin, exactly as asked.

**2. Data import** (src/modules/data-import/) — a genuine, tested answer
to "can we migrate in": CSV upload → auto-mapped columns (recognises
Surname/First Name/Gender/DOB/Mobile/MRN and common variants) → validation
preview → import. Verified against a deliberately messy test file: mixed
date formats (YYYY-MM-DD, DD/MM/YYYY, MM/DD/YYYY) all normalised correctly,
and bad rows (missing name, unrecognised sex/date) were correctly flagged
and excluded — only the valid rows were written, and the patient list grew
by exactly that count, not more.

Honest answer stated directly in the app: the mapping/validation logic is
real and works today — usually the hard part of a migration. What is not
yet real is persistent storage on the receiving end; imported patients live
in the same in-memory list as everything else in this preview build and
reset on reload. Production migration wires the same mapper to D1 instead;
nothing about the column-matching or validation changes.

Total: 78 routes, 66 help articles, 39 lint warnings (0 errors).

## This round — topbar cleanup, branding rename, demo hardening

**1. Topbar de-cluttered.** There were genuinely three separate, partly
inconsistent hospital-identity labels: the sidebar showed a hardcoded
"Ibadan Teaching Hospital" subtitle that never changed regardless of which
tenant was actually signed in; the topbar breadcrumb repeated "HospitalOS"
as a prefix; and a separate TenantBrand badge on the far right duplicated
the tenant name a third time. Collapsed into one unified element on the
topbar's left: **[logo] HospitalOS (Tenant Name)**, reading live from
Administration → Settings, followed by the breadcrumb path. Sidebar brand
block now just shows "HospitalOS" — no more hardcoded, wrong tenant name.
Default seed hospital name corrected from the generic "HospitalOS Teaching
Hospital" to "Ibadan Teaching Hospital", matching the actual reference
tenant. Footer now reads "Powered by HospitalOS · AgoroX Africa".

**Company renamed AgoroX Technologies → AgoroX Africa**, globally —
source code (settlement bank account name, footer), and all three PDF
guides regenerated and verified to contain zero remaining old-name
references.

**2. Demo hardened, not just shortened.**
- Duration: 30 days → 7 days, everywhere — the engine constant, every
  screen's copy, the expiry error message, the help article. Swept and
  verified none were missed.
- The static "AgoroX Demo" seeded tenant removed — redundant now that
  anyone can self-serve a real demo through the sign-in screen.
- **Removed the "Show demo accounts" hint list from the public sign-in
  screen.** This is the more consequential fix: that list auto-filled the
  platform admin's password with one click, directly on the public login
  page — a real problem now that the platform password is being
  hardened. Removed entirely, along with its now-dead styles.
- **Platform admin password changed** from "agorox" to a strong password,
  verified character-for-character including the literal trailing quote in
  the requested password. Old password confirmed no longer works. Account
  flagged `license: "perpetual"` — explicit now, not just implied by the
  absence of an expiry field.

**Found and fixed a real, separate bug while in the help content**: 27
instances across several past rounds' insertions had double-escaped
unicode (`\\u2014` instead of `\u2014`), meaning users would have seen the
literal text "\u2014" instead of an em-dash, and similar for curly quotes.
Verified fixed — real em-dash characters now render, not escape-sequence
text.

Total: 78 routes, 66 help articles, 39 lint warnings (0 errors).

## This round — invite-only registration (LabOS pattern, adapted to Cloudflare)

**Architectural note stated plainly**: HospitalOS runs on Cloudflare Pages
with no backend yet, not Supabase. What was built is the same PATTERN
LabOS uses — activation-code gating, atomic redemption, an 8-step wizard
— adapted to HospitalOS's actual in-memory architecture rather than
faking a Supabase connection that doesn't exist here. Every field in the
activation-codes schema maps 1:1 onto what a future Postgres/D1 table would
hold, documented directly in the code.

**src/engines/onboarding/activationCodes.js** — the schema (code, status,
tenant_name, plan_tier, issued_by/at, redeemed_at/by, expires_at), plus
generate/validate/redeem/revoke. "Expired" is computed live from
expires_at, never stored, so it can't drift out of sync with a stored flag.

**Atomicity, actually verified, not just claimed**: fired two genuinely
concurrent redemption attempts at the same code via `Promise.allSettled` —
exactly one succeeded, one failed with "already been used," zero
double-provisioning. Also verified the failure path is correct: a bad
password during redemption does NOT burn the code — validation (code
validity, admin name/email/password) all happens inside the same
non-yielding critical section as the redeemed-marking, so nothing gets
consumed on a failed attempt.

**8-step wizard** (src/auth/OnboardingWizard.jsx): activation code →
hospital identity → admin account → facility details (beds, centres,
departments) → staff roles → branding → plan confirmation (read-only,
set by the code) → review & confirm. State persists to localStorage on
every change under a per-session key — a refresh mid-wizard resumes
exactly where you left off, with a visible "Resumed — start over instead"
notice rather than silently vanishing progress. Nothing touches the
tenant/account stores until Step 8's submit.

**Removed the old self-serve registration entirely** — not just hid it.
`registerHospital()` and `SignUpForm` are deleted, not dead code sitting
next to the new flow; the only way to a full account is now genuinely an
activation code. The 7-day demo stays self-serve, since it was never real
tenant registration to begin with.

**Platform → Activation codes** (new third tab, src/modules/platform/ActivationCodes.jsx)
— generate a code (tenant name, plan tier, optional expiry), see every
code's status (unredeemed/redeemed/revoked/expired) and who issued it, and
revoke any unredeemed code.

Total: 78 routes, 67 help articles, 39 lint warnings (0 errors).

## This round — Help & Documentation mirrors the LabOS landing page

Rebuilt the Help & documentation landing page (src/engines/help/HelpEngine.jsx)
to match the LabOS "How can we help?" hero-banner pattern shown in the
reference screenshot, adapted to HospitalOS's own charcoal brand palette
rather than copying LabOS's blue:

- **Dark gradient hero banner** with a centred "How can we help?" headline
  and a subtitle showing **live, computed counts** — "Search across 67
  articles in 11 categories" — not hardcoded numbers that would drift out
  of date as articles get added.
- **Search box embedded directly in the hero**, not a separate element
  above the page — verified the counts pull from the same registry every
  other part of the engine already uses.
- **"Browse by category"** section label, then a 2-column grid where each
  category gets a **distinct icon colour** from an 11-colour rotating
  palette (blue, green, purple, orange, red, teal, amber, indigo, pink,
  sage, slate) instead of every card using the same charcoal icon —
  matching the varied, colour-coded look in the reference design.
- The hero only appears on the true landing state; searching, browsing a
  category, or reading an article switches to the existing compact header
  so the banner doesn't compete with actual content — the same
  hero-only-on-home pattern real help centres use.
- Kept the existing "New here? / What can I do? / Before you rely on it"
  quick-start tiles and the Tenant Guide download banner, both genuinely
  useful content that predates this round.

Total: 78 routes, 67 help articles across 11 categories, 38 lint warnings
(0 errors).

## This round — icon cleanup, footer, responsive optimization, comprehensive audit

**1. Reverted the rainbow category icons** in Help & documentation — back
to one consistent neutral treatment, matching the rest of the app's
restrained visual language instead of a colour-per-category palette that
read as unprofessional.

**2. Footer redesigned** — replaced a cramped, dot-separated single line
with a clear three-zone layout: brand mark + name on the left, policy links
centred, version/copyright on the right, stacking cleanly under 900px.

**3. Responsive optimisation — iOS, Android, tablets, desktop:**
- Sidebar is now a genuine off-canvas drawer below 900px, with a hamburger
  toggle, backdrop, and auto-close on navigation — previously a fixed
  250px sidebar would have eaten most of a phone screen.
- iOS safe-area insets added for notches and home indicators; input font
  size forced to 16px on mobile to prevent Safari's auto-zoom-on-focus.
- Topbar breadcrumb text and the global search label collapse on mobile so
  the tight header space doesn't overflow.
- **Modal component fixed** — a real, universal bug: modals had no
  max-height or scroll handling, so a tall form on a short mobile viewport
  (keyboard open) could have been cut off with the submit button
  unreachable. Fixed once, in the shared component, so it applies across
  all ~78 screens simultaneously rather than needing 78 individual fixes.
- **Tables fixed globally, not per-screen**: found that 40+ screens use raw
  `<table>` elements with no horizontal-scroll protection for narrow
  viewports. Rather than hand-fix 40+ files, added one global CSS rule
  making every table a horizontally-scrollable block below 900px.
- **Found and fixed a more serious variant of the same bug**: 26 screens
  share an identical `tableWrap` container using `overflow: hidden` —
  which wouldn't just fail to scroll, it would silently **clip data**
  invisibly off-screen with no indication anything was missing. Bulk-fixed
  all 26 (23 single-line + 3 multi-line-formatted variants) to
  `overflow: auto`, verified none remain across every table-using screen.

**4. Comprehensive audit — results:**
| Check | Result |
|---|---|
| Full build | Clean |
| Lint | 38 warnings, 0 errors |
| Nav ↔ route consistency | Perfect match, both directions |
| RBAC areas ↔ nav groups | Perfect match |
| RBAC role area references | All 8 roles reference valid areas |
| Help content integrity | 67 articles, 0 orphans, 0 broken links, 0 empty categories |
| Alert source count vs. docs | Article's 18-row table matches the 18 real alert mapper functions exactly |
| Double-escaped unicode regression | None found (past bug stayed fixed) |
| Activation-code + demo flow regression | Both verified still working after all layout changes |

Total: 78 routes, 67 help articles, 38 lint warnings (0 errors).

## This round — restored the app's original light colour scheme

Reverted the Help & documentation hero banner from a dark charcoal
gradient (white text, drop-shadowed search bar) back to a light theme
consistent with every other surface in HospitalOS — white/light card
background, `var(--ink-strong)` heading, `var(--muted)` subtitle, bordered
search input. This was the actual off-brand element from mirroring LabOS's
dark-hero pattern: HospitalOS's design language everywhere else is light
and clean, and a single large dark surface stood out as inconsistent.

Kept everything structural from that round — live article/category
counts, the embedded search, the category grid, the "Browse by category"
label — only the colour treatment changed.

Audited the rest of the app for similar issues: confirmed the footer's red
cross mark is correct (matches the established favicon/PDF letterhead
brand colour, not a regression), and confirmed every other gradient/dark
element in the codebase (login background, avatar badges, sidebar brand
mark) is a small, pre-existing, appropriately-scoped decorative element,
not a large-surface colour deviation like the hero banner was.

Total: 78 routes, 38 lint warnings (0 errors), clean build.

## This round — topbar toggle, nav reorder, and signup mirrored to LabOS exactly

**1. Hospital/Platform toggle** replaced with a genuine compact switch
(48px, icon-only) instead of a two-button segmented control with text
labels — freed real horizontal space, and the global search field's
preferred width increased from 380px to 480px to actually use it.

**2. Nav reorder** — Academic and Public health are now directly adjacent;
Specialty services moved to immediately after Public health instead of
sitting between them.

**3. Signup rebuilt to mirror LabOS exactly**, based on the reference
screenshots provided:
- **The sign-in screen IS the activation wizard now** — no separate
  “click to register” button. “Activate your hospital” is the first
  thing anyone sees, landing directly on Step 1.
- **Step 1 combines what were two separate steps** — activation code
  validation and personal account creation — into one screen: code, full
  name, phone, work email, password, confirm password, all together, one
  submit button. This matches the reference exactly and reduced the wizard
  from 8 steps to 7.
- **The demo link and inline sign-in form live directly below Step 1**,
  on the same screen — “or / Explore the interactive demo” then
  “or sign in” with real email/password fields, matching the reference's
  single continuous page rather than separate mode-toggled screens.
- **Password minimum raised from 8 to 12 characters**, matching the
  reference's stated policy.
- **Hospital details remain fully collected**, per explicit correction
  during this round — Steps 2 through 7 (identity, facility, roles,
  branding, plan, review) are unchanged from the previous round's design.
  Only Step 1's shape and the overall entry pattern changed.
- Verified end-to-end: 12-character minimum enforced, phone number
  correctly captured and stored, full activation-to-signed-in-account flow
  still works after the restructuring.

Total: 78 routes, 67 help articles, 39 lint warnings (0 errors).

## This round — security hardening and the Tenant Service Agreement

**1a. Confirmed platform-admin-only code provisioning.** Verified
`generateActivationCode()` is called from exactly one place —
Platform → Activation codes — gated to the platform admin account only.
No self-serve path exists anywhere.

**1b. Found and fixed a real, pre-existing bug: staff accounts couldn't
actually sign in.** Administration → Users & roles wrote to a completely
disconnected list from the account store sign-in actually checks — a
"created" staff member could never log in. Rewired `createUser()` to
create genuine sign-in-capable accounts via the same store the activation
wizard uses: 12-character password minimum, tenant-scoped, deactivation
genuinely blocks sign-in (verified), and the last active Super Admin per
tenant cannot be deactivated by anyone.

**1c. Device fingerprinting**, implemented and tested. A best-effort
browser fingerprint (user agent, screen, timezone, language) tracks known
devices per account. A genuinely new device is logged to the audit trail
and shown as a dismissible banner; an account's first-ever sign-in isn't
falsely flagged. New "Trusted devices" panel in Administration → Security
& audit gives real visibility. Verified: same device recognised across
sign-ins, a genuinely different device (tested Chrome/Windows vs.
Safari/iPhone) correctly flagged.

**1d. Closed the stolen-code rename exploit.** Previously, client input
could override the hospital name during activation — a stolen code could
be redeemed under a different hospital's name. Fixed at the service layer
(not just hidden in the UI): the tenant name is now locked to the
activation code record, full stop. Verified by attempting the exact attack
described — injecting a different hospital name during redemption — and
confirming the tenant was created under the code's real name, not the
injected one. Step 2 of the wizard shows the name read-only with an
explanation.

**2. Activation page footer** now reads "Powered by AgoroX Africa."

**3. Activation panel widened** to 75% of page width (capped at 920px).

**4. Tenant Service Agreement** — drafted and wired as a genuine hard gate,
not decoration:
- 20-section agreement (src/engines/onboarding/tenantAgreement.js) covering
  parties, the real Starter/Growth/Scale/Enterprise fee structure, data
  ownership, NDPA compliance, term/termination, liability, and Nigerian
  arbitration — with an explicit template notice that it needs qualified
  legal review before carrying real contractual weight.
- New **Step 7 of 8**: the agreement is scrollable, and the checkbox plus
  signature field stay locked until scrolled to the end.
- **Verified the gate is real**: redemption attempts with no agreement or
  an empty signature were both rejected at the service layer (not just the
  UI), and the activation code stayed unredeemed after each failed
  attempt — a bad signature doesn't burn the tenant's only code, matching
  the same fail-safe principle as every other guard in this system.
- A signed submission stores the signer's name, agreement version, and
  timestamp on the tenant record, plus a dedicated audit entry.
- Downloadable PDF version generated and linked from the signing step.

**Full integration regression**: ran everything from this round together
in one test — activation, the identity-lock attack attempt, agreement
signing, staff account creation via Users & Roles, and platform tenant
visibility — all passing in combination, not just individually.

Total: 78 routes, 68 help articles (2 new), 39 lint warnings (0 errors).

## This round — brand consistency, Compliance module, audit, and help deepening

**1. Footer text** now reads "HospitalOS powered by AgoroX Africa" exactly.

**4. Logo consistency — found and fixed a real inconsistency.** Three
different marks existed for what should be one brand identity: the sidebar
top-left mark was dark charcoal with a white cross, the footer's was solid
red with a white cross, and the login page's was a blue gradient with a
white cross. All three now genuinely match the actual brand asset
(favicon.svg): white background, red cross. Verified identical across all
three locations.

**5. New engine module: Compliance & Accreditation**
(src/modules/compliance/). Closes a gap an earlier "nationally acceptable"
review explicitly flagged and never built: practitioner license tracking
(MDCN/NMCN/MLSCN/RRBN/PCN, each role mapped to its real licensing body),
facility accreditation (State MoH, HEFAMAA, NHIA, ISO 15189), and a
regulatory inspection log. Wired into the alert system as two new sources
(18 → 20 total) for licenses/accreditation expiring within 60 days or
already expired. New top-level nav group, RBAC-wired, fully tested.

**3. Application audit — found and fixed three real issues:**
- Stale docs: the alerts help article said "Eighteen sources" (actually
  20 after this round), and the orientation article's sidebar group
  count/order was stale after Compliance was added. Both corrected.
- A genuine workflow inconsistency in the new Compliance module itself,
  caught while auditing it: the "add license" form used free-text for
  staff names instead of pulling from real accounts, meaning a typo could
  create a license record for someone who does not exist. Fixed to pull
  from the actual tenant staff list, verified working.
- Nav↔route↔RBAC consistency re-verified perfect after all additions
  this round; zero orphaned files (aside from the expected main.jsx entry
  point false-positive).

**2. Help documentation — substantial, measured deepening across the
board.** Identified the 20 thinnest articles by actual content length and
rewrote every one with real substance grounded in the underlying service
code (not padding) — concrete workflow detail, tables, cross-references,
and honest notes about what's simulated versus real. Added the new
Compliance article. Also fixed a real drift bug found in the process: the
"Downloadable guides" article was missing the Tenant Service Agreement PDF
entirely, added a round after that article was last touched.

Measured result: median article length went from 751 to 933 characters,
and zero articles remain under 500 characters (14 did before this round).
69 articles total, 0 orphans, 0 broken cross-references.

**Full-system regression**: activation + signed agreement + real staff
account creation + a compliance license triggering a genuine alert, all
run together in one test, all passing.

Total: 79 routes, 69 help articles, 39 lint warnings (0 errors).

## This round — brand color reversal, topbar reorganization, Compliance expansion, hero banner restored

**1. Logo/favicon colors reversed** — red background fill, white cross
(the opposite of the previous round). Updated consistently across the
favicon, sidebar, footer, and login page — all four verified identical.

**2. Topbar reorganized — HospitalOS branding removed entirely from the
topbar.** The top-left corner now belongs purely to the tenant: their own
logo and their own name, with no "HospitalOS" text at all (that identity
now lives only in the sidebar and footer). Removed the "Online" status pill
for a cleaner bar, and added a subtle divider between the tenant identity
and the breadcrumb now that they're visually distinct concepts rather than
one flowing string.

**3. Two more Compliance sub-modules added, so it's genuinely not just
one:**
- **Incident & Risk Management** (src/modules/incident-risk/) — adverse
  events, near-misses, and sentinel events with a real root-cause and
  corrective-action trail. Verified fail-safe: an incident cannot be closed
  without a recorded corrective action and owner, enforced at the service
  layer. Severe harm / Sentinel events raise a critical alert while open.
- **Policies & SOPs** (src/modules/policies/) — policy documents with an
  actual review cycle (12/24/36 months), distinct from the general
  Documents & templates library. A policy within 60 days of review, or
  overdue, raises an alert — the same mechanism as every other compliance
  deadline in the system.
- Alert sources: 20 → 22. **Caught and fixed a real bug while wiring
  these in**: the destructuring list and the actual `Promise.all()` array
  had drifted out of sync — two new names were added to one but not the
  other, which would have thrown at runtime on every alert fetch. Caught by
  testing immediately after wiring, not left for later.

**Help & documentation — hero banner restored, this time correctly
understood.** Re-read the earlier "restore color" feedback: the actual
issue had been the rainbow category-icon palette, not the dark hero banner
itself. Restored the dark gradient treatment using HospitalOS's own red
brand identity (a charcoal-to-deep-red gradient) rather than copying
LabOS's blue, keeping the neutral icon treatment that was correctly kept
from the earlier fix.

Total: 81 routes, 71 help articles, 39 lint warnings (0 errors).

## This round — sidebar tenant branding, bolder logo, real search bug fix

**1. Sidebar now shows tenant identity permanently, not "HospitalOS."**
The previous round only fixed the topbar; the sidebar's top-left brand
block — arguably the more prominent, persistent logo spot in the whole
app — still showed the hardcoded "HospitalOS" text and mark. Replaced it
with the exact same TenantBrand component the topbar uses, so both are
now driven by one canonical source and can never drift apart again.
HospitalOS/AgoroX branding now exists in exactly three places: the Login
page (pre-authentication, no tenant context yet), the Footer
(attribution), and the Favicon — nowhere in the actual working app.

**2. Logo made bigger and bolder everywhere it still legitimately
appears.** Favicon redrawn with thicker, more edge-to-edge plus-sign bars
(68% → 74% span, 18% → 22% thickness). The two remaining in-app
occurrences (Login page mark, Footer mark) both increased in icon size and
stroke weight to match. Swept the whole codebase for any other
`Icons.Cross` usage — confirmed only those two remain, both consistent.

**3. Found and fixed a real, verifiable bug in Help & documentation
search** — not a design tweak, an actual defect. The hero's search input
and the compact header's search input were two separate DOM elements.
Typing a single character flipped `isLanding` to false, which unmounted
the hero (destroying the focused input) and mounted the compact header's
different input in its place — so the field lost focus after exactly one
keystroke, and every character typed after that went nowhere. From the
user's side, this looked exactly like "search isn't content-sensitive."
Root cause traced and fixed: the hero (and its one search input) now stays
mounted for as long as no specific article or category is open, including
while actively typing, so there is never a remount mid-query. Verified the
underlying `searchArticles()` function itself was always correct — the
bug was purely a UI remount issue, confirmed by testing the search logic
directly against real queries (title matches, body-only matches like
"MDCN", case-insensitivity) before concluding the fix target.

**4. Removed the avatar initials badge** ("AS" for AgoroX Support) from
the topbar's user info cluster — name, role, and sign-out remain; the
redundant colored circle does not.

Housekeeping while in here: removed the now-dead sidebar brandMark/
brandText/brandSub styles and two other pre-existing dead style constants
found during the lint pass. Warnings down to 37 (0 errors).

Total: 81 routes, 71 help articles, 37 lint warnings (0 errors).

## This round — 12 help categories, iOS home screen icon, topbar decluttered fully

**1. Help & documentation now has 12 categories, not 11.** Split the
overloaded "Administration" category (11 articles, genuinely too broad) by
pulling four compliance-related articles — Compliance & accreditation,
Incident & risk management, Policies & SOPs, and Staff accounts & device
security — into a new "Compliance & risk" category. This wasn't an
arbitrary split: it mirrors the app's own real "Compliance" nav group,
which already has three dedicated screens. Administration now holds 7
articles, Compliance & risk holds 4. Verified all 71 articles still
resolve correctly, zero orphans, zero broken cross-references.

**2. Proper iOS "Add to Home Screen" icon support — this was genuinely
missing entirely.** iOS Safari does not use SVG favicons for home screen
icons; it specifically requires an `apple-touch-icon` PNG link tag, which
did not exist anywhere in the app. Generated real PNG icons at the exact
proportions of the SVG mark (180×180 for iOS, 192×192 and 512×512 for a
proper web manifest, 16/32px favicons) and wired up `index.html` with the
full set: apple-touch-icon, apple-mobile-web-app meta tags, a
manifest.json for Android/general PWA install, and a proper page title
("HospitalOS" instead of the lowercase "hospitalos" that was there
before). Adding to an iPhone home screen should now show the actual red
plus-sign logo instead of a screenshot of the page.

**3. Topbar tenant brand element removed entirely — confirmed this was
still there.** The previous round's sidebar fix was correct but left the
topbar's tenant name + logo (with its initials-fallback avatar) still
showing before the search field, genuinely redundant with the sidebar.
Removed it completely; the topbar's left side is now just the breadcrumb
(and the hamburger on mobile). Verified TenantBrand now renders in exactly
one place in the whole app: the sidebar.

Total: 81 routes, 71 help articles across 12 categories, 37 lint warnings
(0 errors).
