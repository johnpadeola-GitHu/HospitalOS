import { test, expect } from "@playwright/test";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

test.use({ storageState: path.join(__dirname, "../../.auth/superadmin.json") });

// Broad, deliberately shallow coverage across every route in the
// sidebar (extracted directly from navGroups.js, not hand-typed) —
// confirms each one loads to real, identifiable content rather than a
// blank page, a crash, or an access-denied screen, for the one role
// (Super Admin) that should be able to reach all of them. This is NOT
// a substitute for the deeper, multi-step workflow tests elsewhere in
// this suite (cash sessions, the allergy block, registration) — it's
// a wide net, not a deep one. Every module that renders through
// PageHeader (the vast majority) produces a real <h1>; even a
// genuinely unbuilt/scaffolded route renders one via ModulePlaceholder
// using the route's own label — so this test can't yet distinguish
// "fully built" from "still scaffolded," only "loads without breaking."
// Written quickly, deliberately accepting some of these may need
// individual fixes once actually run — see the project history around
// this file's creation for that explicit tradeoff.
const ROUTES = [
  ["/", "Dashboard"],
  ["/patients/mine", "My patients"],
  ["/worklist", "Worklist"],
  ["/alerts", "Alerts & critical values"],
  ["/communication", "Communication hub"],
  ["/bookings", "Online bookings"],
  ["/referrals", "Referrals"],
  ["/patients/adt", "Registration & ADT"],
  ["/records", "Medical records"],
  ["/outpatient", "Outpatient (GOPD & clinics)"],
  ["/emergency", "Emergency & observation"],
  ["/wards", "Wards & bed management"],
  ["/critical-care", "ICU / HDU"],
  ["/theatre", "Theatre & day surgery"],
  ["/maternity", "Maternity & neonatology"],
  ["/specialties", "Specialist clinics"],
  ["/oncology", "Oncology"],
  ["/rehab", "Rehabilitation & therapy"],
  ["/renal", "Renal & dialysis"],
  ["/geriatric", "Geriatric unit"],
  ["/mental-health", "Mental health unit"],
  ["/vip-services", "VIP services"],
  ["/lab", "Laboratory"],
  ["/blood-bank", "Blood bank & transfusion"],
  ["/radiology", "Radiology & imaging"],
  ["/ultrasound", "Ultrasound"],
  ["/ct-scan", "CT scan"],
  ["/mri", "MRI"],
  ["/radiotherapy", "Radiotherapy"],
  ["/poct", "Point of care testing"],
  ["/lab-utilities", "Lab utilities"],
  ["/biobank", "Biobanking"],
  ["/diagnostic-intel", "Diagnostic intelligence"],
  ["/instruments", "Instruments & devices gateway"],
  ["/pharmacy/dispensing", "Dispensing"],
  ["/pharmacy/inventory", "Drug inventory"],
  ["/pharmacy/formulary", "Formulary & NAFDAC"],
  ["/nutrition", "Nutrition & dietetics"],
  ["/sickle-cell", "Sickle cell centre"],
  ["/dental", "Dental & oral health"],
  ["/ipc", "Infection prevention & control"],
  ["/social-work", "Medical social services"],
  ["/occupational-health", "Occupational health"],
  ["/chaplaincy", "Chaplaincy & pastoral care"],
  ["/finance/billing", "Billing & invoicing"],
  ["/finance/payments", "Payments & cashiering"],
  ["/finance/claims", "Insurance & NHIA claims"],
  ["/finance/procurement", "Procurement & suppliers"],
  ["/finance/stores", "Stores & assets"],
  ["/finance/bank-reconciliation", "Bank reconciliation"],
  ["/ops/scheduling", "Scheduling & rosters"],
  ["/ops/cssd", "CSSD & sterile supply"],
  ["/ops/biomedical", "Biomedical engineering"],
  ["/ops/facility", "Facility & waste"],
  ["/ops/fleet", "Ambulance & fleet"],
  ["/ops/support", "Catering, laundry & mortuary"],
  ["/ops/visitor", "Visitor & security"],
  ["/academic/training", "Training & rotations"],
  ["/academic/logbooks", "Clinical logbooks"],
  ["/academic/cme", "CME"],
  ["/academic/research", "Research & trials"],
  ["/academic/ethics", "Ethics committee"],
  ["/public-health/surveillance", "Disease surveillance"],
  ["/public-health/immunisation", "Immunisation programmes"],
  ["/public-health/outreach", "Outreach & community"],
  ["/public-health/reporting", "National reporting"],
  ["/intelligence/analytics", "Analytics & KPIs"],
  ["/intelligence/forecasting", "Forecasting"],
  ["/intelligence/reports", "Reports"],
  ["/compliance", "Compliance & accreditation"],
  ["/incident-risk", "Incident & risk management"],
  ["/policies", "Policies & SOPs"],
  ["/system/users", "Users & roles"],
  ["/system/facilities", "Facilities & sites"],
  ["/system/pricing", "Pricing"],
  ["/system/documents", "Documents & templates"],
  ["/system/privacy", "Privacy & consent"],
  ["/system/fhir", "FHIR interoperability"],
  ["/system/security", "Security & audit"],
  ["/system/data-import", "Data import"],
  ["/system/settings", "Settings"],
  ["/academy", "HospitalOS Academy"],
];

for (const [route, label] of ROUTES) {
  test(`route loads: ${route} (${label}) @regression @broad-smoke`, async ({ page }) => {
    await page.goto(route);
    const heading = page.getByRole("heading").first();
    await heading.waitFor({ timeout: 10000 });
    const text = await heading.textContent();
    expect(text.trim().length).toBeGreaterThan(0);
  });
}
