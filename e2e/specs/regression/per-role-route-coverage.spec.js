import { test, expect } from "@playwright/test";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Per-role broad coverage — the gap in all-routes-smoke.spec.js was
// that it only ever ran as Super Admin, which can reach every area, so
// it never actually exercised what a Cashier, Nurse, or Pharmacist
// sees. This file closes that: for each role with real credentials
// configured, every one of the 82 routes is checked against that
// role's actual areas list from rbac.js — routes inside an allowed
// area should load to real content, routes outside it should show the
// NoAccess screen, not just "doesn't crash."
//
// Route-to-group mapping was extracted programmatically from
// navGroups.js, the same way all-routes-smoke.spec.js's route list
// was, rather than typed by hand — the exact mistake that produced 55
// wrong labels there.
//
// Requires the role's test account to exist and its credentials to be
// set (see .env.example / e2e/README.md) — skips entirely, with an
// explicit message, if not.
const ROUTE_GROUPS = [
  ["overview", "/", "Dashboard"],
  ["overview", "/patients/mine", "My patients"],
  ["overview", "/worklist", "Worklist"],
  ["overview", "/alerts", "Alerts & critical values"],
  ["overview", "/communication", "Communication hub"],
  ["overview", "/bookings", "Online bookings"],
  ["overview", "/referrals", "Referrals"],
  ["patient-care", "/patients/adt", "Registration & ADT"],
  ["patient-care", "/records", "Medical records"],
  ["patient-care", "/outpatient", "Outpatient (GOPD & clinics)"],
  ["patient-care", "/emergency", "Emergency & observation"],
  ["patient-care", "/wards", "Wards & bed management"],
  ["patient-care", "/critical-care", "ICU / HDU"],
  ["patient-care", "/theatre", "Theatre & day surgery"],
  ["patient-care", "/maternity", "Maternity & neonatology"],
  ["patient-care", "/specialties", "Specialist clinics"],
  ["patient-care", "/oncology", "Oncology"],
  ["patient-care", "/rehab", "Rehabilitation & therapy"],
  ["patient-care", "/renal", "Renal & dialysis"],
  ["patient-care", "/geriatric", "Geriatric unit"],
  ["patient-care", "/mental-health", "Mental health unit"],
  ["patient-care", "/vip-services", "VIP services"],
  ["diagnostics", "/lab", "Laboratory"],
  ["diagnostics", "/blood-bank", "Blood bank & transfusion"],
  ["diagnostics", "/radiology", "Radiology & imaging"],
  ["diagnostics", "/ultrasound", "Ultrasound"],
  ["diagnostics", "/ct-scan", "CT scan"],
  ["diagnostics", "/mri", "MRI"],
  ["diagnostics", "/radiotherapy", "Radiotherapy"],
  ["diagnostics", "/poct", "Point of care testing"],
  ["diagnostics", "/lab-utilities", "Lab utilities"],
  ["diagnostics", "/biobank", "Biobanking"],
  ["diagnostics", "/diagnostic-intel", "Diagnostic intelligence"],
  ["diagnostics", "/instruments", "Instruments & devices gateway"],
  ["pharmacy", "/pharmacy/dispensing", "Dispensing"],
  ["pharmacy", "/pharmacy/inventory", "Drug inventory"],
  ["pharmacy", "/pharmacy/formulary", "Formulary & NAFDAC"],
  ["specialty-services", "/nutrition", "Nutrition & dietetics"],
  ["specialty-services", "/sickle-cell", "Sickle cell centre"],
  ["specialty-services", "/dental", "Dental & oral health"],
  ["specialty-services", "/ipc", "Infection prevention & control"],
  ["specialty-services", "/social-work", "Medical social services"],
  ["specialty-services", "/occupational-health", "Occupational health"],
  ["specialty-services", "/chaplaincy", "Chaplaincy & pastoral care"],
  ["finance", "/finance/billing", "Billing & invoicing"],
  ["finance", "/finance/payments", "Payments & cashiering"],
  ["finance", "/finance/claims", "Insurance & NHIA claims"],
  ["finance", "/finance/procurement", "Procurement & suppliers"],
  ["finance", "/finance/stores", "Stores & assets"],
  ["finance", "/finance/bank-reconciliation", "Bank reconciliation"],
  ["operations", "/ops/scheduling", "Scheduling & rosters"],
  ["operations", "/ops/cssd", "CSSD & sterile supply"],
  ["operations", "/ops/biomedical", "Biomedical engineering"],
  ["operations", "/ops/facility", "Facility & waste"],
  ["operations", "/ops/fleet", "Ambulance & fleet"],
  ["operations", "/ops/support", "Catering, laundry & mortuary"],
  ["operations", "/ops/visitor", "Visitor & security"],
  ["academic", "/academic/training", "Training & rotations"],
  ["academic", "/academic/logbooks", "Clinical logbooks"],
  ["academic", "/academic/cme", "CME"],
  ["academic", "/academic/research", "Research & trials"],
  ["academic", "/academic/ethics", "Ethics committee"],
  ["public-health", "/public-health/surveillance", "Disease surveillance"],
  ["public-health", "/public-health/immunisation", "Immunisation programmes"],
  ["public-health", "/public-health/outreach", "Outreach & community"],
  ["public-health", "/public-health/reporting", "National reporting"],
  ["intelligence", "/intelligence/analytics", "Analytics & KPIs"],
  ["intelligence", "/intelligence/forecasting", "Forecasting"],
  ["intelligence", "/intelligence/reports", "Reports"],
  ["compliance", "/compliance", "Compliance & accreditation"],
  ["compliance", "/incident-risk", "Incident & risk management"],
  ["compliance", "/policies", "Policies & SOPs"],
  ["system", "/system/users", "Users & roles"],
  ["system", "/system/facilities", "Facilities & sites"],
  ["system", "/system/pricing", "Pricing"],
  ["system", "/system/documents", "Documents & templates"],
  ["system", "/system/privacy", "Privacy & consent"],
  ["system", "/system/fhir", "FHIR interoperability"],
  ["system", "/system/security", "Security & audit"],
  ["system", "/system/data-import", "Data import"],
  ["system", "/system/settings", "Settings"],
  ["academy", "/academy", "HospitalOS Academy"],
];

const ROLES = {
  cashier: { areas: ["overview", "academy", "finance"] },
  nurse: { areas: ["overview", "academy", "patient-care", "specialty-services"] },
  pharmacist: { areas: ["overview", "academy", "pharmacy"] },
};

for (const [role, cfg] of Object.entries(ROLES)) {
  test.describe(`Per-role route coverage — ${role} @regression @rbac @broad-smoke`, () => {
    const authFile = path.join(__dirname, `../../.auth/${role}.json`);

    test.beforeEach(() => {
      test.skip(
        !fs.existsSync(authFile),
        `No saved session for "${role}" — create this test account first (see e2e/README.md), set its credentials in .env, then re-run "npm run e2e:setup".`
      );
    });

    for (const [groupId, routePath, label] of ROUTE_GROUPS) {
      const shouldAllow = cfg.areas.includes(groupId);
      test(`${role} ${shouldAllow ? "can reach" : "is blocked from"} ${routePath} (${label})`, async ({ browser }) => {
        const context = await browser.newContext({ storageState: authFile });
        const page = await context.newPage();
        await page.goto(routePath);

        if (shouldAllow) {
          const heading = page.getByRole("heading").first();
          await heading.waitFor({ timeout: 10000 });
          const text = await heading.textContent();
          expect(text.trim().length).toBeGreaterThan(0);
        } else {
          await expect(page.getByRole("heading", { name: "You don't have access to this area" })).toBeVisible({ timeout: 10000 });
        }

        await context.close();
      });
    }
  });
}
