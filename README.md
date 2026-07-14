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
